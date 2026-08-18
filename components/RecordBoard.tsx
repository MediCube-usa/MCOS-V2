'use client';

import { useEffect, useState } from 'react';
import { dbSelect, dbInsert, dbUpdate, dbDelete } from '@/lib/db';

export interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'select';
  options?: string[];
  placeholder?: string;
}
export interface BoardConfig {
  table: string;
  color: string;
  statuses: string[];
  statusColors?: Record<string, string>;
  fields: FieldDef[];
  subtitleKeys: string[];  // shown under the title on the card
  addPlaceholder: string;
  emptyText: string;
}

type Row = { id: string; title: string; status: string; [k: string]: string | null | undefined };

export function RecordBoard({ config }: { config: BoardConfig }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [adding, setAdding] = useState(false);
  const [nm, setNm] = useState('');

  const load = async () => {
    try { setRows(await dbSelect<Row>(config.table, 'select=*&order=created_at.desc')); setStatus('ready'); }
    catch (e) { setStatus('error'); setMsg(e instanceof Error ? e.message : 'load failed'); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [config.table]);
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 2500); };

  const add = async () => {
    if (!nm.trim()) { flash('Add a title first'); return; }
    try {
      const created = await dbInsert(config.table, { title: nm.trim(), status: config.statuses[0] });
      setRows((r) => [created as Row, ...r]);
      setNm(''); setAdding(false); setOpen((created as Row).id); flash('Added');
    } catch { flash('Could not add'); }
  };
  const patch = async (id: string, p: Partial<Row>) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
    try { await dbUpdate(config.table, `id=eq.${id}`, p); } catch { flash('Save failed'); }
  };
  const remove = async (id: string) => {
    setRows((rs) => rs.filter((r) => r.id !== id));
    if (open === id) setOpen(null);
    try { await dbDelete(config.table, `id=eq.${id}`); flash('Removed'); } catch { flash('Delete failed'); }
  };

  const shown = filter === 'all' ? rows : rows.filter((r) => r.status === filter);

  if (status === 'loading') return <div className="section"><p>Loading…</p></div>;
  if (status === 'error') return <div className="banner building">Could not load: {msg}</div>;

  return (
    <div className="recboard" style={{ ['--rc' as string]: config.color }}>
      <div className="sb-bar">
        <div className="con-filters">
          <button className={`con-chip ${filter === 'all' ? 'on' : ''}`} style={filter === 'all' ? { background: config.color, borderColor: config.color } : undefined} onClick={() => setFilter('all')}>all {rows.length}</button>
          {config.statuses.map((s) => {
            const n = rows.filter((r) => r.status === s).length;
            return <button key={s} className={`con-chip ${filter === s ? 'on' : ''}`} style={filter === s ? { background: config.color, borderColor: config.color } : undefined} onClick={() => setFilter(s)}>{s} {n}</button>;
          })}
        </div>
        {!adding
          ? <button className="pd-save" style={{ background: config.color }} onClick={() => setAdding(true)}>+ Add</button>
          : (
            <div className="sb-add">
              <input placeholder={config.addPlaceholder} value={nm} onChange={(e) => setNm(e.target.value)} />
              <button className="pd-save" style={{ background: config.color }} onClick={add}>Add</button>
              <button className="pd-link" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          )}
      </div>
      {msg && <div className="sb-msg" style={{ color: config.color }}>{msg}</div>}

      {shown.length === 0 && <div className="section"><p>{config.emptyText}</p></div>}

      <div className="fac-list">
        {shown.map((r) => {
          const isOpen = open === r.id;
          const sub = config.subtitleKeys.map((k) => r[k]).filter(Boolean).join(' · ');
          return (
            <div key={r.id} className={`rec-card ${isOpen ? 'open' : ''}`}>
              <div className="fac-top" onClick={() => setOpen(isOpen ? null : r.id)}>
                <div>
                  <div className="fac-name">{r.title}</div>
                  <div className="fac-sub">{sub || 'no details yet'}</div>
                </div>
                <span className="rec-status">{r.status}</span>
              </div>
              {isOpen && (
                <div className="fac-body">
                  <div className="pd-status">
                    {config.statuses.map((s) => (
                      <button key={s} className={`pd-stat ${r.status === s ? 'on' : ''}`} style={r.status === s ? { background: config.color, borderColor: config.color } : undefined} onClick={() => patch(r.id, { status: s })}>{s}</button>
                    ))}
                  </div>
                  <label className="pd-field"><span>Title</span><input value={r.title || ''} onChange={(e) => patch(r.id, { title: e.target.value })} /></label>
                  <div className="pd-grid">
                    {config.fields.map((f) => (
                      <label key={f.key} className={`pd-field ${f.type === 'textarea' ? 'pd-wide' : ''}`}>
                        <span>{f.label}</span>
                        {f.type === 'textarea'
                          ? <textarea rows={2} value={r[f.key] || ''} placeholder={f.placeholder} onChange={(e) => patch(r.id, { [f.key]: e.target.value })} />
                          : f.type === 'select'
                            ? <select value={r[f.key] || ''} onChange={(e) => patch(r.id, { [f.key]: e.target.value })}><option value="">—</option>{f.options?.map((o) => <option key={o}>{o}</option>)}</select>
                            : <input type={f.type === 'date' ? 'date' : 'text'} value={r[f.key] || ''} placeholder={f.placeholder} onChange={(e) => patch(r.id, { [f.key]: e.target.value })} />}
                      </label>
                    ))}
                  </div>
                  <button className="sb-remove" onClick={() => remove(r.id)}>Remove</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
