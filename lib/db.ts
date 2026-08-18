// Thin browser client for the Supabase REST (PostgREST) API. The publishable key
// is public by design; tables are guarded by row-level-security policies.
import { SUPABASE_URL, SUPABASE_KEY } from '@/lib/config';

const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

export async function dbSelect<T>(table: string, query = 'select=*'): Promise<T[]> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers });
  if (!r.ok) throw new Error(`select ${table} ${r.status}`);
  return r.json();
}

export async function dbInsert<T extends object>(table: string, row: T): Promise<T> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(row)
  });
  if (!r.ok) throw new Error(`insert ${table} ${r.status} ${await r.text()}`);
  const out = await r.json();
  return Array.isArray(out) ? out[0] : out;
}

export async function dbUpdate<T extends object>(table: string, match: string, patch: T): Promise<void> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${match}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() })
  });
  if (!r.ok) throw new Error(`update ${table} ${r.status} ${await r.text()}`);
}

export async function dbDelete(table: string, match: string): Promise<void> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${match}`, {
    method: 'DELETE',
    headers: { ...headers, Prefer: 'return=minimal' }
  });
  if (!r.ok) throw new Error(`delete ${table} ${r.status}`);
}
