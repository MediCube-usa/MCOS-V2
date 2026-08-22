import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { ScopeMap } from '@/components/ScopeMap';
import { ContactsBoard } from '@/components/ContactsBoard';
import { BlockAlerts } from '@/components/BlockAlerts';
import { AtlasDock } from '@/components/AtlasDock';

const COLOR = '#a6b5ff';

// Contacts is the central directory: every person lives here once, tagged by
// category and linked by role. Facilities, Restocking, Setup and Marketing all
// point at these records instead of keeping their own copies.
export default function Contacts() {
  return (
    <div className="shell">
      <Sidebar active="contacts" />
      <main className="main">
        <div className="deptpage" style={{ ['--c' as string]: COLOR, maxWidth: 1100 }}>
          <AtlasDock dept="contacts" />
          <div className="crumb"><Link href="/">Command Center</Link> / GROWTH</div>
          <h1>Contacts</h1>
          <p className="blurb">Central directory — every contact lives once, linked by role. Refillers, facility contacts, TCN reps, logistics, vendors, payments — all in one place.</p>

          <BlockAlerts dept="contacts" />

          <div className="banner" style={{ border: '1px solid rgba(166,181,255,.35)', background: 'rgba(166,181,255,.07)', color: '#cdd6ff' }}>
            <b>Add everyone once.</b> Filter by category, search by name or org, tap <b>call</b> to dial. Refillers you add here feed Restocking dispatch; facility contacts feed Facilities.
          </div>

          <ContactsBoard />

          <div className="section" style={{ marginTop: 18 }}>
            <h3>Coming next on this page <span className="ph-tag">after the directory</span></h3>
            <p>Linking a contact to a specific <Link href="/facilities" style={{ color: '#6fe4ff' }}>facility</Link>, vendor, or machine (not just free-text org), duplicate detection, and pulling refillers straight into a <Link href="/restocking" style={{ color: '#6fe4ff' }}>Restocking</Link> work order.</p>
          </div>

          <h2 className="scope-heading">Full department scope</h2>
          <ScopeMap id="contacts" />
        </div>
      </main>
    </div>
  );
}
