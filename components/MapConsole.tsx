'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { GOOGLE_MAPS_KEY, SUPABASE_URL, SUPABASE_KEY } from '@/lib/config';

export interface MapMachine {
  machineId: string;
  label: string;
  group: string;
}

export interface LocationRecord {
  machine_id: string;
  lat: number;
  lng: number;
  status?: string | null;
  address?: string | null;
  hours?: string | null;
  access_code?: string | null;
  access_notes?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  photo_url?: string | null;
}

const STATUSES = ['approved', 'mapped', 'placed', 'live'] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global { interface Window { google?: any; __mcosMapsCb?: () => void; } }

const DEFAULT_CENTER = { lat: 39.5, lng: -98.35 };

function loadGoogleMaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return;
    if (window.google?.maps) return resolve();
    const existing = document.getElementById('gmaps-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('maps script failed')));
      return;
    }
    window.__mcosMapsCb = () => resolve();
    const s = document.createElement('script');
    s.id = 'gmaps-script';
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&callback=__mcosMapsCb`;
    s.async = true;
    s.onerror = () => reject(new Error('maps script failed'));
    document.head.appendChild(s);
  });
}

const sbHeaders = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

async function fetchPins(): Promise<LocationRecord[]> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/machine_locations?select=*`, { headers: sbHeaders });
  if (!r.ok) throw new Error(`load pins ${r.status}`);
  return r.json();
}

async function savePin(rec: LocationRecord): Promise<void> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/machine_locations`, {
    method: 'POST',
    headers: { ...sbHeaders, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ ...rec, updated_at: new Date().toISOString() })
  });
  if (!r.ok) throw new Error(`save ${r.status} ${await r.text()}`);
}

async function deletePin(machineId: string): Promise<void> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/machine_locations?machine_id=eq.${machineId}`, {
    method: 'DELETE', headers: { ...sbHeaders, Prefer: 'return=minimal' }
  });
  if (!r.ok) throw new Error(`delete ${r.status}`);
}

async function uploadPhoto(machineId: string, file: File): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${machineId}-${Date.now()}.${ext}`;
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/placement-photos/${path}`, {
    method: 'POST',
    headers: { ...sbHeaders, 'Content-Type': file.type || 'image/jpeg', 'x-upsert': 'true' },
    body: file
  });
  if (!r.ok) throw new Error(`photo ${r.status} ${await r.text()}`);
  return `${SUPABASE_URL}/storage/v1/object/public/placement-photos/${path}`;
}

