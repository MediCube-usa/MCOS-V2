'use client';

import { useEffect, useMemo, useState } from 'react';
import { dbSelect, dbInsert, dbUpdate, dbDelete } from '@/lib/db';

interface Task {
  id: string;
  machine_id: string;
  task_type: string;
  status: string;
  refiller_type: string | null;
  refiller_name: string | null;
  refiller_contact: string | null;
  offer_sent_at: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  accepted: boolean | null;
  reoffer_date: string | null;
  mapcard_sent: boolean | null;
  onsite_verified: boolean | null;
  access_code_sent: boolean | null;
  refill_code: string | null;
  refill_code_sent: boolean | null;
  replenish: { coil: number; product: string; add: number }[];
  inventory_verified: boolean | null;
  photo_url: string | null;
  filed_drive: boolean | null;
  filed_email: boolean | null;
  pickup_location: string | null;
  checkin_contact: string | null;
  checkin_instructions: string | null;
  backstorage_note: string | null;
  notes: string | null;
}
interface Machine {
  machine_id: string; label: string | null; campus: string | null; lockbox_code: string | null;
  refill_videos_url: string | null; refill_docs_url: string | null;
}
interface CardInfo {
  machine_id: string; address: string | null; google_maps_url: string | null;
  walkout_location: string | null; fill_times: string | null; hours: string | null;
  contact_name: string | null; contact_phone: string | null;
}
interface Slot { coil: number; product: string | null; stock: number | null; capacity: number | null; }

const STATUSES = [
  { id: 'requested', label: 'Requested' },
  { id: 'offered', label: 'Alert sent' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'mapcard', label: 'Map card' },
  { id: 'onsite', label: 'At machine' },
  { id: 'filling', label: 'Filling' },
  { id: 'filled', label: 'Filled' },
  { id: 'done', label: 'Filed · done' },
] as const;
const REFILLER_TYPES = ['Instawork', 'Aramark', 'student', 'other'];
const isRealCap = (c: number | null) => !!c && c > 0 && c !== 99 && c !== 199;

