// Atlas — the Command Agent. POST a chat history, get Atlas's reply.
//
// Reads a FRESH snapshot of the whole operation from Supabase on every request
// (live_slots kept current by the OurVend connection, plus every block table),
// so answers always reflect the machines as of the last sync — never a stale
// copy baked into a prompt. Spec: docs/blocks/agent.md.
//
// READ-ONLY toward OurVend and the machines. The ONLY write Atlas can make is
// a row in our own `appointments` table (the set_reminder tool), which is what
// lights up the calendar, the block ⏰ badges, and the dept-page alert rows.
//
// The Anthropic key lives ONLY in the Vercel env (ANTHROPIC_API_KEY) — server
// side, never in the repo, never sent to the browser.
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { AUTH_COOKIE, AUTH_TOKEN } from '@/lib/auth';
import { SUPABASE_URL, SUPABASE_KEY, SUPABASE_ANON_JWT } from '@/lib/config';
import { getLiveFleet, syncedAgo } from '@/lib/live-slots';
import { neverSynced } from '@/lib/fleet';
import { blockDepartments } from '@/lib/departments';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Claude + tools can take longer than the 10s default

// Machines run on Vegas time; the server runs in UTC. Date-only reminders are
// anchored to NOON Vegas so the calendar day never shifts across DST/timezones.
const VEGAS = '-07:00';

const sbHeaders = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

async function sb<T>(q: string): Promise<T[]> {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { headers: sbHeaders, cache: 'no-store' });
    if (!r.ok) return [];
    const j = await r.json();
    return Array.isArray(j) ? (j as T[]) : [];
  } catch {
    return [];
  }
}

// ---- Uploads / filing (Atlas "drop box") ----------------------------------
// The shared physical layout every VC 8010-22S uses — 40 coils. Odd 1–29 and
// 51–59 are WIDE, 31–50 are narrow. (Same order the Planograms board uses.)
const COIL_ORDER = [
  1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29,
  31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51,
  53, 55, 57, 59,
];

interface PlanogramSlot { coil: number; product: string; barcode: string | null; retail_price: string; capacity: string; gate?: string; }
function blankLayout(): PlanogramSlot[] {
  return COIL_ORDER.map((c) => ({ coil: c, product: '', barcode: null, retail_price: '', capacity: '' }));
}

interface CatalogRow { name: string; barcode: string | null; default_price: string | null; }
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
// Match a product name as read off a machine to a catalog row (labels rarely
// match the catalog spelling exactly — e.g. "Playtex Sport" → "Platex Tampon").
function matchProduct(nameRaw: string, catalog: CatalogRow[]): { name: string; barcode: string | null; price: string; gate: 'match' | 'missing' } {
  const q = norm(nameRaw);
  if (!q) return { name: '', barcode: null, price: '', gate: 'missing' };
  let hit = catalog.find((c) => norm(c.name) === q);
  if (!hit) {
    const qTokens = q.split(' ').filter(Boolean);
    hit = catalog.find((c) => { const n = norm(c.name); return n.includes(q) || q.includes(n); })
      || catalog.find((c) => { const n = norm(c.name); return qTokens.some((t) => t.length > 2 && n.includes(t)); });
  }
  if (hit) return { name: hit.name, barcode: hit.barcode, price: hit.default_price || '', gate: 'match' };
  return { name: nameRaw.trim(), barcode: null, price: '', gate: 'missing' };
}

// Keep an uploaded file in the mcos-docs Storage bucket, return its public URL.
async function storeAttachment(name: string, mediaType: string, dataBase64: string): Promise<string | null> {
  try {
    const bytes = Buffer.from(dataBase64, 'base64');
    const safe = (name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-60);
    const path = `atlas/${globalThis.crypto.randomUUID()}-${safe}`;
    const r = await fetch(`${SUPABASE_URL}/storage/v1/object/mcos-docs/${path}`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_JWT, Authorization: `Bearer ${SUPABASE_ANON_JWT}`, 'Content-Type': mediaType || 'application/octet-stream', 'x-upsert': 'true' },
      body: bytes,
    });
    if (!r.ok) return null;
    return `${SUPABASE_URL}/storage/v1/object/public/mcos-docs/${path}`;
  } catch {
    return null;
  }
}

