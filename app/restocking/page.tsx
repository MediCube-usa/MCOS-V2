import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { ScopeMap } from '@/components/ScopeMap';
import { RestockBoard } from '@/components/RestockBoard';
import { AtlasDock } from '@/components/AtlasDock';

// Restocking — Joe's flow (docs/blocks/restocking.md): trigger → alert refiller
// (Instawork/Aramark/student) → accept or roll to next day → map card → QR/push
// verify at machine → key code + refill code → replenish screen amounts → photo
// → agent files to Drive + email → done. Refill NEVER changes prices or slots.
export default function Restocking() {
  return (
    <div className="shell">
      <Sidebar active="restocking" />
      <main className="main">
        <div className="deptpage" style={{ ['--c' as string]: '#caff00', maxWidth: 1200 }}>
          <AtlasDock dept="restocking" />
          <div className="crumb"><Link href="/">Command Center</Link> / OPERATIONS</div>
          <h1>Restocking</h1>
          <p className="blurb">Trigger → alert the refiller → accept (or roll to next day) → map card → verify at the
            machine → key + refill codes → replenish exactly what the screen says → photo → filed → done.
            Shipping refills add the campus check-in stop first.</p>


          <RestockBoard />

          <h2 className="scope-heading">Full department scope</h2>
          <ScopeMap id="restocking" />
        </div>
      </main>
    </div>
  );
}
