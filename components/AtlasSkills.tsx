'use client';
// Atlas Skills — Joe's own knowledge packs. Each row is appended to Atlas's
// instructions on EVERY message (see loadSkills() in app/api/agent/route.ts), so
// teaching Atlas something new is just adding a row here — no rebuild, no deploy.

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { dbSelect, dbInsert, dbUpdate, dbDelete } from '@/lib/db';
import { blockDepartments, getDepartment } from '@/lib/departments';
import { DEPT_SPECS } from '@/lib/dept-specs';

interface Skill {
  id: string;
  name: string;
  scope: string | null;
  kind: string | null;
  body: string;
  active: boolean | null;
}

// What Joe can file here — not just "skills": rules, guidelines and workflow too.
const KINDS = ['skill', 'rule', 'guideline', 'workflow'] as const;

export function AtlasSkills() {
  // Arriving from a department's Atlas dock (?dept=inventory) focuses that block.
  const params = useSearchParams();
  const focus = params.get('dept') || '';
  const [rows, setRows] = useState<Skill[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [nm, setNm] = useState('');
  const [scope, setScope] = useState(focus || 'all');
  const [kind, setKind] = useState<string>('skill');
  const [onlyHere, setOnlyHere] = useState(!!focus);

  const scopes = ['all', ...blockDepartments().map((d) => d.id)];

  const load = async () => {
    try {
      setRows(await dbSelect<Skill>('atlas_skills', 'select=*&order=name.asc'));
      setStatus('ready');
    } catch (e) {
      setStatus('error');
      setMsg(e instanceof Error ? e.message : 'load failed');
    }
  };
  useEffect(() => { load(); }, []);
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 2500); };

  const add = async () => {
    const name = nm.trim();
    if (!name) { flash('Name the skill first'); return; }
    try {
      const created = await dbInsert('atlas_skills', { name, scope, kind, body: '', active: true });
      setRows((r) => [...r, created as Skill].sort((a, b) => a.name.localeCompare(b.name)));
      setNm(''); setAdding(false); setOpen((created as Skill).id);
      flash('Skill created — write what Atlas should know');
    } catch { flash('Could not create'); }
  };
  const patch = async (id: string, p: Partial<Skill>) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
    try { await dbUpdate('atlas_skills', `id=eq.${id}`, p); } catch { flash('Save failed'); }
  };
  const remove = async (id: string) => {
    setRows((rs) => rs.filter((r) => r.id !== id));
    if (open === id) setOpen(null);
    try { await dbDelete('atlas_skills', `id=eq.${id}`); flash('Deleted'); } catch { flash('Delete failed'); }
  };

  const shown = onlyHere && focus
    ? rows.filter((r) => r.scope === focus || r.scope === 'all')
    : rows;
  const live = shown.filter((r) => r.active).length;

  return (
    <div>
      {msg && <div className="sb-msg">{msg}</div>}
      {status === 'loading' && <div className="section"><p>Loading skills…</p></div>}
      {status === 'error' && <div className="banner building">Could not load: {msg}</div>}

      {status === 'ready' && (
        <div>
          <div className="sb-bar">
            <div className="sb-counts">
              <span className="sb-count"><b>{shown.length}</b> entries</span>
              <span className="sb-count"><b>{live}</b> active</span>
            </div>
            {focus && (
              <button className={`pd-stat ${onlyHere ? 'on' : ''}`} onClick={() => setOnlyHere((v) => !v)}>
                {onlyHere ? `showing ${focus}` : 'showing everything'}
              </button>
            )}
            {!adding
              ? <button className="pd-save" onClick={() => setAdding(true)}>+ New entry</button>
              : (
                <div className="sb-add">
                  <input placeholder="Skill name * (e.g. Refill rules, Weiner's ordering)" value={nm} onChange={(e) => setNm(e.target.value)} />
                  <select value={kind} onChange={(e) => setKind(e.target.value)}>
                    {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                  <select value={scope} onChange={(e) => setScope(e.target.value)}>
                    {scopes.map((s) => <option key={s} value={s}>{s === 'all' ? 'all blocks' : s}</option>)}
                  </select>
                  <button className="pd-save" onClick={add}>Create</button>
                  <button className="pd-link" onClick={() => setAdding(false)}>Cancel</button>
                </div>
              )}
          </div>

          {focus && DEPT_SPECS[focus] && (
            <div className="baseline">
              <div className="baseline-top">
                <b>Atlas already knows this about {getDepartment(focus)?.name || focus}</b>
                <span>built in — no need to write it</span>
              </div>
              <p className="baseline-purpose">{DEPT_SPECS[focus].purpose}</p>
              <div className="baseline-grid">
                <div><span>Owns</span><ul>{DEPT_SPECS[focus].owns.map((x) => <li key={x}>{x}</li>)}</ul></div>
                <div><span>Workflow</span><ol>{DEPT_SPECS[focus].workflow.map((x) => <li key={x}>{x}</li>)}</ol></div>
              </div>
              <p className="baseline-foot">Everything you add below stacks on top of this — rules, guidelines, workflow changes, and anything new as you grow.</p>
            </div>
          )}

          <p className="hub-note">A skill is knowledge you hand Atlas in your own words — rules, procedures,
            who to call, how you want something done, facts about a campus or supplier. Every <b>active</b> skill
            is loaded into Atlas on <b>every message</b>, so it takes effect immediately — no rebuild.
            Write it like you are telling a new manager how things work here.</p>

          <div className="fac-list">
            {shown.map((s) => {
              const isOpen = open === s.id;
              return (
                <div key={s.id} className={`tpl-card ${isOpen ? 'open' : ''}`}>
                  <div className="fac-top" onClick={() => setOpen(isOpen ? null : s.id)}>
                    <div>
                      <div className="fac-name">{s.name}</div>
                      <div className="fac-sub">
                        <span className="skill-kind">{s.kind || 'skill'}</span> · {s.scope && s.scope !== 'all' ? s.scope : 'all blocks'} · {s.body ? `${s.body.length} chars` : 'empty — nothing written yet'}
                      </div>
                    </div>
                    <span className={`skill-state ${s.active ? 'on' : 'off'}`}><em />{s.active ? 'ON' : 'OFF'}</span>
                  </div>
                  {isOpen && (
                    <div className="fac-body">
                      <div className="pd-grid" style={{ marginBottom: 10 }}>
                        <label className="pd-field"><span>Name</span>
                          <input value={s.name} onChange={(e) => patch(s.id, { name: e.target.value })} /></label>
                        <label className="pd-field"><span>Type</span>
                          <select value={s.kind || 'skill'} onChange={(e) => patch(s.id, { kind: e.target.value })}>
                            {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                          </select>
                        </label>
                        <label className="pd-field"><span>Applies to</span>
                          <select value={s.scope || 'all'} onChange={(e) => patch(s.id, { scope: e.target.value })}>
                            {scopes.map((x) => <option key={x} value={x}>{x === 'all' ? 'all blocks' : x}</option>)}
                          </select>
                        </label>
                        <label className="pd-field"><span>On / off</span>
                          <button className={`pd-stat ${s.active ? 'on' : ''}`} onClick={() => patch(s.id, { active: !s.active })}>
                            {s.active ? 'active ✓' : 'off'}
                          </button>
                        </label>
                      </div>
                      <label className="pd-field pd-wide"><span>What Atlas should know / do</span>
                        <textarea
                          className="skill-body"
                          rows={10}
                          value={s.body}
                          placeholder={'e.g.\n- Never change a price on a live machine without telling me first.\n- Weiner\'s LTD is the primary supplier; order Mondays.\n- ASU West: partner Gabriel handles on-site, text before visits.'}
                          onChange={(e) => patch(s.id, { body: e.target.value })}
                        />
                      </label>
                      <div className="pd-actions">
                        <button className="sb-remove" onClick={() => remove(s.id)}>Delete skill</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {shown.length === 0 && (
              <div className="section"><p>No skills yet. Add one and Atlas picks it up on the next message.</p></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
