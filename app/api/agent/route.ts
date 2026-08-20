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
import { SUPABASE_URL, SUPABASE_KEY } from '@/lib/config';
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
  const [fleet, products, machines, restock, setup, locations, orders, appts, templates] = await Promise.all([
    getLiveFleet(),
    sb<{ name: string; default_price: string | null }>('products?select=name,default_price&order=name.asc'),
    sb<object>('machines?select=machine_id,label,role,assigned_template_id&order=machine_id.asc'),
    sb<object>('restock_tasks?select=id,machine_id,status,scheduled_date,scheduled_time,accepted,onsite_verified,reoffer_date&status=not.eq.done'),
    sb<object>('setup_machines?select=name,stage,eta,pickup_date,campus_ship_date,follow_up_date,arrived_date,warehouse_date'),
    sb<object>('machine_locations?select=*'),
    sb<object>('warehouse_orders?select=title,status,eta'),
    sb<object>('appointments?select=department,title,starts_at,has_time,location,notes&done=eq.false&order=starts_at.asc'),
    sb<object>('templates?select=id,name,status'),
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
    rowsText('CATALOG PRODUCTS (name @ default price)', products.map((p) => ({ n: p.name, p: p.default_price })), 60),
    rowsText('MACHINE REGISTRY (roles/planogram assignment)', machines, 20),
    rowsText('OPEN RESTOCK TASKS', restock),
    rowsText('MACHINE SETUP PIPELINE', setup, 25),
    rowsText('MACHINE LOCATIONS / MAP CARDS', locations, 25),
    rowsText('OPEN WAREHOUSE ORDERS', orders, 25),
    rowsText('APPOINTMENTS & REMINDERS (open, soonest first)', appts, 40),
    rowsText('PLANOGRAM TEMPLATES', templates, 20),
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
3. You are READ-ONLY toward OurVend and the machines. You cannot change prices, products, planograms, or anything on a machine — only Joe does that, in OurVend. If asked, say so.
4. Your ONE write ability: set_reminder — it files a reminder/appointment on a block. It appears on the site calendar, as a ⏰ badge on that block's box, and in that block's alert list. Use it whenever Joe mentions a date, a visit, a deadline, a follow-up, or asks to be reminded — capture WHO it involves and WHERE it's going in the title/location/notes. Confirm what you set, with the date.
5. When a question needs a block that is still a shell (parked), say the block isn't built yet.

Keep replies under ~150 words unless Joe asks for a full rundown.`;
}

interface ChatMsg { role: 'user' | 'assistant'; content: string; }

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
  const found = findAnthropicKey();
  if (!found.key) {
    const seen = found.nearMisses.length
      ? `I can see server variables named ${found.nearMisses.join(', ')} — but none of them holds an Anthropic key (the value should start with sk-ant-).`
      : 'No variable on the server looks like an Anthropic key at all.';
    return NextResponse.json({
      reply: `My API key isn't connected yet. ${seen}\n\nFix in Vercel → project mcos-v2-site → Settings → Environment Variables: Key = ANTHROPIC_API_KEY, Value = the whole key starting with sk-ant-, tick PRODUCTION, Save — then Deployments → ⋯ on the newest → Redeploy. Ask me again after.`,
    });
  }

  let history: ChatMsg[] = [];
  try {
    const body = (await req.json()) as { messages?: ChatMsg[] };
    history = (body.messages ?? [])
      .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
      .slice(-24);
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
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
    return `SAVED: "${title}" on ${date}${time ? ` at ${time}` : ''} → ${dept} block (calendar + badge + alerts).`;
  }

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
        tools: [setReminderTool],
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
          const out =
            block.name === 'set_reminder'
              ? await runSetReminder(block.input as Record<string, unknown>)
              : `ERROR: unknown tool ${block.name}`;
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
