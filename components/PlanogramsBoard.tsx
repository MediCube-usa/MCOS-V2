'use client';

import { useEffect, useMemo, useState } from 'react';
import { dbSelect, dbInsert, dbUpdate, dbDelete } from '@/lib/db';

// The shared physical layout every machine uses (verified from live_slots):
// odd coils 1–29 and 53–59 are WIDE, 31–51 are STANDARD. 40 coils total.
const COIL_ORDER = [
  1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29,
  31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51,
  53, 55, 57, 59,
];
const isWide = (c: number) => c < 31 || c > 51;

interface Slot {
  coil: number;
  product: string;
  barcode?: string | null;
  retail_price?: number | string | null;
  capacity?: number | string | null;
  gate?: string;
  [k: string]: unknown;
}
interface Template {
  id: string;
  name: string;
  description: string | null;
  status: string;
  slots: Slot[];
}
interface Machine {
  machine_id: string;
  label: string | null;
  role: string | null;
  campus: string | null;
  notes: string | null;
  assigned_template_id: string | null;
  go_live_confirmed: boolean | null;
}
interface Product { barcode: string; name: string; default_price: string | null; }

const ROLES = ['live', 'new', 'template'];
const STATUSES = ['draft', 'ready', 'assigned', 'live'];

// tolerate the old {slot, price} shape and the imported {coil, retail_price} shape
function normSlots(raw: unknown): Slot[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Record<string, unknown>[]).map((s) => ({
    ...s,
    coil: Number(s.coil ?? s.slot ?? 0),
    product: String(s.product ?? ''),
    retail_price: (s.retail_price ?? s.price ?? '') as string,
    capacity: (s.capacity ?? '') as string,
  }));
}
function blankLayout(): Slot[] {
  return COIL_ORDER.map((c) => ({ coil: c, product: '', barcode: null, retail_price: '', capacity: '' }));
}

