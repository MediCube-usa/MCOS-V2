'use client';

// Alerts + appointments for one block, shown at the top of its page.
// Anything overdue / today / inside its reminder window fires as an alert
// banner. Below it, the block's appointment book: set new ones (they roll up
// to the Command Center calendar), push any of them to Google Calendar in one
// click, and the dates already typed into this block's own forms (ETAs,
// pickups, follow-ups, refill visits) appear automatically — edit those on
// the form and the appointment follows.

import { useEffect, useState } from 'react';
import { dbDelete, dbInsert, dbUpdate } from '@/lib/db';
import { getDepartment } from '@/lib/departments';
import { Appointment, CalItem, alertLevel, fetchAlertsOff, fetchCalendar, fmtWhen, fromRow, gcalUrl, setAlertsEnabled } from '@/lib/appointments';

const LEVEL_LABEL = { overdue: 'OVERDUE', today: 'TODAY', soon: 'COMING UP' } as const;

export function BlockAlerts({ dept }: { dept: string }) {
  const color = getDepartment(dept)?.color || '#6fe4ff';
  const [items, setItems] = useState<CalItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [alertsOn, setAlertsOn] = useState(true);
  const [showBook, setShowBook] = useState(false);
  const [msg, setMsg] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loc, setLoc] = useState('');
  const [notes, setNotes] = useState('');
  const [remind, setRemind] = useState(1);
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 3000); };

  useEffect(() => {
    Promise.all([fetchCalendar(dept), fetchAlertsOff()])
      .then(([all, off]) => { setItems(all); setAlertsOn(!off.has(dept)); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, [dept]);

  const toggleAlerts = async () => {
    const next = !alertsOn;
    setAlertsOn(next);
    try {
      await setAlertsEnabled(dept, next);
      flash(next ? 'Reminders ON for this block — alerts show here and on the Command Center' : 'Reminders OFF for this block — nothing fires here or on the Command Center');
    } catch { setAlertsOn(!next); flash('Could not save the setting'); }
  };

  const add = async () => {
    if (!title.trim() || !date) { flash('Give it a title and a date'); return; }
    const hasTime = /^\d{1,2}:\d{2}/.test(time.trim());
    const starts = hasTime ? new Date(`${date}T${time.trim()}`) : new Date(`${date}T00:00`);
    try {
      const created = await dbInsert('appointments', {
        department: dept, title: title.trim(), starts_at: starts.toISOString(), has_time: hasTime,
        location: loc.trim() || null, notes: notes.trim() || null, remind_days_before: remind,
      });
      setItems((xs) => [...xs, fromRow(created as unknown as Appointment)].sort((a, b) => a.when.getTime() - b.when.getTime()));
      setTitle(''); setDate(''); setTime(''); setLoc(''); setNotes('');
      flash('Appointment set — it alerts here and rolls up to the Command Center');
    } catch { flash('Could not save'); }
  };
  const markDone = async (i: CalItem) => {
    setItems((xs) => xs.filter((x) => x.key !== i.key));
    try { await dbUpdate('appointments', `id=eq.${i.id}`, { done: true }); flash('Done'); } catch { flash('Save failed'); }
  };
  const remove = async (i: CalItem) => {
    setItems((xs) => xs.filter((x) => x.key !== i.key));
    try { await dbDelete('appointments', `id=eq.${i.id}`); flash('Removed'); } catch { flash('Delete failed'); }
  };

  const alerts = alertsOn ? items.filter((i) => alertLevel(i) !== 'later') : [];
  const upcoming = items.slice(0, 10);

  return (
    <div className="blockalerts" style={{ ['--c' as string]: color }}>
      {/* live alerts — overdue, today, inside the reminder window */}
      {alerts.map((i) => {
        const lvl = alertLevel(i) as keyof typeof LEVEL_LABEL;
        return (
          <div key={`al-${i.key}`} className={`appt-alert ${lvl}`}>
            <span className="appt-flag">⏰ {LEVEL_LABEL[lvl]}</span>
            <span className="appt-text">{i.title} — {fmtWhen(i)}{i.location ? ` · ${i.location}` : ''}</span>
            <span className="appt-actions">
              <a href={gcalUrl(i)} target="_blank" rel="noreferrer">＋GCal</a>
              {!i.auto && i.id && <button onClick={() => markDone(i)}>✓ done</button>}
            </span>
          </div>
        );
      })}

      <button className="appt-toggle" onClick={() => setShowBook((v) => !v)}>
        📅 Appointments &amp; reminders
        {status === 'ready' && <span className="stage-n" style={{ background: color }}>{items.length}</span>}
        <span className="appt-caret">{showBook ? '▴' : '▾'}</span>
      </button>
      {msg && <div className="sb-msg">{msg}</div>}

      {showBook && (
        <div className="appt-book">
          <label className="sb-check-row" style={{ marginBottom: 8 }}>
            <input type="checkbox" checked={alertsOn} onChange={toggleAlerts} />
            🔔 Reminders &amp; alerts for this block {alertsOn ? 'ON' : 'OFF'} — controls the alert rows here and this block&apos;s badge on the Command Center
          </label>
          {status === 'error' && <div className="cal-empty">could not load — reload the page</div>}
          {status === 'ready' && upcoming.length === 0 && (
            <div className="cal-empty">nothing on the book for this block yet — set the first one below</div>
          )}
          {upcoming.map((i) => (
            <div key={i.key} className="appt-row">
              <span className="cal-when">{fmtWhen(i)}</span>
              <span className="appt-text">
                {i.title}
                {i.auto && <span className="ph-tag" title="comes from this block's own form — edit it there">{i.source}</span>}
              </span>
              <span className="appt-actions">
                <a href={gcalUrl(i)} target="_blank" rel="noreferrer">＋GCal</a>
                {!i.auto && i.id && <>
                  <button onClick={() => markDone(i)}>✓</button>
                  <button onClick={() => remove(i)}>✕</button>
                </>}
              </span>
            </div>
          ))}

          <div className="pd-grid appt-form">
            <label className="pd-field"><span>What</span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. call the port broker" /></label>
            <label className="pd-field"><span>Date</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
            <label className="pd-field"><span>Time (optional)</span><input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></label>
            <label className="pd-field"><span>Alert me</span>
              <select value={remind} onChange={(e) => setRemind(Number(e.target.value))}>
                <option value={0}>day of</option><option value={1}>1 day before</option>
                <option value={2}>2 days before</option><option value={3}>3 days before</option>
                <option value={7}>a week before</option>
              </select></label>
            <label className="pd-field"><span>Location (optional)</span><input value={loc} onChange={(e) => setLoc(e.target.value)} /></label>
            <label className="pd-field"><span>Notes (optional)</span><input value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
          </div>
          <div className="sup-foot">
            <button className="pd-save" onClick={add}>Set appointment</button>
            <span className="cal-empty">alerts fire here + on the Command Center; ＋GCal puts it on Google Calendar with its own phone reminders</span>
          </div>
        </div>
      )}
    </div>
  );
}
