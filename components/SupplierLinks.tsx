'use client';

import { useEffect, useState } from 'react';
import { dbSelect, dbInsert, dbUpdate, dbDelete } from '@/lib/db';

interface Supplier {
  id: string;
  name: string;
  url: string | null;
  notes: string | null;
  contact: string | null;
  shipping: string | null;
  is_primary: boolean | null;
}

export function SupplierLinks() {
  const [rows, setRows] = useState<Supplier[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [nm, setNm] = useState('');
  const [url, setUrl] = useState('');

  const load = async () => {
    try {
      setRows(await dbSelect<Supplier>('supplier_links', 'select=*&order=is_primary.desc,name.asc'));
      setStatus('ready');
    } catch (e) { setStatus('error'); setMsg(e instanceof Error ? e.message : 'load failed'); }
  };
  useEffect(() => { load(); }, []);
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 2500); };

  const add = async () => {
    if (!nm.trim()) { flash('Name the supplier first'); return; }
    try {
      const created = await dbInsert('supplier_links', { name: nm.trim(), url: url.trim() || null });
      setRows((r) => [...r, created as Supplier]);
      setNm(''); setUrl(''); setAdding(false); flash('Supplier added');
    } catch { flash('Could not add'); }
  };
  const patch = async (id: string, p: Partial<Supplier>) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
    try { await dbUpdate('supplier_links', `id=eq.${id}`, p); } catch { flash('Save failed'); }
  };
  const remove = async (id: string) => {
    setRows((rs) => rs.filter((r) => r.id !== id));
    try { await dbDelete('supplier_links', `id=eq.${id}`); flash('Removed'); } catch { flash('Delete failed'); }
  };

  if (status === 'loading') return <div className="section"><p>Loading suppliers…</p></div>;
  if (status === 'error') return <div className="banner building">Could not load suppliers: {msg}</div>;

  return (
    <div>
      <div className="sb-bar">
        <div className="sb-counts">
          <span className="sb-count"><b>{rows.length}</b> shopping site{rows.length === 1 ? '' : 's'}</span>
        </div>
        {!adding
          ? <button className="pd-save" onClick={() => setAdding(true)}>+ Add site</button>
          : (
            <div className="sb-add">
              <input placeholder="Supplier name *" value={nm} onChange={(e) => setNm(e.target.value)} />
              <input placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
              <button className="pd-save" onClick={add}>Add</button>
              <button className="pd-link" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          )}
      </div>
      {msg && <div className="sb-msg">{msg}</div>}
      <p className="hub-note">Click <b>Shop</b> to buy on the supplier&apos;s site (log in there — credentials stay with the site).
        While shopping, bring products back here: add them on the <b>Requested</b> tab with the source link,
        copy the description, borrow the image. The agent will help with this once it&apos;s loaded on this page.</p>

      <div className="sup-grid">
        {rows.map((s) => {
          const isOpen = open === s.id;
          return (
            <div key={s.id} className="sup-card">
              <div className="sup-head">
                <div>
                  <div className="sup-name">{s.is_primary ? '★ ' : ''}{s.name}</div>
                  {s.notes && !isOpen && <div className="sup-notes">{s.notes}</div>}
                </div>
                {s.url
                  ? <a className="pd-save sup-shop" href={s.url} target="_blank" rel="noopener noreferrer">Shop ↗</a>
                  : <span className="ph-tag">no link yet</span>}
              </div>
              {isOpen && (
                <div className="pd-grid" style={{ marginTop: 10 }}>
                  <label className="pd-field"><span>Name</span><input value={s.name} onChange={(e) => patch(s.id, { name: e.target.value })} /></label>
                  <label className="pd-field"><span>Shop URL</span><input value={s.url || ''} onChange={(e) => patch(s.id, { url: e.target.value })} /></label>
                  <label className="pd-field"><span>Warehouse contact</span><input value={s.contact || ''} onChange={(e) => patch(s.id, { contact: e.target.value })} placeholder="phone / email / rep" /></label>
                  <label className="pd-field"><span>Shipping prices</span><input value={s.shipping || ''} onChange={(e) => patch(s.id, { shipping: e.target.value })} placeholder="rates, free-ship minimum…" /></label>
                  <label className="pd-field pd-wide"><span>What we buy here / notes</span><textarea rows={2} value={s.notes || ''} onChange={(e) => patch(s.id, { notes: e.target.value })} /></label>
                </div>
              )}
              <div className="sup-foot">
                {!isOpen && s.contact && <span className="sup-meta">☎ {s.contact}</span>}
                {!isOpen && s.shipping && <span className="sup-meta">🚚 {s.shipping}</span>}
                <button className="pd-link" onClick={() => setOpen(isOpen ? null : s.id)}>{isOpen ? 'Close' : 'Edit'}</button>
                {isOpen && <button className="sb-remove" onClick={() => remove(s.id)}>Remove</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
