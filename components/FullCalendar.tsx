'use client';

// THE FULL CALENDAR — every appointment and every block date on one month
// grid, dark. Chips carry each block's color; NOT-MET items burn red. Click a
// chip to jump to its block. When the MediCube ops Google Calendar ID is set,
// the real Google month grid renders above this one, dark-filtered.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CalItem, GOOGLE_DEPT, alertLevel, dayKey, fetchAlertsOffShared, fetchCalendarShared,
  fmtWhen, gcalUrl, groupByDay, itemColor, monthMatrix,
} from '@/lib/appointments';
import { DEPARTMENTS, getDepartment } from '@/lib/departments';
import { CAL_DEFAULTS, CalSettings, fetchCalSettings } from '@/lib/site-settings';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function FullCalendar() {
  const now = new Date();
  const [items, setItems] = useState<CalItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [cfg, setCfg] = useState<CalSettings | null>(null);
  const [ym, setYm] = useState<[number, number]>([now.getFullYear(), now.getMonth()]);

  useEffect(() => {
    fetchCalSettings().then(setCfg).catch(() => setCfg(CAL_DEFAULTS));
    Promise.all([fetchCalendarShared(), fetchAlertsOffShared()])
      .then(([all, off]) => { setItems(all.filter((i) => !off.has(i.department))); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, []);

  const byDay = useMemo(() => groupByDay(items), [items]);
  const cells = useMemo(() => monthMatrix(ym[0], ym[1]), [ym]);
  const todayKey = dayKey(now);
  const missed = items.filter((i) => alertLevel(i) === 'overdue');
  const deptsInUse = DEPARTMENTS.filter((d) => items.some((i) => i.department === d.id));
  const hasGoogle = items.some((i) => i.department === GOOGLE_DEPT);
  const itemHref = (i: CalItem) => (i.department === GOOGLE_DEPT ? 'https://calendar.google.com/calendar/r' : `/${i.department}`);

  const move = (d: 1 | -1) => setYm(([y, m]) => {
    const x = new Date(y, m + d, 1); return [x.getFullYear(), x.getMonth()];
  });

  return (
    <div className="fullcal">
      {cfg?.calendar_id && (
        <div className={`gcal-month ${cfg.dark ? 'gcal-dark' : 'gcal-dark gcal-plain'}`}>
          <iframe
            title="MediCube Google Calendar"
            src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(cfg.calendar_id)}&mode=MONTH&showTitle=0&showPrint=0&showTz=0&showCalendars=0`}
            loading="lazy"
          />
        </div>
      )}

      {/* NOT-MET strip — anything whose date passed without the milestone happening */}
      {missed.length > 0 && (
        <div className="fc-missed">
          <b>⚠ NOT MET — needs attention:</b>
          {missed.slice(0, 6).map((i) => (
            <Link key={i.key} href={itemHref(i)} className="fc-missed-item">
              {i.title} · {fmtWhen(i)}
            </Link>
          ))}
          {missed.length > 6 && <span className="cal-empty">+{missed.length - 6} more below</span>}
        </div>
      )}

      <div className="fc-bar">
        <div className="fc-nav">
          <button className="pd-link" onClick={() => setYm([now.getFullYear(), now.getMonth()])}>Today</button>
          <button className="pd-link" onClick={() => move(-1)}>‹</button>
          <button className="pd-link" onClick={() => move(1)}>›</button>
          <h2>{MONTHS[ym[1]]} {ym[0]}</h2>
        </div>
        <div className="fc-legend">
          {deptsInUse.map((d) => (
            <Link key={d.id} href={`/${d.id}`} className="fc-leg"><i style={{ background: d.color }} />{d.name}</Link>
          ))}
          {hasGoogle && <a className="fc-leg" href="https://calendar.google.com/calendar/r" target="_blank" rel="noreferrer"><i style={{ background: '#eaf7ff' }} />Google Calendar</a>}
        </div>
      </div>

      {status === 'error' && <div className="banner building">Could not load the calendar — check the connection and reload.</div>}

      <div className="fc-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w) => <div key={w} className="fc-wd">{w}</div>)}
        {cells.map((d) => {
          const k = dayKey(d);
          const day = byDay.get(k) || [];
          const out = d.getMonth() !== ym[1];
          return (
            <div key={k} className={`fc-day ${out ? 'out' : ''} ${k === todayKey ? 'today' : ''}`}>
              <span className="fc-num">{d.getDate()}</span>
              {day.slice(0, 4).map((i) => {
                const lvl = alertLevel(i);
                return (
                  <Link
                    key={i.key}
                    href={itemHref(i)}
                    className={`fc-chip ${lvl === 'overdue' ? 'missed' : ''}`}
                    style={{ ['--dc' as string]: itemColor(i, getDepartment(i.department)?.color) }}
                    title={`${i.title} — ${fmtWhen(i)} (${i.source}).`}
                  >
                    {i.title}
                  </Link>
                );
              })}
              {day.length > 4 && <span className="fc-more">+{day.length - 4} more</span>}
            </div>
          );
        })}
      </div>

      {/* everything, in order — the "see every single thing" list */}
      <div className="section" style={{ marginTop: 16 }}>
        <h3>Every appointment, every block</h3>
        {status === 'ready' && items.length === 0 && <p>Nothing on the calendar yet — set appointments on any block&apos;s page, or type dates into the block forms (ETAs, pickups, refills) and they appear here on their own.</p>}
        <div className="cal-list">
          {items.map((i) => (
            <div key={i.key} className={`cal-row ${alertLevel(i)}`}>
              <span className="cal-when">{fmtWhen(i)}</span>
              <span className="cal-what">
                <i className="cal-dot" style={{ background: itemColor(i, getDepartment(i.department)?.color) }} />
                {i.title}
                <span className="ph-tag">{getDepartment(i.department)?.name || (i.department === GOOGLE_DEPT ? 'Google Calendar' : i.department)}</span>
                {alertLevel(i) === 'overdue' && <span className="ph-tag" style={{ color: '#ff8095', borderColor: 'rgba(255,80,120,.4)' }}>NOT MET</span>}
              </span>
              <a className="cal-add" href={gcalUrl(i)} target="_blank" rel="noreferrer">＋GCal</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
