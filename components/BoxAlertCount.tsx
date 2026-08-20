'use client';

// The calendar alert on EVERY Command Center box — always present, same as
// the block's other alert line. Dim clock = connected, nothing due right now.
// Lit amber + count = this block has appointments due (overdue / today /
// inside the reminder window). Sits under the block's logo.

import { useEffect, useState } from 'react';
import { alertLevel, fetchCalendarShared, fetchAlertsOffShared } from '@/lib/appointments';

export function BoxAlertCount({ dept }: { dept: string }) {
  const [state, setState] = useState<{ n: number; off: boolean } | null>(null);
  useEffect(() => {
    Promise.all([fetchCalendarShared(), fetchAlertsOffShared()])
      .then(([all, off]) => setState({
        n: all.filter((i) => i.department === dept && alertLevel(i) !== 'later').length,
        off: off.has(dept),
      }))
      .catch(() => setState({ n: 0, off: false }));
  }, [dept]);

  if (!state || state.off || state.n === 0) {
    return (
      <span
        className="box-alertnum zero"
        title={state?.off ? 'reminders switched off for this block (its page → appointment book)' : 'calendar connected — nothing due; set appointments on this block’s page'}
      >
        <em>⏰</em>0
      </span>
    );
  }
  return (
    <span className="box-alertnum" title={`${state.n} appointment alert${state.n > 1 ? 's' : ''} on this block — open it`}>
      <em>⏰</em>{state.n}
    </span>
  );
}
