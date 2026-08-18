import Link from 'next/link';
import { DEPARTMENTS, GROUP_ORDER } from '@/lib/departments';

export function Sidebar({ active }: { active: string }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo" />
        <div><b>MCOS</b><small>MEDICUBE HEALTH</small></div>
      </div>
      {GROUP_ORDER.map((group) => {
        const items = DEPARTMENTS.filter((d) => d.group === group);
        if (!items.length) return null;
        return (
          <div className="nav-group" key={group}>
            <h6>{group}</h6>
            {items.map((d) => (
              <Link
                key={d.id}
                href={d.id === 'command-center' ? '/' : `/${d.id}`}
                className={`nav-item ${active === d.id ? 'active' : ''} ${d.status === 'shell' ? 'parked' : ''}`}
              >
                <span className="dot" style={{ color: d.color, background: d.color }} />
                {d.name}
              </Link>
            ))}
          </div>
        );
      })}
    </aside>
  );
}
