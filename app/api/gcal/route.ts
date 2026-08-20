import { NextResponse } from 'next/server';
import { SUPABASE_URL, SUPABASE_KEY, GCAL_EMBED_ID } from '@/lib/config';

// Server-side reader for the MediCube ops Google Calendar's PUBLIC feed.
// Browsers can't fetch the ICS cross-origin; this route can. Lets the site's
// own neon calendar UI show real Google events without any embed.
export const dynamic = 'force-dynamic';

interface GEvent { title: string; start: string; allDay: boolean; location: string | null; }

function parseIcs(ics: string): GEvent[] {
  // unfold wrapped lines, then walk VEVENT blocks
  const lines = ics.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
  const out: GEvent[] = [];
  let cur: Partial<GEvent> | null = null;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { cur = {}; continue; }
    if (line === 'END:VEVENT') {
      if (cur?.title && cur.start) out.push({ title: cur.title, start: cur.start, allDay: !!cur.allDay, location: cur.location ?? null });
      cur = null; continue;
    }
    if (!cur) continue;
    if (line.startsWith('SUMMARY:')) cur.title = line.slice(8).replace(/\\,/g, ',').replace(/\\n/g, ' ');
    else if (line.startsWith('LOCATION:')) cur.location = line.slice(9).replace(/\\,/g, ',');
    else if (line.startsWith('DTSTART')) {
      const v = line.split(':')[1] || '';
      if (/^\d{8}$/.test(v)) { // all-day
        cur.start = `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
        cur.allDay = true;
      } else if (/^\d{8}T\d{6}Z?$/.test(v)) {
        const iso = `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}T${v.slice(9, 11)}:${v.slice(11, 13)}:00${v.endsWith('Z') ? 'Z' : ''}`;
        cur.start = iso;
        cur.allDay = false;
      }
    }
  }
  return out;
}

export async function GET() {
  let calId = GCAL_EMBED_ID;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/site_settings?select=value&key=eq.cal_id`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      next: { revalidate: 300 },
    });
    if (r.ok) { const rows = await r.json(); if (rows[0]?.value !== undefined) calId = rows[0].value; }
  } catch { /* fall back to configured id */ }
  if (!calId) return NextResponse.json({ events: [] });

  try {
    const r = await fetch(`https://calendar.google.com/calendar/ical/${encodeURIComponent(calId)}/public/basic.ics`, {
      next: { revalidate: 300 },
    });
    if (!r.ok) return NextResponse.json({ events: [], error: 'calendar not public' });
    const events = parseIcs(await r.text());
    // keep it tight: today back 1 day through +120 days
    const from = Date.now() - 86400000, to = Date.now() + 120 * 86400000;
    return NextResponse.json({
      events: events.filter((e) => { const t = new Date(e.start).getTime(); return t >= from && t <= to; }).slice(0, 200),
    });
  } catch {
    return NextResponse.json({ events: [], error: 'feed unreachable' });
  }
}
