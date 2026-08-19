'use client';

import { useEffect, useState } from 'react';
import { dbSelect, dbInsert, dbUpdate, dbDelete } from '@/lib/db';

interface Machine {
  machine_id: string;
  label: string | null;
  role: string | null;
  campus: string | null;
  notes: string | null;
  reader_type: string | null;
  reader_url: string | null;
  router: string | null;
  apps: string | null;
  registered_ourvend: boolean | null;
  lockbox_code: string | null;
  lockbox_generated_at: string | null;
  assigned_template_id: string | null;
}
interface Loc {
  machine_id: string;
  address: string | null;
  access_code: string | null;
  access_notes: string | null;
}
interface Ev { id: string; kind: string | null; note: string; event_date: string | null; }

const READERS = ['Nayax', 'Cantaloupe', 'Aprivas'];

export function MachineRecord({ machineId, health }: {
  machineId: string;
  health: { reporting: boolean; syncedAgo: string; slots: number; stock: number; low: number; diffs: number };
}) {
  const [m, setM] = useState<Machine | null>(null);
  const [loc, setLoc] = useState<Loc | null>(null);
  const [locExists, setLocExists] = useState(false);
  const [events, setEvents] = useState<Ev[]>([]);
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 2500); };

  useEffect(() => {
    (async () => {
      try {
        const [mm, ll, ee] = await Promise.all([
          dbSelect<Machine>('machines', `select=*&machine_id=eq.${machineId}`),
          dbSelect<Loc>('machine_locations', `select=machine_id,address,access_code,access_notes&machine_id=eq.${machineId}`),
          dbSelect<Ev>('machine_events', `select=id,kind,note,event_date&machine_id=eq.${machineId}&order=event_date.desc,created_at.desc`),
        ]);
        if (mm[0]) setM(mm[0]);
        else {
          const created = await dbInsert('machines', { machine_id: machineId, role: 'live' });
          setM(created as Machine);
        }
        if (ll[0]) { setLoc(ll[0]); setLocExists(true); }
        else setLoc({ machine_id: machineId, address: '', access_code: '', access_notes: '' });
        setEvents(ee);
      } catch (e) { flash(e instanceof Error ? e.message : 'load failed'); }
    })();
  }, [machineId]);

  const patchM = async (p: Partial<Machine>) => {
    if (!m) return;
    setM({ ...m, ...p });
    try { await dbUpdate('machines', `machine_id=eq.${machineId}`, p); } catch { flash('Save failed'); }
  };
  const patchLoc = async (p: Partial<Loc>) => {
    if (!loc) return;
    const next = { ...loc, ...p };
    setLoc(next);
    try {
      if (locExists) await dbUpdate('machine_locations', `machine_id=eq.${machineId}`, p);
      else { await dbInsert('machine_locations', next); setLocExists(true); }
    } catch { flash('Save failed'); }
  };
  const genLockbox = () => {
    const n = new Uint32Array(1); crypto.getRandomValues(n);
    const code = String(n[0] % 10000).padStart(4, '0');
    patchM({ lockbox_code: code, lockbox_generated_at: new Date().toISOString() });
    flash(`New lockbox code ${code} — set the physical lockbox to match`);
  };
  const addEvent = async () => {
    if (!note.trim()) return;
    try {
      const created = await dbInsert('machine_events', { machine_id: machineId, note: note.trim() });
      setEvents((e) => [created as unknown as Ev, ...e]); setNote(''); flash('Logged');
    } catch { flash('Could not log'); }
  };
  const rmEvent = async (id: string) => {
    setEvents((e) => e.filter((x) => x.id !== id));
    try { await dbDelete('machine_events', `id=eq.${id}`); } catch { flash('Delete failed'); }
  };

  if (!m || !loc) return <div className="section"><p>Loading machine record…</p></div>;

  return (
    <div className="mrec">
      {msg && <div className="sb-msg">{msg}</div>}

      <div className="mrec-health">
        <span className={`chip ${health.reporting ? 'chip-live' : 'chip-empty'}`}>
          {health.reporting ? `ONLINE · synced ${health.syncedAgo}` : 'NOT REPORTING'}
        </span>
        <span className="pill">{health.slots} slots</span>
        <span className="pill">{health.stock.toLocaleString()} units</span>
        <span className={`pill ${health.low > 0 ? 'warn' : ''}`}>{health.low} low</span>
        <span className={`pill ${health.diffs > 0 ? 'warn' : ''}`}>{health.diffs} price differs</span>
        <span className="pill">{m.registered_ourvend ? 'OurVend registered ✓' : 'NOT registered'}</span>
      </div>

      <div className="pd-grid" style={{ marginTop: 12 }}>
        <label className="pd-field"><span>Name</span><input value={m.label || ''} onChange={(e) => patchM({ label: e.target.value })} /></label>
        <label className="pd-field"><span>Campus / location</span><input value={m.campus || ''} onChange={(e) => patchM({ campus: e.target.value })} /></label>
        <label className="pd-field pd-wide"><span>Address</span><input value={loc.address || ''} onChange={(e) => patchLoc({ address: e.target.value })} placeholder="street, city, state" /></label>

        <label className="pd-field"><span>Card reader</span>
          <input list="reader-options" value={m.reader_type || ''} onChange={(e) => patchM({ reader_type: e.target.value })} placeholder="Nayax / Cantaloupe / Aprivas" />
          <datalist id="reader-options">{READERS.map((r) => <option key={r} value={r} />)}</datalist>
        </label>
        <label className="pd-field"><span>Reader portal link</span><input value={m.reader_url || ''} onChange={(e) => patchM({ reader_url: e.target.value })} placeholder="https://… (password lives in the portal sign-up)" /></label>
        <label className="pd-field"><span>Router / internet</span><input value={m.router || ''} onChange={(e) => patchM({ router: e.target.value })} placeholder="carrier, SIM, router ID" /></label>
        <label className="pd-field"><span>Apps on machine</span><input value={m.apps || ''} onChange={(e) => patchM({ apps: e.target.value })} placeholder="anything installed on the machine" /></label>
        <label className="pd-field"><span>Registered in OurVend</span>
          <select value={m.registered_ourvend ? 'yes' : 'no'} onChange={(e) => patchM({ registered_ourvend: e.target.value === 'yes' })}>
            <option value="yes">yes</option><option value="no">no</option>
          </select>
        </label>
        <label className="pd-field pd-wide"><span>Access notes (where the lockbox is, keys…)</span><input value={loc.access_notes || ''} onChange={(e) => patchLoc({ access_notes: e.target.value })} /></label>
        <label className="pd-field pd-wide"><span>Notes</span><textarea rows={2} value={m.notes || ''} onChange={(e) => patchM({ notes: e.target.value })} /></label>
      </div>

      <div className="mrec-lock">
        <div>
          <div className="mrec-lock-label">LOCKBOX CODE</div>
          <div className="mrec-code">{m.lockbox_code || '— none set —'}</div>
          {m.lockbox_generated_at && <div className="mrec-lock-sub">generated {new Date(m.lockbox_generated_at).toLocaleString()}</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {m.reader_url && <a className="pd-save" style={{ textDecoration: 'none' }} href={m.reader_url} target="_blank" rel="noopener noreferrer">Reader portal ↗</a>}
          <button className="pd-save" onClick={genLockbox}>Generate new code</button>
        </div>
      </div>
      <p className="tbl-cap">Generating stores a new 4-digit code here (our record for machine access) — then set the
        physical lockbox to match. The card-reader password is not stored in MCOS; it lives in the reader portal sign-up.</p>

      <div className="section" style={{ marginTop: 14 }}>
        <h3>Maintenance &amp; service log</h3>
        <div className="sb-add" style={{ marginBottom: 10 }}>
          <input placeholder="What happened / what was done…" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="pd-save" onClick={addEvent}>Log it</button>
        </div>
        {events.length === 0
          ? <p style={{ opacity: .6 }}>No service events yet.</p>
          : events.map((ev) => (
            <div key={ev.id} className="mrec-ev">
              <span className="mono" style={{ opacity: .6 }}>{ev.event_date}</span>
              <span style={{ flex: 1 }}>{ev.note}</span>
              <button className="mc-x" onClick={() => rmEvent(ev.id)}>✕</button>
            </div>
          ))}
      </div>
    </div>
  );
}