export function PlanogramsBoard() {
  const [tpls, setTpls] = useState<Template[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [view, setView] = useState<'planograms' | 'machines'>('planograms');
  const [adding, setAdding] = useState(false);
  const [nm, setNm] = useState('');

  const load = async () => {
    try {
      const [t, m, p] = await Promise.all([
        dbSelect<Template>('templates', 'select=*&order=name.asc'),
        dbSelect<Machine>('machines', 'select=*&order=role.asc,machine_id.asc'),
        dbSelect<Product>('products', 'select=barcode,name,default_price&order=name.asc'),
      ]);
      setTpls(t.map((r) => ({ ...r, slots: normSlots(r.slots) })));
      setMachines(m);
      setProducts(p);
      setStatus('ready');
    } catch (e) { setStatus('error'); setMsg(e instanceof Error ? e.message : 'load failed'); }
  };
  useEffect(() => { load(); }, []);
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 2500); };

  const assignedTo = useMemo(() => {
    const map: Record<string, string[]> = {};
    machines.forEach((m) => { if (m.assigned_template_id) (map[m.assigned_template_id] ||= []).push(m.machine_id); });
    return map;
  }, [machines]);

  // ---- templates ----
  const addTpl = async (fromId?: string, nameOverride?: string) => {
    const name = (nameOverride ?? nm).trim();
    if (!name) { flash('Name the planogram first'); return; }
    const src = fromId ? tpls.find((t) => t.id === fromId) : null;
    try {
      const created = await dbInsert('templates', {
        name,
        status: 'draft',
        description: src ? `duplicated from ${src.name}` : null,
        slots: src ? src.slots : blankLayout(),
      });
      setTpls((r) => [...r, { ...(created as Template), slots: normSlots((created as Template).slots) }].sort((a, b) => a.name.localeCompare(b.name)));
      setNm(''); setAdding(false); setOpen((created as Template).id); flash('Planogram created');
    } catch { flash('Could not create'); }
  };
  const patchTpl = async (id: string, p: Partial<Template>) => {
    setTpls((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
    try { await dbUpdate('templates', `id=eq.${id}`, p); } catch { flash('Save failed'); }
  };
  const removeTpl = async (id: string) => {
    if ((assignedTo[id] || []).length) { flash('Unassign it from machines first'); return; }
    setTpls((rs) => rs.filter((r) => r.id !== id));
    if (open === id) setOpen(null);
    try { await dbDelete('templates', `id=eq.${id}`); flash('Deleted'); } catch { flash('Delete failed'); }
  };
  const editSlot = (t: Template, coil: number, p: Partial<Slot>) => {
    const exists = t.slots.some((s) => s.coil === coil);
    const slots = exists
      ? t.slots.map((s) => (s.coil === coil ? { ...s, ...p } : s))
      : [...t.slots, { coil, product: '', retail_price: '', capacity: '', ...p }];
    patchTpl(t.id, { slots: slots.sort((a, b) => a.coil - b.coil) });
  };
  const pickProduct = (t: Template, coil: number, name: string) => {
    const prod = products.find((x) => x.name === name);
    const cur = t.slots.find((s) => s.coil === coil);
    editSlot(t, coil, {
      product: name,
      barcode: prod?.barcode ?? null,
      gate: name ? (prod ? 'match' : 'missing') : undefined,
      retail_price: cur?.retail_price || prod?.default_price || '',
    });
  };

  // ---- machines ----
  const patchMachine = async (id: string, p: Partial<Machine>) => {
    setMachines((ms) => ms.map((m) => (m.machine_id === id ? { ...m, ...p } : m)));
    try { await dbUpdate('machines', `machine_id=eq.${id}`, p); } catch { flash('Save failed'); }
  };
  const assign = async (m: Machine, templateId: string | null) => {
    await patchMachine(m.machine_id, { assigned_template_id: templateId, go_live_confirmed: false });
    if (templateId) {
      const t = tpls.find((x) => x.id === templateId);
      if (t && (t.status === 'draft' || t.status === 'ready')) patchTpl(templateId, { status: 'assigned' });
      flash('Planogram assigned — goes live after refill + begin count at the machine');
    }
  };

  if (status === 'loading') return <div className="section"><p>Loading planograms…</p></div>;
  if (status === 'error') return <div className="banner building">Could not load: {msg}</div>;

  return (
    <div>
      <div className="hub-tabs">
        <button className={`hub-tab ${view === 'planograms' ? 'active' : ''}`} onClick={() => setView('planograms')}>Planograms ({tpls.length})</button>
        <button className={`hub-tab ${view === 'machines' ? 'active' : ''}`} onClick={() => setView('machines')}>Machines ({machines.length})</button>
      </div>
      {msg && <div className="sb-msg">{msg}</div>}

      {view === 'planograms' && (
        <div>
          <div className="sb-bar">
            <div className="sb-counts">
              <span className="sb-count"><b>{tpls.length}</b> planograms</span>
              <span className="sb-count"><b>{tpls.filter((t) => t.status === 'live').length}</b> live</span>
            </div>
            {!adding
              ? <button className="pd-save" onClick={() => setAdding(true)}>+ New planogram</button>
              : (
                <div className="sb-add">
                  <input placeholder="Planogram name * (e.g. UNLV Tonopah 2)" value={nm} onChange={(e) => setNm(e.target.value)} />
                  <button className="pd-save" onClick={() => addTpl()}>Blank 40-coil</button>
                  <button className="pd-link" onClick={() => setAdding(false)}>Cancel</button>
                </div>
              )}
          </div>
          <p className="hub-note">A planogram fills the shared 40-coil layout with catalog products (the product picker
            only offers what&apos;s in the catalog — the OurVend gate). Flow: <b>draft → ready → assigned → live</b>.
            Push to OurVend rides <b>clone-a-machine only</b> and stays locked until Joe walks the clone steps.</p>

          <div className="fac-list">
            {tpls.map((t) => {
              const isOpen = open === t.id;
              const onMachines = assignedTo[t.id] || [];
              const filled = t.slots.filter((s) => s.product).length;
              const gateMiss = t.slots.filter((s) => s.product && s.gate === 'missing').length;
              return (
                <div key={t.id} className={`tpl-card ${isOpen ? 'open' : ''}`}>
                  <div className="fac-top" onClick={() => setOpen(isOpen ? null : t.id)}>
                    <div>
                      <div className="fac-name">{t.name}</div>
                      <div className="fac-sub">{filled}/{COIL_ORDER.length} coils filled
                        {gateMiss > 0 && <span style={{ color: '#ff5d7a' }}> · {gateMiss} not in OurVend</span>}
                        {onMachines.length > 0 && ` · on ${onMachines.join(', ')}`}</div>
                    </div>
                    <span className={`fac-status ${t.status === 'live' ? 's-active' : 's-prospect'}`}>{t.status}</span>
                  </div>
                  {isOpen && (
                    <div className="fac-body">
                      <div className="pd-grid" style={{ marginBottom: 10 }}>
                        <label className="pd-field"><span>Status</span>
                          <select value={t.status} onChange={(e) => patchTpl(t.id, { status: e.target.value })}>
                            {STATUSES.map((s) => <option key={s}>{s}</option>)}
                          </select>
                        </label>
                        <label className="pd-field pd-wide"><span>Description</span>
                          <input value={t.description || ''} onChange={(e) => patchTpl(t.id, { description: e.target.value })} /></label>
                      </div>

                      <div className="tpl-slots">
                        <div className="tpl-row tpl-head"><span>Coil</span><span>Product (catalog only)</span><span>Price</span><span>Fill</span><span /></div>
                        {COIL_ORDER.map((coil) => {
                          const s = t.slots.find((x) => x.coil === coil) || { coil, product: '', retail_price: '', capacity: '' } as Slot;
                          return (
                            <div key={coil} className="tpl-row">
                              <span className={`coil-cell ${isWide(coil) ? 'wide' : ''}`}>{coil}{isWide(coil) ? ' W' : ''}</span>
                              <select value={s.product} onChange={(e) => pickProduct(t, coil, e.target.value)}>
                                <option value="">— empty —</option>
                                {s.product && !products.some((p) => p.name === s.product) && <option value={s.product}>{s.product} (not in catalog!)</option>}
                                {products.map((p) => <option key={p.barcode} value={p.name}>{p.name}</option>)}
                              </select>
                              <input className="tpl-num" value={String(s.retail_price ?? '')} onChange={(e) => editSlot(t, coil, { retail_price: e.target.value })} placeholder="0.00" />
                              <input className="tpl-num" value={String(s.capacity ?? '')} onChange={(e) => editSlot(t, coil, { capacity: e.target.value })} placeholder="qty" />
                              <span className="coil-gate">{s.product ? (s.gate === 'missing' ? '✕' : s.gate === 'variant' ? '?' : '✓') : ''}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="pd-actions">
                        <button className="pd-link" onClick={() => addTpl(t.id, `${t.name} copy`)}>Duplicate</button>
                        <button className="sb-remove" onClick={() => removeTpl(t.id)}>Delete planogram</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'machines' && (
        <div>
          <p className="hub-note">The OurVend roster with roles. <b>live</b> machines keep their current layouts
            (begin counts get updated at the machine). <b>new</b> machines take a planogram assignment.
            <b> template</b> = a not-in-use machine set up in OurVend to be cloned. Confirm &quot;live fill&quot; only after
            refill placed the products and set the beginning count at the machine.</p>
          <div className="tablewrap">
            <table className="dtable">
              <thead><tr><th>Machine</th><th>Label</th><th>Role</th><th>Campus</th><th>Assigned planogram</th><th>Live fill</th><th>Notes</th></tr></thead>
              <tbody>
                {machines.map((m) => (
                  <tr key={m.machine_id}>
                    <td className="num">{m.machine_id}</td>
                    <td><input className="mreg-in" value={m.label || ''} onChange={(e) => patchMachine(m.machine_id, { label: e.target.value })} placeholder="name it" /></td>
                    <td>
                      <select className="mreg-in" value={m.role || 'new'} onChange={(e) => patchMachine(m.machine_id, { role: e.target.value })}>
                        {ROLES.map((r) => <option key={r}>{r}</option>)}
                      </select>
                    </td>
                    <td><input className="mreg-in" value={m.campus || ''} onChange={(e) => patchMachine(m.machine_id, { campus: e.target.value })} placeholder="campus" /></td>
                    <td>
                      <select className="mreg-in" value={m.assigned_template_id || ''} onChange={(e) => assign(m, e.target.value || null)} disabled={m.role === 'live'}>
                        <option value="">{m.role === 'live' ? 'keeps its layout' : '— none —'}</option>
                        {tpls.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </td>
                    <td>
                      {m.assigned_template_id
                        ? <button className={`pd-stat ${m.go_live_confirmed ? 'on' : ''}`}
                            onClick={() => patchMachine(m.machine_id, { go_live_confirmed: !m.go_live_confirmed })}>
                            {m.go_live_confirmed ? 'filled ✓' : 'confirm fill'}
                          </button>
                        : <span style={{ opacity: .4 }}>—</span>}
                    </td>
                    <td><input className="mreg-in mreg-notes" value={m.notes || ''} onChange={(e) => patchMachine(m.machine_id, { notes: e.target.value })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