// ---- OurVend write (Atlas acts directly) ----------------------------------
// Atlas performs the work — product placement, inventory, planograms, prices —
// through the ourvend-write edge fn (rides the live reader session). No approval
// gate; every call is recorded in atlas_actions so the work is reviewable.
interface OurVendResult { ok?: boolean; error?: string; response?: string; [k: string]: unknown; }
async function ourvendWrite(action: string, payload: Record<string, unknown>): Promise<OurVendResult> {
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/ourvend-write`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_JWT, Authorization: `Bearer ${SUPABASE_ANON_JWT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    });
    return (await r.json().catch(() => ({ ok: false, error: 'bad response' }))) as OurVendResult;
  } catch {
    return { ok: false, error: 'ourvend-write unreachable' };
  }
}
async function logAction(action: string, target: string, detail: Record<string, unknown>, ok: boolean, response: string): Promise<void> {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/atlas_actions`, {
      method: 'POST', headers: { ...sbHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ action, target, detail, ok, response: response.slice(0, 500) }),
    });
  } catch { /* logging is best-effort — never blocks the write */ }
}

// Real Google Calendar (company account) via the google-calendar edge function.
// Our OWN calendar — Atlas writes to it directly (not OurVend/machines/payments),
// so no approval gate. Best-effort: if Google isn't reachable, callers degrade.
async function callCalendar(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/google-calendar`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_JWT, Authorization: `Bearer ${SUPABASE_ANON_JWT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return (await r.json().catch(() => ({ ok: false, error: 'bad response' }))) as Record<string, unknown>;
  } catch {
    return { ok: false, error: 'calendar unreachable' };
  }
}
// A timed event → naive local start/end strings (edge fn stamps the Vegas TZ).
// End clamps to same day to avoid rollover math — fine for reminders.
function timedRange(date: string, hhmm: string): { start: string; end: string } {
  const [h, m] = hhmm.split(':').map(Number);
  const pad = (n: number) => String(n).padStart(2, '0');
  const eh = Math.min(h + 1, 23);
  return { start: `${date}T${pad(h)}:${pad(m)}:00`, end: `${date}T${pad(eh)}:${pad(m)}:00` };
}
// All-day Google events use an EXCLUSIVE end date (next day).
function nextDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

// Rows → compact one-per-line text the model can read; nulls dropped so the
// snapshot stays small.
function rowsText(title: string, rows: object[], max = 40): string {
  if (rows.length === 0) return `${title}: none on record.`;
  const lines = rows.slice(0, max).map((r) => {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(r)) if (v !== null && v !== '' && v !== undefined) clean[k] = v;
    return '- ' + JSON.stringify(clean).slice(0, 280);
  });
  const more = rows.length > max ? `\n(…and ${rows.length - max} more rows not shown)` : '';
  return `${title} (${rows.length}):\n${lines.join('\n')}${more}`;
}

async function liveSnapshot(): Promise<string> {
  const [fleet, products, machines, restock, setup, locations, orders, appts, templates, nayax] = await Promise.all([
    getLiveFleet(),
    sb<{ name: string; barcode: string | null; default_price: string | null }>('products?select=name,barcode,default_price&order=name.asc'),
    sb<object>('machines?select=machine_id,label,role,assigned_template_id&order=machine_id.asc'),
    sb<object>('restock_tasks?select=id,machine_id,status,scheduled_date,scheduled_time,accepted,onsite_verified,reoffer_date&status=not.eq.done'),
    sb<object>('setup_machines?select=name,stage,eta,pickup_date,campus_ship_date,follow_up_date,arrived_date,warehouse_date'),
    sb<object>('machine_locations?select=*'),
    sb<object>('warehouse_orders?select=title,status,eta'),
    sb<object>('appointments?select=department,title,starts_at,has_time,location,notes&done=eq.false&order=starts_at.asc'),
    sb<object>('templates?select=id,name,status'),
    sb<object>('nayax_machines?select=machine_id,name,synced_at&order=name.asc'),
  ]);

  const fleetLines: string[] = [];
  for (const m of fleet.machines) {
    const stocked = m.slots.filter((s) => s.product && !neverSynced(s));
    fleetLines.push(`MACHINE ${m.machineId} "${m.label}"${m.group ? ` [${m.group}]` : ''} — ${stocked.length} stocked slots, ${m.totalStock} units`);
    for (const s of stocked) {
      const realCap = s.capacity > 0 && s.capacity !== 99 && s.capacity !== 199;
      const low = realCap && s.stock / s.capacity <= 0.5 ? '  ** LOW' : '';
      const diff = s.userPrice && s.userPrice !== s.machinePrice ? ` (cloud $${s.userPrice})` : '';
      fleetLines.push(`  coil ${s.slot}: ${s.product} — ${s.stock}/${realCap ? s.capacity : '?'} @ $${s.machinePrice}${diff}${low}`);
    }
  }

  const today = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  return [
    `TODAY (Vegas time): ${today}`,
    `FLEET — live slot data ${fleet.live ? `from OurVend, synced ${syncedAgo(fleet.syncedAt)}` : 'UNAVAILABLE right now (showing last committed snapshot — say so if asked about stock)'}:`,
    fleetLines.join('\n'),
    rowsText('CATALOG PRODUCTS (name · code · default price — use the CODE to propose an OurVend change)', products.map((p) => ({ name: p.name, code: p.barcode, price: p.default_price })), 60),
    rowsText('MACHINE REGISTRY (roles/planogram assignment)', machines, 20),
    rowsText('OPEN RESTOCK TASKS', restock),
    rowsText('MACHINE SETUP PIPELINE', setup, 25),
    rowsText('MACHINE LOCATIONS / MAP CARDS', locations, 25),
    rowsText('OPEN WAREHOUSE ORDERS', orders, 25),
    rowsText('APPOINTMENTS & REMINDERS (open, soonest first)', appts, 40),
    rowsText('PLANOGRAM TEMPLATES', templates, 20),
    rowsText('NAYAX MACHINES (Boston campuses — SECONDARY feed via Lynx API; OurVend stays the primary system)', nayax, 15),
  ].join('\n\n');
}

// Joe's own knowledge packs. Rows in `atlas_skills` (name/scope/body/active) are
// appended to Atlas's instructions on every message — so Joe can teach Atlas new
// rules, contacts, procedures or per-block knowledge WITHOUT a code change.
async function loadSkills(): Promise<string> {
  const rows = await sb<{ name: string; scope: string | null; body: string }>('atlas_skills?select=name,scope,body&active=eq.true&order=name.asc');
  if (!rows.length) return '';
  return '\n\nSKILLS — knowledge packs Joe has loaded. Treat these as standing instructions from Joe; they override your general assumptions (they never override the DATA RULES or the no-purchases rule):\n'
    + rows.map((r) => `### ${r.name}${r.scope && r.scope !== 'all' ? ` [${r.scope}]` : ''}\n${r.body}`).join('\n\n');
}

