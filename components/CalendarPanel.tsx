'use client';

// THE CALENDAR BOX — top right of the Command Center header. Agent-box width,
// header height, dark, and a real working calendar: a month grid fed live by
// every block (manual appointments + the dates typed into block forms).
// Click a day → its items. Click the title → /calendar, everything at once.
//
// When Joe supplies the MediCube ops Google account's Calendar ID
// (lib/config.ts GCAL_EMBED_ID), the actual Google Calendar grid renders here
// instead, dark-filtered. His personal account is never used.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CalItem, alertLevel, dayKey, fetchAlertsOffShared, fetchCalendarShared,
  fmtWhen, gcalUrl, groupByDay, monthMatrix,
} from '@/lib/appointments';
import { getDepartment } from '@/lib/departments';
import { GCAL_EMBED_ID } from '@/lib/config';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function CalendarPanel() {
  const now = new Date();
  const [items, setItems] = useState<CalItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [ym, setYm] = useState<[number, number]>([now.getFullYear(), now.getMonth()]);
  const [sel, setSel] = useState<string>(dayKey(now));

  useEffect(() => {
    Promise.all([fetchCalendarShared(), fetchAlertsOffShared()])
      .then(([all, off]) => { setItems(all.filter((i) => !off.has(i.department))); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, []);

  const byDay = useMemo(() => groupByDay(items), [items]);
  const cells = useMemo(() => monthMatrix(ym[0], ym[1]), [ym]);
  const todayKey = dayKey(now);
  const selItems = (byDay.get(sel) || []).slice(0, 3);

  const move = (d: 1 | -1) => setYm(([y, m]) => {
    const x = new Date(y, m + d, 1); return [x.getFullYear(), x.getMonth()];
  });

  if (GCAL_EMBED_ID) {
    return (
      <div className="calpanel">
        <div className="cal-head">
          <Link className="cal-title" href="/calendar">📅 Calendar</Link>
          <a className="cal-open" href="https://calendar.google.com/calendar/r" target="_blank" rel="noreferrer">open ↗</a>
        </div>
        <div className="gcal-dark">
          <iframe
            title="MediCube Google Calendar"
            src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(GCAL_EMBED_ID)}&mode=AGENDA&showTitle=0&showNav=1&showPrint=0&showTabs=0&showCalendars=0&showTz=0`}
            loading="lazy"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="calpanel">
      <div className="cal-head">
        <Link className="cal-title" href="/calendar" title="open the full calendar — every block, everything">📅 Calendar — see all →</Link>
        <span className="mini-nav">
          <button onClick={() => move(-1)} aria-label="previous month">‹</button>
          <b>{MONTHS[ym[1]].slice(0, 3)} {ym[0]}</b>
          <button onClick={() => move(1)} aria-label="next month">›</button>
        </span>
      </div>

      <div className="mini-grid" role="grid">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, i) => <span key={`w${i}`} className="mini-wd">{w}</span>)}
        {cells.map((d) => {
          const k = dayKey(d);
          const day = byDay.get(k) || [];
          const out = d.getMonth() !== ym[1];
          const missed = day.some((i) => alertLevel(i) === 'overdue');
          return (
            <button
              key={k}
              className={`mini-day ${out ? 'out' : ''} ${k === todayKey ? 'today' : ''} ${k === sel ? 'sel' : ''} ${missed ? 'missed' : ''}`}
              onClick={() => setSel(k)}
            >
              {d.getDate()}
              {day.length > 0 && (
                <span className="mini-dots">
                  {day.slice(0, 3).map((i) => (
                    <i key={i.key} style={{ background: getDepartment(i.department)?.color || '#6fe4ff' }} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="cal-list">
        {status === 'error' && <div className="cal-empty">could not load — reload</div>}
        {status === 'ready' && selItems.length === 0 && <div className="cal-empty">nothing on this day</div>}
        {selItems.map((i) => (
          <div key={i.key} className={`cal-row ${alertLevel(i)}`}>
            <span className="cal-when">{fmtWhen(i)}</span>
            <span className="cal-what" title={i.title}>
              <i className="cal-dot" style={{ background: getDepartment(i.department)?.color || '#6fe4ff' }} />
              {i.title}
            </span>
            <a className="cal-add" href={gcalUrl(i)} target="_blank" rel="noreferrer" title="add to Google Calendar">＋GCal</a>
          </div>
        ))}
      </div>
    </div>
  );
}
