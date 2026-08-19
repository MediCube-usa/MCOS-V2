'use client';

// THE MAP CARD — the shared card every department sends out (restocking,
// distribution, setup, service). One card per machine, canonical here on the
// Maps page. Contents per Joe: machine name + location, address, the Google
// pin ("directions there on google"), the actual WALK-OUT location, directions
// to the machine and THROUGH the machine, what times it must be filled, time
// of access, contacts + numbers, photos (machine / hallway / location),
// refilling videos + notes + documents, follow-up date, access notes.
// The lockbox KEY CODE is NOT on the card — it releases only after on-site
// verification (see Restocking).

import { useEffect, useMemo, useState } from 'react';
import { dbSelect, dbInsert, dbUpdate } from '@/lib/db';

interface Machine {
  machine_id: string; label: string | null; campus: string | null;
  refill_videos_url: string | null; refill_docs_url: string | null;
}
interface Card {
  machine_id: string;
  address: string | null;
  google_maps_url: string | null;
  walkout_location: string | null;
  directions_there: string | null;
  directions_through: string | null;
  fill_times: string | null;
  hours: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contacts_extra: string | null;
  photo_url: string | null;
  hallway_photo_url: string | null;
  location_photo_url: string | null;
  follow_up_date: string | null;
  refill_notes: string | null;
  access_notes: string | null;
}
const EMPTY: Omit<Card, 'machine_id'> = {
  address: '', google_maps_url: '', walkout_location: '', directions_there: '',
  directions_through: '', fill_times: '', hours: '', contact_name: '', contact_phone: '',
  contacts_extra: '', photo_url: '', hallway_photo_url: '', location_photo_url: '',
  follow_up_date: null, refill_notes: '', access_notes: '',
};

function LinkChip({ url, label }: { url: string | null; label: string }) {
  if (!url) return null;
  return <a className="pd-link" href={url} target="_blank" rel="noopener noreferrer">{label} ↗</a>;
}

