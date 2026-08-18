'use client';

import { useEffect, useState } from 'react';
import { dbSelect, dbInsert, dbUpdate, dbDelete } from '@/lib/db';

interface SlotRow { slot: number; product: string; price: string; capacity: string; }
interface Template {
  id: string;
  name: string;
  description: string | null;
  status: string;
  slots: SlotRow[];
}

export function TemplatesBoard({ products }: { products: string[] }) {
  const [rows, setRows] = useState<Template[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [nm, setNm] = useState('');

  const load = async () => {
    try {
      const data = await dbSelect<Template>('templates', 'select=*&order=name.asc');
      setRows(data.map((r) => ({ ...r, slots: Array.isArray(r.slots) ? r.slots : [] })));
      setStatus('ready');
    } catch (e) { setStatus('error'); setMsg(e instanceof Error ? e.message : 'load failed'); }
  };
  useEffect(() => { load(); }, []);
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 2500); };

  const add = async () => {
    if (!nm.trim()) { flash('Name the template first'); return; }
    try {
      const created = await dbInsert('templates', { name: nm.trim(), status: 'draft', slots: [] as SlotRow[] });
      setRows((r) => [...r, { ...(created as Template), slots: [] }].sort((a, b) => a.name.localeCompare(b.name)));
      setNm(''); setAdding(false); setOpen((created as Template).id); flash('Template created');
    } catch { flash('Could not create'); }
  };
  const patch = async (id: string, p: Partial<Template>) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
    try { await dbUpdate('templates', `id=eq.${id}`, p); } catch { flash('Save failed'); }
  };
  const remove = async (id: string) => {
    setRows((rs) => rs.filter((r) => r.id !== id));
    if (open === id) setOpen(null);
    try { await dbDelete('templates', `id=eq.${id}`); flash('Deleted'); } catch { flash('Delete failed'); }
  };

  const setSlots = (t: Template, slots: SlotRow[]) => patch(t.id, { slots });
  const addRow = (t: Template) => {
    const nextSlot = t.slots.reduce((mx, s) => Math.max(mx, s.slot), 0) + 1;
    setSlots(t, [...t.slots, { slot: nextSlot, product: '', price: '', capacity: '' }]);
  };
  const editRow = (t: Template, i: number, key: keyof SlotRow, val: string) => {
    const slots = t.slots.map((s, idx) => (idx === i ? { ...s, [key]: key === 'slot' ? Number(val) || 0 : val } : s));
    setSlots(t, slots);
  };
  const removeRow = (t: Template, i: number) => setSlots(t, t.slots.filter((_, idx) => idx !== i));

  if (status === 'loading') return <div className="section"><p>Loading templates…</p></div>;
  if (status === 'error') return <div className="banner building">Could not load templates: {msg}</div>;

  return (
    <div className="tplboard">
      <datalist id="product-options">{products.map((p) => <option key={p} value={p} />)}</datalist>

      <div className="sb-bar">
        <div className="sb-counts">
          <span className="sb-count"><b>{rows.length}</b> templates</span>
          <span className="sb-count"><b>{rows.filter((r) => r.status === 'approved').length}</b> approved</span>
        </div>
        {!adding
          ? <button className="pd-save" onClick={() => setAdding(true)}>+ New template</button>
          : (
            <div className="sb-add">
              <input placeholder="Template name * (e.g. Standard 60-slot)" value={nm} onChange={(e) => setNm(e.target.value)} />
              <button className="pd-save" onClick={add}>Create</button>
              <button className="pd-link" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          )}
      </div>
      {msg && <div className="sb-msg">{msg}</div>}

      {rows.length === 0 && <div className="section"><p>No templates yet. A template is a reusable layout — which product sits in which slot, at what price and capacity — that you load onto a machine at setup.</p></div>}

      <div className="fac-list">
        {rows.map((t) => {
          const isOpen = open === t.id;
          return (
            <div key={t.id} className={`tpl-card ${isOpen ? 'open' : ''}`}>
              <div className="fac-top" onClick={() => setOpen(isOpen ? null : t.id)}>
                <div>
                  <div className="fac-name">{t.name}</div>
                  <div className="fac-sub">{t.slots.length} slots{t.description ? ` · ${t.description}` : ''}</div>
                </div>
                <span className={`fac-status ${t.status === 'approved' ? 's-active' : 's-prospect'}`}>{t.status}</span>
              </div>
              {isOpen && (
                <div className="fac-body">
                  <label className="pd-field"><span>Description</span><input value={t.description || ''} onChange={(e) => patch(t.id, { description: e.target.value })} placeholder="What machine / campus this layout is for" /></label>

                  <div className="tpl-slots">
                    <div className="tpl-row tpl-head"><span>Slot</span><span>Product</span><span>Price</span><span>Cap</span><span /></div>
                    {t.slots.map((s, i) => (
                      <div key={i} className="tpl-row">
                        <input className="tpl-slot" value={s.slot} onChange={(e) => editRow(t, i, 'slot', e.target.value)} />
                        <input list="product-options" value={s.product} onChange={(e) => editRow(t, i, 'product', e.target.value)} placeholder="product" />
                        <input className="tpl-num" value={s.price} onChange={(e) => editRow(t, i, 'price', e.target.value)} placeholder="0.00" />
                        <input className="tpl-num" value={s.capacity} onChange={(e) => editRow(t, i, 'capacity', e.target.value)} placeholder="qty" />
                        <button className="mc-x" onClick={() => removeRow(t, i)}>✕</button>
                      </div>
                    ))}
                    <button className="pd-link" onClick={() => addRow(t)}>+ Add slot</button>
                  </div>

                  <div className="pd-actions">
                    <button className={`pd-stat ${t.status === 'approved' ? 'on' : ''}`} onClick={() => patch(t.id, { status: t.status === 'approved' ? 'draft' : 'approved' })}>
                      {t.status === 'approved' ? 'approved ✓ (click to unlock)' : 'approve template'}
                    </button>
                    <button className="sb-remove" onClick={() => remove(t.id)}>Delete template</button>
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
