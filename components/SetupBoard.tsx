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
}

const STAGES = [
  { id: 'ordered', label: 'Ordered', hint: 'PO placed with TCN' },
  { id: 'shipping', label: 'Shipping', hint: 'In transit / port / import' },
  { id: 'warehouse', label: 'At warehouse', hint: 'Received, staged' },
  { id: 'scheduled', label: 'Scheduled', hint: 'Delivery/install booked' },
  { id: 'placed', label: 'Placed', hint: 'On site, connecting' },
  { id: 'live', label: 'Live', hint: 'Selling — hand to Operations' }
] as const;

const GO_LIVE = ['Facility assigned', 'Template loaded', 'Card reader mapped', 'Initial stock loaded', 'Test vend OK', 'Photos taken'];

export function SetupBoard() {
  const [rows, setRows] = useState<SetupMachine[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [nm, setNm] = useState('');
  const [model, setModel] = useState('');
  const [order, setOrder] = useState('');

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
    if (!nm.trim()) { flash('Give the machine a name / location first'); return; }
    try {
      const created = await dbInsert('setup_machines', { name: nm.trim(), model: model.trim() || null, order_ref: order.trim() || null, stage: 'ordered' });
      setRows((r) => [...r, { ...(created as SetupMachine), checklist: {} }]);
      setNm(''); setModel(''); setOrder(''); setAdding(false);
      flash('Added to pipeline');
    } catch { flash('Could not add — check connection'); }
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
    const next = STAGES[Math.min(STAGES.length - 1, Math.max(0, i + dir))];
    if (next.id !== m.stage) patch(m.id, { stage: next.id });
  };

  const toggleCheck = (m: SetupMachine, item: string) => {
    const cl = { ...m.checklist, [item]: !m.checklist[item] };
    patch(m.id, { checklist: cl });
  };

  if (status === 'loading') return <div className="section"><p>Loading pipeline…</p></div>;
  if (status === 'error') return <div className="banner building">Could not load the setup pipeline: {msg}</div>;

  return (
    <div className="setupboard">
      <div className="sb-bar">
        <div className="sb-counts">
          {STAGES.map((s) => <span key={s.id} className="sb-count"><b>{rows.filter((r) => r.stage === s.id).length}</b> {s.label}</span>)}
        </div>
        {!adding
          ? <button className="pd-save" onClick={() => setAdding(true)}>+ Add machine</button>
          : (
            <div className="sb-add">
              <input placeholder="Name / intended location *" value={nm} onChange={(e) => setNm(e.target.value)} />
              <input placeholder="TCN model" value={model} onChange={(e) => setModel(e.target.value)} />
              <input placeholder="Order ref" value={order} onChange={(e) => setOrder(e.target.value)} />
              <button className="pd-save" onClick={add}>Add</button>
              <button className="pd-link" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          )}
      </div>

      {msg && <div className="sb-msg">{msg}</div>}

      {rows.length === 0 && <div className="section"><p>No machines in setup yet. Add one when your partner orders a machine from TCN — it moves down the pipeline from there.</p></div>}

      <div className="sb-cols">
        {STAGES.map((s) => (
          <div key={s.id} className="sb-col">
            <div className="sb-col-head"><b>{s.label}</b><span>{s.hint}</span></div>
            {rows.filter((r) => r.stage === s.id).map((m) => {
              const isOpen = open === m.id;
              const done = GO_LIVE.filter((i) => m.checklist[i]).length;
              return (
                <div key={m.id} className={`sb-card ${isOpen ? 'open' : ''}`}>
                  <div className="sb-card-top" onClick={() => setOpen(isOpen ? null : m.id)}>
                    <div className="sb-card-name">{m.name}</div>
                    {m.model && <div className="sb-card-sub">{m.model}</div>}
                    <div className="sb-card-meta">{done}/{GO_LIVE.length} checklist{m.facility ? ` · ${m.facility}` : ''}</div>
                  </div>
                  {isOpen && (
                    <div className="sb-card-body">
                      <div className="sb-move">
                        <button className="pd-link" onClick={() => move(m, -1)} disabled={s.id === STAGES[0].id}>← back</button>
                        <button className="pd-link" onClick={() => move(m, 1)} disabled={s.id === STAGES[STAGES.length - 1].id}>advance →</button>
                      </div>
                      <label className="pd-field"><span>Order ref</span><input value={m.order_ref || ''} onChange={(e) => patch(m.id, { order_ref: e.target.value })} /></label>
                      <label className="pd-field"><span>Facility / campus</span><input value={m.facility || ''} onChange={(e) => patch(m.id, { facility: e.target.value })} /></label>
                      <label className="pd-field"><span>ETA</span><input type="date" value={m.eta || ''} onChange={(e) => patch(m.id, { eta: e.target.value })} /></label>
                      <label className="pd-field"><span>Notes</span><textarea rows={2} value={m.notes || ''} onChange={(e) => patch(m.id, { notes: e.target.value })} /></label>
                      <div className="sb-check">
                        <div className="sb-check-title">Go-live checklist</div>
                        {GO_LIVE.map((item) => (
                          <label key={item} className="sb-check-row">
                            <input type="checkbox" checked={!!m.checklist[item]} onChange={() => toggleCheck(m, item)} />
                            {item}
                          </label>
                        ))}
                      </div>
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
