'use client';
// The Atlas line on every Command Center box: unread messages from Atlas, and
// whether this block has skills/rules switched on. Click through to the block —
// its Atlas dock opens the messages. One shared fetch serves every box.

import { useEffect, useState } from 'react';
import { dbSelect } from '@/lib/db';

interface MsgRow { department: string; read: boolean | null; }
interface SkillRow { scope: string | null; active: boolean | null; }

let cache: Promise<{ msgs: MsgRow[]; skills: SkillRow[] }> | null = null;
function load() {
  if (!cache) {
    cache = Promise.all([
      dbSelect<MsgRow>('atlas_messages', 'select=department,read&read=eq.false').catch(() => [] as MsgRow[]),
      dbSelect<SkillRow>('atlas_skills', 'select=scope,active&active=eq.true').catch(() => [] as SkillRow[]),
    ]).then(([msgs, skills]) => ({ msgs, skills }));
  }
  return cache;
}

export function BoxAtlasCount({ dept }: { dept: string }) {
  const [state, setState] = useState<{ unread: number; skills: number } | null>(null);

  useEffect(() => {
    load()
      .then(({ msgs, skills }) => setState({
        unread: msgs.filter((m) => m.department === dept).length,
        skills: skills.filter((s) => s.scope === dept || s.scope === 'all').length,
      }))
      .catch(() => setState({ unread: 0, skills: 0 }));
  }, [dept]);

  if (!state) return <span className="box-atlas" />;

  return (
    <span className="box-atlas">
      <span
        className={`box-msgnum ${state.unread ? 'lit' : 'zero'}`}
        title={state.unread ? `${state.unread} message${state.unread > 1 ? 's' : ''} from Atlas — open the block to read` : 'no new messages from Atlas on this block'}
      >
        <em>✉</em>{state.unread}
      </span>
      <span
        className={`box-skilldot ${state.skills ? 'on' : 'off'}`}
        title={state.skills ? `${state.skills} skill/rule${state.skills > 1 ? 's' : ''} active for this block` : 'no skills or rules on for this block yet'}
      />
    </span>
  );
}
