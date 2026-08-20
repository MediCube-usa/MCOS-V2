'use client';

// THE CALENDAR BOX — top right of the Command Center header, pinned to
// 300×132 (agent-box width, header height). Default face is the site's own
// neon list: the next things happening across every block PLUS the real
// events on the MediCube ops Google Calendar (read server-side, no embed,
// no white). Click the title → /calendar for everything. The raw Google
// embed is still available as a face in ⚙ Calendar settings.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CalItem, alertLevel, fetchAlertsOffShared, fetchCalendarShared, fmtWhen, gcalUrl, itemColor,
} from '@/lib/appointments';
import { getDepartment } from '@/lib/departments';
import { CAL_DEFAULTS, CalSettings, embedUrl, fetchCalSettings } from '@/lib/site-settings';

export function CalendarPanel() {
  const [items, setItems] = useState<CalItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [cfg, setCfg] = useState<CalSettings | null>(null);

  useEffect(() => {
    fetchCalSettings().then(setCfg).catch(() => setCfg(CAL_DEFAULTS));
    Promise.all([fetchCalendarShared(), fetchAlertsOffShared()])
      .then(([all, off]) => { setItems(all.filter((i) => !off.has(i.department))); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, []);

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

  const next = items.slice(0, 4);
  return (
    <div className="calpanel">
      <div className="cal-head">
        <Link className="cal-title" href="/calendar" title="open the full calendar — every block, everything">📅 Calendar — see all →</Link>
        <a className="cal-open" href="https://calendar.google.com/calendar/r" target="_blank" rel="noreferrer">Google ↗</a>
      </div>
      <div className="cal-list">
        {status === 'loading' && <div className="cal-empty">loading…</div>}
        {status === 'error' && <div className="cal-empty">could not load — reload</div>}
        {status === 'ready' && next.length === 0 && (
          <div className="cal-empty">clear calendar — set appointments on any block&apos;s page or in Google Calendar</div>
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
