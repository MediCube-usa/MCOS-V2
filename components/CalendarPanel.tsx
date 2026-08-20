'use client';

// The calendar in the Command Center header — compact, dark, the size of the
// Command Agent box. Shows the next appointments rolling up from every block
// (blocks with reminders switched off don't report here). No personal Google
// account is embedded; ＋GCal pushes an item to whichever Google Calendar
// account the browser is signed into — the MediCube ops account once Joe
// creates it (see docs/blocks/calendar.md).

import { useEffect, useState } from 'react';
import { CalItem, alertLevel, fetchCalendarShared, fetchAlertsOffShared, fmtWhen, gcalUrl } from '@/lib/appointments';
import { getDepartment } from '@/lib/departments';

export function CalendarPanel() {
  const [items, setItems] = useState<CalItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    Promise.all([fetchCalendarShared(), fetchAlertsOffShared()])
      .then(([all, off]) => {
        setItems(all.filter((i) => !off.has(i.department)).slice(0, 3));
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div className="calpanel">
      <div className="cal-head">
        <span className="cal-title">📅 Calendar</span>
        <a className="cal-open" href="https://calendar.google.com/calendar/r" target="_blank" rel="noreferrer">Google Calendar ↗</a>
      </div>
      <div className="cal-list">
        {status === 'loading' && <div className="cal-empty">loading…</div>}
        {status === 'error' && <div className="cal-empty">could not load — reload</div>}
        {status === 'ready' && items.length === 0 && (
          <div className="cal-empty">no appointments yet — set them on any block&apos;s page</div>
        )}
        {items.map((i) => {
          const d = getDepartment(i.department);
          return (
            <div key={i.key} className={`cal-row ${alertLevel(i)}`}>
              <span className="cal-when">{fmtWhen(i)}</span>
              <span className="cal-what" title={i.title}>
                <i className="cal-dot" style={{ background: d?.color || '#6fe4ff' }} />
                {i.title}
              </span>
              <a className="cal-add" href={gcalUrl(i)} target="_blank" rel="noreferrer" title="add to Google Calendar">＋GCal</a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
