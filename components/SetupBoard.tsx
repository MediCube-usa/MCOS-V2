'use client';

// Machine Setup — Joe's ordered-and-distribution pipeline as colored command
// tabs. Every tab opens into a full stage panel even with zero machines:
// the stage mission, the exact fields it owns, what COMPLETE means to advance,
// and the machines currently sitting at that stage. Spec:
// docs/blocks/setup-distribution.md

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

const PROTOCOL = ['Model verified', 'Color verified', 'Locks verified', 'Invoice received', 'Paperwork complete'];

// The pipeline. Each stage carries its color, mission, the fields it owns,
// and what "complete" means — visible the moment the tab opens, machines or not.
const STAGES = [
  {
    id: 'ordered', label: 'Order', color: '#ffb02e',
    mission: 'Ordered from TCN — verify exactly what machine before anything moves: model, how many, color, description, fridge or non-fridge. Machines, colors and locks can still change — recheck the protocol whenever they do.',
    fields: ['Model (what machine)', 'Type: fridge / non-fridge', 'How many', 'Color', 'Description', 'Order ref', 'Invoice link', 'Purchasing protocol checklist'],
    complete: ['All 5 protocol checks ticked', 'Invoice on file'],
    next: 'Shipping',
  },
  {
    id: 'shipping', label: 'Shipping', color: '#35e0ff',
    mission: 'In transit to the port — mostly Los Angeles. Every piece of shipping info, the paperwork, and the calendar dates live here so nothing lands unannounced.',
    fields: ['Port (defaults Los Angeles)', 'Shipping info — carrier, container, broker', 'Paperwork link', 'Order date', 'ETA'],
    complete: ['Paperwork complete', 'ETA on the calendar'],
    next: 'Arrived',
  },
  {
    id: 'arrived', label: 'Arrived', color: '#4da3ff',
    mission: 'Landed at the port. Brendamour does the pickup and runs it to the warehouse.',
    fields: ['Arrived-at-port date', 'Brendamour pickup date'],
    complete: ['Brendamour picked it up'],
    next: 'Warehouse',
  },
  {
    id: 'warehouse', label: 'Warehouse', color: '#9d8cff',
    mission: 'Received and staged at the warehouse. It waits here until the campus contract is signed.',
    fields: ['At-warehouse date'],
    complete: ['Staged and accounted for'],
    next: 'Contract',
  },
  {
    id: 'contract', label: 'Contract', color: '#ff8fd6',
    mission: 'Campus contract signed — the machine ships to its campus through distribution.',
    fields: ['Contract-signed date', 'Shipped-to-campus date', 'Campus / facility'],
    complete: ['Contract signed', 'On its way to campus'],
    next: 'Map card',
  },
  {
    id: 'mapcard', label: 'Map card', color: '#3ddc97',
    mission: 'The big one. Create and send the MAP CARD: the pinned WALK-OUT location (not just the address), photos up on Google Maps, directions, time of access, contact numbers, and the follow-up date. This card feeds every department — restocking, service, distribution.',
    fields: ['Walk-out location (the exact spot)', 'Google Maps pin link', 'Directions', 'Time of access', 'Contact numbers', 'Follow-up date', 'Photos uploaded on Google Maps', 'Map card sent'],
    complete: ['Pin + walk-out + directions in', 'Photos uploaded', 'Card sent'],
    next: 'Setup',
  },
  {
    id: 'setup', label: 'Setup', color: '#caff00',
    mission: 'Boots on the ground: machine set up, brought ONLINE with the router, registered with TCN, decals on and checked.',
    fields: ['Online + verified with router', 'Registered with TCN', 'Decals verified', 'TCN machine ID (links it to Machine Operations)'],
    complete: ['Router · TCN · decals all verified', 'TCN machine ID entered'],
    next: 'Verified',
  },
  {
    id: 'verified', label: 'Verified', color: '#00ffaa',
    mission: 'Done. The machine carries its TCN ID and lives on Machine Operations from here — planogram assigned on Templates, first fill through Restocking, and it starts earning.',
    fields: ['TCN machine ID on record', 'Hand-off to Machine Operations'],
    complete: ['It is running the fleet now'],
    next: null,
  },
] as const;

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
  const [view, setView] = useState<string>('ordered');
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
      setNm(''); setModel(''); setAdding(false); setView('ordered'); flash('Order added to the pipeline');
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
    const next = STAGES[Math.min(STAGES.length - 1, Math.max(0, (i === -1 ? 0 : i) + dir))];
    if (next.id !== m.stage) { patch(m.id, { stage: next.id }); setView(next.id); setOpen(m.id); }
  };
  const toggleCheck = (m: SetupMachine, item: string) =>
    patch(m.id, { checklist: { ...m.checklist, [item]: !m.checklist[item] } });

  const stage = STAGES.find((s) => s.id === view) ?? STAGES[0];
  const here = rows.filter((r) => r.stage === stage.id);
  const stageIdx = STAGES.findIndex((s) => s.id === stage.id);
  const prev = stageIdx > 0 ? STAGES[stageIdx - 1] : null;

  return (
    <div className="setupboard">
      {/* colored command tabs — the pipeline, in order */}
      <div className="stage-tabs">
        {STAGES.map((s) => {
          const n = rows.filter((r) => r.stage === s.id).length;
          return (
            <button
              key={s.id}
              className={`stage-tab ${view === s.id ? 'active' : ''}`}
              style={{ ['--sc' as string]: s.color }}
              onClick={() => setView(s.id)}
            >
              {s.label}{n > 0 ? <span className="stage-n">{n}</span> : null}
            </button>
          );
        })}
      </div>

      {msg && <div className="sb-msg">{msg}</div>}
      {status === 'loading' && <div className="section"><p>Loading pipeline…</p></div>}
      {status === 'error' && <div className="banner building">Could not load the setup pipeline: {msg} — check your connection and reload.</div>}

      {/* stage panel — full briefing, machines or not */}
      <div className="stage-panel" style={{ ['--sc' as string]: stage.color }}>
        <div className="stage-head">
          <div>
            <div className="stage-title">{stage.label}</div>
            <p className="stage-mission">{stage.mission}</p>
          </div>
          {stage.id === 'ordered' && (
            !adding
              ? <button className="pd-save" onClick={() => setAdding(true)}>+ New TCN order</button>
              : (
                <div className="sb-add">
                  <input placeholder="Order name / destination *" value={nm} onChange={(e) => setNm(e.target.value)} />
                  <input placeholder="TCN model" value={model} onChange={(e) => setModel(e.target.value)} />
                  <button className="pd-save" onClick={add}>Add</button>
                  <button className="pd-link" onClick={() => setAdding(false)}>Cancel</button>
                </div>
              )
          )}
        </div>

        <div className="stage-info">
          <div className="stage-block">
            <div className="stage-block-title">This tab holds</div>
            <ul>{stage.fields.map((f) => <li key={f}>{f}</li>)}</ul>
          </div>
          <div className="stage-block">
            <div className="stage-block-title">Complete when</div>
            <ul>{stage.complete.map((c) => <li key={c}>{c}</li>)}</ul>
            {stage.next
              ? <div className="stage-next">then advance → <b>{stage.next}</b></div>
              : <div className="stage-next">runs the fleet from <a href="/machine-operations">Machine Operations →</a></div>}
          </div>
        </div>

        {status === 'ready' && here.length === 0 && (
          <div className="stage-empty">
            {stage.id === 'ordered'
              ? <>No orders yet — hit <b>+ New TCN order</b> and the pipeline starts moving.</>
              : <>No machines at this stage right now — they arrive here from <b>{prev?.label}</b>.</>}
          </div>
        )}

        <div className="req-grid">
          {here.map((m) => {
            const isOpen = open === m.id;
            const proto = PROTOCOL.filter((i) => m.checklist[i]).length;
            return (
              <div key={m.id} className={`req-card ${isOpen ? 'open' : ''}`}>
                <div className="req-head" onClick={() => setOpen(isOpen ? null : m.id)}>
                  <div className="req-main">
                    <div className="req-name">{m.name}{m.qty && m.qty > 1 ? ` ×${m.qty}` : ''}</div>
                    <div className="req-meta">
                      {(m.model || m.color || m.machine_type) && <span className="ph-tag">{[m.model, m.color, m.machine_type].filter(Boolean).join(' · ')}</span>}
                      <span className="ph-tag">{proto}/{PROTOCOL.length} protocol</span>
                      {m.facility && <span className="ph-tag">{m.facility}</span>}
                      {m.eta && <span className="ph-tag">ETA {m.eta}</span>}
                    </div>
                  </div>
                </div>
                {isOpen && (
                  <div className="req-body">
                    <div className="sb-move">
                      <button className="pd-link" onClick={() => move(m, -1)} disabled={stageIdx === 0}>← back</button>
                      <button className="pd-link" onClick={() => move(m, 1)} disabled={stageIdx === STAGES.length - 1}>advance → {stage.next ?? ''}</button>
                    </div>

                    <div className="sb-check-title">The order</div>
                    <div className="pd-grid">
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
                    </div>
                    <div className="sb-check">
                      <div className="sb-check-title">Purchasing protocol (recheck on any change)</div>
                      {PROTOCOL.map((item) => (
                        <label key={item} className="sb-check-row">
                          <input type="checkbox" checked={!!m.checklist[item]} onChange={() => toggleCheck(m, item)} />
                          {item}
                        </label>
                      ))}
                    </div>

                    <div className="sb-check-title">Shipping &amp; dates</div>
                    <div className="pd-grid">
                      <label className="pd-field"><span>Port</span><input value={m.port || 'Los Angeles'} onChange={(e) => patch(m.id, { port: e.target.value })} /></label>
                      <label className="pd-field pd-wide"><span>Shipping info</span><textarea rows={2} value={m.shipping_info || ''} onChange={(e) => patch(m.id, { shipping_info: e.target.value })} placeholder="carrier, container, broker…" /></label>
                      <label className="pd-field"><span>Paperwork link</span><input value={m.paperwork_url || ''} onChange={(e) => patch(m.id, { paperwork_url: e.target.value })} placeholder="https://…" /></label>
                      <label className="pd-field"><span>Order date</span><input type="date" value={m.order_date || ''} onChange={(e) => patch(m.id, { order_date: e.target.value })} /></label>
                      <label className="pd-field"><span>ETA</span><input type="date" value={m.eta || ''} onChange={(e) => patch(m.id, { eta: e.target.value })} /></label>
                      <label className="pd-field"><span>Arrived (port)</span><input type="date" value={m.arrived_date || ''} onChange={(e) => patch(m.id, { arrived_date: e.target.value })} /></label>
                      <label className="pd-field"><span>Brendamour pickup</span><input type="date" value={m.pickup_date || ''} onChange={(e) => patch(m.id, { pickup_date: e.target.value })} /></label>
                      <label className="pd-field"><span>At warehouse</span><input type="date" value={m.warehouse_date || ''} onChange={(e) => patch(m.id, { warehouse_date: e.target.value })} /></label>
                      <label className="pd-field"><span>Contract signed</span><input type="date" value={m.contract_date || ''} onChange={(e) => patch(m.id, { contract_date: e.target.value })} /></label>
                      <label className="pd-field"><span>Shipped to campus</span><input type="date" value={m.campus_ship_date || ''} onChange={(e) => patch(m.id, { campus_ship_date: e.target.value })} /></label>
                      <label className="pd-field"><span>Campus / facility</span><input value={m.facility || ''} onChange={(e) => patch(m.id, { facility: e.target.value })} /></label>
                    </div>

                    <div className="sb-check-title">Map card — the walk-out location</div>
                    <div className="pd-grid">
                      <label className="pd-field pd-wide"><span>Walk-out location (exact spot)</span><input value={m.walkout_location || ''} onChange={(e) => patch(m.id, { walkout_location: e.target.value })} placeholder="building, floor, hallway…" /></label>
                      <label className="pd-field pd-wide"><span>Google Maps pin link</span><input value={m.google_maps_url || ''} onChange={(e) => patch(m.id, { google_maps_url: e.target.value })} placeholder="paste the pinned location" /></label>
                      <label className="pd-field pd-wide"><span>Directions</span><textarea rows={2} value={m.directions || ''} onChange={(e) => patch(m.id, { directions: e.target.value })} /></label>
                      <label className="pd-field"><span>Time of access</span><input value={m.access_time || ''} onChange={(e) => patch(m.id, { access_time: e.target.value })} placeholder="e.g. M–F 7am–10pm" /></label>
                      <label className="pd-field"><span>Contact numbers</span><input value={m.contact_numbers || ''} onChange={(e) => patch(m.id, { contact_numbers: e.target.value })} /></label>
                      <label className="pd-field"><span>Follow-up date</span><input type="date" value={m.follow_up_date || ''} onChange={(e) => patch(m.id, { follow_up_date: e.target.value })} /></label>
                    </div>
                    <div className="sb-check">
                      <Bool label="Photos uploaded on the Google Maps site" value={!!m.photos_uploaded} onChange={(v) => patch(m.id, { photos_uploaded: v })} />
                      <Bool label="Map card sent" value={!!m.map_card_sent} onChange={(v) => patch(m.id, { map_card_sent: v })} />
                    </div>

                    <div className="sb-check-title">Setup verification</div>
                    <div className="pd-grid">
                      <label className="pd-field"><span>TCN machine ID (once known)</span><input value={m.machine_id || ''} onChange={(e) => patch(m.id, { machine_id: e.target.value })} placeholder="links it to Machine Operations" /></label>
                    </div>
                    <div className="sb-check">
                      <Bool label="Online + verified with router" value={!!m.router_verified} onChange={(v) => patch(m.id, { router_verified: v })} />
                      <Bool label="Registered with TCN" value={!!m.tcn_registered} onChange={(v) => patch(m.id, { tcn_registered: v })} />
                      <Bool label="Decals verified" value={!!m.decals_verified} onChange={(v) => patch(m.id, { decals_verified: v })} />
                    </div>

                    <label className="pd-field pd-wide"><span>Notes / changes</span><textarea rows={2} value={m.notes || ''} onChange={(e) => patch(m.id, { notes: e.target.value })} placeholder="machine / color / lock changes go here" /></label>
                    <div className="sup-foot">
                      <button className="sb-remove" onClick={() => remove(m.id)}>Remove from pipeline</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
