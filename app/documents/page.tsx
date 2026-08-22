import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { ScopeMap } from '@/components/ScopeMap';
import { RecordBoard, type BoardConfig } from '@/components/RecordBoard';
import { BlockAlerts } from '@/components/BlockAlerts';
import { AtlasDock } from '@/components/AtlasDock';

const COLOR = '#ff66a8';

const CONFIG: BoardConfig = {
  table: 'documents',
  color: COLOR,
  statuses: ['draft', 'sent', 'signed', 'expired'],
  addPlaceholder: 'Document name * (e.g. ASU vending agreement)',
  emptyText: 'No documents yet. Track contracts, licenses, and compliance items here — each with its party, status, and expiry/renewal date.',
  subtitleKeys: ['doc_type', 'party', 'expiry'],
  fields: [
    { key: 'doc_type', label: 'Type', type: 'select', options: ['Contract', 'License', 'Compliance', 'Insurance', 'Corporate', 'Other'] },
    { key: 'party', label: 'Party / facility', type: 'text' },
    { key: 'expiry', label: 'Expiry / renewal', type: 'date' },
    { key: 'link', label: 'Secure link (vault URL)', type: 'text', placeholder: 'Link only — no raw secrets in the dashboard' },
    { key: 'notes', label: 'Notes', type: 'textarea' }
  ]
};

export default function Documents() {
  return (
    <div className="shell">
      <Sidebar active="documents" />
      <main className="main">
        <div className="deptpage" style={{ ['--c' as string]: COLOR, maxWidth: 1100 }}>
          <AtlasDock dept="documents" />
          <div className="crumb"><Link href="/">Command Center</Link> / COMPANY</div>
          <h1>Documents &amp; Compliance</h1>
          <p className="blurb">Contracts, licenses, and compliance deadlines. The record and its status live here; the signed file lives in a secure vault, linked — never pasted raw.</p>

          <BlockAlerts dept="documents" />

          <div className="banner" style={{ border: '1px solid rgba(255,102,168,.35)', background: 'rgba(255,102,168,.08)', color: '#ffbcd8' }}>
            <b>Every contract and license, tracked to its deadline.</b> Add a document, set its type, party, and expiry, and move it draft → sent → signed. Store only a secure link — never the actual credentials or raw file.
          </div>

          <RecordBoard config={CONFIG} />

          <div className="section" style={{ marginTop: 18 }}>
            <h3>Coming next on this page <span className="ph-tag">after the record store</span></h3>
            <p>Expiry/renewal alerts before a deadline hits, a DocuSign send-for-signature flow, and contract rules (reporting, restrictions) flowing into <Link href="/facilities" style={{ color: '#ff9ec8' }}>Facilities</Link> automatically.</p>
          </div>

          <h2 className="scope-heading">Full department scope</h2>
          <ScopeMap id="documents" />
        </div>
      </main>
    </div>
  );
}
