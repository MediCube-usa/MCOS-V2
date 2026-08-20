'use client';

// Google Calendar, top-right of the Command Center. Shows Joe's live Google
// agenda (renders when signed into Google in this browser) plus the next
// appointments rolling up from every block, each with a one-click
// add-to-Google-Calendar link. Appointments are set on each block's page.

import { useEffect, useState } from 'react';
import { CalItem, alertLevel, fetchCalendar, fmtWhen, gcalUrl } from '@/lib/appointments';
import { getDepartment } from '@/lib/departments';

const EMBED =
  'https://calendar.google.com/calendar/embed?src=' + encodeURIComponent('me.joejordan@gmail.com') +
  '&mode=AGENDA&showTitle=0&showNav=0&showPrint=0&showTabs=0&showCalendars=0&showTz=0&bgcolor=%23071225';

export function CalendarPanel() {
  const [items, setItems] = useState<CalItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    fetchCalendar()
      .then((all) => { setItems(all.slice(0, 5)); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div className="calpanel">
      <div className="cal-head">
        <span className="cal-title">📅 Google Calendar</span>
        <a className="cal-open" href="https://calendar.google.com/calendar/r" target="_blank" rel="noreferrer">open ↗</a>
      </div>
      <iframe className="cal-embed" src={EMBED} title="Google Calendar" loading="lazy" />
      <div className="cal-list">
        {status === 'loading' && <div className="cal-empty">loading appointments…</div>}
        {status === 'error' && <div className="cal-empty">could not load appointments — reload</div>}
        {status === 'ready' && items.length === 0 && (
          <div className="cal-empty">no appointments yet — set them on any block&apos;s page and they roll up here</div>
        )}
        {items.map((i) => {
          const d = getDepartment(i.department);
          const lvl = alertLevel(i);
          return (
            <div key={i.key} className={`cal-row ${lvl}`}>
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
