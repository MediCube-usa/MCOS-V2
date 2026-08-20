'use client';

// Calendar settings — Joe's own controls, on the /calendar page. Change the
// corner box's view, the dark filter, or which Google calendar the site
// shows. Saves to site_settings; applies on the next page refresh.

import { useEffect, useState } from 'react';
import { CAL_DEFAULTS, CalMode, CalSettings, fetchCalSettings, saveCalSetting } from '@/lib/site-settings';

export function CalendarSettings() {
  const [cfg, setCfg] = useState<CalSettings | null>(null);
  const [calId, setCalId] = useState('');
  const [msg, setMsg] = useState('');
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 4000); };

  useEffect(() => {
    fetchCalSettings().then((c) => { setCfg(c); setCalId(c.calendar_id); }).catch(() => setCfg(CAL_DEFAULTS));
  }, []);

  if (!cfg) return null;

  const save = async (key: 'cal_mode' | 'cal_dark' | 'cal_id', value: string, patch: Partial<CalSettings>) => {
    setCfg((c) => (c ? { ...c, ...patch } : c));
    try { await saveCalSetting(key, value); flash('Saved — refresh the page and it takes effect everywhere'); }
    catch { flash('Could not save — try again'); }
  };

  return (
    <div className="section" style={{ marginTop: 16 }}>
      <h3>⚙ Calendar settings — yours to change, no rebuild needed</h3>
      {msg && <div className="sb-msg">{msg}</div>}
      <div className="pd-grid">
        <label className="pd-field">
          <span>Corner box view (Command Center)</span>
          <select value={cfg.mode} onChange={(e) => save('cal_mode', e.target.value, { mode: e.target.value as CalMode })}>
            <option value="AGENDA">Agenda — upcoming list</option>
            <option value="WEEK">Week grid</option>
            <option value="MONTH">Month grid</option>
          </select>
        </label>
        <label className="pd-field">
          <span>Dark look</span>
          <select value={cfg.dark ? 'on' : 'off'} onChange={(e) => save('cal_dark', String(e.target.value === 'on'), { dark: e.target.value === 'on' })}>
            <option value="on">Dark (matches the site)</option>
            <option value="off">Google&apos;s original white</option>
          </select>
        </label>
        <label className="pd-field pd-wide">
          <span>Google Calendar shown on the site (calendar ID — usually the account&apos;s email)</span>
          <div className="ff-row">
            <input value={calId} onChange={(e) => setCalId(e.target.value)} placeholder="medicubehub1@gmail.com" />
            <button type="button" className="ff-btn" style={{ ['--sc' as string]: '#6fe4ff' }}
              onClick={() => save('cal_id', calId.trim(), { calendar_id: calId.trim() })}>Save calendar</button>
          </div>
        </label>
      </div>
      <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '8px 0 0' }}>
        Remember: a calendar must be set <b>&quot;Make available to public&quot;</b> inside its own Google account
        (Settings → Access permissions) or the box shows empty. Event colors, names, and reminders are changed
        inside Google Calendar itself — those show here automatically.
      </p>
    </div>
  );
}
