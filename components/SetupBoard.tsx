'use client';

// Machine Setup — Joe's ordered-and-distribution pipeline as colored command
// tabs. Every tab IS its stage: the real fields, date pickers, checklists and
// document uploads for that stage render right in the panel — machines at the
// stage open straight into that stage's form, with the full record one click
// away. Spec: docs/blocks/setup-distribution.md

import { useEffect, useRef, useState } from 'react';
import { dbSelect, dbInsert, dbUpdate, dbDelete, uploadToBucket } from '@/lib/db';

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
  container_number: string | null;
  seal_number: string | null;
  bol_number: string | null;
  release_contact: string | null;
  order_date: string | null;
  arrived_date: string | null;
  pickup_date: string | null;
  warehouse_date: string | null;
  contract_date: string | null;
  contract_url: string | null;
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

// The pipeline. Each stage: its color, its mission, and the one line that
// says when a machine advances. The stage's REAL form renders in the panel.
const STAGES = [
  {
    id: 'ordered', label: 'Order', color: '#ffb02e',
    mission: 'Ordered from TCN — verify exactly what machine before anything moves. Machines, colors and locks can still change: recheck the protocol whenever they do.',
    advance: 'all 5 protocol checks ticked and the invoice on file', next: 'Shipping',
  },
  {
    id: 'shipping', label: 'Shipping', color: '#35e0ff',
    mission: 'In transit to the port — mostly Los Angeles. Every piece of shipping info, the paperwork, and the dates live here so nothing lands unannounced.',
    advance: 'paperwork complete and the ETA on the calendar', next: 'Arrived',
  },
  {
    id: 'arrived', label: 'Arrived', color: '#4da3ff',
    mission: 'Landed at the port. Brendamour does the pickup and runs it to the warehouse.',
    advance: 'Brendamour picked it up', next: 'Warehouse',
  },
  {
    id: 'warehouse', label: 'Warehouse', color: '#9d8cff',
    mission: 'Received and staged at the warehouse. It waits here until the campus contract is signed.',
    advance: 'staged and accounted for', next: 'Contract',
  },
  {
    id: 'contract', label: 'Contract', color: '#ff8fd6',
    mission: 'Campus contract signed — the signed contract lives on this tab — and the machine ships to its campus through distribution.',
    advance: 'contract signed and on file, machine on its way to campus', next: 'Map card',
  },
  {
    id: 'mapcard', label: 'Map card', color: '#3ddc97',
    mission: 'The big one. Create and send the MAP CARD: the pinned WALK-OUT location (not just the address), photos up on Google Maps, directions, time of access, contact numbers, follow-up date. This card feeds every department.',
    advance: 'pin + walk-out + directions in, photos uploaded, card sent', next: 'Setup',
  },
  {
    id: 'setup', label: 'Setup', color: '#caff00',
    mission: 'Boots on the ground: machine set up, brought ONLINE with the router, registered with TCN, decals on and checked.',
    advance: 'router · TCN · decals all verified and the TCN machine ID entered', next: 'Verified',
  },
  {
    id: 'verified', label: 'Verified', color: '#00ffaa',
    mission: 'Done. The machine carries its TCN ID and lives on Machine Operations from here — planogram assigned on Templates, first fill through Restocking, and it starts earning.',
    advance: null, next: null,
  },
] as const;

type StageId = (typeof STAGES)[number]['id'];
type Patch = (id: string, p: Partial<SetupMachine>) => void;

function Bool({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="sb-check-row">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

// A document space: paste a link OR upload the actual file (Supabase storage,
// bucket mcos-docs) — the stored link opens from right here.
function FileField({ label, value, machineId, kind, onChange, onError }: {
  label: string; value: string | null; machineId: string; kind: string;
  onChange: (url: string) => void; onError: (m: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const up = async (f: File) => {
    setBusy(true);
    try {
      const url = await uploadToBucket('mcos-docs', `setup/${machineId}/${kind}`, f);
      onChange(url);
    } catch { onError('Upload failed — check the connection and try again'); }
    setBusy(false);
  };
  return (
    <div className="pd-field pd-wide">
      <span>{label}</span>
      <div className="ff-row">
        <input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="paste a link…" />
        <input ref={fileRef} type="file" style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) up(f); e.target.value = ''; }} />
        <button type="button" className="ff-btn" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? 'Uploading…' : '⬆ Upload file'}
        </button>
        {value ? <a className="ff-open" href={value} target="_blank" rel="noreferrer">open ↗</a> : null}
      </div>
    </div>
  );
}

