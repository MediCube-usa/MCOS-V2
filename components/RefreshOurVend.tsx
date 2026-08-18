'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { OURVEND_REFRESH_URL, SUPABASE_ANON_JWT } from '@/lib/config';

// Triggers the permanent, cloud-side OurVend pull (the Supabase edge function).
// One machine, or the whole fleet. Reads live from OurVend and writes live_slots.
// No browser clicking through OurVend — this is the same reader pg_cron runs on
// its own every ~20 min; the button is just an on-demand "refresh now".
export function RefreshOurVend({ machineId, label }: { machineId?: string; label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const run = async () => {
    setBusy(true); setMsg('Pulling from OurVend…');
    try {
      const q = machineId ? `?machine=${machineId}` : '';
      const r = await fetch(`${OURVEND_REFRESH_URL}${q}`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_JWT,
          Authorization: `Bearer ${SUPABASE_ANON_JWT}`,
        },
      });
      const d = await r.json();
      if (!d.ok && d.error) {
        setMsg(d.error);
      } else if (d.failed > 0) {
        const first = (d.results || []).find((x: { error?: string }) => x.error);
        setMsg(`${d.machines - d.failed}/${d.machines} ok, ${d.totalSlots} slots. ${d.failed} failed: ${first?.error || ''}`);
      } else {
        setMsg(`✓ Pulled ${d.totalSlots} slots from ${d.machines} machine${d.machines > 1 ? 's' : ''}. Refreshing…`);
        // re-render the server component with the freshly-synced live_slots
        router.refresh();
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'refresh failed');
    }
    setBusy(false);
  };

  return (
    <div className="ov-refresh">
      <button className="pd-save" onClick={run} disabled={busy}>
        {busy ? 'Refreshing…' : `↻ Refresh ${label || 'fleet'} from OurVend`}
      </button>
      {msg && <span className="ov-refresh-msg">{msg}</span>}
    </div>
  );
}