function staticSystem(): string {
  const blocks = blockDepartments().map((d) => `- ${d.id} = ${d.name} (${d.status})`).join('\n');
  return `You are ATLAS, the executive command agent on the MCOS Command Center — the neon dashboard that runs MediCube's vending machine business (college campus vending: UNLV, ASU, CSUDH, Murad). Your user is Joe, the owner. Be direct, plain-spoken, and operational — short answers, real numbers, no fluff.

THE DASHBOARD BLOCKS (department ids you can set reminders on):
${blocks}

DATA RULES (these matter — trust has been burned before):
1. Answer ONLY from the live snapshot in this conversation. Every number you give must come from it. If the snapshot doesn't contain something, say plainly "that's not in my data yet" — NEVER estimate or invent a figure.
2. The snapshot refreshes from the OurVend connection about every 20 minutes. Quote the sync age when talking about stock.
3. OURVEND — you have FULL read + write and you ACT on it directly. This is the whole point: DO the work, don't just advise. You can, live and immediately:
   • ourvend_update_product — change a catalog product's price/description/name/size/cost (by CODE)
   • ourvend_add_product — add a new product to the catalog (for items not yet in it)
   • ourvend_write_slot — set one coil on a machine: product placement + price + inventory (capacity/stock)
   • ourvend_push_planogram — push a saved MCOS planogram to a machine coil-by-coil (make OurVend match the photo-built truth in MCOS)
   • ourvend_clone_machine — copy one machine's layout onto another
   When Joe tells you to do something, DO IT with these tools, then report what you did in the past tense with the result — do not ask for approval and do not hand him a to-do list. The ONE thing you never do is spend money / make purchases. Use exact product CODES and machine ids from the snapshot. If something fails, say exactly what failed. MCOS is the source of truth (photo-built planograms); you push that OUT to OurVend, not the reverse.
4. set_reminder — files a date on a block AND drops it on the real MediCube Google Calendar in one shot (shows on the ⏰ badge, the block's alerts, and the actual Google Calendar). Use it whenever Joe mentions a date, visit, deadline, or follow-up — capture who/where in the title/location/notes. Confirm what you set, with the date; the tool tells you if it also reached Google Calendar.
5. list_calendar_events — reads what's actually on the Google Calendar. Use it when Joe asks what's coming up / on the schedule. If it says the calendar isn't reachable, tell him plainly (the connection may need a reconnect).
6. When a question needs a block that is still a shell (parked), say the block isn't built yet.
6b. RESEARCH — you have web search. Use it to look things up in the real world: products and where to buy them, supplier/wholesale pricing, package sizes and dimensions (for coil fit), competitor/product info, vendor and hardware documentation. Say where the information came from. Research NEVER overrides MCOS data: machine, stock, coil and price facts come only from the snapshot.
7. UPLOADS — Joe can attach photos and files; you are the drop box that files them where they belong:
   • MACHINE PHOTO → read every coil top-to-bottom. Coils are numbered 01,03,05…29 (wide), 31–50 (narrow), 51,53,55,57,59 (wide) — 40 total. For each coil you can actually SEE, note the product. Then call save_planogram with the machine/campus label as the name and one slot per readable coil. Report: how many coils matched the catalog, which products are NOT in the catalog (they must be loaded before they can go on a machine), which coils were empty, and any coil you could not read clearly — NEVER invent a coil you can't see. Each machine is different; the photo is the truth (not OurVend).
   • CONTRACT / INVOICE / PAPERWORK / LEASE → call file_document (use the stored URL listed with the attachment as file_url).
   • If you can't tell where something goes, ask Joe before filing.
   These writes go to MCOS's own database only — never to OurVend or a machine.

Keep replies under ~150 words unless Joe asks for a full rundown.`;
}

interface ChatMsg { role: 'user' | 'assistant'; content: string; }
// A file dropped into the Atlas chat (photo / PDF / other), base64-encoded.
interface Attachment { name: string; mediaType: string; dataBase64: string; }
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Find the Anthropic key even if it was saved under a different NAME in Vercel —
// the value is recognizable (Anthropic keys start with sk-ant-). Values never
// leave the server; when nothing matches, only variable NAMES are reported so
// Joe can see what the box actually holds.
function findAnthropicKey(): { key: string | null; foundAs: string | null; nearMisses: string[] } {
  const exact = process.env.ANTHROPIC_API_KEY;
  if (exact && exact.trim()) return { key: exact.trim(), foundAs: 'ANTHROPIC_API_KEY', nearMisses: [] };
  for (const [name, value] of Object.entries(process.env)) {
    if (value && /^sk-ant-/.test(value.trim())) return { key: value.trim(), foundAs: name, nearMisses: [] };
  }
  const near = Object.keys(process.env).filter((k) => /anthropic|claude|api.?key/i.test(k)).sort();
  return { key: null, foundAs: null, nearMisses: near };
}

