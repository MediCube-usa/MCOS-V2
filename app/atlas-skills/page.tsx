import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { AtlasSkills } from '@/components/AtlasSkills';

const COLOR = '#b9a6ff';

// Atlas Skills — Joe teaches Atlas in his own words. Rows in `atlas_skills` are
// appended to Atlas's instructions on every message (loadSkills() in
// app/api/agent/route.ts), so a new skill takes effect immediately, no rebuild.
export default function AtlasSkillsPage() {
  return (
    <div className="shell">
      <Sidebar active="command-center" />
      <main className="main">
        <div className="deptpage" style={{ ['--c' as string]: COLOR, maxWidth: 1100 }}>
          <div className="crumb"><Link href="/">Command Center</Link> / ATLAS</div>
          <h1>Atlas Skills</h1>
          <p className="blurb">Teach Atlas. Anything you write here becomes part of how Atlas thinks —
            rules, procedures, contacts, how you want a job done, what to never do. Active skills load on
            every message, so changes take effect straight away.</p>

          <div className="banner" style={{ border: '1px solid rgba(185,166,255,.35)', background: 'rgba(185,166,255,.08)', color: '#d8ccff' }}>
            <b>What Atlas can already do:</b> read the whole operation live (fleet, catalog, inventory,
            restock, setup, locations, orders, calendar) · <b>write to OurVend</b> — change a product,
            add a product, set a coil (product + price + inventory), push a planogram to a machine,
            clone a machine · build planograms from photos you upload · file documents ·
            set reminders on the real Google Calendar · <b>research the web</b>.
            The one thing Atlas never does is spend money.
          </div>

          <AtlasSkills />
        </div>
      </main>
    </div>
  );
}
