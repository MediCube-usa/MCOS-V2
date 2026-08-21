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

function staticSystem(): string {
  const blocks = blockDepartments().map((d) => `- ${d.id} = ${d.name} (${d.status})`).join('\n');
  return `You are ATLAS, the executive command agent on the MCOS Command Center — the neon dashboard that runs MediCube's vending machine business (college campus vending: UNLV, ASU, CSUDH, Murad). Your user is Joe, the owner. Be direct, plain-spoken, and operational — short answers, real numbers, no fluff.

THE DASHBOARD BLOCKS (department ids you can set reminders on):
${blocks}

DATA RULES (these matter — trust has been burned before):
1. Answer ONLY from the live snapshot in this conversation. Every number you give must come from it. If the snapshot doesn't contain something, say plainly "that's not in my data yet" — NEVER estimate or invent a figure.
2. The snapshot refreshes from the OurVend connection about every 20 minutes. Quote the sync age when talking about stock.
3. You can PROPOSE changes to a product in OurVend — price, description, name, or size — with the propose_ourvend_change tool, using the product's exact CODE from the catalog snapshot. This does NOT change anything itself: it shows Joe an Approve button, and only his tap makes it live. So NEVER say you changed something — say you've "put it up for approval" and let the card do the rest. You still cannot touch planograms, coils/slots, or per-machine prices yet (not built) — say so if asked.
4. set_reminder — files a date on a block AND drops it on the real MediCube Google Calendar in one shot (shows on the ⏰ badge, the block's alerts, and the actual Google Calendar). Use it whenever Joe mentions a date, visit, deadline, or follow-up — capture who/where in the title/location/notes. Confirm what you set, with the date; the tool tells you if it also reached Google Calendar.
5. list_calendar_events — reads what's actually on the Google Calendar. Use it when Joe asks what's coming up / on the schedule. If it says the calendar isn't reachable, tell him plainly (the connection may need a reconnect).
6. When a question needs a block that is still a shell (parked), say the block isn't built yet.

Keep replies under ~150 words unless Joe asks for a full rundown.`;
}

interface ChatMsg { role: 'user' | 'assistant'; content: string; }

// A proposed OurVend change — surfaced to the chat as an Approve card. Nothing
// happens until Joe taps Approve, which POSTs {execute} back here (hard rule 3).
type OurVendChange = 'price' | 'description' | 'name' | 'size';
interface PendingAction { code: string; name: string; change: OurVendChange; value: string; }

async function executeAction(a: PendingAction): Promise<Response> {
  const code = String(a.code || '').trim();
  const change = a.change;
  const value = String(a.value ?? '');
  if (!code || !['price', 'description', 'name', 'size'].includes(change)) {
    return NextResponse.json({ reply: 'That action was malformed — nothing changed.' });
  }
  if (change === 'price' && !/^\d+(\.\d{1,2})?$/.test(value)) {
    return NextResponse.json({ reply: 'A price has to be a number like 3.99 — nothing changed.' });
  }
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/ourvend-write`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_JWT, Authorization: `Bearer ${SUPABASE_ANON_JWT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'editProductByCode', code, set: { [change]: value } }),
    });
    const j = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string; before?: Record<string, string> };
    if (j?.ok) {
      const was = j.before?.[change];
      return NextResponse.json({ reply: `✅ Done in OurVend — ${a.name || code}: ${change} is now "${value}"${was ? ` (was "${was}")` : ''}.` });
    }
    return NextResponse.json({ reply: `⚠️ Could not make that change: ${j?.error || 'OurVend did not confirm'}. Nothing was changed.` });
  } catch {
    return NextResponse.json({ reply: '⚠️ Could not reach OurVend just now — nothing was changed. Try again in a moment.' });
  }
}

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

  let body: { messages?: ChatMsg[]; execute?: PendingAction } = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad request' }, { status: 400 }); }

  // APPROVE GATE — a live OurVend write happens ONLY here, when Joe taps Approve.
  if (body.execute) return executeAction(body.execute);

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
  const snapshot = await liveSnapshot();
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

  const proposeChangeTool = {
    name: 'propose_ourvend_change',
    description:
      "Propose a change to a product in OurVend — price, description, name, or size. This does NOT change anything; it shows Joe an Approve button and only his tap makes it live. Use the product's exact CODE from the catalog snapshot.",
    input_schema: {
      type: 'object' as const,
      properties: {
        product_code: { type: 'string', description: 'The OurVend product code (from the catalog snapshot)' },
        product_name: { type: 'string', description: 'Product name, for the confirmation card' },
        change: { type: 'string', enum: ['price', 'description', 'name', 'size'], description: 'What to change' },
        new_value: { type: 'string', description: 'The new value (a price is a number like 3.99)' },
      },
      required: ['product_code', 'change', 'new_value'],
    },
  };

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

  const pending: PendingAction[] = [];
  const messages: Anthropic.Beta.BetaMessageParam[] = history.map((m) => ({ role: m.role, content: m.content }));

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
          { type: 'text', text: `LIVE SNAPSHOT (fetched for this message):\n\n${snapshot}` },
        ],
        tools: [setReminderTool, listCalendarTool, proposeChangeTool],
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
          if (block.type !== 'tool_use') continue;
          let out: string;
          if (block.name === 'set_reminder') {
            out = await runSetReminder(block.input as Record<string, unknown>);
          } else if (block.name === 'list_calendar_events') {
            out = await runListCalendar(block.input as Record<string, unknown>);
          } else if (block.name === 'propose_ourvend_change') {
            const inp = block.input as Record<string, unknown>;
            const code = String(inp.product_code ?? '').trim();
            const change = String(inp.change ?? '');
            const value = String(inp.new_value ?? '');
            const name = String(inp.product_name ?? '');
            if (code && ['price', 'description', 'name', 'size'].includes(change) && value) {
              pending.push({ code, name, change: change as OurVendChange, value });
              out = `Proposed ${change} of "${name || code}" → "${value}". Shown to Joe with an Approve button — NOT applied yet.`;
            } else {
              out = 'ERROR: propose needs product_code, change (price|description|name|size), and new_value';
            }
          } else {
            out = `ERROR: unknown tool ${block.name}`;
          }
          results.push({ type: 'tool_result', tool_use_id: block.id, content: out, is_error: out.startsWith('ERROR') });
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
    return NextResponse.json({ reply: reply || (pending.length ? 'Ready for your approval below.' : 'I ran out of turns before finishing — try asking again.'), pending });
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
