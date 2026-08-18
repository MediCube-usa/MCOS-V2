'use client';

import { useState } from 'react';

// Triggers the permanent server-side OurVend pull. One machine, or the whole
// fleet. Shows the result inline. No browser clicking through OurVend.
export function RefreshOurVend({ machineId, label }: { machineId?: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const run = async () => {
    setBusy(true); setMsg('Pulling from OurVend…');
    try {
      const q = machineId ? `?machine=${machineId}` : '';
      const r = await fetch(`/api/ourvend/refresh${q}`, { method: 'POST' });
      const d = await r.json();
      if (!d.ok && d.error) { setMsg(d.error); }
      else if (d.failed > 0) {
        const first = d.results.find((x: { error?: string }) => x.error);
        setMsg(`${d.machines - d.failed}/${d.machines} ok, ${d.totalSlots} slots. ${d.failed} failed: ${first?.error || ''}`);
      } else {
        setMsg(`✓ Pulled ${d.totalSlots} slots from ${d.machines} machine${d.machines > 1 ? 's' : ''}. Reload to see it.`);
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
