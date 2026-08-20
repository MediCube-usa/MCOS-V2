'use client';

// THE CALENDAR BOX — right column of the Command Center band, same size as
// the screen-feed box above it. Default face is a REAL month grid: every day
// of the month with a colored dot per block that has something that day
// (white dots = Google Calendar events, read server-side via /api/gcal),
// plus the next things coming up. The dots ARE the block-alert connection:
// the same appointments rows drive the ⏰ badges on the department boxes.
// Click any day or the title → /calendar for everything. The raw Google
// embed is still available as a face in ⚙ Calendar settings on /calendar.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CalItem, alertLevel, dayKey, fetchAlertsOffShared, fetchCalendarShared, fmtWhen, gcalUrl,
  groupByDay, itemColor, monthMatrix,
} from '@/lib/appointments';
import { getDepartment } from '@/lib/departments';
import { CAL_DEFAULTS, CalSettings, embedUrl, fetchCalSettings } from '@/lib/site-settings';

const WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function CalendarPanel() {
  const [items, setItems] = useState<CalItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [cfg, setCfg] = useState<CalSettings | null>(null);
  const [ym, setYm] = useState<[number, number]>(() => {
    const n = new Date();
    return [n.getFullYear(), n.getMonth()];
  });

  useEffect(() => {
    fetchCalSettings().then(setCfg).catch(() => setCfg(CAL_DEFAULTS));
    Promise.all([fetchCalendarShared(), fetchAlertsOffShared()])
      .then(([all, off]) => { setItems(all.filter((i) => !off.has(i.department))); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, []);

  const cells = useMemo(() => monthMatrix(ym[0], ym[1]), [ym]);
  const byDay = useMemo(() => groupByDay(items), [items]);

  if (!cfg) return <div className="calpanel"><div className="cal-head"><span className="cal-title">📅 Calendar</span></div></div>;

  // Google's own widget, if that face is chosen in settings
  if (cfg.mode !== 'NEON' && cfg.calendar_id) {
    return (
      <div className="calpanel">
        <div className="cal-head">
          <Link className="cal-title" href="/calendar">📅 Calendar</Link>
          <a className="cal-open" href="https://calendar.google.com/calendar/r" target="_blank" rel="noreferrer">open ↗</a>
        </div>
        <div className={cfg.dark ? 'gcal-dark' : 'gcal-dark gcal-plain'}>
          <iframe title="MediCube Google Calendar" src={embedUrl(cfg.calendar_id, cfg.mode)} loading="lazy" />
        </div>
      </div>
    );
  }

  const todayK = dayKey(new Date());
  const monthName = new Date(ym[0], ym[1], 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const move = (d: number) => setYm(([y, m]) => { const t = new Date(y, m + d, 1); return [t.getFullYear(), t.getMonth()]; });
  const next = items.slice(0, 3);

  return (
    <div className="calpanel">
      <div className="cal-head">
        <Link className="cal-title" href="/calendar" title="open the full calendar — every block, everything">📅 Calendar — see all →</Link>
        <a className="cal-open" href="https://calendar.google.com/calendar/r" target="_blank" rel="noreferrer">Google ↗</a>
      </div>
      <div className="mini-nav cal-mini-nav">
        <button onClick={() => move(-1)} aria-label="previous month">‹</button>
        <span className="cal-mini-month">{monthName}</span>
        <button onClick={() => move(1)} aria-label="next month">›</button>
      </div>
      <div className="mini-grid cal-mini-grid">
        {WD.map((w, i) => <span key={`wd${i}`} className="mini-wd">{w}</span>)}
        {cells.map((d) => {
          const k = dayKey(d);
          const its = byDay.get(k) || [];
          return (
            <Link
              key={k}
              href="/calendar"
              className={`mini-day ${d.getMonth() !== ym[1] ? 'out' : ''} ${k === todayK ? 'today' : ''}`}
              title={its.length ? its.map((i) => i.title).join(' · ') : undefined}
            >
              {d.getDate()}
              {its.length > 0 && (
                <span className="mini-dots">
                  {its.slice(0, 3).map((i, idx) => (
                    <i key={idx} style={{ background: itemColor(i, getDepartment(i.department)?.color) }} />
                  ))}
                </span>
              )}
            </Link>
          );
        })}
      </div>
      <div className="cal-list">
        {status === 'loading' && <div className="cal-empty">loading…</div>}
        {status === 'error' && <div className="cal-empty">could not load — reload</div>}
        {status === 'ready' && next.length === 0 && (
          <div className="cal-empty">clear — set dates on any block or tell Atlas &quot;remind me…&quot;</div>
        )}
        {next.map((i) => (
          <div key={i.key} className={`cal-row ${alertLevel(i)}`}>
            <span className="cal-when">{fmtWhen(i)}</span>
            <span className="cal-what" title={`${i.title} — ${i.source}`}>
              <i className="cal-dot" style={{ background: itemColor(i, getDepartment(i.department)?.color) }} />
              {i.title}
            </span>
            <a className="cal-add" href={gcalUrl(i)} target="_blank" rel="noreferrer" title="add to Google Calendar">＋GCal</a>
          </div>
        ))}
      </div>
    </div>
  );
}
