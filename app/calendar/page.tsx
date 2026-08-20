import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { FullCalendar } from '@/components/FullCalendar';
import { CalendarSettings } from '@/components/CalendarSettings';

// The whole company on one calendar: every manual appointment plus every date
// typed into any block's forms. Reached from the calendar box on the Command
// Center header.
export default function CalendarPage() {
  return (
    <div className="shell">
      <Sidebar active="command-center" />
      <main className="main">
        <div className="deptpage" style={{ ['--c' as string]: '#6fe4ff', maxWidth: 1200 }}>
          <div className="crumb"><Link href="/">Command Center</Link> / CALENDAR</div>
          <h1>Calendar</h1>
          <p className="blurb">Every single thing, one calendar — appointments set on any block, plus the dates living in the block forms (ETAs, pickups, contracts, map-card follow-ups, refill visits, order arrivals). Red means the date passed and the milestone did not happen.</p>
          <FullCalendar />
          <CalendarSettings />
        </div>
      </main>
    </div>
  );
}