export function MapCards() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [cards, setCards] = useState<Record<string, Card>>({});
  const [exists, setExists] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 2500); };

  useEffect(() => {
    (async () => {
      try {
        const [m, l] = await Promise.all([
          dbSelect<Machine>('machines', 'select=machine_id,label,campus,refill_videos_url,refill_docs_url&order=label.asc.nullslast'),
          dbSelect<Card>('machine_locations', 'select=*'),
        ]);
        setMachines(m);
        const map: Record<string, Card> = {};
        const ex: Record<string, boolean> = {};
        l.forEach((c) => { map[c.machine_id] = c; ex[c.machine_id] = true; });
        setCards(map); setExists(ex); setStatus('ready');
      } catch (e) { setStatus('error'); setMsg(e instanceof Error ? e.message : 'load failed'); }
    })();
  }, []);

  const cardOf = (mid: string): Card => cards[mid] || { machine_id: mid, ...EMPTY };

  const patchCard = async (mid: string, p: Partial<Card>) => {
    const next = { ...cardOf(mid), ...p, machine_id: mid };
    setCards((c) => ({ ...c, [mid]: next }));
    try {
      if (exists[mid]) await dbUpdate('machine_locations', `machine_id=eq.${mid}`, p);
      else { await dbInsert('machine_locations', next); setExists((e) => ({ ...e, [mid]: true })); }
    } catch { flash('Save failed'); }
  };
  const patchMachine = async (mid: string, p: Partial<Machine>) => {
    setMachines((ms) => ms.map((m) => (m.machine_id === mid ? { ...m, ...p } : m)));
    try { await dbUpdate('machines', `machine_id=eq.${mid}`, p); } catch { flash('Save failed'); }
  };

  const done = useMemo(() => machines.filter((m) => {
    const c = cardOf(m.machine_id);
    return c.address && c.google_maps_url && c.walkout_location;
  }).length, [machines, cards]); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'loading') return <div className="section"><p>Loading map cards…</p></div>;
  if (status === 'error') return <div className="banner building">Could not load map cards: {msg}</div>;

  return (
    <div className="section" id="map-cards">
      <h3>Map cards <span className="ph-tag">{done}/{machines.length} complete</span></h3>
      <p className="hub-note">One card per machine — the card that goes out to restocking, distribution, setup and
        service. Complete = address + Google pin + walk-out location, minimum. The lockbox key code is never on the
        card; it releases only after on-site verification.</p>
      {msg && <div className="sb-msg">{msg}</div>}

      <div className="req-grid">
        {machines.map((m) => {
          const c = cardOf(m.machine_id);
          const isOpen = open === m.machine_id;
          const complete = c.address && c.google_maps_url && c.walkout_location;
          return (
            <div key={m.machine_id} className={`req-card ${isOpen ? 'open' : ''}`}>
              <div className="req-head" onClick={() => setOpen(isOpen ? null : m.machine_id)}>
                <div className="req-main">
                  <div className="req-name">{m.label || m.machine_id}{m.campus ? ` · ${m.campus}` : ''}</div>
                  <div className="req-meta">
                    <span className={`req-status ${complete ? 's-approved' : 's-requested'}`}>{complete ? 'card complete' : 'incomplete'}</span>
                    {c.address && <span className="ph-tag">{c.address}</span>}
                    <LinkChip url={c.google_maps_url} label="pin" />
                    <LinkChip url={m.refill_videos_url} label="videos" />
                    <LinkChip url={m.refill_docs_url} label="docs" />
                  </div>
                </div>
              </div>
              {isOpen && (
                <div className="req-body">
                  <div className="sb-check-title">Location</div>
                  <div className="pd-grid">
                    <label className="pd-field pd-wide"><span>Address</span><input value={c.address || ''} onChange={(e) => patchCard(m.machine_id, { address: e.target.value })} placeholder="street, city, state" /></label>
                    <label className="pd-field pd-wide"><span>Google Maps pin (directions there)</span><input value={c.google_maps_url || ''} onChange={(e) => patchCard(m.machine_id, { google_maps_url: e.target.value })} placeholder="paste the pinned location link" /></label>
                    <label className="pd-field pd-wide"><span>Walk-out location (the actual spot)</span><input value={c.walkout_location || ''} onChange={(e) => patchCard(m.machine_id, { walkout_location: e.target.value })} placeholder="building, floor, hallway, by which door" /></label>
                    <label className="pd-field pd-wide"><span>Directions to the machine</span><textarea rows={2} value={c.directions_there || ''} onChange={(e) => patchCard(m.machine_id, { directions_there: e.target.value })} placeholder="from parking / entrance to the machine" /></label>
                    <label className="pd-field pd-wide"><span>Directions through the machine</span><textarea rows={2} value={c.directions_through || ''} onChange={(e) => patchCard(m.machine_id, { directions_through: e.target.value })} placeholder="how to open, load, close — what the refiller does at the machine" /></label>
                  </div>

                  <div className="sb-check-title">Times</div>
                  <div className="pd-grid">
                    <label className="pd-field"><span>Fill times (when it must be filled)</span><input value={c.fill_times || ''} onChange={(e) => patchCard(m.machine_id, { fill_times: e.target.value })} placeholder="e.g. before 10am, never during class change" /></label>
                    <label className="pd-field"><span>Time of access</span><input value={c.hours || ''} onChange={(e) => patchCard(m.machine_id, { hours: e.target.value })} placeholder="e.g. M–F 7am–10pm" /></label>
                    <label className="pd-field"><span>Follow-up date</span><input type="date" value={c.follow_up_date || ''} onChange={(e) => patchCard(m.machine_id, { follow_up_date: e.target.value })} /></label>
                  </div>

                  <div className="sb-check-title">Contacts</div>
                  <div className="pd-grid">
                    <label className="pd-field"><span>Contact name</span><input value={c.contact_name || ''} onChange={(e) => patchCard(m.machine_id, { contact_name: e.target.value })} /></label>
                    <label className="pd-field"><span>Contact number</span><input value={c.contact_phone || ''} onChange={(e) => patchCard(m.machine_id, { contact_phone: e.target.value })} /></label>
                    <label className="pd-field pd-wide"><span>Other contacts / numbers</span><input value={c.contacts_extra || ''} onChange={(e) => patchCard(m.machine_id, { contacts_extra: e.target.value })} /></label>
                  </div>

                  <div className="sb-check-title">Photos (machine · hallway · location)</div>
                  <div className="pd-grid">
                    <label className="pd-field"><span>Machine photo link</span><input value={c.photo_url || ''} onChange={(e) => patchCard(m.machine_id, { photo_url: e.target.value })} placeholder="https://…" /></label>
                    <label className="pd-field"><span>Hallway photo link</span><input value={c.hallway_photo_url || ''} onChange={(e) => patchCard(m.machine_id, { hallway_photo_url: e.target.value })} placeholder="https://…" /></label>
                    <label className="pd-field"><span>Location photo link</span><input value={c.location_photo_url || ''} onChange={(e) => patchCard(m.machine_id, { location_photo_url: e.target.value })} placeholder="https://…" /></label>
                  </div>

                  <div className="sb-check-title">Refilling resources</div>
                  <div className="pd-grid">
                    <label className="pd-field"><span>Refilling videos link</span><input value={m.refill_videos_url || ''} onChange={(e) => patchMachine(m.machine_id, { refill_videos_url: e.target.value })} placeholder="https://…" /></label>
                    <label className="pd-field"><span>Documents link</span><input value={m.refill_docs_url || ''} onChange={(e) => patchMachine(m.machine_id, { refill_docs_url: e.target.value })} placeholder="https://…" /></label>
                    <label className="pd-field pd-wide"><span>Refill notes</span><textarea rows={2} value={c.refill_notes || ''} onChange={(e) => patchCard(m.machine_id, { refill_notes: e.target.value })} /></label>
                    <label className="pd-field pd-wide"><span>Access notes (where the lockbox is — never the code)</span><input value={c.access_notes || ''} onChange={(e) => patchCard(m.machine_id, { access_notes: e.target.value })} /></label>
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