// ---- the stage forms — each tab's actual working fields ----

function StageForm({ sid, m, patch, toggleCheck, flash }: {
  sid: StageId; m: SetupMachine; patch: Patch;
  toggleCheck: (m: SetupMachine, item: string) => void; flash: (t: string) => void;
}) {
  switch (sid) {
    case 'ordered': return (
      <>
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
          <label className="pd-field"><span>Order date</span><input type="date" value={m.order_date || ''} onChange={(e) => patch(m.id, { order_date: e.target.value })} /></label>
          <FileField label="Invoice — link or upload the file" value={m.invoice_url} machineId={m.id} kind="invoice"
            onChange={(url) => patch(m.id, { invoice_url: url })} onError={flash} />
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
      </>
    );
    case 'shipping': return (
      <div className="pd-grid">
        <label className="pd-field"><span>Port (where it lands)</span><input value={m.port || 'Los Angeles'} onChange={(e) => patch(m.id, { port: e.target.value })} /></label>
        <label className="pd-field"><span>ETA — date it arrives</span><input type="date" value={m.eta || ''} onChange={(e) => patch(m.id, { eta: e.target.value })} /></label>
        <label className="pd-field"><span>Container #</span><input value={m.container_number || ''} onChange={(e) => patch(m.id, { container_number: e.target.value })} /></label>
        <label className="pd-field"><span>Seal / sea number</span><input value={m.seal_number || ''} onChange={(e) => patch(m.id, { seal_number: e.target.value })} /></label>
        <label className="pd-field"><span>Bill of lading #</span><input value={m.bol_number || ''} onChange={(e) => patch(m.id, { bol_number: e.target.value })} /></label>
        <label className="pd-field"><span>Port release contact — name / phone</span><input value={m.release_contact || ''} onChange={(e) => patch(m.id, { release_contact: e.target.value })} /></label>
        <label className="pd-field pd-wide"><span>Shipping info — carrier, vessel, broker</span><textarea rows={2} value={m.shipping_info || ''} onChange={(e) => patch(m.id, { shipping_info: e.target.value })} /></label>
        <FileField label="Paperwork — link or upload the file" value={m.paperwork_url} machineId={m.id} kind="paperwork"
          onChange={(url) => patch(m.id, { paperwork_url: url })} onError={flash} />
        <FileField label="Invoice — the same document from the Order tab, here for the release call" value={m.invoice_url} machineId={m.id} kind="invoice"
          onChange={(url) => patch(m.id, { invoice_url: url })} onError={flash} />
      </div>
    );
    case 'arrived': return (
      <div className="pd-grid">
        <label className="pd-field"><span>Arrived at port</span><input type="date" value={m.arrived_date || ''} onChange={(e) => patch(m.id, { arrived_date: e.target.value })} /></label>
        <label className="pd-field"><span>Brendamour pickup</span><input type="date" value={m.pickup_date || ''} onChange={(e) => patch(m.id, { pickup_date: e.target.value })} /></label>
      </div>
    );
    case 'warehouse': return (
      <div className="pd-grid">
        <label className="pd-field"><span>Received at warehouse</span><input type="date" value={m.warehouse_date || ''} onChange={(e) => patch(m.id, { warehouse_date: e.target.value })} /></label>
      </div>
    );
    case 'contract': return (
      <div className="pd-grid">
        <label className="pd-field"><span>Contract signed</span><input type="date" value={m.contract_date || ''} onChange={(e) => patch(m.id, { contract_date: e.target.value })} /></label>
        <label className="pd-field"><span>Shipped to campus</span><input type="date" value={m.campus_ship_date || ''} onChange={(e) => patch(m.id, { campus_ship_date: e.target.value })} /></label>
        <label className="pd-field pd-wide"><span>Campus / facility</span><input value={m.facility || ''} onChange={(e) => patch(m.id, { facility: e.target.value })} /></label>
        <FileField label="The signed contract — link or upload the file" value={m.contract_url} machineId={m.id} kind="contract"
          onChange={(url) => patch(m.id, { contract_url: url })} onError={flash} />
      </div>
    );
    case 'mapcard': return (
      <>
        <div className="pd-grid">
          <label className="pd-field pd-wide"><span>Walk-out location (the exact spot)</span><input value={m.walkout_location || ''} onChange={(e) => patch(m.id, { walkout_location: e.target.value })} placeholder="building, floor, hallway…" /></label>
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
      </>
    );
    case 'setup': return (
      <>
        <div className="pd-grid">
          <label className="pd-field pd-wide"><span>TCN machine ID (links it to Machine Operations)</span><input value={m.machine_id || ''} onChange={(e) => patch(m.id, { machine_id: e.target.value })} /></label>
        </div>
        <div className="sb-check">
          <Bool label="Online + verified with router" value={!!m.router_verified} onChange={(v) => patch(m.id, { router_verified: v })} />
          <Bool label="Registered with TCN" value={!!m.tcn_registered} onChange={(v) => patch(m.id, { tcn_registered: v })} />
          <Bool label="Decals verified" value={!!m.decals_verified} onChange={(v) => patch(m.id, { decals_verified: v })} />
        </div>
      </>
    );
    case 'verified': return (
      <>
        <div className="vr-grid">
          <div className="vr-item"><span>TCN machine ID</span>{m.machine_id || '— enter on Setup tab —'}</div>
          <div className="vr-item"><span>Campus</span>{m.facility || '—'}</div>
          <div className="vr-item"><span>Machine</span>{[m.model, m.color, m.machine_type].filter(Boolean).join(' · ') || '—'}</div>
          <div className="vr-item"><span>Walk-out</span>{m.walkout_location || '—'}</div>
          <div className="vr-item"><span>Access</span>{m.access_time || '—'}</div>
          <div className="vr-item"><span>Checks</span>{[m.router_verified && 'router', m.tcn_registered && 'TCN', m.decals_verified && 'decals'].filter(Boolean).join(' · ') || 'none yet'}</div>
        </div>
        <div className="stage-next" style={{ marginTop: 10 }}>
          {m.google_maps_url && <a href={m.google_maps_url} target="_blank" rel="noreferrer">map pin ↗</a>}
          {m.google_maps_url && <span style={{ margin: '0 6px' }}>·</span>}
          <a href="/machine-operations">runs from Machine Operations →</a>
        </div>
      </>
    );
  }
}

