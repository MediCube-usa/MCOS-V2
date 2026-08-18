'use client';

import { useEffect, useState } from 'react';
import { dbSelect, dbInsert, dbUpdate, dbDelete } from '@/lib/db';

interface Contact { role: string; name: string; phone: string; email: string; }
interface Facility {
  id: string;
  name: string;
  kind: string | null;
  status: string;
  address: string | null;
  reporting_rules: string | null;
  restrictions: string | null;
  promo_rules: string | null;
  access_notes: string | null;
  notes: string | null;
  contacts: Contact[];
}

const STATUSES = ['prospect', 'approved', 'active', 'paused'] as const;

export function FacilitiesBoard() {
  const [rows, setRows] = useState<Facility[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [nm, setNm] = useState('');
  const [kind, setKind] = useState('University');

  const load = async () => {
    try {
      const data = await dbSelect<Facility>('facilities', 'select=*&order=name.asc');
      setRows(data.map((r) => ({ ...r, contacts: Array.isArray(r.contacts) ? r.contacts : [] })));
      setStatus('ready');
    } catch (e) { setStatus('error'); setMsg(e instanceof Error ? e.message : 'load failed'); }
  };
  useEffect(() => { load(); }, []);
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 2500); };

  const add = async () => {
    if (!nm.trim()) { flash('Name the facility first'); return; }
    try {
      const created = await dbInsert('facilities', { name: nm.trim(), kind, status: 'prospect' });
      setRows((r) => [...r, { ...(created as Facility), contacts: [] }].sort((a, b) => a.name.localeCompare(b.name)));
      setNm(''); setAdding(false); flash('Facility added');
    } catch { flash('Could not add (name may already exist)'); }
  };

  const patch = async (id: string, p: Partial<Facility>) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
    try { await dbUpdate('facilities', `id=eq.${id}`, p); } catch { flash('Save failed'); }
  };

  const remove = async (id: string) => {
    setRows((rs) => rs.filter((r) => r.id !== id));
    if (open === id) setOpen(null);
    try { await dbDelete('facilities', `id=eq.${id}`); flash('Removed'); } catch { flash('Delete failed'); }
  };

  const setContact = (f: Facility, i: number, key: keyof Contact, val: string) => {
    const contacts = f.contacts.map((c, idx) => (idx === i ? { ...c, [key]: val } : c));
    patch(f.id, { contacts });
  };
  const addContact = (f: Facility) => patch(f.id, { contacts: [...f.contacts, { role: '', name: '', phone: '', email: '' }] });
  const removeContact = (f: Facility, i: number) => patch(f.id, { contacts: f.contacts.filter((_, idx) => idx !== i) });

  if (status === 'loading') return <div className="section"><p>Loading facilities…</p></div>;
  if (status === 'error') return <div className="banner building">Could not load facilities: {msg}</div>;

  return (
    <div className="facboard">
      <div className="sb-bar">
        <div className="sb-counts">
          {STATUSES.map((s) => <span key={s} className="sb-count"><b>{rows.filter((r) => r.status === s).length}</b> {s}</span>)}
        </div>
        {!adding
          ? <button className="pd-save" onClick={() => setAdding(true)}>+ Add facility</button>
          : (
            <div className="sb-add">
              <input placeholder="Facility / campus name *" value={nm} onChange={(e) => setNm(e.target.value)} />
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                <option>University</option><option>Corporate</option><option>Hospital</option><option>Other</option>
              </select>
              <button className="pd-save" onClick={add}>Add</button>
              <button className="pd-link" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          )}
      </div>
      {msg && <div className="sb-msg">{msg}</div>}

      <div className="fac-list">
        {rows.map((f) => {
          const isOpen = open === f.id;
          return (
            <div key={f.id} className={`fac-card ${isOpen ? 'open' : ''}`}>
              <div className="fac-top" onClick={() => setOpen(isOpen ? null : f.id)}>
                <div>
                  <div className="fac-name">{f.name}</div>
                  <div className="fac-sub">{f.kind || 'Facility'}{f.contacts.length ? ` · ${f.contacts.length} contact${f.contacts.length > 1 ? 's' : ''}` : ''}</div>
                </div>
                <span className={`fac-status s-${f.status}`}>{f.status}</span>
              </div>
              {isOpen && (
                <div className="fac-body">
                  <div className="pd-status">
                    {STATUSES.map((s) => <button key={s} className={`pd-stat ${f.status === s ? 'on' : ''}`} onClick={() => patch(f.id, { status: s })}>{s}</button>)}
                  </div>
                  <div className="pd-grid">
                    <label className="pd-field pd-wide"><span>Address</span><input value={f.address || ''} onChange={(e) => patch(f.id, { address: e.target.value })} /></label>
                    <label className="pd-field"><span>Reporting rules</span><textarea rows={2} value={f.reporting_rules || ''} onChange={(e) => patch(f.id, { reporting_rules: e.target.value })} placeholder="How/when this campus wants sales or commission reported" /></label>
                    <label className="pd-field"><span>Restrictions</span><textarea rows={2} value={f.restrictions || ''} onChange={(e) => patch(f.id, { restrictions: e.target.value })} placeholder="e.g. no Plan B, no energy drinks" /></label>
                    <label className="pd-field"><span>Promo rules</span><textarea rows={2} value={f.promo_rules || ''} onChange={(e) => patch(f.id, { promo_rules: e.target.value })} placeholder="Discount / voucher / event rules" /></label>
                    <label className="pd-field"><span>Access / delivery notes</span><textarea rows={2} value={f.access_notes || ''} onChange={(e) => patch(f.id, { access_notes: e.target.value })} placeholder="Loading dock, hours, security check-in" /></label>
                  </div>

                  <div className="fac-contacts">
                    <div className="sb-check-title">Contacts by role</div>
                    {f.contacts.map((c, i) => (
                      <div key={i} className="fac-contact-row">
                        <input placeholder="Role" value={c.role} onChange={(e) => setContact(f, i, 'role', e.target.value)} />
                        <input placeholder="Name" value={c.name} onChange={(e) => setContact(f, i, 'name', e.target.value)} />
                        <input placeholder="Phone" value={c.phone} onChange={(e) => setContact(f, i, 'phone', e.target.value)} />
                        <input placeholder="Email" value={c.email} onChange={(e) => setContact(f, i, 'email', e.target.value)} />
                        <button className="mc-x" onClick={() => removeContact(f, i)}>✕</button>
                      </div>
                    ))}
                    <button className="pd-link" onClick={() => addContact(f)}>+ Add contact</button>
                  </div>

                  <label className="pd-field"><span>Notes</span><textarea rows={2} value={f.notes || ''} onChange={(e) => patch(f.id, { notes: e.target.value })} /></label>
                  <button className="sb-remove" onClick={() => remove(f.id)}>Remove facility</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
