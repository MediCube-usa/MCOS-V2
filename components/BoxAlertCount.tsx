'use client';

// The calendar alert on a Command Center box — a round badge the size of the
// block's logo, sitting right under it. Counts this department's appointment
// alerts (overdue / today / inside the reminder window). Renders nothing when
// there's nothing to flag or the block's reminders are switched off.

import { useEffect, useState } from 'react';
import { alertLevel, fetchCalendarShared, fetchAlertsOffShared } from '@/lib/appointments';

export function BoxAlertCount({ dept }: { dept: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    Promise.all([fetchCalendarShared(), fetchAlertsOffShared()])
      .then(([all, off]) => {
        if (off.has(dept)) { setN(0); return; }
        setN(all.filter((i) => i.department === dept && alertLevel(i) !== 'later').length);
      })
      .catch(() => {});
  }, [dept]);
  if (n === 0) return null;
  return (
    <span className="box-alertnum" title={`${n} appointment alert${n > 1 ? 's' : ''} on this block`}>
      <em>⏰</em>{n}
    </span>
  );
}
