// Settings Joe changes HIMSELF from the site (no code, no credits).
// First use: the calendar face — stored in site_settings, read on page load.

import { dbSelect, dbInsert, dbUpdate } from '@/lib/db';
import { GCAL_EMBED_ID } from '@/lib/config';

// NEON = the site's own calendar face (Google events pulled in through
// /api/gcal); the embed modes show Google's raw widget instead.
export type CalMode = 'NEON' | 'AGENDA' | 'WEEK' | 'MONTH';
export interface CalSettings {
  mode: CalMode;        // how the corner box shows the calendar
  dark: boolean;        // dark filter over Google's white embed (embed modes)
  calendar_id: string;  // which Google calendar the site reads/shows
}

export const CAL_DEFAULTS: CalSettings = { mode: 'NEON', dark: true, calendar_id: GCAL_EMBED_ID };

export async function fetchCalSettings(): Promise<CalSettings> {
  try {
    const rows = await dbSelect<{ key: string; value: string }>('site_settings', 'select=key,value&key=like.cal_*');
    const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      mode: (['NEON', 'AGENDA', 'WEEK', 'MONTH'].includes(m.cal_mode) ? m.cal_mode : CAL_DEFAULTS.mode) as CalMode,
      dark: m.cal_dark !== undefined ? m.cal_dark === 'true' : CAL_DEFAULTS.dark,
      calendar_id: m.cal_id !== undefined ? m.cal_id : CAL_DEFAULTS.calendar_id,
    };
  } catch { return CAL_DEFAULTS; }
}

export async function saveCalSetting(key: 'cal_mode' | 'cal_dark' | 'cal_id', value: string): Promise<void> {
  const existing = await dbSelect<{ key: string }>('site_settings', `select=key&key=eq.${key}`);
  if (existing.length > 0) await dbUpdate('site_settings', `key=eq.${key}`, { value });
  else await dbInsert('site_settings', { key, value });
}

export function embedUrl(calendarId: string, mode: CalMode): string {
  return `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}&mode=${mode}&showTitle=0&showPrint=0&showTz=0&showCalendars=0&showTabs=0`;
}
