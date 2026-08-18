import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { AgentBadge } from '@/components/AgentBadge';
import { blockDepartments } from '@/lib/departments';

export default function CommandCenter() {
  const blocks = blockDepartments();
  const ready = blocks.filter((d) => d.status === 'ready').length;
  const building = blocks.filter((d) => d.status === 'building').length;
  const shell = blocks.filter((d) => d.status === 'shell').length;

  return (
    <div className="shell">
      <Sidebar active="command-center" />
      <main className="main">
        <div className="topbar">
          <div>
            <h1>Command Center</h1>
            <div className="sub">MEDICUBE HEALTH · LIVE OPERATIONS · JOSEPH</div>
          </div>
          <div className="pills">
            <div className="pill">Ready {ready}</div>
            <div className="pill">Building {building}</div>
            <div className="pill">Parked {shell}</div>
            <div className="pill">Machines 14</div>
          </div>
        </div>

        <div className="agent-band">
          <div className="statement">
            <b>One system runs the whole company.</b>
            <span>Every machine, school, product, restock, payout, and report moves through MCOS.</span>
          </div>
          <div className="agent-card">
            <AgentBadge name="Atlas" sub="Executive Operations" size={54} brand />
            <div className="agent-card-body">
              <div className="t">Command Agent</div>
              <div className="note">Framework online. {ready} departments live, {building} in build, {shell} parked. Click any block to open its page.</div>
            </div>
          </div>
        </div>

        <section className="grid">
          {blocks.map((d) => (
            <Link key={d.id} href={`/${d.id}`} className={`block ${d.status === 'shell' ? 'parked' : ''}`} style={{ ['--c' as string]: d.color }}>
              <span className={`status-tag ${d.status}`}>{d.status}</span>
              <div className="head">
                <h2>{d.name}</h2>
              </div>
              <div className="metric">{d.metric}</div>
              <div className="label">{d.metricLabel}</div>
              {d.agent && d.agent !== '—'
                ? <div className="block-agent"><AgentBadge name={d.agent} color={d.color} size={30} sub={d.hasAgent ? 'live agent' : undefined} /></div>
                : <div className="block-agent block-agent-empty">no agent yet</div>}
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
