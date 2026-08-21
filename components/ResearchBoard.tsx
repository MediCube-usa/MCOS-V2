'use client';

// Research tab — drop a product in and queue a full-scenario search on it.
// Joe defines the exact search parameters later ("very specific"); until the
// engine is loaded, runs queue here honestly and execute the moment it's live.

import { useEffect, useState } from 'react';
import { dbSelect, dbInsert, dbUpdate, dbDelete } from '@/lib/db';

interface Run {
  id: string;
  product_name: string;
  barcode: string | null;
  status: string;
  findings: string | null;
  notes: string | null;
  requested_at: string;
}
interface Product { barcode: string; name: string; }

const SCOPE = [
  'Price points (ours vs online vs local)',
  'Popularity & demand signals',
  'Packaging size + warehouse SKU',
  'Coil-fit check — which of our coils it fits (by size)',
  'Popularity by venue type — gym vs dorm vs hospital vs stadium',
  'Demographics — who buys it, on which campuses',
  'Online sales & reviews',
  'Where it sells / where it does not (our fleet)',
  'Supplier cost & availability',
];

export function ResearchBoard() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [msg, setMsg] = useState('');
  const [pick, setPick] = useState('');
  const [custom, setCustom] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 2500); };

  useEffect(() => {
    (async () => {
      try {
        const [r, p] = await Promise.all([
          dbSelect<Run>('product_research', 'select=*&order=requested_at.desc'),
          dbSelect<Product>('products', 'select=barcode,name&order=name.asc'),
        ]);
        setRuns(r); setProducts(p); setStatus('ready');
      } catch (e) { setStatus('error'); setMsg(e instanceof Error ? e.message : 'load failed'); }
    })();
  }, []);

  const run = async () => {
    const name = (custom.trim() || pick).trim();
    if (!name) { flash('Pick a product or type one first'); return; }
    const prod = products.find((x) => x.name === name);
    try {
      const created = await dbInsert('product_research', { product_name: name, barcode: prod?.barcode ?? null, status: 'queued' });
      setRuns((r) => [created as unknown as Run, ...r]);
      setPick(''); setCustom(''); setOpen((created as unknown as Run).id);
      flash('Research queued — runs the moment the search engine is loaded');
    } catch { flash('Could not queue'); }
  };
  const patch = async (id: string, p: Partial<Run>) => {
    setRuns((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
    try { await dbUpdate('product_research', `id=eq.${id}`, p); } catch { flash('Save failed'); }
  };
  const remove = async (id: string) => {
    setRuns((rs) => rs.filter((r) => r.id !== id));
    if (open === id) setOpen(null);
    try { await dbDelete('product_research', `id=eq.${id}`); flash('Removed'); } catch { flash('Delete failed'); }
  };

  if (status === 'loading') return <div className="section"><p>Loading research…</p></div>;
  if (status === 'error') return <div className="banner building">Could not load research: {msg}</div>;

  return (
    <div>
      <p className="hub-note"><b>Drop a product in, run the search on the whole scenario.</b> Pick from the catalog
        or type any product you&apos;re scouting. Joe defines the exact search parameters next — until the engine is
        loaded, runs <b>queue</b> here and execute automatically once it&apos;s live.</p>

      <div className="sb-bar">
        <div className="sb-add" style={{ flexWrap: 'wrap' }}>
          <select value={pick} onChange={(e) => { setPick(e.target.value); setCustom(''); }}>
            <option value="">pick from catalog…</option>
            {products.map((p) => <option key={p.barcode} value={p.name}>{p.name}</option>)}
          </select>
          <input placeholder="…or type any product" value={custom} onChange={(e) => { setCustom(e.target.value); setPick(''); }} />
          <button className="pd-save" onClick={run}>Run research</button>
        </div>
        <div className="sb-counts"><span className="sb-count"><b>{runs.length}</b> runs</span></div>
      </div>
      {msg && <div className="sb-msg">{msg}</div>}

      <div className="banner building" style={{ marginBottom: 14 }}>
        <b>Search engine: waiting on Joe&apos;s parameters.</b> Each run will cover the full scenario —
        {' '}{SCOPE.join(' · ').toLowerCase()} — tuned to the exact parameters Joe sets. Queued runs execute
        the moment the engine is loaded; nothing is lost in the meantime.
      </div>

      {runs.length === 0 && <div className="section"><p>No research runs yet — drop the first product in above.</p></div>}

      <div className="req-grid">
        {runs.map((r) => {
          const isOpen = open === r.id;
          return (
            <div key={r.id} className={`req-card ${isOpen ? 'open' : ''}`}>
              <div className="req-head" onClick={() => setOpen(isOpen ? null : r.id)}>
                <div className="req-main">
                  <div className="req-name">{r.product_name}</div>
                  <div className="req-meta">
                    <span className={`req-status ${r.status === 'done' ? 's-approved' : r.status === 'running' ? 's-ordered' : 's-requested'}`}>{r.status}</span>
                    {r.barcode && <span className="ph-tag">in catalog</span>}
                    <span className="ph-tag">{new Date(r.requested_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              {isOpen && (
                <div className="req-body">
                  <div className="sb-check-title">What this run covers</div>
                  <ul style={{ margin: '0 0 10px 18px', fontSize: 13, color: 'var(--muted)' }}>
                    {SCOPE.map((s) => <li key={s}>{s}</li>)}
                  </ul>
                  <div className="pd-grid">
                    <label className="pd-field pd-wide"><span>Findings {r.status !== 'done' ? '(fills in when the run executes)' : ''}</span>
                      <textarea rows={4} value={r.findings || ''} onChange={(e) => patch(r.id, { findings: e.target.value })} placeholder="results land here" /></label>
                    <label className="pd-field pd-wide"><span>Notes / what to focus on</span>
                      <textarea rows={2} value={r.notes || ''} onChange={(e) => patch(r.id, { notes: e.target.value })} placeholder="anything specific for this product's run" /></label>
                  </div>
                  <div className="sup-foot">
                    <button className="sb-remove" onClick={() => remove(r.id)}>Remove run</button>
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