export function MapConsole({ machines }: { machines: MapMachine[] }) {
  const mapEl = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Record<string, any>>({});
  const selectedRef = useRef<string | null>(null);

  const [recs, setRecs] = useState<Record<string, LocationRecord>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [msg, setMsg] = useState('');

  useEffect(() => { selectedRef.current = selected; }, [selected]);

  const labelFor = useCallback((id: string) => machines.find((m) => m.machineId === id)?.label || id, [machines]);
  const flash = (m: string) => { setMsg(m); };

  const upsertMarker = useCallback((rec: LocationRecord) => {
    const g = window.google;
    if (!g || !mapRef.current) return;
    let marker = markersRef.current[rec.machine_id];
    if (!marker) {
      marker = new g.maps.Marker({ map: mapRef.current, position: { lat: rec.lat, lng: rec.lng }, draggable: true, title: labelFor(rec.machine_id) });
      marker.addListener('click', () => { setSelected(rec.machine_id); });
      marker.addListener('dragend', async (e: { latLng: { lat: () => number; lng: () => number } }) => {
        const moved = { ...(markersRef.current[rec.machine_id]?.__rec || rec), lat: e.latLng.lat(), lng: e.latLng.lng() } as LocationRecord;
        setRecs((p) => ({ ...p, [rec.machine_id]: moved }));
        marker.__rec = moved;
        try { await savePin(moved); flash(`Moved ${labelFor(rec.machine_id)}`); } catch { flash('Could not save move'); }
      });
      markersRef.current[rec.machine_id] = marker;
    } else {
      marker.setPosition({ lat: rec.lat, lng: rec.lng });
    }
    marker.__rec = rec;
  }, [labelFor]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadGoogleMaps();
        if (cancelled || !mapEl.current) return;
        const g = window.google;
        mapRef.current = new g.maps.Map(mapEl.current, {
          center: DEFAULT_CENTER, zoom: 4, mapTypeControl: true, streetViewControl: false, fullscreenControl: true, styles: DARK_STYLE
        });
        mapRef.current.addListener('click', async (e: { latLng: { lat: () => number; lng: () => number } }) => {
          const id = selectedRef.current;
          if (!id) { flash('Pick a machine from the list first, then click its spot.'); return; }
          const prev = markersRef.current[id]?.__rec as LocationRecord | undefined;
          const rec: LocationRecord = { ...(prev || { machine_id: id, status: 'mapped' }), machine_id: id, lat: e.latLng.lat(), lng: e.latLng.lng() };
          setRecs((p) => ({ ...p, [id]: rec }));
          upsertMarker(rec);
          try { await savePin(rec); flash(`Pinned ${labelFor(id)}`); } catch { flash('Could not save pin'); }
        });

        const existing = await fetchPins();
        if (cancelled) return;
        const map: Record<string, LocationRecord> = {};
        for (const p of existing) { map[p.machine_id] = p; upsertMarker(p); }
        setRecs(map);
        if (existing.length > 0) {
          const b = new g.maps.LatLngBounds();
          existing.forEach((p) => b.extend({ lat: p.lat, lng: p.lng }));
          mapRef.current.fitBounds(b);
          if (existing.length === 1) mapRef.current.setZoom(16);
        }
        setStatus('ready');
      } catch (err) {
        setStatus('error');
        flash(err instanceof Error ? err.message : 'map failed to load');
      }
    })();
    return () => { cancelled = true; };
  }, [labelFor, upsertMarker]);

  const focusMachine = (id: string) => {
    setSelected(id);
    const rec = recs[id];
    if (rec && mapRef.current) {
      mapRef.current.panTo({ lat: rec.lat, lng: rec.lng });
      mapRef.current.setZoom(17);
      markersRef.current[id]?.setAnimation(window.google.maps.Animation.BOUNCE);
      setTimeout(() => markersRef.current[id]?.setAnimation(null), 1400);
    }
  };

  const clearPin = async (id: string) => {
    markersRef.current[id]?.setMap(null);
    delete markersRef.current[id];
    setRecs((p) => { const n = { ...p }; delete n[id]; return n; });
    if (selected === id) setSelected(null);
    try { await deletePin(id); flash(`Cleared ${labelFor(id)}`); } catch { flash('Could not clear'); }
  };

  // group machines for the side list
  const groups = new Map<string, MapMachine[]>();
  for (const m of machines) {
    const k = m.group && m.group.trim() ? m.group : 'Unassigned';
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(m);
  }
  const orderedGroups = [...groups.entries()].sort((a, b) => a[0] === 'Unassigned' ? 1 : b[0] === 'Unassigned' ? -1 : a[0].localeCompare(b[0]));
  const pinnedCount = Object.keys(recs).length;
  const selectedRec = selected ? recs[selected] : null;

  return (
    <div className="mapwrap">
      <div className="mapconsole">
        <div className="mapconsole-side">
          <div className="mc-head">
            <b>{pinnedCount}</b> / {machines.length} pinned
            {selected && !selectedRec && <div className="mc-selected">Placing: <span>{labelFor(selected)}</span> — click its spot on the map</div>}
            {!selected && <div className="mc-hint">Pick a machine, then click where it sits.</div>}
          </div>
          <div className="mc-list">
            {orderedGroups.map(([campus, list]) => (
              <div key={campus} className="mc-group">
                <div className="mc-group-name">{campus}</div>
                {list.map((m) => {
                  const isPinned = !!recs[m.machineId];
                  const isSel = selected === m.machineId;
                  return (
                    <div key={m.machineId} className={`mc-row ${isSel ? 'sel' : ''}`} onClick={() => focusMachine(m.machineId)}>
                      <span className={`mc-dot ${isPinned ? 'on' : ''}`} />
                      <span className="mc-name">{m.label}</span>
                      {isPinned
                        ? <button className="mc-x" onClick={(e) => { e.stopPropagation(); clearPin(m.machineId); }} title="Clear pin">✕</button>
                        : <span className="mc-need">set</span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="mapconsole-map">
          <div ref={mapEl} className="mc-canvas" />
          {status !== 'ready' && (
            <div className="mc-overlay">
              {status === 'loading' ? 'Loading map…' : 'Map could not load.'}
              {status === 'error' && <div className="mc-err">{msg}</div>}
            </div>
          )}
          {msg && status === 'ready' && <div className="mc-toast" key={msg}>{msg}</div>}
        </div>
      </div>

      {selectedRec && (
        <PinDetail
          key={selectedRec.machine_id}
          label={labelFor(selectedRec.machine_id)}
          rec={selectedRec}
          onSaved={(r) => { setRecs((p) => ({ ...p, [r.machine_id]: r })); upsertMarker(r); flash(`Saved ${labelFor(r.machine_id)}`); }}
          onFlash={flash}
        />
      )}
    </div>
  );
}

function PinDetail({ label, rec, onSaved, onFlash }: {
  label: string; rec: LocationRecord;
  onSaved: (r: LocationRecord) => void; onFlash: (m: string) => void;
}) {
  const [form, setForm] = useState<LocationRecord>(rec);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  useEffect(() => { setForm(rec); }, [rec]);

  const set = (k: keyof LocationRecord, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try { await savePin(form); onSaved(form); } catch { onFlash('Save failed — check connection'); }
    setSaving(false);
  };

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadPhoto(form.machine_id, file);
      const next = { ...form, photo_url: url };
      setForm(next);
      await savePin(next);
      onSaved(next);
    } catch { onFlash('Photo upload failed'); }
    setUploading(false);
  };

  const dirLink = `https://www.google.com/maps/dir/?api=1&destination=${form.lat},${form.lng}`;
  const pinLink = `https://www.google.com/maps/search/?api=1&query=${form.lat},${form.lng}`;
  const copy = (text: string, what: string) => { navigator.clipboard?.writeText(text).then(() => onFlash(`${what} copied`)); };

  return (
    <div className="pindetail">
      <div className="pd-top">
        <div>
          <div className="pd-title">{label}</div>
          <div className="pd-coords mono">{form.lat.toFixed(5)}, {form.lng.toFixed(5)}</div>
        </div>
        <div className="pd-status">
          {STATUSES.map((s) => (
            <button key={s} className={`pd-stat ${form.status === s ? 'on' : ''}`} onClick={() => set('status', s)}>{s}</button>
          ))}
        </div>
      </div>

      <div className="pd-grid">
        <label className="pd-field"><span>Address</span>
          <input value={form.address || ''} onChange={(e) => set('address', e.target.value)} placeholder="Building, street, city" />
        </label>
        <label className="pd-field"><span>Open hours / days</span>
          <input value={form.hours || ''} onChange={(e) => set('hours', e.target.value)} placeholder="Mon–Fri 7a–10p, weekends closed" />
        </label>
        <label className="pd-field"><span>Access code</span>
          <input value={form.access_code || ''} onChange={(e) => set('access_code', e.target.value)} placeholder="Door / machine code" />
        </label>
        <label className="pd-field"><span>Site contact</span>
          <input value={form.contact_name || ''} onChange={(e) => set('contact_name', e.target.value)} placeholder="Name at location" />
        </label>
        <label className="pd-field"><span>Contact phone</span>
          <input value={form.contact_phone || ''} onChange={(e) => set('contact_phone', e.target.value)} placeholder="Phone" />
        </label>
        <label className="pd-field pd-wide"><span>Access notes</span>
          <textarea value={form.access_notes || ''} onChange={(e) => set('access_notes', e.target.value)} placeholder="Floor, room, where exactly it sits, who to ask, loading dock, etc." rows={2} />
        </label>
      </div>

      <div className="pd-photo">
        {form.photo_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={form.photo_url} alt="placement" />
          : <div className="pd-photo-empty">No placement photo yet</div>}
        <label className="pd-btn">
          {uploading ? 'Uploading…' : (form.photo_url ? 'Replace photo' : '📷 Add placement photo')}
          <input type="file" accept="image/*" hidden onChange={onPhoto} disabled={uploading} />
        </label>
      </div>

      <div className="pd-actions">
        <button className="pd-save" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save details'}</button>
        <button className="pd-link" onClick={() => copy(dirLink, 'Directions link')}>🚚 Copy field card (directions)</button>
        <button className="pd-link" onClick={() => copy(pinLink, 'Pin link')}>📍 Copy pin link</button>
      </div>

      <div className="pd-jump">
        <span>Go to:</span>
        <a href={`/machine-operations/${form.machine_id}`}>Machine slots & prices →</a>
        <a href="/restocking">Restock this machine →</a>
        <a href="/setup-distribution">Setup record →</a>
      </div>
    </div>
  );
}

const DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0b1a2e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0b1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8fa6c4' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#06101f' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a2c45' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#24507a' }] }
];
