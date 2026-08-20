'use client';

// The small alert number on a Command Center box — sits under the block's
// logo. Counts this department's appointment alerts (overdue / today / inside
// the reminder window). Renders nothing when there is nothing to flag.

import { useEffect, useState } from 'react';
import { alertLevel, fetchCalendarShared } from '@/lib/appointments';

export function BoxAlertCount({ dept }: { dept: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    fetchCalendarShared()
      .then((all) => setN(all.filter((i) => i.department === dept && alertLevel(i) !== 'later').length))
      .catch(() => {});
  }, [dept]);
  if (n === 0) return null;
  return <span className="box-alertnum">⏰ {n} appt{n > 1 ? 's' : ''}</span>;
}