function Bool({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="sb-check-row">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function RestockBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [cards, setCards] = useState<Record<string, CardInfo>>({});
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [msg, setMsg] = useState('');
  const [tab, setTab] = useState<'refill' | 'shipping_refill'>('refill');
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newMachine, setNewMachine] = useState('');
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 2500); };

  useEffect(() => {
    (async () => {
      try {
        const [t, m, l] = await Promise.all([
          dbSelect<Task>('restock_tasks', 'select=*&order=created_at.desc'),
          dbSelect<Machine>('machines', 'select=machine_id,label,campus,lockbox_code,refill_videos_url,refill_docs_url&order=label.asc.nullslast'),
          dbSelect<CardInfo>('machine_locations', 'select=machine_id,address,google_maps_url,walkout_location,fill_times,hours,contact_name,contact_phone'),
        ]);
        setTasks(t.map((x) => ({ ...x, replenish: Array.isArray(x.replenish) ? x.replenish : [] })));
        setMachines(m);
        setCards(Object.fromEntries(l.map((c) => [c.machine_id, c])));
        setStatus('ready');
      } catch (e) { setStatus('error'); setMsg(e instanceof Error ? e.message : 'load failed'); }
    })();
  }, []);

  const machineOf = useMemo(() => Object.fromEntries(machines.map((m) => [m.machine_id, m])), [machines]);

  const add = async () => {
    if (!newMachine) { flash('Pick the machine first'); return; }
    try {
      const created = await dbInsert('restock_tasks', { machine_id: newMachine, task_type: tab, status: 'requested' });
      setTasks((t) => [{ ...(created as unknown as Task), replenish: [] }, ...t]);
      setAdding(false); setNewMachine(''); setOpen((created as unknown as Task).id); flash('Task created');
    } catch { flash('Could not create'); }
  };
  const patch = async (id: string, p: Partial<Task>) => {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...p } : t)));
    try { await dbUpdate('restock_tasks', `id=eq.${id}`, p); } catch { flash('Save failed'); }
  };
  const patchMachine = async (mid: string, p: Partial<Machine>) => {
    setMachines((ms) => ms.map((m) => (m.machine_id === mid ? { ...m, ...p } : m)));
    try { await dbUpdate('machines', `machine_id=eq.${mid}`, p); } catch { flash('Save failed'); }
  };
  const remove = async (id: string) => {
    setTasks((ts) => ts.filter((t) => t.id !== id));
    if (open === id) setOpen(null);
    try { await dbDelete('restock_tasks', `id=eq.${id}`); flash('Removed'); } catch { flash('Delete failed'); }
  };
  const move = (t: Task, dir: 1 | -1) => {
    const i = STATUSES.findIndex((s) => s.id === t.status);
    const next = STATUSES[Math.min(STATUSES.length - 1, Math.max(0, i + dir))];
    if (next.id !== t.status) patch(t.id, { status: next.id });
  };
  const genRefillCode = (t: Task) => {
    const n = new Uint32Array(1); crypto.getRandomValues(n);
    const code = String(n[0] % 10000).padStart(4, '0');
    patch(t.id, { refill_code: code });
    flash(`Refill code ${code} — send it after on-site verify`);
  };
  const loadReplenish = async (t: Task) => {
    try {
      const slots = await dbSelect<Slot>('live_slots', `select=coil,product,stock,capacity&machine_id=eq.${t.machine_id}&order=coil.asc`);
      if (slots.length === 0) { flash('No live slots for this machine yet'); return; }
      const list = slots.filter((s) => s.product).map((s) => ({
        coil: s.coil, product: s.product as string,
        add: isRealCap(s.capacity) ? Math.max(0, (s.capacity as number) - (s.stock ?? 0)) : 0,
      }));
      patch(t.id, { replenish: list });
      flash('Replenish list loaded from the live machine');
    } catch { flash('Could not load slots'); }
  };
  const editAdd = (t: Task, coil: number, add: number) =>
    patch(t.id, { replenish: t.replenish.map((r) => (r.coil === coil ? { ...r, add } : r)) });

  if (status === 'loading') return <div className="section"><p>Loading restock tasks…</p></div>;
  if (status === 'error') return <div className="banner building">Could not load: {msg}</div>;

  const shown = tasks.filter((t) => t.task_type === tab);

  return (
    <div>
      <div className="hub-tabs">
        <button className={`hub-tab ${tab === 'refill' ? 'active' : ''}`} onClick={() => setTab('refill')}>Refill ({tasks.filter((t) => t.task_type === 'refill').length})</button>
        <button className={`hub-tab ${tab === 'shipping_refill' ? 'active' : ''}`} onClick={() => setTab('shipping_refill')}>Shipping refill ({tasks.filter((t) => t.task_type === 'shipping_refill').length})</button>
      </div>
      {msg && <div className="sb-msg">{msg}</div>}

      <div className="sb-bar">
        <div className="sb-counts">
          <span className="sb-count"><b>{shown.filter((t) => t.status !== 'done').length}</b> open</span>
          <span className="sb-count"><b>{shown.filter((t) => t.status === 'done').length}</b> done</span>
        </div>
        {!adding
          ? <button className="pd-save" onClick={() => setAdding(true)}>+ New {tab === 'refill' ? 'refill' : 'shipping refill'}</button>
          : (
            <div className="sb-add">
              <select value={newMachine} onChange={(e) => setNewMachine(e.target.value)}>
                <option value="">machine…</option>
                {machines.map((m) => <option key={m.machine_id} value={m.machine_id}>{m.label || m.machine_id}</option>)}
              </select>
              <button className="pd-save" onClick={add}>Create</button>
              <button className="pd-link" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          )}
      </div>

      <div className="banner building" style={{ marginBottom: 14 }}>
        <b>Rule:</b> the refiller never changes prices or slots — those go through the departments before anything
        is sent to the machine. Alerts, QR check-in, code release, photo intake, Drive filing and the at-machine
        text bot run through the agent once it&apos;s loaded; until then the toggles below are the manual record.
      </div>

      {shown.length === 0 && <div className="section"><p>No {tab === 'refill' ? 'refill' : 'shipping refill'} tasks yet.</p></div>}

      <div className="req-grid">
        {shown.map((t) => {
          const m = machineOf[t.machine_id];
          const isOpen = open === t.id;
          const si = STATUSES.findIndex((s) => s.id === t.status);
          return (
            <div key={t.id} className={`req-card ${isOpen ? 'open' : ''}`}>
              <div className="req-head" onClick={() => setOpen(isOpen ? null : t.id)}>
                <div className="req-main">
                  <div className="req-name">{m?.label || t.machine_id}{m?.campus ? ` · ${m.campus}` : ''}</div>
                  <div className="req-meta">
                    <span className="req-status s-requested">{STATUSES[si]?.label || t.status}</span>
                    {t.refiller_name && <span className="ph-tag">{t.refiller_name}{t.refiller_type ? ` (${t.refiller_type})` : ''}</span>}
                    {t.scheduled_date && <span className="ph-tag">{t.scheduled_date}{t.scheduled_time ? ` ${t.scheduled_time}` : ''}</span>}
                    {!t.accepted && t.reoffer_date && <span className="ph-tag" style={{ color: '#ffc247' }}>re-offer {t.reoffer_date}</span>}
                  </div>
                </div>
              </div>
              {isOpen && (
                <div className="req-body">
                  <div className="sb-move" style={{ marginBottom: 10 }}>
                    <button className="pd-link" onClick={() => move(t, -1)} disabled={si <= 0}>← back</button>
                    <button className="pd-link" onClick={() => move(t, 1)} disabled={si >= STATUSES.length - 1}>advance →</button>
                  </div>

                  <div className="sb-check-title">Refiller (Instawork / Aramark / student — must be set up)</div>
                  <div className="pd-grid">
                    <label className="pd-field"><span>Type</span>
                      <select value={t.refiller_type || ''} onChange={(e) => patch(t.id, { refiller_type: e.target.value })}>
                        <option value="">—</option>{REFILLER_TYPES.map((r) => <option key={r}>{r}</option>)}
                      </select></label>
                    <label className="pd-field"><span>Name</span><input value={t.refiller_name || ''} onChange={(e) => patch(t.id, { refiller_name: e.target.value })} /></label>
                    <label className="pd-field"><span>Contact (phone/email)</span><input value={t.refiller_contact || ''} onChange={(e) => patch(t.id, { refiller_contact: e.target.value })} /></label>
                    <label className="pd-field"><span>Alert sent</span><input type="date" value={t.offer_sent_at || ''} onChange={(e) => patch(t.id, { offer_sent_at: e.target.value })} /></label>
                    <label className="pd-field"><span>Scheduled date</span><input type="date" value={t.scheduled_date || ''} onChange={(e) => patch(t.id, { scheduled_date: e.target.value })} /></label>
                    <label className="pd-field"><span>Time</span><input value={t.scheduled_time || ''} onChange={(e) => patch(t.id, { scheduled_time: e.target.value })} placeholder="e.g. 9–11am" /></label>
                    <label className="pd-field"><span>No accept? re-offer (next day)</span><input type="date" value={t.reoffer_date || ''} onChange={(e) => patch(t.id, { reoffer_date: e.target.value })} /></label>
                  </div>
                  <div className="sb-check"><Bool label="Refiller accepted the time + date" value={!!t.accepted} onChange={(v) => patch(t.id, { accepted: v })} /></div>

                  {t.task_type === 'shipping_refill' && (
                    <div>
                      <div className="sb-check-title">Shipment first — campus check-in</div>
                      <div className="pd-grid">
                        <label className="pd-field"><span>Pickup location on campus</span><input value={t.pickup_location || ''} onChange={(e) => patch(t.id, { pickup_location: e.target.value })} /></label>
                        <label className="pd-field"><span>Check-in contact</span><input value={t.checkin_contact || ''} onChange={(e) => patch(t.id, { checkin_contact: e.target.value })} /></label>
                        <label className="pd-field pd-wide"><span>Check-in instructions</span><textarea rows={2} value={t.checkin_instructions || ''} onChange={(e) => patch(t.id, { checkin_instructions: e.target.value })} placeholder="receive the shipment → machine refill → back-storage fill" /></label>
                        <label className="pd-field pd-wide"><span>Back-storage fill note</span><input value={t.backstorage_note || ''} onChange={(e) => patch(t.id, { backstorage_note: e.target.value })} /></label>
                      </div>
                    </div>
                  )}

                  <div className="sb-check-title">Map card (the shared card — edited on Maps &amp; Routes)</div>
                  {(() => {
                    const c = cards[t.machine_id];
                    return (
                      <div className="mapcard-summary">
                        {c?.address && <div><b>Address:</b> {c.address}</div>}
                        {c?.walkout_location && <div><b>Walk-out:</b> {c.walkout_location}</div>}
                        {c?.fill_times && <div><b>Fill times:</b> {c.fill_times}</div>}
                        {c?.hours && <div><b>Access:</b> {c.hours}</div>}
                        {(c?.contact_name || c?.contact_phone) && <div><b>Contact:</b> {[c?.contact_name, c?.contact_phone].filter(Boolean).join(' · ')}</div>}
                        <div className="sup-foot">
                          {c?.google_maps_url && <a className="pd-link" href={c.google_maps_url} target="_blank" rel="noopener noreferrer">Google pin ↗</a>}
                          {m?.refill_videos_url && <a className="pd-link" href={m.refill_videos_url} target="_blank" rel="noopener noreferrer">Refill videos ↗</a>}
                          {m?.refill_docs_url && <a className="pd-link" href={m.refill_docs_url} target="_blank" rel="noopener noreferrer">Documents ↗</a>}
                          <a className="pd-link" href="/maps-distribution#map-cards">Edit the full card on Maps &amp; Routes →</a>
                        </div>
                        {!c?.address && !c?.walkout_location && <div style={{ color: '#ffc247', fontSize: 12.5 }}>This machine&apos;s map card isn&apos;t filled in yet — complete it on Maps &amp; Routes before sending.</div>}
                      </div>
                    );
                  })()}
                  <div className="sb-check"><Bool label="Map card sent to refiller (after confirm)" value={!!t.mapcard_sent} onChange={(v) => patch(t.id, { mapcard_sent: v })} /></div>

                  <div className="sb-check-title">At the machine — verify, then release codes</div>
                  <div className="sb-check">
                    <Bool label="On-site verified (QR / push — manual until the agent is live)" value={!!t.onsite_verified} onChange={(v) => patch(t.id, { onsite_verified: v })} />
                    {t.onsite_verified ? (
                      <>
                        <div className="mrec-lock" style={{ margin: '8px 0' }}>
                          <div>
                            <div className="mrec-lock-label">KEY CODE (machine lockbox)</div>
                            <div className="mrec-code">{m?.lockbox_code || 'not set — generate on Machine Ops'}</div>
                          </div>
                          <div>
                            <div className="mrec-lock-label">REFILL CODE (replenish screen)</div>
                            <div className="mrec-code">{t.refill_code || '—'}</div>
                          </div>
                          <button className="pd-save" onClick={() => genRefillCode(t)}>Generate refill code</button>
                        </div>
                        <Bool label="Key code sent" value={!!t.access_code_sent} onChange={(v) => patch(t.id, { access_code_sent: v })} />
                        <Bool label="Refill code sent" value={!!t.refill_code_sent} onChange={(v) => patch(t.id, { refill_code_sent: v })} />
                      </>
                    ) : <p style={{ fontSize: 12.5, opacity: .6, margin: '4px 0' }}>Codes stay hidden until on-site verification.</p>}
                  </div>

                  <div className="sb-check-title">Replenish screen — exact product + amount</div>
                  {t.replenish.length === 0
                    ? <button className="pd-save" onClick={() => loadReplenish(t)}>Load list from the live machine</button>
                    : (
                      <div className="tablewrap" style={{ marginBottom: 8 }}>
                        <table className="dtable">
                          <thead><tr><th>Coil</th><th>Product</th><th className="num">Add</th></tr></thead>
                          <tbody>
                            {t.replenish.map((r) => (
                              <tr key={r.coil}>
                                <td className="num">{r.coil}</td>
                                <td>{r.product}</td>
                                <td className="num"><input type="number" style={{ width: 64, textAlign: 'right' }} className="mreg-in" value={r.add} onChange={(e) => editAdd(t, r.coil, Number(e.target.value) || 0)} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                  <div className="sb-check-title">Close out</div>
                  <div className="pd-grid">
                    <label className="pd-field pd-wide"><span>Door-closed photo (link)</span><input value={t.photo_url || ''} onChange={(e) => patch(t.id, { photo_url: e.target.value })} placeholder="photo sent to the agent" /></label>
                  </div>
                  <div className="sb-check">
                    <Bool label="Inventory verified" value={!!t.inventory_verified} onChange={(v) => patch(t.id, { inventory_verified: v })} />
                    <Bool label="Filed in Google Drive (agent)" value={!!t.filed_drive} onChange={(v) => patch(t.id, { filed_drive: v })} />
                    <Bool label="Sent through email (agent)" value={!!t.filed_email} onChange={(v) => patch(t.id, { filed_email: v })} />
                  </div>

                  <label className="pd-field pd-wide"><span>Notes</span><textarea rows={2} value={t.notes || ''} onChange={(e) => patch(t.id, { notes: e.target.value })} /></label>
                  <div className="sup-foot">
                    <button className="sb-remove" onClick={() => remove(t.id)}>Remove task</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
