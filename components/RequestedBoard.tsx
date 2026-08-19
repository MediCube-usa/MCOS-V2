'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react';
import { dbSelect, dbInsert, dbUpdate, dbDelete } from '@/lib/db';

interface Requested {
  id: string;
  name: string;
  list_label: string | null;
  status: string | null;
  requested_count: number | null;
  target_price: string | null;
  est_cost: string | null;
  source_url: string | null;
  image_url: string | null;
  description: string | null;
  popularity: string | null;
  notes: string | null;
}

const STATUSES = ['researching', 'requested', 'approved', 'ordered', 'in_catalog'];

export function RequestedBoard() {
  const [rows, setRows] = useState<Requested[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [list, setList] = useState('all');
  const [adding, setAdding] = useState(false);
  const [nm, setNm] = useState('');
  const [lbl, setLbl] = useState('');

  const load = async () => {
    try {
      setRows(await dbSelect<Requested>('requested_products', 'select=*&order=created_at.desc'));
      setStatus('ready');
    } catch (e) { setStatus('error'); setMsg(e instanceof Error ? e.message : 'load failed'); }
  };
  useEffect(() => { load(); }, []);
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 2500); };

  const lists = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => r.list_label && s.add(r.list_label));
    return [...s].sort();
  }, [rows]);

  const shown = rows.filter((r) => list === 'all' || r.list_label === list);

  const add = async () => {
    if (!nm.trim()) { flash('Name the product first'); return; }
    try {
      const created = await dbInsert('requested_products', {
        name: nm.trim(),
        list_label: (lbl.trim() || (list !== 'all' ? list : '')) || null
      });
      setRows((r) => [created as Requested, ...r]);
      setNm(''); setLbl(''); setAdding(false); setOpen((created as Requested).id); flash('Added to the list');
    } catch { flash('Could not add'); }
  };
  const patch = async (id: string, p: Partial<Requested>) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
    try { await dbUpdate('requested_products', `id=eq.${id}`, p); } catch { flash('Save failed'); }
  };
  const remove = async (id: string) => {
    setRows((rs) => rs.filter((r) => r.id !== id));
    if (open === id) setOpen(null);
    try { await dbDelete('requested_products', `id=eq.${id}`); flash('Removed'); } catch { flash('Delete failed'); }
  };

  if (status === 'loading') return <div className="section"><p>Loading requested products…</p></div>;
  if (status === 'error') return <div className="banner building">Could not load requested products: {msg}</div>;

  return (
    <div>
      <div className="sb-bar">
        <div className="sb-counts">
          <span className="sb-count"><b>{rows.length}</b> on the request/research list</span>
          <select className="hub-filter" value={list} onChange={(e) => setList(e.target.value)}>
            <option value="all">all lists</option>
            {lists.map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>
        {!adding
          ? <button className="pd-save" onClick={() => setAdding(true)}>+ Add product</button>
          : (
            <div className="sb-add">
              <input placeholder="Product name *" value={nm} onChange={(e) => setNm(e.target.value)} />
              <input placeholder="List (campus / promo)" value={lbl} onChange={(e) => setLbl(e.target.value)} />
              <button className="pd-save" onClick={add}>Add</button>
              <button className="pd-link" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          )}
      </div>
      {msg && <div className="sb-msg">{msg}</div>}
      <p className="hub-note">Products <b>not in machines yet</b> — request lists per campus or promo, and the research
        behind them (price points, popularity, demographics). Requested products are one of our strongest promotions:
        the count shows demand before we ever load a coil. When one graduates, add it on the <b>Products</b> tab
        (and into OurVend — image + description, one at a time — before it can ride a template).</p>

      <div className="req-grid">
        {shown.map((r) => {
          const isOpen = open === r.id;
          return (
            <div key={r.id} className={`req-card ${isOpen ? 'open' : ''}`}>
              <div className="req-head" onClick={() => setOpen(isOpen ? null : r.id)}>
                {r.image_url && <img className="req-thumb" src={r.image_url} alt={r.name} />}
                <div className="req-main">
                  <div className="req-name">{r.name}</div>
                  <div className="req-meta">
                    {r.list_label && <span className="ph-tag">{r.list_label}</span>}
                    <span className={`req-status s-${r.status || 'researching'}`}>{r.status || 'researching'}</span>
                    <span className="req-count" title="times requested">▲ {r.requested_count ?? 0}</span>
                    {r.target_price && <span className="req-price">${r.target_price}</span>}
                  </div>
                </div>
                <button
                  className="pd-save req-vote"
                  onClick={(e) => { e.stopPropagation(); patch(r.id, { requested_count: (r.requested_count ?? 0) + 1 }); }}
                  title="Someone asked for this — count it"
                >+1 requested</button>
              </div>
              {isOpen && (
                <div className="req-body">
                  <div className="pd-grid">
                    <label className="pd-field"><span>Name</span><input value={r.name} onChange={(e) => patch(r.id, { name: e.target.value })} /></label>
                    <label className="pd-field"><span>List (campus / promo)</span><input value={r.list_label || ''} onChange={(e) => patch(r.id, { list_label: e.target.value })} /></label>
                    <label className="pd-field"><span>Status</span>
                      <select value={r.status || 'researching'} onChange={(e) => patch(r.id, { status: e.target.value })}>
                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </label>
                    <label className="pd-field"><span>Requested count</span><input type="number" value={r.requested_count ?? 0} onChange={(e) => patch(r.id, { requested_count: Number(e.target.value) || 0 })} /></label>
                    <label className="pd-field"><span>Target sell price</span><input value={r.target_price || ''} onChange={(e) => patch(r.id, { target_price: e.target.value })} /></label>
                    <label className="pd-field"><span>Est. cost</span><input value={r.est_cost || ''} onChange={(e) => patch(r.id, { est_cost: e.target.value })} /></label>
                    <label className="pd-field pd-wide"><span>Where to buy (source URL)</span><input value={r.source_url || ''} onChange={(e) => patch(r.id, { source_url: e.target.value })} placeholder="paste the shop page link" /></label>
                    <label className="pd-field pd-wide"><span>Image URL</span><input value={r.image_url || ''} onChange={(e) => patch(r.id, { image_url: e.target.value })} placeholder="borrow from the shop page for now" /></label>
                    <label className="pd-field pd-wide"><span>Description</span><textarea rows={2} value={r.description || ''} onChange={(e) => patch(r.id, { description: e.target.value })} placeholder="copy from the supplier page, clean up later" /></label>
                    <label className="pd-field pd-wide"><span>Popularity / demographics research</span><textarea rows={2} value={r.popularity || ''} onChange={(e) => patch(r.id, { popularity: e.target.value })} placeholder="who buys it, where it does well, online sales signals…" /></label>
                    <label className="pd-field pd-wide"><span>Notes</span><textarea rows={2} value={r.notes || ''} onChange={(e) => patch(r.id, { notes: e.target.value })} /></label>
                  </div>
                  <div className="sup-foot">
                    {r.source_url && <a className="pd-link" href={r.source_url} target="_blank" rel="noopener noreferrer">Open source page ↗</a>}
                    <button className="sb-remove" onClick={() => remove(r.id)}>Remove</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {shown.length === 0 && <div className="section"><p>Nothing on this list yet — add the first product.</p></div>}
      </div>
    </div>
  );
}
