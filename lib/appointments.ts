// Appointments & reminders for every block, plus the dates that already live
// in each block's own forms (ETAs, pickups, follow-ups, refill visits) read as
// auto-appointments — set once on the block, never retyped.
// Google Calendar hookup is link-based: every item carries a one-click
// "add to Google Calendar" URL, and Google handles the phone/email reminders.

import { dbSelect, dbInsert, dbUpdate } from '@/lib/db';

export interface Appointment {
  id: string;
  department: string;
  title: string;
  starts_at: string;
  has_time: boolean;
  location: string | null;
  notes: string | null;
  remind_days_before: number;
  done: boolean;
}

export interface CalItem {
  key: string;
  department: string;
  title: string;
  when: Date;
  hasTime: boolean;
  location: string | null;
  notes: string | null;
  remindDays: number;
  auto: boolean;          // true = comes from a block form's own date field
  source: string;         // where it comes from, e.g. "Machine Setup form"
  id?: string;            // appointments.id (manual items only)
}

export type AlertLevel = 'overdue' | 'today' | 'soon' | 'later';

// ---- month-grid helpers (header calendar box + /calendar page) ----
export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// 42 cells (6 weeks) starting on the Sunday on/before the 1st of the month.
export function monthMatrix(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

export function groupByDay(items: CalItem[]): Map<string, CalItem[]> {
  const m = new Map<string, CalItem[]>();
  for (const i of items) {
    const k = dayKey(i.when);
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(i);
  }
  return m;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function alertLevel(i: CalItem, now = new Date()): AlertLevel {
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDay = new Date(i.when.getFullYear(), i.when.getMonth(), i.when.getDate());
  if (itemDay < dayStart) return 'overdue';
  if (itemDay.getTime() === dayStart.getTime()) return 'today';
  const days = Math.round((itemDay.getTime() - dayStart.getTime()) / 86400000);
  return days <= i.remindDays ? 'soon' : 'later';
}

export function fmtWhen(i: CalItem): string {
  const d = i.when;
  const date = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return i.hasTime ? `${date} · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : date;
}

// One-click "add to Google Calendar" — timed items get a 1-hour block,
// date-only items land as all-day events.
export function gcalUrl(i: CalItem): string {
  let dates: string;
  if (i.hasTime) {
    const f = (x: Date) =>
      `${x.getUTCFullYear()}${pad(x.getUTCMonth() + 1)}${pad(x.getUTCDate())}T${pad(x.getUTCHours())}${pad(x.getUTCMinutes())}00Z`;
    dates = `${f(i.when)}/${f(new Date(i.when.getTime() + 3600000))}`;
  } else {
    const f = (x: Date) => `${x.getFullYear()}${pad(x.getMonth() + 1)}${pad(x.getDate())}`;
    const next = new Date(i.when); next.setDate(next.getDate() + 1);
    dates = `${f(i.when)}/${f(next)}`;
  }
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: `MCOS · ${i.title}`,
    dates,
    details: `${i.notes ? `${i.notes}\n` : ''}${i.source} — set in MCOS`,
  });
  if (i.location) p.set('location', i.location);
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

function parseDay(dateStr: string, timeStr?: string | null): { when: Date; hasTime: boolean } {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
  const t = timeStr?.match(/^(\d{1,2}):(\d{2})/);
  if (t) return { when: new Date(y, m - 1, d, Number(t[1]), Number(t[2])), hasTime: true };
  return { when: new Date(y, m - 1, d), hasTime: false };
}

export function fromRow(a: Appointment): CalItem {
  const when = new Date(a.starts_at);
  return {
    key: `appt-${a.id}`, id: a.id, department: a.department, title: a.title,
    when, hasTime: a.has_time, location: a.location, notes: a.notes,
    remindDays: a.remind_days_before, auto: false, source: 'set on the block',
  };
}

export async function fetchManual(dept?: string): Promise<CalItem[]> {
  const q = `select=*&done=eq.false&order=starts_at.asc${dept ? `&department=eq.${dept}` : ''}`;
  return (await dbSelect<Appointment>('appointments', q)).map(fromRow);
}

// The dates each block already tracks, read live from its own tables.
// Rows here mirror the forms — edit the form, the appointment follows.
export async function fetchAuto(dept?: string): Promise<CalItem[]> {
  const out: CalItem[] = [];
  const want = (d: string) => !dept || dept === d;
  const add = (department: string, source: string, key: string, title: string,
    dateStr: string | null, timeStr?: string | null, remindDays = 3) => {
    if (!dateStr) return;
    const { when, hasTime } = parseDay(dateStr, timeStr);
    out.push({ key, department, title, when, hasTime, location: null, notes: null, remindDays, auto: true, source });
  };

  // Each auto item knows whether its milestone was MET (machine actually
  // arrived, refiller actually verified on site…). Met items drop off the
  // calendar; a passed date with the milestone NOT met fires a NOT-MET alert.
  const jobs: Promise<void>[] = [];
  if (want('setup-distribution')) {
    jobs.push(dbSelect<{ id: string; name: string; stage: string; eta: string | null; pickup_date: string | null; campus_ship_date: string | null; follow_up_date: string | null; arrived_date: string | null; warehouse_date: string | null; map_card_sent: boolean | null }>(
      'setup_machines', 'select=id,name,stage,eta,pickup_date,campus_ship_date,follow_up_date,arrived_date,warehouse_date,map_card_sent',
    ).then((rows) => rows.forEach((r) => {
      const atCampus = ['mapcard', 'setup', 'verified'].includes(r.stage);
      if (!r.arrived_date) add('setup-distribution', 'Machine Setup form', `su-eta-${r.id}`, `${r.name} — arrives at port (ETA)`, r.eta);
      if (!r.warehouse_date) add('setup-distribution', 'Machine Setup form', `su-pk-${r.id}`, `${r.name} — Brendamour pickup`, r.pickup_date);
      if (!atCampus) add('setup-distribution', 'Machine Setup form', `su-cs-${r.id}`, `${r.name} — ships to campus`, r.campus_ship_date);
      if (!r.map_card_sent) add('setup-distribution', 'Machine Setup form', `su-fu-${r.id}`, `${r.name} — map card follow-up`, r.follow_up_date);
    })).catch(() => {}));
  }
  if (want('restocking')) {
    jobs.push(dbSelect<{ id: string; machine_id: string | null; status: string; scheduled_date: string | null; scheduled_time: string | null; reoffer_date: string | null; onsite_verified: boolean | null; accepted: boolean | null }>(
      'restock_tasks', 'select=id,machine_id,status,scheduled_date,scheduled_time,reoffer_date,onsite_verified,accepted&status=not.eq.done',
    ).then((rows) => rows.forEach((r) => {
      if (!r.onsite_verified) add('restocking', 'Restocking task', `rs-sd-${r.id}`, `Refill visit — ${r.machine_id || 'machine'}`, r.scheduled_date, r.scheduled_time, 1);
      if (!r.accepted) add('restocking', 'Restocking task', `rs-ro-${r.id}`, `Re-offer refiller — ${r.machine_id || 'machine'}`, r.reoffer_date, null, 1);
    })).catch(() => {}));
  }
  if (want('maps-distribution')) {
    jobs.push(dbSelect<{ machine_id: string; follow_up_date: string | null }>(
      'machine_locations', 'select=machine_id,follow_up_date&follow_up_date=not.is.null',
    ).then((rows) => rows.forEach((r) => {
      add('maps-distribution', 'Map card', `ml-fu-${r.machine_id}`, `${r.machine_id} — location follow-up`, r.follow_up_date);
    })).catch(() => {}));
  }
  if (want('warehouse-purchasing')) {
    jobs.push(dbSelect<{ id: string; title: string; status: string; eta: string | null }>(
      'warehouse_orders', 'select=id,title,status,eta&eta=not.is.null',
    ).then((rows) => rows.forEach((r) => {
      if (!['received', 'delivered', 'done', 'closed'].includes((r.status || '').toLowerCase()))
        add('warehouse-purchasing', 'Warehouse order', `wo-${r.id}`, `${r.title} — order ETA`, r.eta);
    })).catch(() => {}));
  }
  await Promise.all(jobs);
  return out;
}

// Everything a page needs: manual + auto, deduped keys, old noise dropped
// (anything more than 30 days past), soonest first.
export async function fetchCalendar(dept?: string): Promise<CalItem[]> {
  const [manual, auto] = await Promise.all([fetchManual(dept), fetchAuto(dept)]);
  const cutoff = Date.now() - 30 * 86400000;
  return [...manual, ...auto]
    .filter((i) => i.when.getTime() >= cutoff)
    .sort((a, b) => a.when.getTime() - b.when.getTime());
}

// One shared fetch per page load — the Command Center boxes all read this so
// sixteen small alert counters cost one round trip, not sixteen.
let allCache: Promise<CalItem[]> | null = null;
export function fetchCalendarShared(): Promise<CalItem[]> {
  if (!allCache) allCache = fetchCalendar().catch((e) => { allCache = null; throw e; });
  return allCache;
}

// ---- per-block reminder switch (block_settings) ----
// Alerts on for some blocks and off for others; set on each block's page.
// Missing row = ON (the default).
interface BlockSetting { department: string; alerts_enabled: boolean; }

export async function fetchAlertsOff(): Promise<Set<string>> {
  try {
    const rows = await dbSelect<BlockSetting>('block_settings', 'select=department,alerts_enabled&alerts_enabled=eq.false');
    return new Set(rows.map((r) => r.department));
  } catch { return new Set(); }
}

let offCache: Promise<Set<string>> | null = null;
export function fetchAlertsOffShared(): Promise<Set<string>> {
  if (!offCache) offCache = fetchAlertsOff().catch(() => { offCache = null; return new Set<string>(); });
  return offCache;
}

export async function setAlertsEnabled(department: string, enabled: boolean): Promise<void> {
  const existing = await dbSelect<BlockSetting>('block_settings', `select=department&department=eq.${department}`);
  if (existing.length > 0) await dbUpdate('block_settings', `department=eq.${department}`, { alerts_enabled: enabled });
  else await dbInsert('block_settings', { department, alerts_enabled: enabled });
  offCache = null;
}
