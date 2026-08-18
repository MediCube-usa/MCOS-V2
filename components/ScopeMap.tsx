import Link from 'next/link';
import { getDepartment } from '@/lib/departments';
import { DEPT_SPECS } from '@/lib/dept-specs';

// The full department plan — Owns / Workflow / Connects to / To build — rendered
// the same way on every department page so the whole team can see the complete map:
// what each department is the source of truth for, and where its boundaries are.
export function ScopeMap({ id }: { id: string }) {
  const spec = DEPT_SPECS[id];
  if (!spec) return null;

  return (
    <div className="scopemap">
      <div className="scope-purpose">{spec.purpose}</div>

      <div className="scope-grid">
        <div className="scope-card">
          <h4>Owns <span className="scope-tag">source of truth</span></h4>
          <ul>{spec.owns.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
        <div className="scope-card">
          <h4>Workflow</h4>
          <ol>{spec.workflow.map((x) => <li key={x}>{x}</li>)}</ol>
        </div>
      </div>

      <div className="scope-card">
        <h4>Connects to</h4>
        <div className="scope-chips">
          {spec.connects.map((cid) => {
            const c = getDepartment(cid);
            return (
              <Link
                key={cid}
                href={`/${cid}`}
                className="scope-chip"
                style={c ? { ['--cc' as string]: c.color } : undefined}
              >
                {c ? c.name : cid}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="scope-card">
        <h4>To build</h4>
        <ul className="scope-todo">{spec.toBuild.map((x) => <li key={x}>{x}</li>)}</ul>
      </div>
    </div>
  );
}
