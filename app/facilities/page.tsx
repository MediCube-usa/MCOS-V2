import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { ScopeMap } from '@/components/ScopeMap';
import { FacilitiesBoard } from '@/components/FacilitiesBoard';
import { BlockAlerts } from '@/components/BlockAlerts';

const COLOR = '#4dff88';

// Facilities is the master record and rule center for each campus. Its rules
// (reporting, restrictions, promo) are read by Setup, Machine Operations,
// Inventory, Restocking and Marketing — so it holds them once, here.
export default function Facilities() {
  return (
    <div className="shell">
      <Sidebar active="facilities" />
      <main className="main">
        <div className="deptpage" style={{ ['--c' as string]: COLOR, maxWidth: 1200 }}>
          <div className="crumb"><Link href="/">Command Center</Link> / COMPANY</div>
          <h1>Facilities</h1>
          <p className="blurb">Each campus and its rules — contacts, reporting, restrictions, access. Other departments read these rules instead of keeping their own copy.</p>

          <BlockAlerts dept="facilities" />

          <div className="banner" style={{ border: '1px solid rgba(77,255,136,.35)', background: 'rgba(77,255,136,.07)', color: '#a7ffc8' }}>
            <b>Your four live campuses are already here.</b> Open one to fill in its address, rules, restrictions (e.g. &quot;no Plan B&quot;), and contacts. Set a facility to <b>approved</b> and that&apos;s the trigger to map it and order a machine.
          </div>

          <FacilitiesBoard />

          <div className="section" style={{ marginTop: 18 }}>
            <h3>Coming next on this page <span className="ph-tag">after profiles</span></h3>
            <p>Contacts here link to the central <Link href="/contacts" style={{ color: '#6fe4ff' }}>Contacts</Link> directory instead of being retyped, a facility calendar/events, and the restriction rules flowing straight into Templates (block a restricted product) and Machine Operations.</p>
          </div>

          <h2 className="scope-heading">Full department scope</h2>
          <ScopeMap id="facilities" />
        </div>
      </main>
    </div>
  );
}