const ORDER_OF = (sid: string) => STAGES.findIndex((s) => s.id === sid);

// Blank record backing the always-visible template form on stages with no
// machines yet — so every tab shows its real fields, not a description.
const BLANK: SetupMachine = {
  id: '', name: '', model: '', order_ref: '', stage: 'ordered', facility: '', eta: '', notes: '',
  checklist: {}, machine_type: '', qty: 1, color: '', description: '', invoice_url: '',
  port: '', shipping_info: '', paperwork_url: '', container_number: '', seal_number: '',
  bol_number: '', release_contact: '', order_date: '', arrived_date: '', pickup_date: '',
  warehouse_date: '', contract_date: '', contract_url: '', campus_ship_date: '',
  walkout_location: '', google_maps_url: '', photos_uploaded: false, directions: '',
  access_time: '', contact_numbers: '', follow_up_date: '', map_card_sent: false,
  machine_id: '', router_verified: false, tcn_registered: false, decals_verified: false,
};
const NOOP = () => {};

export function SetupBoard() {
  const [rows, setRows] = useState<SetupMachine[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [fullId, setFullId] = useState<string | null>(null);
  const [view, setView] = useState<string>('ordered');
  const [adding, setAdding] = useState(false);
  const [nm, setNm] = useState('');
  const [model, setModel] = useState('');

  const load = async () => {
    try {
      const data = await dbSelect<SetupMachine>('setup_machines', 'select=*&order=created_at.asc');
      setRows(data.map((r) => ({ ...r, checklist: r.checklist || {} })));
      setOpen((cur) => cur ?? data.find((r) => r.stage === 'ordered')?.id ?? null);
      setStatus('ready');
    } catch (e) { setStatus('error'); setMsg(e instanceof Error ? e.message : 'load failed'); }
  };
  useEffect(() => { load(); }, []);
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const add = async () => {
    if (!nm.trim()) { flash('Name the order first (e.g. "UNLV batch 2")'); return; }
    try {
      const created = await dbInsert('setup_machines', { name: nm.trim(), model: model.trim() || null, stage: 'ordered' });
      setRows((r) => [...r, { ...(created as SetupMachine), checklist: {} }]);
      setNm(''); setModel(''); setAdding(false); setView('ordered');
      setOpen((created as SetupMachine).id);
      flash('Order added to the pipeline');
    } catch { flash('Could not add'); }
  };
  const patch: Patch = async (id, p) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
    try { await dbUpdate('setup_machines', `id=eq.${id}`, p); } catch { flash('Save failed'); }
  };
  const remove = async (id: string) => {
    setRows((rs) => rs.filter((r) => r.id !== id));
    if (open === id) setOpen(null);
    try { await dbDelete('setup_machines', `id=eq.${id}`); flash('Removed'); } catch { flash('Delete failed'); }
  };
  const move = (m: SetupMachine, dir: 1 | -1) => {
    const i = ORDER_OF(m.stage);
    const next = STAGES[Math.min(STAGES.length - 1, Math.max(0, (i === -1 ? 0 : i) + dir))];
    if (next.id !== m.stage) { patch(m.id, { stage: next.id }); setView(next.id); setOpen(m.id); }
  };
  const toggleCheck = (m: SetupMachine, item: string) =>
    patch(m.id, { checklist: { ...m.checklist, [item]: !m.checklist[item] } });

  const stage = STAGES.find((s) => s.id === view) ?? STAGES[0];
  const here = rows.filter((r) => r.stage === stage.id);
  const stageIdx = ORDER_OF(stage.id);
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
              onClick={() => {
                setView(s.id); setFullId(null);
                setOpen(rows.find((r) => r.stage === s.id)?.id ?? null);
              }}
            >
              {s.label}{n > 0 ? <span className="stage-n">{n}</span> : null}
            </button>
          );
        })}
      </div>

      {msg && <div className="sb-msg">{msg}</div>}
      {status === 'loading' && <div className="section"><p>Loading pipeline…</p></div>}
      {status === 'error' && <div className="banner building">Could not load the setup pipeline: {msg} — check your connection and reload.</div>}

      {/* stage panel — the stage's working form, machines or not */}
      <div className="stage-panel" style={{ ['--sc' as string]: stage.color }}>
        <div className="stage-head">
          <div>
            <div className="stage-title">{stage.label}</div>
            <p className="stage-mission">{stage.mission}</p>
            {stage.advance && <div className="stage-next">advance when <b>{stage.advance}</b> → {stage.next}</div>}
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

        {status === 'ready' && here.length === 0 && (
          <>
            <div className="stage-empty">
              {stage.id === 'ordered'
                ? <>The {stage.label} form, below. Hit <b>+ New TCN order</b> and it goes live — everything you put in saves to that machine and travels with it tab to tab.</>
                : <>The {stage.label} form, below. Every machine that reaches this stage from <b>{prev?.label}</b> gets its own copy, carrying everything already filled — it unlocks on the machine&apos;s card.</>}
            </div>
            <fieldset className="stage-template" disabled>
              <StageForm sid={stage.id} m={BLANK} patch={NOOP} toggleCheck={NOOP} flash={NOOP} />
            </fieldset>
          </>
        )}

        <div className="req-grid">
          {here.map((m) => {
            const isOpen = open === m.id;
            const isFull = fullId === m.id;
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
                      {m.machine_id && <span className="ph-tag">TCN {m.machine_id}</span>}
                    </div>
                  </div>
                </div>
                {isOpen && (
                  <div className="req-body">
                    <div className="sb-move">
                      <button className="pd-link" onClick={() => move(m, -1)} disabled={stageIdx === 0}>← back{prev ? ` to ${prev.label}` : ''}</button>
                      <button className="pd-link" onClick={() => move(m, 1)} disabled={stageIdx === STAGES.length - 1}>advance → {stage.next ?? ''}</button>
                    </div>

                    {!isFull && <StageForm sid={stage.id} m={m} patch={patch} toggleCheck={toggleCheck} flash={flash} />}

                    {isFull && STAGES.map((s) => (
                      <div key={s.id}>
                        <div className="stage-section-title" style={{ ['--sc' as string]: s.color }}>{s.label}</div>
                        <StageForm sid={s.id} m={m} patch={patch} toggleCheck={toggleCheck} flash={flash} />
                      </div>
                    ))}

                    <label className="pd-field pd-wide" style={{ marginTop: 10 }}><span>Notes / changes</span>
                      <textarea rows={2} value={m.notes || ''} onChange={(e) => patch(m.id, { notes: e.target.value })} placeholder="machine / color / lock changes go here" /></label>

                    <div className="sup-foot">
                      <button className="rec-toggle" onClick={() => setFullId(isFull ? null : m.id)}>
                        {isFull ? 'Show this stage only' : 'Show full record — every stage'}
                      </button>
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
