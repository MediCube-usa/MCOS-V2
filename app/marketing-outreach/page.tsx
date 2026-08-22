import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { ScopeMap } from '@/components/ScopeMap';
import { RecordBoard, type BoardConfig } from '@/components/RecordBoard';
import { AtlasDock } from '@/components/AtlasDock';
import { getDepartment } from '@/lib/departments';

const COLOR = getDepartment('marketing-outreach')!.color;

const CONFIG: BoardConfig = {
  table: 'campaigns',
  color: COLOR,
  statuses: ['planned', 'scheduled', 'sent', 'done'],
  addPlaceholder: 'Campaign / launch name * (e.g. UNLV fall launch)',
  emptyText: 'No campaigns yet. Track school launches, announcements, and outreach here — tied to a facility and its go-live date.',
  subtitleKeys: ['facility', 'camp_type', 'run_date'],
  fields: [
    { key: 'camp_type', label: 'Type', type: 'select', options: ['Launch', 'Announcement', 'Campaign', 'Onboarding'] },
    { key: 'facility', label: 'Facility / campus', type: 'text' },
    { key: 'channel', label: 'Channel', type: 'text', placeholder: 'Email, flyer, social, on-machine screen' },
    { key: 'run_date', label: 'Run date', type: 'date' },
    { key: 'notes', label: 'Message / notes', type: 'textarea' }
  ]
};

export default function MarketingOutreach() {
  return (
    <div className="shell">
      <Sidebar active="marketing-outreach" />
      <main className="main">
        <div className="deptpage" style={{ ['--c' as string]: COLOR, maxWidth: 1100 }}>
          <AtlasDock dept="marketing-outreach" />
          <div className="crumb"><Link href="/">Command Center</Link> / GROWTH</div>
          <h1>Marketing &amp; Outreach</h1>
          <p className="blurb">School launches, announcements, and new-facility onboarding — tied to each facility&apos;s go-live.</p>


          <div className="banner" style={{ border: '1px solid rgba(0,255,234,.3)', background: 'rgba(0,255,234,.07)', color: '#9ffff5' }}>
            <b>Plan every launch and announcement.</b> Add a campaign, tie it to a facility and a run date, pick the channel, and move it planned → scheduled → sent. Reads launch rules from <Link href="/facilities" style={{ color: '#7ffff2' }}>Facilities</Link>.
          </div>

          <RecordBoard config={CONFIG} />

          <div className="section" style={{ marginTop: 18 }}>
            <h3>Coming next on this page <span className="ph-tag">after the tracker</span></h3>
            <p>Announcement templates, auto-scheduling a launch to a facility&apos;s go-live date from <Link href="/setup-distribution" style={{ color: '#7ffff2' }}>Machine Setup</Link>, and outreach contacts pulled from <Link href="/contacts" style={{ color: '#7ffff2' }}>Contacts</Link>.</p>
          </div>

          <h2 className="scope-heading">Full department scope</h2>
          <ScopeMap id="marketing-outreach" />
        </div>
      </main>
    </div>
  );
}
