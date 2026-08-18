'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react';
import { dbSelect, dbInsert, dbUpdate, dbDelete, uploadToBucket } from '@/lib/db';

interface Product {
  barcode: string;
  name: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  default_price: string | null;
  cost: string | null;
  supplier: string | null;
  notes: string | null;
}

const CATEGORIES = ['Health', 'Personal Care', 'Feminine', 'Sexual Health', 'Cold & Allergy', 'Pain Relief', 'Grooming', 'Laundry', 'Hydration', 'Other'];

export function CatalogBoard({ carriers }: { carriers: Record<string, string[]> }) {
  const [rows, setRows] = useState<Product[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [nm, setNm] = useState('');

  const load = async () => {
    try { setRows(await dbSelect<Product>('products', 'select=*&order=name.asc')); setStatus('ready'); }
    catch (e) { setStatus('error'); setMsg(e instanceof Error ? e.message : 'load failed'); }
  };
  useEffect(() => { load(); }, []);
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 2500); };

  const add = async () => {
    if (!nm.trim()) { flash('Name the product first'); return; }
    const barcode = `NEW-${Date.now()}`;
    try {
      const created = await dbInsert('products', { barcode, name: nm.trim() });
      setRows((r) => [...r, created as Product].sort((a, b) => a.name.localeCompare(b.name)));
      setNm(''); setAdding(false); setOpen(barcode); flash('Product added');
    } catch { flash('Could not add'); }
  };
  const patch = async (barcode: string, p: Partial<Product>) => {
    setRows((rs) => rs.map((r) => (r.barcode === barcode ? { ...r, ...p } : r)));
    try { await dbUpdate('products', `barcode=eq.${encodeURIComponent(barcode)}`, p); } catch { flash('Save failed'); }
  };
  const remove = async (barcode: string) => {
    setRows((rs) => rs.filter((r) => r.barcode !== barcode));
    if (open === barcode) setOpen(null);
    try { await dbDelete('products', `barcode=eq.${encodeURIComponent(barcode)}`); flash('Removed'); } catch { flash('Delete failed'); }
  };
  const onImage = async (barcode: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    flash('Uploading image…');
    try {
      const url = await uploadToBucket('product-images', barcode.replace(/[^a-zA-Z0-9]/g, ''), file);
      await patch(barcode, { image_url: url });
      flash('Image saved');
    } catch { flash('Image upload failed'); }
  };

  const shown = useMemo(() => rows.filter((r) => {
    if (!q) return true;
    return `${r.name} ${r.category || ''} ${r.supplier || ''}`.toLowerCase().includes(q.toLowerCase());
  }), [rows, q]);

  const withImg = rows.filter((r) => r.image_url).length;
  const withDesc = rows.filter((r) => r.description).length;

  if (status === 'loading') return <div className="section"><p>Loading catalog…</p></div>;
  if (status === 'error') return <div className="banner building">Could not load catalog: {msg}</div>;

  return (
    <div className="catboard">
      <div className="sb-bar">
        <div className="sb-counts">
          <span className="sb-count"><b>{rows.length}</b> products</span>
          <span className="sb-count"><b>{withImg}</b> with image</span>
          <span className="sb-count"><b>{withDesc}</b> with description</span>
        </div>
        {!adding
          ? <button className="pd-save" onClick={() => setAdding(true)}>+ Add product</button>
          : (
            <div className="sb-add">
              <input placeholder="Product name *" value={nm} onChange={(e) => setNm(e.target.value)} />
              <button className="pd-save" onClick={add}>Add</button>
              <button className="pd-link" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          )}
      </div>
      <input className="con-search" placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
      {msg && <div className="sb-msg">{msg}</div>}

      <div className="cat-grid">
        {shown.map((p) => {
          const machines = carriers[p.barcode] || [];
          const isOpen = open === p.barcode;
          return (
            <div key={p.barcode} className={`cat-card ${isOpen ? 'open' : ''}`}>
              <div className="cat-top" onClick={() => setOpen(isOpen ? null : p.barcode)}>
                <div className="cat-thumb">
                  {p.image_url ? <img src={p.image_url} alt={p.name} /> : <span className="cat-noimg">no image</span>}
                </div>
                <div className="cat-info">
                  <div className="cat-name">{p.name}</div>
                  {p.default_price && <div className="cat-price">${p.default_price}</div>}
                  <div className="cat-desc">{p.description || 'no description yet'}</div>
                  <div className="cat-machines">{machines.length ? `on ${machines.length} machine${machines.length > 1 ? 's' : ''}` : 'not placed'}</div>
                </div>
              </div>
              {isOpen && (
                <div className="cat-body">
                  <div className="cat-edit-img">
                    <div className="cat-thumb lg">
                      {p.image_url ? <img src={p.image_url} alt={p.name} /> : <span className="cat-noimg">no image</span>}
                    </div>
                    <label className="pd-btn">
                      {p.image_url ? 'Replace image' : '📷 Add image'}
                      <input type="file" accept="image/*" hidden onChange={(e) => onImage(p.barcode, e)} />
                    </label>
                  </div>
                  <div className="pd-grid">
                    <label className="pd-field"><span>Name</span><input value={p.name} onChange={(e) => patch(p.barcode, { name: e.target.value })} /></label>
                    <label className="pd-field"><span>Category</span>
                      <select value={p.category || ''} onChange={(e) => patch(p.barcode, { category: e.target.value })}><option value="">—</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
                    </label>
                    <label className="pd-field"><span>Default price</span><input value={p.default_price || ''} onChange={(e) => patch(p.barcode, { default_price: e.target.value })} /></label>
                    <label className="pd-field"><span>Cost</span><input value={p.cost || ''} onChange={(e) => patch(p.barcode, { cost: e.target.value })} /></label>
                    <label className="pd-field"><span>Supplier</span><input value={p.supplier || ''} onChange={(e) => patch(p.barcode, { supplier: e.target.value })} /></label>
                    <label className="pd-field"><span>Barcode / ID</span><input value={p.barcode} readOnly style={{ opacity: .6 }} /></label>
                    <label className="pd-field pd-wide"><span>Description</span><textarea rows={2} value={p.description || ''} onChange={(e) => patch(p.barcode, { description: e.target.value })} placeholder="What it is, size, key details for the planogram and machine display" /></label>
                    <label className="pd-field pd-wide"><span>Notes</span><textarea rows={2} value={p.notes || ''} onChange={(e) => patch(p.barcode, { notes: e.target.value })} /></label>
                  </div>
                  {machines.length > 0 && <div className="cat-onlist">On: {machines.join(', ')}</div>}
                  <button className="sb-remove" onClick={() => remove(p.barcode)}>Remove product</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
