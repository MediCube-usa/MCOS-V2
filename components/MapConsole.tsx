'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { GOOGLE_MAPS_KEY, SUPABASE_URL, SUPABASE_KEY } from '@/lib/config';

export interface MapMachine {
  machineId: string;
  label: string;
  group: string;
}
interface Pin {
  machine_id: string;
  lat: number;
  lng: number;
  note: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global { interface Window { google?: any; __mcosMapsCb?: () => void; } }

// The whole US, so an empty map still reads as "the fleet's country" not a random ocean.
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

async function fetchPins(): Promise<Pin[]> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/machine_locations?select=machine_id,lat,lng,note`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  if (!r.ok) throw new Error(`load pins ${r.status}`);
  return r.json();
}

async function savePin(pin: Pin): Promise<void> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/machine_locations`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify({ ...pin, updated_at: new Date().toISOString() })
  });
  if (!r.ok) throw new Error(`save pin ${r.status} ${await r.text()}`);
}

async function deletePin(machineId: string): Promise<void> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/machine_locations?machine_id=eq.${machineId}`, {
    method: 'DELETE',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: 'return=minimal' }
  });
  if (!r.ok) throw new Error(`delete pin ${r.status}`);
}

export function MapConsole({ machines }: { machines: MapMachine[] }) {
  const mapEl = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Record<string, any>>({});
  const selectedRef = useRef<string | null>(null);

  const [pins, setPins] = useState<Record<string, Pin>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [msg, setMsg] = useState('');

  useEffect(() => { selectedRef.current = selected; }, [selected]);

  const labelFor = useCallback(
    (id: string) => machines.find((m) => m.machineId === id)?.label || id,
    [machines]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upsertMarker = useCallback((pin: Pin) => {
    const g = window.google;
    if (!g || !mapRef.current) return;
    let marker = markersRef.current[pin.machine_id];
    if (!marker) {
      marker = new g.maps.Marker({
        map: mapRef.current,
        position: { lat: pin.lat, lng: pin.lng },
        draggable: true,
        title: labelFor(pin.machine_id)
      });
      marker.addListener('dragend', async (e: { latLng: { lat: () => number; lng: () => number } }) => {
        const moved: Pin = { ...pin, lat: e.latLng.lat(), lng: e.latLng.lng() };
        setPins((p) => ({ ...p, [pin.machine_id]: moved }));
        try { await savePin(moved); setMsg(`Moved ${labelFor(pin.machine_id)}`); }
        catch { setMsg('Could not save move — check connection'); }
      });
      markersRef.current[pin.machine_id] = marker;
    } else {
      marker.setPosition({ lat: pin.lat, lng: pin.lng });
    }
  }, [labelFor]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadGoogleMaps();
        if (cancelled || !mapEl.current) return;
        const g = window.google;
        mapRef.current = new g.maps.Map(mapEl.current, {
          center: DEFAULT_CENTER,
          zoom: 4,
          mapTypeControl: true,
          streetViewControl: false,
          styles: DARK_STYLE
        });

        // click the map to place the currently-selected machine
        mapRef.current.addListener('click', async (e: { latLng: { lat: () => number; lng: () => number } }) => {
          const id = selectedRef.current;
          if (!id) { setMsg('Pick a machine from the list first, then click its spot.'); return; }
          const pin: Pin = { machine_id: id, lat: e.latLng.lat(), lng: e.latLng.lng(), note: null };
          setPins((p) => ({ ...p, [id]: pin }));
          upsertMarker(pin);
          try { await savePin(pin); setMsg(`Pinned ${labelFor(id)}`); }
          catch { setMsg('Could not save pin — check connection'); }
        });

        const existing = await fetchPins();
        if (cancelled) return;
        const map: Record<string, Pin> = {};
        for (const p of existing) { map[p.machine_id] = p; upsertMarker(p); }
        setPins(map);

        // frame the pins if we have any
        if (existing.length > 0) {
          const bounds = new g.maps.LatLngBounds();
          existing.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
          mapRef.current.fitBounds(bounds);
          if (existing.length === 1) mapRef.current.setZoom(16);
        }
        setStatus('ready');
      } catch (err) {
        setStatus('error');
        setMsg(err instanceof Error ? err.message : 'map failed to load');
      }
    })();
    return () => { cancelled = true; };
  }, [labelFor, upsertMarker]);

  const focusMachine = (id: string) => {
    setSelected(id);
    const pin = pins[id];
    if (pin && mapRef.current) {
      mapRef.current.panTo({ lat: pin.lat, lng: pin.lng });
      mapRef.current.setZoom(17);
      markersRef.current[id]?.setAnimation(window.google.maps.Animation.BOUNCE);
      setTimeout(() => markersRef.current[id]?.setAnimation(null), 1400);
    }
  };

  const clearPin = async (id: string) => {
    markersRef.current[id]?.setMap(null);
    delete markersRef.current[id];
    setPins((p) => { const n = { ...p }; delete n[id]; return n; });
    try { await deletePin(id); setMsg(`Cleared ${labelFor(id)}`); }
    catch { setMsg('Could not clear — check connection'); }
  };

  // group machines for the side list
  const groups = new Map<string, MapMachine[]>();
  for (const m of machines) {
    const k = m.group && m.group.trim() ? m.group : 'Unassigned';
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(m);
  }
  const orderedGroups = [...groups.entries()].sort((a, b) =>
    a[0] === 'Unassigned' ? 1 : b[0] === 'Unassigned' ? -1 : a[0].localeCompare(b[0])
  );
  const pinnedCount = Object.keys(pins).length;

  return (
    <div className="mapconsole">
      <div className="mapconsole-side">
        <div className="mc-head">
          <b>{pinnedCount}</b> / {machines.length} pinned
          {selected && <div className="mc-selected">Placing: <span>{labelFor(selected)}</span> — click its spot on the map</div>}
          {!selected && <div className="mc-hint">Pick a machine, then click where it sits.</div>}
        </div>
        <div className="mc-list">
          {orderedGroups.map(([campus, list]) => (
            <div key={campus} className="mc-group">
              <div className="mc-group-name">{campus}</div>
              {list.map((m) => {
                const isPinned = !!pins[m.machineId];
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
        {msg && status === 'ready' && <div className="mc-toast">{msg}</div>}
      </div>
    </div>
  );
}

// muted dark map to match the dashboard
const DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0b1a2e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0b1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8fa6c4' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#06101f' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a2c45' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#24507a' }] }
];
