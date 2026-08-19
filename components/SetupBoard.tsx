'use client';

import { useEffect, useState } from 'react';
import { dbSelect, dbInsert, dbUpdate, dbDelete } from '@/lib/db';

interface SetupMachine {
  id: string;
  name: string;
  model: string | null;
  order_ref: string | null;
  stage: string;
  facility: string | null;
  eta: string | null;
  notes: string | null;
  checklist: Record<string, boolean>;
  machine_type: string | null;
  qty: number | null;
  color: string | null;
  description: string | null;
  invoice_url: string | null;
  port: string | null;
  shipping_info: string | null;
  paperwork_url: string | null;
  order_date: string | null;
  arrived_date: string | null;
  pickup_date: string | null;
  warehouse_date: string | null;
  contract_date: string | null;
  campus_ship_date: string | null;
  walkout_location: string | null;
  google_maps_url: string | null;
  photos_uploaded: boolean | null;
  directions: string | null;
  access_time: string | null;
  contact_numbers: string | null;
  follow_up_date: string | null;
  map_card_sent: boolean | null;
  machine_id: string | null;
  router_verified: boolean | null;
  tcn_registered: boolean | null;
  decals_verified: boolean | null;
}

// Joe's pipeline: TCN order → port (LA) → Brendamour pickup → warehouse →
// contract → map card (distribution) → setup (router/TCN/decals) → verified.
const STAGES = [
  { id: 'ordered', label: 'Order', hint: 'TCN order verified' },
  { id: 'shipping', label: 'Shipping', hint: 'port · mostly Los Angeles' },
  { id: 'arrived', label: 'Arrived', hint: 'Brendamour pickup' },
  { id: 'warehouse', label: 'Warehouse', hint: 'received, staged' },
  { id: 'contract', label: 'Contract', hint: 'then ship to campus' },
  { id: 'mapcard', label: 'Map card', hint: 'pin + walk-out location' },
  { id: 'setup', label: 'Setup', hint: 'router · TCN · decals' },
  { id: 'verified', label: 'Verified', hint: 'hand to Machine Ops' },
] as const;

const PROTOCOL = ['Model verified', 'Color verified', 'Locks verified', 'Invoice received', 'Paperwork complete'];

