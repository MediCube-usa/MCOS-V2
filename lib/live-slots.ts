// Reads the live fleet from Supabase `live_slots` — the table the OurVend edge
// function keeps current (every ~20 min via pg_cron, plus on-demand from the
// Refresh button). Falls back to the committed snapshot (fleet-seed.json) when
// the table is empty or unreachable, so the dashboard always renders.
//
// Read-only. Nothing here writes to OurVend or to any machine.
import { SUPABASE_URL, SUPABASE_KEY } from './config';
import { FLEET, type Machine, type Slot } from './fleet';

interface LiveRow {
  machine_id: string;
  coil: number;
  barcode: string;
  product: string;
  machine_price: string;
  cloud_price: string;
  capacity: number;
  stock: number;
  img_url: string;
  work_status: string;
  synced_at: string;
}

export interface LiveFleet {
  machines: Machine[];
  // Most recent synced_at across all live rows, or null when we fell back to the seed.
  syncedAt: string | null;
  // true when at least one machine came from live_slots (not the seed).
  live: boolean;
  source: 'live' | 'snapshot';
}

// Product image URLs, keyed by machineId+coil, from the same live pull. Used by
// pages that want to show the real product image next to a slot.
export interface LiveImages { [key: string]: string; }

async function fetchLiveRows(): Promise<LiveRow[]> {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/live_slots?select=*&order=machine_id.asc,coil.asc`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      cache: 'no-store',
    });
    if (!r.ok) return [];
    const rows = (await r.json()) as LiveRow[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function rowToSlot(row: LiveRow): Slot {
  return {
    machineId: row.machine_id,
    slot: row.coil,
    barcode: row.barcode,
    product: row.product,
    machinePrice: row.machine_price,
    userPrice: row.cloud_price,
    capacity: row.capacity,
    stock: row.stock,
  };
}

// The whole fleet with live data overlaid on the seed's structure (labels +
// groups come from the seed; slots/prices/stock come from live_slots when
// present for that machine).
export async function getLiveFleet(): Promise<LiveFleet> {
  const rows = await fetchLiveRows();
  if (rows.length === 0) {
    return { machines: FLEET.machines, syncedAt: null, live: false, source: 'snapshot' };
  }

  const byMachine = new Map<string, LiveRow[]>();
  let syncedAt = '';
  for (const row of rows) {
    if (!byMachine.has(row.machine_id)) byMachine.set(row.machine_id, []);
    byMachine.get(row.machine_id)!.push(row);
    if (row.synced_at > syncedAt) syncedAt = row.synced_at;
  }

  const machines: Machine[] = FLEET.machines.map((seed) => {
    const live = byMachine.get(seed.machineId);
    if (!live || live.length === 0) return seed;
    const slots = live.map(rowToSlot).sort((a, b) => a.slot - b.slot);
    return {
      ...seed,
      slots,
      stockedSlots: slots.filter((s) => s.stock > 0).length,
      totalStock: slots.reduce((n, s) => n + (s.stock || 0), 0),
    };
  });

  return { machines, syncedAt: syncedAt || null, live: true, source: 'live' };
}

export async function getLiveMachine(id: string): Promise<{ machine: Machine | undefined; syncedAt: string | null; live: boolean }> {
  const fleet = await getLiveFleet();
  return {
    machine: fleet.machines.find((m) => m.machineId === id),
    syncedAt: fleet.syncedAt,
    live: fleet.live,
  };
}

// Product image URLs from the live pull, keyed by `${machineId}:${coil}`.
export async function getLiveImages(machineId?: string): Promise<LiveImages> {
  const rows = await fetchLiveRows();
  const out: LiveImages = {};
  for (const row of rows) {
    if (machineId && row.machine_id !== machineId) continue;
    if (row.img_url) out[`${row.machine_id}:${row.coil}`] = row.img_url;
  }
  return out;
}

// A short, friendly "synced 4 min ago" string for the UI.
export function syncedAgo(iso: string | null): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (secs < 60) return 'just now';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}
