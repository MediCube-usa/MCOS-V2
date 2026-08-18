'use client';

import { useEffect, useMemo, useState } from 'react';
import { dbSelect, dbInsert, dbUpdate, dbDelete } from '@/lib/db';

interface Contact {
  id: string;
  name: string;
  role: string | null;
  org: string | null;
  category: string;
  phone: string | null;
  email: string | null;
  verified: boolean;
  notes: string | null;
}

const CATEGORIES = ['refiller', 'facility', 'vendor', 'tcn', 'logistics', 'payments', 'internal', 'other'] as const;

export function ContactsBoard() {
  const [rows, setRows] = useState<Contact[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [nm, setNm] = useState('');
  const [cat, setCat] = useState<string>('refiller');

  const load = async () => {
    try { setRows(await dbSelect<Contact>('contacts', 'select=*&order=name.asc')); setStatus('ready'); }
    catch (e) { setStatus('error'); setMsg(e instanceof Error ? e.message : 'load failed'); }
  };
  useEffect(() => { load(); }, []);
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 2500); };

  const add = async () => {
    if (!nm.trim()) { flash('Name the contact first'); return; }
    try {
      const created = await dbInsert('contacts', { name: nm.trim(), category: cat });
      setRows((r) => [...r, created as Contact].sort((a, b) => a.name.localeCompare(b.name)));
      setNm(''); setAdding(false); setOpen((created as Contact).id); flash('Contact added');
    } catch { flash('Could not add'); }
  };
  const patch = async (id: string, p: Partial<Contact>) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
    try { await dbUpdate('contacts', `id=eq.${id}`, p); } catch { flash('Save failed'); }
  };
  const remove = async (id: string) => {
    setRows((rs) => rs.filter((r) => r.id !== id));
    if (open === id) setOpen(null);
    try { await dbDelete('contacts', `id=eq.${id}`); flash('Removed'); } catch { flash('Delete failed'); }
  };

  const shown = useMemo(() => rows.filter((r) => {
    if (filter !== 'all' && r.category !== filter) return false;
    if (q) { const s = `${r.name} ${r.role || ''} ${r.org || ''} ${r.email || ''}`.toLowerCase(); if (!s.includes(q.toLowerCase())) return false; }
    return true;
  }), [rows, filter, q]);

  if (status === 'loading') return <div className="section"><p>Loading contacts…</p></div>;
  if (status === 'error') return <div className="banner building">Could not load contacts: {msg}</div>;

  return (
    <div className="conboard">
      <div className="sb-bar">
        <div className="con-filters">
          <button className={`con-chip ${filter === 'all' ? 'on' : ''}`} onClick={() => setFilter('all')}>all {rows.length}</button>
          {CATEGORIES.map((c) => {
            const n = rows.filter((r) => r.category === c).length;
            if (n === 0) return null;
            return <button key={c} className={`con-chip ${filter === c ? 'on' : ''}`} onClick={() => setFilter(c)}>{c} {n}</button>;
          })}
        </div>
        {!adding
          ? <button className="pd-save" onClick={() => setAdding(true)}>+ Add contact</button>
          : (
            <div className="sb-add">
              <input placeholder="Name *" value={nm} onChange={(e) => setNm(e.target.value)} />
              <select value={cat} onChange={(e) => setCat(e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
              <button className="pd-save" onClick={add}>Add</button>
              <button className="pd-link" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          )}
      </div>
      <input className="con-search" placeholder="Search name, role, org, email…" value={q} onChange={(e) => setQ(e.target.value)} />
      {msg && <div className="sb-msg">{msg}</div>}

      {shown.length === 0 && <div className="section"><p>No contacts{filter !== 'all' ? ` in "${filter}"` : ''} yet. Add refillers, facility contacts, TCN reps, logistics, and vendors here — each person once.</p></div>}

      <div className="con-list">
        {shown.map((c) => {
          const isOpen = open === c.id;
          return (
            <div key={c.id} className={`con-card ${isOpen ? 'open' : ''}`}>
              <div className="con-top" onClick={() => setOpen(isOpen ? null : c.id)}>
                <div>
                  <div className="con-name">{c.name} {c.verified && <span className="con-verified">✓</span>}</div>
                  <div className="con-sub">{[c.role, c.org].filter(Boolean).join(' · ') || 'no role set'}</div>
                </div>
                <div className="con-right">
                  <span className="con-cat">{c.category}</span>
                  {c.phone && <a className="con-quick" href={`tel:${c.phone}`} onClick={(e) => e.stopPropagation()}>call</a>}
                </div>
              </div>
              {isOpen && (
                <div className="con-body">
                  <div className="pd-grid">
                    <label className="pd-field"><span>Role</span><input value={c.role || ''} onChange={(e) => patch(c.id, { role: e.target.value })} /></label>
                    <label className="pd-field"><span>Org / facility / vendor</span><input value={c.org || ''} onChange={(e) => patch(c.id, { org: e.target.value })} /></label>
                    <label className="pd-field"><span>Phone</span><input value={c.phone || ''} onChange={(e) => patch(c.id, { phone: e.target.value })} /></label>
                    <label className="pd-field"><span>Email</span><input value={c.email || ''} onChange={(e) => patch(c.id, { email: e.target.value })} /></label>
                    <label className="pd-field"><span>Category</span>
                      <select value={c.category} onChange={(e) => patch(c.id, { category: e.target.value })}>{CATEGORIES.map((x) => <option key={x}>{x}</option>)}</select>
                    </label>
                    <label className="pd-field"><span>Verified</span>
                      <button className={`pd-stat ${c.verified ? 'on' : ''}`} style={{ alignSelf: 'flex-start' }} onClick={() => patch(c.id, { verified: !c.verified })}>{c.verified ? 'verified' : 'mark verified'}</button>
                    </label>
                    <label className="pd-field pd-wide"><span>Notes</span><textarea rows={2} value={c.notes || ''} onChange={(e) => patch(c.id, { notes: e.target.value })} /></label>
                  </div>
                  <button className="sb-remove" onClick={() => remove(c.id)}>Remove contact</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