function Bool({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="sb-check-row">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function SetupBoard() {
  const [rows, setRows] = useState<SetupMachine[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [nm, setNm] = useState('');
  const [model, setModel] = useState('');

  const load = async () => {
    try {
      const data = await dbSelect<SetupMachine>('setup_machines', 'select=*&order=created_at.asc');
      setRows(data.map((r) => ({ ...r, checklist: r.checklist || {} })));
      setStatus('ready');
    } catch (e) { setStatus('error'); setMsg(e instanceof Error ? e.message : 'load failed'); }
  };
  useEffect(() => { load(); }, []);
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 2500); };

  const add = async () => {
    if (!nm.trim()) { flash('Name the order first (e.g. "UNLV batch 2")'); return; }
    try {
      const created = await dbInsert('setup_machines', { name: nm.trim(), model: model.trim() || null, stage: 'ordered' });
      setRows((r) => [...r, { ...(created as SetupMachine), checklist: {} }]);
      setNm(''); setModel(''); setAdding(false); flash('Order added');
    } catch { flash('Could not add'); }
  };
  const patch = async (id: string, p: Partial<SetupMachine>) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
    try { await dbUpdate('setup_machines', `id=eq.${id}`, p); } catch { flash('Save failed'); }
  };
  const remove = async (id: string) => {
    setRows((rs) => rs.filter((r) => r.id !== id));
    if (open === id) setOpen(null);
    try { await dbDelete('setup_machines', `id=eq.${id}`); flash('Removed'); } catch { flash('Delete failed'); }
  };
  const move = (m: SetupMachine, dir: 1 | -1) => {
    const i = STAGES.findIndex((s) => s.id === m.stage);
    const next = STAGES[Math.min(STAGES.length - 1, Math.max(0, i + (i === -1 ? 1 : dir)))];
    if (next.id !== m.stage) patch(m.id, { stage: next.id });
  };
  const toggleCheck = (m: SetupMachine, item: string) =>
    patch(m.id, { checklist: { ...m.checklist, [item]: !m.checklist[item] } });

  if (status === 'loading') return <div className="section"><p>Loading pipeline…</p></div>;
  if (status === 'error') return <div className="banner building">Could not load the setup pipeline: {msg}</div>;

  return (
    <div className="setupboard">
      <div className="sb-bar">
        <div className="sb-counts">
          {STAGES.map((s) => <span key={s.id} className="sb-count"><b>{rows.filter((r) => r.stage === s.id).length}</b> {s.label}</span>)}
        </div>
        {!adding
          ? <button className="pd-save" onClick={() => setAdding(true)}>+ New TCN order</button>
          : (
            <div className="sb-add">
              <input placeholder="Order name / destination *" value={nm} onChange={(e) => setNm(e.target.value)} />
              <input placeholder="TCN model" value={model} onChange={(e) => setModel(e.target.value)} />
              <button className="pd-save" onClick={add}>Add</button>
              <button className="pd-link" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          )}
      </div>
      {msg && <div className="sb-msg">{msg}</div>}

      {rows.length === 0 && <div className="section"><p>No machines in the pipeline. Add the TCN order and it moves
        through: shipping → Brendamour pickup → warehouse → contract → map card → setup → verified.</p></div>}

      <div className="sb-cols">
        {STAGES.map((s) => (
          <div key={s.id} className="sb-col">
            <div className="sb-col-head"><b>{s.label}</b><span>{s.hint}</span></div>
            {rows.filter((r) => r.stage === s.id).map((m) => {
              const isOpen = open === m.id;
              const proto = PROTOCOL.filter((i) => m.checklist[i]).length;
              return (
                <div key={m.id} className={`sb-card ${isOpen ? 'open' : ''}`}>
                  <div className="sb-card-top" onClick={() => setOpen(isOpen ? null : m.id)}>
                    <div className="sb-card-name">{m.name}{m.qty && m.qty > 1 ? ` ×${m.qty}` : ''}</div>
                    {(m.model || m.color || m.machine_type) && <div className="sb-card-sub">{[m.model, m.color, m.machine_type].filter(Boolean).join(' · ')}</div>}
                    <div className="sb-card-meta">{proto}/{PROTOCOL.length} protocol{m.facility ? ` · ${m.facility}` : ''}{m.eta ? ` · ETA ${m.eta}` : ''}</div>
                  </div>
                  {isOpen && (
                    <div className="sb-card-body">
                      <div className="sb-move">
                        <button className="pd-link" onClick={() => move(m, -1)} disabled={s.id === STAGES[0].id}>← back</button>
                        <button className="pd-link" onClick={() => move(m, 1)} disabled={s.id === STAGES[STAGES.length - 1].id}>advance →</button>
                      </div>

                      <div className="sb-check-title">The order</div>
                      <label className="pd-field"><span>Model (what machine)</span><input value={m.model || ''} onChange={(e) => patch(m.id, { model: e.target.value })} /></label>
                      <label className="pd-field"><span>Type</span>
                        <select value={m.machine_type || ''} onChange={(e) => patch(m.id, { machine_type: e.target.value })}>
                          <option value="">—</option><option value="fridge">fridge</option><option value="non-fridge">non-fridge</option>
                        </select></label>
                      <label className="pd-field"><span>How many</span><input type="number" value={m.qty ?? 1} onChange={(e) => patch(m.id, { qty: Number(e.target.value) || 1 })} /></label>
                      <label className="pd-field"><span>Color</span><input value={m.color || ''} onChange={(e) => patch(m.id, { color: e.target.value })} /></label>
                      <label className="pd-field"><span>Description</span><input value={m.description || ''} onChange={(e) => patch(m.id, { description: e.target.value })} /></label>
                      <label className="pd-field"><span>Order ref</span><input value={m.order_ref || ''} onChange={(e) => patch(m.id, { order_ref: e.target.value })} /></label>
                      <label className="pd-field"><span>Invoice link</span><input value={m.invoice_url || ''} onChange={(e) => patch(m.id, { invoice_url: e.target.value })} placeholder="https://…" /></label>
                      <div className="sb-check">
                        <div className="sb-check-title">Purchasing protocol (can still change — recheck on changes)</div>
                        {PROTOCOL.map((item) => (
                          <label key={item} className="sb-check-row">
                            <input type="checkbox" checked={!!m.checklist[item]} onChange={() => toggleCheck(m, item)} />
                            {item}
                          </label>
                        ))}
                      </div>

                      <div className="sb-check-title">Shipping &amp; dates</div>
                      <label className="pd-field"><span>Port</span><input value={m.port || 'Los Angeles'} onChange={(e) => patch(m.id, { port: e.target.value })} /></label>
                      <label className="pd-field"><span>Shipping info</span><textarea rows={2} value={m.shipping_info || ''} onChange={(e) => patch(m.id, { shipping_info: e.target.value })} placeholder="carrier, container, broker…" /></label>
                      <label className="pd-field"><span>Paperwork link</span><input value={m.paperwork_url || ''} onChange={(e) => patch(m.id, { paperwork_url: e.target.value })} placeholder="https://…" /></label>
                      <label className="pd-field"><span>Order date</span><input type="date" value={m.order_date || ''} onChange={(e) => patch(m.id, { order_date: e.target.value })} /></label>
                      <label className="pd-field"><span>ETA</span><input type="date" value={m.eta || ''} onChange={(e) => patch(m.id, { eta: e.target.value })} /></label>
                      <label className="pd-field"><span>Arrived (port)</span><input type="date" value={m.arrived_date || ''} onChange={(e) => patch(m.id, { arrived_date: e.target.value })} /></label>
                      <label className="pd-field"><span>Brendamour pickup</span><input type="date" value={m.pickup_date || ''} onChange={(e) => patch(m.id, { pickup_date: e.target.value })} /></label>
                      <label className="pd-field"><span>At warehouse</span><input type="date" value={m.warehouse_date || ''} onChange={(e) => patch(m.id, { warehouse_date: e.target.value })} /></label>
                      <label className="pd-field"><span>Contract signed</span><input type="date" value={m.contract_date || ''} onChange={(e) => patch(m.id, { contract_date: e.target.value })} /></label>
                      <label className="pd-field"><span>Shipped to campus</span><input type="date" value={m.campus_ship_date || ''} onChange={(e) => patch(m.id, { campus_ship_date: e.target.value })} /></label>
                      <label className="pd-field"><span>Campus / facility</span><input value={m.facility || ''} onChange={(e) => patch(m.id, { facility: e.target.value })} /></label>

                      <div className="sb-check-title">Map card — the walk-out location</div>
                      <label className="pd-field"><span>Walk-out location (exact spot)</span><input value={m.walkout_location || ''} onChange={(e) => patch(m.id, { walkout_location: e.target.value })} placeholder="building, floor, hallway…" /></label>
                      <label className="pd-field"><span>Google Maps pin link</span><input value={m.google_maps_url || ''} onChange={(e) => patch(m.id, { google_maps_url: e.target.value })} placeholder="paste the pinned location" /></label>
                      <label className="pd-field"><span>Directions</span><textarea rows={2} value={m.directions || ''} onChange={(e) => patch(m.id, { directions: e.target.value })} /></label>
                      <label className="pd-field"><span>Time of access</span><input value={m.access_time || ''} onChange={(e) => patch(m.id, { access_time: e.target.value })} placeholder="e.g. M–F 7am–10pm, loading dock after 6" /></label>
                      <label className="pd-field"><span>Contact numbers</span><input value={m.contact_numbers || ''} onChange={(e) => patch(m.id, { contact_numbers: e.target.value })} /></label>
                      <label className="pd-field"><span>Follow-up date</span><input type="date" value={m.follow_up_date || ''} onChange={(e) => patch(m.id, { follow_up_date: e.target.value })} /></label>
                      <div className="sb-check">
                        <Bool label="Photos uploaded on the Google Maps site" value={!!m.photos_uploaded} onChange={(v) => patch(m.id, { photos_uploaded: v })} />
                        <Bool label="Map card sent" value={!!m.map_card_sent} onChange={(v) => patch(m.id, { map_card_sent: v })} />
                      </div>

                      <div className="sb-check-title">Setup verification</div>
                      <label className="pd-field"><span>TCN machine ID (once known)</span><input value={m.machine_id || ''} onChange={(e) => patch(m.id, { machine_id: e.target.value })} placeholder="links it to Machine Operations" /></label>
                      <div className="sb-check">
                        <Bool label="Online + verified with router" value={!!m.router_verified} onChange={(v) => patch(m.id, { router_verified: v })} />
                        <Bool label="Registered with TCN" value={!!m.tcn_registered} onChange={(v) => patch(m.id, { tcn_registered: v })} />
                        <Bool label="Decals verified" value={!!m.decals_verified} onChange={(v) => patch(m.id, { decals_verified: v })} />
                      </div>

                      <label className="pd-field"><span>Notes / changes</span><textarea rows={2} value={m.notes || ''} onChange={(e) => patch(m.id, { notes: e.target.value })} placeholder="machine / color / lock changes go here" /></label>
                      <button className="sb-remove" onClick={() => remove(m.id)}>Remove from pipeline</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