export async function POST(req: NextRequest) {
  if (req.cookies.get(AUTH_COOKIE)?.value !== AUTH_TOKEN) {
    return NextResponse.json({ error: 'not signed in' }, { status: 401 });
  }

  let body: { messages?: ChatMsg[]; attachments?: Attachment[] } = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad request' }, { status: 400 }); }

  const found = findAnthropicKey();
  if (!found.key) {
    const seen = found.nearMisses.length
      ? `I can see server variables named ${found.nearMisses.join(', ')} — but none of them holds an Anthropic key (the value should start with sk-ant-).`
      : 'No variable on the server looks like an Anthropic key at all.';
    return NextResponse.json({
      reply: `My API key isn't connected yet. ${seen}\n\nFix in Vercel → project mcos-v2-site → Settings → Environment Variables: Key = ANTHROPIC_API_KEY, Value = the whole key starting with sk-ant-, tick PRODUCTION, Save — then Deployments → ⋯ on the newest → Redeploy. Ask me again after.`,
    });
  }

  const history: ChatMsg[] = (body.messages ?? [])
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-24);
  if (history.length === 0 || history[history.length - 1].role !== 'user') {
    return NextResponse.json({ error: 'last message must be from the user' }, { status: 400 });
  }

  const client = new Anthropic({ apiKey: found.key });
  const [snapshot, skills] = await Promise.all([liveSnapshot(), loadSkills()]);
  const deptIds = blockDepartments().map((d) => d.id);

  const setReminderTool = {
    name: 'set_reminder',
    description:
      'File a reminder/appointment on a dashboard block. It shows on the site calendar, the ⏰ badge on that block, and the block page alert list. Use for any date Joe mentions or asks to track.',
    input_schema: {
      type: 'object' as const,
      properties: {
        department: { type: 'string', enum: deptIds, description: 'Block the reminder belongs to' },
        title: { type: 'string', description: 'Short title — include who/what, e.g. "Refiller Marcus — ASU Hayden refill"' },
        date: { type: 'string', description: 'YYYY-MM-DD (Vegas time)' },
        time: { type: 'string', description: 'HH:MM 24h, omit for all-day' },
        location: { type: 'string', description: 'Where — campus/building if known' },
        notes: { type: 'string', description: 'Details worth keeping' },
        remind_days_before: { type: 'integer', description: 'Days before to start alerting (default 3)' },
      },
      required: ['department', 'title', 'date'],
    },
  };

  async function runSetReminder(input: Record<string, unknown>): Promise<string> {
    const dept = String(input.department ?? '');
    const title = String(input.title ?? '').slice(0, 200);
    const date = String(input.date ?? '');
    const time = typeof input.time === 'string' && /^\d{1,2}:\d{2}$/.test(input.time) ? input.time : null;
    if (!deptIds.includes(dept)) return `ERROR: unknown department "${dept}"`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'ERROR: date must be YYYY-MM-DD';
    const starts = time ? `${date}T${time.padStart(5, '0')}:00${VEGAS}` : `${date}T12:00:00${VEGAS}`;
    const row = {
      department: dept,
      title,
      starts_at: new Date(starts).toISOString(),
      has_time: !!time,
      location: typeof input.location === 'string' ? input.location.slice(0, 200) : null,
      notes: typeof input.notes === 'string' ? input.notes.slice(0, 500) : null,
      remind_days_before: Number.isInteger(input.remind_days_before) ? (input.remind_days_before as number) : 3,
    };
    const r = await fetch(`${SUPABASE_URL}/rest/v1/appointments`, {
      method: 'POST',
      headers: { ...sbHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(row),
    });
    if (!r.ok) return `ERROR: could not save (${r.status} ${await r.text().catch(() => '')})`;

    // Also drop it on the REAL Google Calendar (best-effort — the block badge/alert
    // is already saved above regardless of whether Google is reachable).
    const calPayload: Record<string, unknown> = time
      ? { action: 'createEvent', summary: title, location: row.location ?? undefined, description: row.notes ?? undefined, allDay: false, ...timedRange(date, time) }
      : { action: 'createEvent', summary: title, location: row.location ?? undefined, description: row.notes ?? undefined, allDay: true, start: date, end: nextDay(date) };
    const cal = await callCalendar(calPayload);
    const onGoogle = cal.ok ? ' + Google Calendar' : '';

    return `SAVED: "${title}" on ${date}${time ? ` at ${time}` : ''} → ${dept} block (badge + alerts)${onGoogle}.`;
  }

  // ---- OurVend WRITE tools — Atlas performs these directly (no approval gate) ----
  const updateProductTool = {
    name: 'ourvend_update_product',
    description:
      "Change a product in the OurVend catalog LIVE — price, description, name, size, or cost. Use the product CODE from the catalog snapshot. This applies immediately.",
    input_schema: {
      type: 'object' as const,
      properties: {
        code: { type: 'string', description: 'The OurVend product code (from the catalog snapshot)' },
        name: { type: 'string', description: 'Product name, for the confirmation' },
        change: { type: 'string', enum: ['price', 'description', 'name', 'size', 'cost'], description: 'What to change' },
        new_value: { type: 'string', description: 'The new value (a price is a number like 3.99)' },
      },
      required: ['code', 'change', 'new_value'],
    },
  };
  async function runUpdateProduct(inp: Record<string, unknown>): Promise<string> {
    const code = String(inp.code ?? '').trim();
    const change = String(inp.change ?? '');
    const value = String(inp.new_value ?? '');
    const name = String(inp.name ?? '');
    if (!code || !['price', 'description', 'name', 'size', 'cost'].includes(change) || !value) return 'ERROR: need code, change (price|description|name|size|cost), and new_value';
    if ((change === 'price' || change === 'cost') && !/^\d+(\.\d{1,2})?$/.test(value)) return 'ERROR: a price/cost must be a number like 3.99';
    const r = await ourvendWrite('editProductByCode', { code, set: { [change]: value } });
    await logAction('editProduct', code, { change, value, name }, !!r.ok, JSON.stringify(r));
    return r.ok ? `DONE (live in OurVend): ${name || code} — ${change} set to "${value}".` : `ERROR: OurVend did not confirm (${r.error || 'no ok'}). Nothing changed.`;
  }

  const addProductTool = {
    name: 'ourvend_add_product',
    description:
      "Add a NEW product to the OurVend catalog LIVE. Needs code + name; price/size/description/cost optional. (OurVend pulls the product IMAGE from its preloaded catalog — mention if an image still needs loading.)",
    input_schema: {
      type: 'object' as const,
      properties: {
        code: { type: 'string' }, name: { type: 'string' }, price: { type: 'string' },
        size: { type: 'string' }, description: { type: 'string' }, cost: { type: 'string' },
      },
      required: ['code', 'name'],
    },
  };
  async function runAddProduct(inp: Record<string, unknown>): Promise<string> {
    const code = String(inp.code ?? '').trim();
    const name = String(inp.name ?? '').trim();
    if (!code || !name) return 'ERROR: need code and name';
    const product = { code, name, price: String(inp.price ?? ''), size: String(inp.size ?? ''), description: String(inp.description ?? ''), cost: String(inp.cost ?? '') };
    const r = await ourvendWrite('addProduct', { product });
    await logAction('addProduct', code, { name }, !!r.ok, JSON.stringify(r));
    return r.ok ? `DONE (live): added "${name}" (code ${code}) to the OurVend catalog.` : `ERROR: could not add it (${r.error || 'no ok'}).`;
  }

  const writeSlotTool = {
    name: 'ourvend_write_slot',
    description:
      "Set ONE coil on a machine in OurVend LIVE — product placement + price + inventory. Give the machine id, coil number, product CODE, and (optional) machine_price, capacity, stock. Applies immediately.",
    input_schema: {
      type: 'object' as const,
      properties: {
        machine_id: { type: 'string' }, coil: { type: 'integer' }, product_code: { type: 'string' },
        machine_price: { type: 'string' }, capacity: { type: 'string' }, stock: { type: 'string' },
      },
      required: ['machine_id', 'coil', 'product_code'],
    },
  };
  async function runWriteSlot(inp: Record<string, unknown>): Promise<string> {
    const machineId = String(inp.machine_id ?? '').trim();
    const coil = Number(inp.coil);
    const code = String(inp.product_code ?? '').trim();
    if (!machineId || !coil || !code) return 'ERROR: need machine_id, coil, product_code';
    const r = await ourvendWrite('editSlot', { machineId, coil, productCode: code, machinePrice: String(inp.machine_price ?? ''), capacity: String(inp.capacity ?? ''), stock: String(inp.stock ?? '') });
    await logAction('editSlot', `${machineId}#${coil}`, { code, price: inp.machine_price, capacity: inp.capacity }, !!r.ok, JSON.stringify(r));
    return r.ok ? `DONE (live): machine ${machineId} coil ${coil} → ${code}.` : `ERROR: coil write failed (${r.error || 'no ok'}).`;
  }

  const pushPlanogramTool = {
    name: 'ourvend_push_planogram',
    description:
      "Push a saved MCOS planogram to a machine in OurVend LIVE, coil by coil — makes OurVend match MCOS (the photo-built truth). Give the planogram name (or id) and the target machine id. Coils not in the catalog are skipped.",
    input_schema: {
      type: 'object' as const,
      properties: {
        template_name: { type: 'string', description: 'Planogram name, e.g. "ASU West Campus 1"' },
        template_id: { type: 'string', description: 'Planogram id (alternative to name)' },
        machine_id: { type: 'string', description: 'Target OurVend machine id' },
      },
      required: ['machine_id'],
    },
  };
  async function runPushPlanogram(inp: Record<string, unknown>): Promise<string> {
    const machineId = String(inp.machine_id ?? '').trim();
    if (!machineId) return 'ERROR: need machine_id';
    const q = inp.template_id
      ? `templates?id=eq.${encodeURIComponent(String(inp.template_id))}&select=name,slots`
      : `templates?name=eq.${encodeURIComponent(String(inp.template_name ?? ''))}&select=name,slots`;
    const rows = await sb<{ name: string; slots: { coil: number; product: string; barcode: string | null; retail_price: string; capacity: string }[] }>(q);
    if (!rows.length) return 'ERROR: planogram not found — check the name.';
    const tpl = rows[0];
    const slots = (tpl.slots || []).filter((s) => s.product && s.barcode);
    if (!slots.length) return 'ERROR: that planogram has no catalog-matched coils to push.';
    let ok = 0; const fails: number[] = [];
    for (const s of slots) {
      const r = await ourvendWrite('editSlot', { machineId, coil: s.coil, productPrId: s.barcode, machinePrice: String(s.retail_price ?? ''), capacity: String(s.capacity ?? ''), stock: String(s.capacity ?? '') });
      if (r.ok) ok++; else fails.push(s.coil);
    }
    await logAction('pushPlanogram', machineId, { template: tpl.name, coils: slots.length, ok }, fails.length === 0, `ok ${ok}/${slots.length}`);
    return `Pushed "${tpl.name}" → machine ${machineId}: ${ok}/${slots.length} coils written LIVE${fails.length ? `; failed coils: ${fails.join(', ')}` : ''}. Coils not in the catalog were skipped.`;
  }

  const cloneMachineTool = {
    name: 'ourvend_clone_machine',
    description:
      "Clone one machine's whole layout onto another in OurVend LIVE (OurVend's own 'apply planogram'). Give source and target machine ids. Use to make machines identical.",
    input_schema: {
      type: 'object' as const,
      properties: {
        source_machine_id: { type: 'string' }, target_machine_id: { type: 'string' },
        start_coil: { type: 'integer' }, end_coil: { type: 'integer' },
      },
      required: ['source_machine_id', 'target_machine_id'],
    },
  };
  async function runCloneMachine(inp: Record<string, unknown>): Promise<string> {
    const source = String(inp.source_machine_id ?? '').trim();
    const target = String(inp.target_machine_id ?? '').trim();
    if (!source || !target) return 'ERROR: need source_machine_id and target_machine_id';
    const r = await ourvendWrite('cloneMachine', { sourceMachineId: source, targetMachineId: target, startCoil: inp.start_coil ?? 1, endCoil: inp.end_coil ?? '' });
    await logAction('cloneMachine', `${source}->${target}`, { start: inp.start_coil, end: inp.end_coil }, !!r.ok, JSON.stringify(r));
    return r.ok ? `DONE (live): cloned ${source} onto ${target}.` : `ERROR: clone failed (${r.error || 'no ok'}).`;
  }

  const listCalendarTool = {
    name: 'list_calendar_events',
    description:
      "Read upcoming events from the real MediCube Google Calendar. Use when Joe asks what's on the calendar / schedule / coming up.",
    input_schema: {
      type: 'object' as const,
      properties: {
        days: { type: 'integer', description: 'How many days ahead to look (default 14)' },
      },
    },
  };

  async function runListCalendar(input: Record<string, unknown>): Promise<string> {
    const days = Number.isInteger(input.days) && (input.days as number) > 0 ? (input.days as number) : 14;
    const now = new Date();
    const max = new Date(now.getTime() + days * 86400000);
    const cal = await callCalendar({ action: 'listEvents', timeMin: now.toISOString(), timeMax: max.toISOString(), maxResults: 50 });
    if (!cal.ok) return `ERROR: Google Calendar not reachable right now (${cal.error || '?'}).`;
    const events = (cal.events as { start?: string; summary?: string; location?: string }[]) || [];
    if (!events.length) return `No events on the Google Calendar in the next ${days} days.`;
    return `Google Calendar — next ${days} days:\n` +
      events.map((e) => `- ${e.start}: ${e.summary || '(no title)'}${e.location ? ` @ ${e.location}` : ''}`).join('\n');
  }

  const savePlanogramTool = {
    name: 'save_planogram',
    description:
      "Save a machine's REAL planogram to MCOS from a machine photo Joe attached. List every coil you can read (top to bottom). Products are matched to the catalog automatically. Name it with the machine/campus label (e.g. \"ASU West Glendale\"). Only include coils you can actually see; leave the rest out. This writes to MCOS only (not OurVend).",
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Planogram name — the machine/campus label from the photo or Joe' },
        machine_id: { type: 'string', description: 'OurVend machine id if known (optional)' },
        slots: {
          type: 'array',
          description: 'One entry per coil you can read',
          items: {
            type: 'object',
            properties: {
              coil: { type: 'integer', description: 'Coil number (01,03,05… wide; 31–50 narrow; 51–59 wide)' },
              product: { type: 'string', description: 'Product as seen on the label; matched to the catalog automatically' },
              price: { type: 'string', description: 'Price if visible (optional)' },
            },
            required: ['coil', 'product'],
          },
        },
      },
      required: ['name', 'slots'],
    },
  };

  async function runSavePlanogram(input: Record<string, unknown>): Promise<string> {
    const name = String(input.name ?? '').trim().slice(0, 120);
    if (!name) return 'ERROR: a planogram name (machine label) is required';
    const rawSlots = Array.isArray(input.slots) ? (input.slots as Record<string, unknown>[]) : [];
    if (!rawSlots.length) return 'ERROR: no coils provided';
    const catalog = await sb<CatalogRow>('products?select=name,barcode,default_price&order=name.asc');
    const layout = blankLayout();
    const byCoil = new Map(layout.map((s) => [s.coil, s]));
    const matched: string[] = []; const missing: string[] = []; let filled = 0;
    for (const rs of rawSlots) {
      const coil = Number(rs.coil);
      const slot = byCoil.get(coil);
      if (!slot) continue; // not a real coil on this layout
      const prodRaw = String(rs.product ?? '').trim();
      if (!prodRaw) continue;
      const m = matchProduct(prodRaw, catalog);
      slot.product = m.name;
      slot.barcode = m.barcode;
      slot.gate = m.gate;
      slot.retail_price = typeof rs.price === 'string' && rs.price ? rs.price : m.price;
      filled++;
      if (m.gate === 'match') matched.push(`${coil}:${m.name}`); else missing.push(`${coil}:${prodRaw}`);
    }
    if (!filled) return 'ERROR: none of the coils were valid (coils must be 1,3,5…29, 31–50, 51,53,55,57,59)';
    const slots = Array.from(byCoil.values()).sort((a, b) => a.coil - b.coil);
    const desc = `Built by Atlas from a machine photo. ${filled}/40 coils filled${input.machine_id ? ` · machine ${input.machine_id}` : ''}.`;

    // Upsert by name: update an existing planogram of the same name, else create.
    const existing = await sb<{ id: string }>(`templates?select=id&name=eq.${encodeURIComponent(name)}`);
    let saved = false;
    if (existing.length) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/templates?id=eq.${existing[0].id}`, {
        method: 'PATCH', headers: { ...sbHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ slots, description: desc, updated_at: new Date().toISOString() }),
      });
      saved = r.ok;
    } else {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/templates`, {
        method: 'POST', headers: { ...sbHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ name, status: 'draft', description: desc, slots }),
      });
      saved = r.ok;
    }
    if (!saved) return 'ERROR: could not save the planogram to MCOS';
    return `SAVED planogram "${name}" (${existing.length ? 'updated' : 'created'}) — ${filled}/40 coils. `
      + `Matched to catalog: ${matched.length}. `
      + (missing.length ? `NOT in the catalog (need loading before they can go on a machine): ${missing.join(', ')}. ` : '')
      + `Visible on the Templates block → Planograms. Tell Joe the count, list what is not in the catalog, and note any coils he should double-check.`;
  }

  const fileDocumentTool = {
    name: 'file_document',
    description:
      'File an uploaded document (contract, invoice, paperwork, lease, or other) into the Documents block, linking the stored copy. Use the stored URL listed for the attachment as file_url.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Short title, e.g. "ASU West lease" or "TCN invoice #1234"' },
        doc_type: { type: 'string', description: 'contract | invoice | paperwork | lease | other' },
        party: { type: 'string', description: 'Who it is with (supplier, campus, etc.)' },
        file_url: { type: 'string', description: 'The stored URL of the uploaded file (from the attachment list)' },
        notes: { type: 'string', description: 'Anything worth keeping' },
      },
      required: ['title'],
    },
  };

  async function runFileDocument(input: Record<string, unknown>): Promise<string> {
    const title = String(input.title ?? '').trim().slice(0, 160);
    if (!title) return 'ERROR: a document title is required';
    const row = {
      title,
      doc_type: typeof input.doc_type === 'string' ? input.doc_type.slice(0, 40) : 'other',
      party: typeof input.party === 'string' ? input.party.slice(0, 120) : null,
      link: typeof input.file_url === 'string' ? input.file_url.slice(0, 500) : null,
      status: 'filed',
      notes: typeof input.notes === 'string' ? input.notes.slice(0, 500) : null,
    };
    const r = await fetch(`${SUPABASE_URL}/rest/v1/documents`, {
      method: 'POST', headers: { ...sbHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(row),
    });
    if (!r.ok) return `ERROR: could not file the document (${r.status})`;
    return `FILED "${title}" (${row.doc_type}) into the Documents block${row.link ? ' with the uploaded file linked' : ''}.`;
  }

  const messages: Anthropic.Beta.BetaMessageParam[] = history.map((m) => ({ role: m.role, content: m.content }));

  // Attachments ride on the LAST user message: readable ones (images, PDFs) go
  // to Claude as content blocks so Atlas can SEE them; every file is also kept in
  // Storage so Atlas can file a link. The stored URLs are listed for the model.
  const attachments = (body.attachments ?? []).filter((a) => a && a.dataBase64).slice(0, 6);
  const storedFiles: { name: string; url: string | null }[] = [];
  if (attachments.length) {
    const blocks: Anthropic.Beta.BetaContentBlockParam[] = [];
    const lastText = history[history.length - 1].content;
    if (lastText) blocks.push({ type: 'text', text: lastText });
    const unreadable: string[] = [];
    for (const a of attachments) {
      const url = await storeAttachment(a.name, a.mediaType, a.dataBase64);
      storedFiles.push({ name: a.name, url });
      if (IMAGE_TYPES.includes(a.mediaType)) {
        blocks.push({ type: 'image', source: { type: 'base64', media_type: a.mediaType as 'image/jpeg', data: a.dataBase64 } });
      } else if (a.mediaType === 'application/pdf') {
        blocks.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: a.dataBase64 } });
      } else {
        unreadable.push(a.name);
      }
    }
    const urlList = storedFiles.filter((f) => f.url).map((f) => `- ${f.name}: ${f.url}`).join('\n');
    const notes = [
      `[${attachments.length} file(s) attached.`,
      urlList ? `Stored copies (use these URLs when filing with file_document):\n${urlList}` : 'Storage of the files failed — you can still read the images/PDFs above.',
      unreadable.length ? `You CANNOT read the contents of: ${unreadable.join(', ')} — file them by name, or ask Joe what they are.` : '',
      `]`,
    ].filter(Boolean).join('\n');
    blocks.push({ type: 'text', text: notes });
    messages[messages.length - 1] = { role: 'user', content: blocks };
  }

  try {
    let reply = '';
    for (let turn = 0; turn < 5; turn++) {
      const resp = await client.beta.messages.create({
        model: 'claude-opus-5',
        max_tokens: 2000,
        betas: ['server-side-fallback-2026-06-01'],
        fallbacks: [{ model: 'claude-opus-4-8' }],
        output_config: { effort: 'medium' },
        system: [
          { type: 'text', text: staticSystem(), cache_control: { type: 'ephemeral' } },
          { type: 'text', text: `LIVE SNAPSHOT (fetched for this message):\n\n${snapshot}${skills}` },
        ],
        tools: [
          setReminderTool, listCalendarTool, savePlanogramTool, fileDocumentTool,
          updateProductTool, addProductTool, writeSlotTool, pushPlanogramTool, cloneMachineTool,
          // Research — Anthropic's hosted web search (runs server-side on our key).
          { type: 'web_search_20250305', name: 'web_search', max_uses: 8 },
        ],
        messages,
      });

      if (resp.stop_reason === 'refusal') {
        reply = "I can't help with that one.";
        break;
      }
      if (resp.stop_reason === 'pause_turn') {
        messages.push({ role: 'assistant', content: resp.content });
        continue;
      }
      if (resp.stop_reason === 'tool_use') {
        messages.push({ role: 'assistant', content: resp.content });
        const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
        for (const block of resp.content) {
          // web_search is a SERVER tool — Anthropic runs it and returns the results
          // inline; there is nothing for us to execute or answer here.
          if (block.type !== 'tool_use' || block.name === 'web_search') continue;
          let out: string;
          if (block.name === 'set_reminder') {
            out = await runSetReminder(block.input as Record<string, unknown>);
          } else if (block.name === 'list_calendar_events') {
            out = await runListCalendar(block.input as Record<string, unknown>);
          } else if (block.name === 'save_planogram') {
            out = await runSavePlanogram(block.input as Record<string, unknown>);
          } else if (block.name === 'file_document') {
            out = await runFileDocument(block.input as Record<string, unknown>);
          } else if (block.name === 'ourvend_update_product') {
            out = await runUpdateProduct(block.input as Record<string, unknown>);
          } else if (block.name === 'ourvend_add_product') {
            out = await runAddProduct(block.input as Record<string, unknown>);
          } else if (block.name === 'ourvend_write_slot') {
            out = await runWriteSlot(block.input as Record<string, unknown>);
          } else if (block.name === 'ourvend_push_planogram') {
            out = await runPushPlanogram(block.input as Record<string, unknown>);
          } else if (block.name === 'ourvend_clone_machine') {
            out = await runCloneMachine(block.input as Record<string, unknown>);
          } else {
            out = `ERROR: unknown tool ${block.name}`;
          }
          results.push({ type: 'tool_result', tool_use_id: block.id, content: out, is_error: out.startsWith('ERROR') });
        }
        // Nothing of ours to run (e.g. a server tool handled it) — take the text and
        // finish rather than looping with no new input.
        if (!results.length) {
          reply = resp.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text').map((b) => b.text).join('\n').trim();
          break;
        }
        messages.push({ role: 'user', content: results });
        continue;
      }
      // end_turn / max_tokens — collect the text and finish
      reply = resp.content
        .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();
      break;
    }
    return NextResponse.json({ reply: reply || 'I ran out of turns before finishing — try asking again.' });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ reply: 'My API key was rejected — check the ANTHROPIC_API_KEY value in Vercel (Settings → Environment Variables) and redeploy.' });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ reply: 'The AI service is rate-limiting us right now — give it a minute and ask again.' });
    }
    const msg = err instanceof Anthropic.APIError ? `AI service error ${err.status}` : 'Something broke on my side';
    return NextResponse.json({ reply: `${msg} — try again, and if it keeps happening tell the builder.` });
  }
}
