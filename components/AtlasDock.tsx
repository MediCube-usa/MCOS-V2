'use client';
// The Atlas dock — Atlas, present in every department. Wide and short, top-right
// of the page, so Joe can work a block and work WITH Atlas without going back to
// the Command Center.
//
// Layout (Joe's markup):
//   [logo = skills button] [skill dot green/red]   [⏰ cal alerts] [✉ Atlas msgs]
//   ── messages / chat ──
//   [📎 Upload] [🎤] [ ask or tell Atlas… ] [Ask]
//
// Same Atlas, same backend as the Command Center box — it just knows which
// department it is standing in, so its answers and its skills are that block's.

import { useEffect, useRef, useState } from 'react';
import { LogoRainbow } from '@/components/Logo';
import { dbSelect, dbUpdate } from '@/lib/db';
import { getDepartment } from '@/lib/departments';
import { alertLevel, fetchCalendar, fmtWhen, CalItem } from '@/lib/appointments';

interface Msg { role: 'user' | 'assistant'; content: string; }
interface AtlasMessage { id: string; kind: string | null; title: string; body: string | null; read: boolean | null; created_at: string; }
interface SkillRow { id: string; name: string; active: boolean | null; kind: string | null; }

type Tab = 'chat' | 'msgs' | 'cal';

export function AtlasDock({ dept }: { dept: string }) {
  const d = getDepartment(dept);
  const color = d?.color || '#6fe4ff';

  const [tab, setTab] = useState<Tab>('chat');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState<{ name: string; mediaType: string; dataUrl: string }[]>([]);
  const [notes, setNotes] = useState<AtlasMessage[]>([]);
  const [cal, setCal] = useState<CalItem[]>([]);
  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<unknown>(null);

  const loadNotes = () =>
    dbSelect<AtlasMessage>('atlas_messages', `select=*&department=eq.${dept}&order=created_at.desc&limit=25`)
      .then(setNotes).catch(() => setNotes([]));

  // Tapping a tab twice comes back to the chat. Messages refresh only when that
  // tab is opened — the chat never polls on its own.
  const openTab = (t: Tab) => {
    const next = tab === t ? 'chat' : t;
    setTab(next);
    if (next === 'msgs') loadNotes();
  };

  // Everything this block needs: Atlas's messages, its due dates, its skills.
  useEffect(() => {
    loadNotes();
    dbSelect<SkillRow>('atlas_skills', `select=id,name,active,kind&or=(scope.eq.${dept},scope.eq.all)`)
      .then(setSkills).catch(() => setSkills([]));
    fetchCalendar(dept).then((all) => setCal(all.filter((i) => alertLevel(i) !== 'later'))).catch(() => setCal([]));
  }, [dept]);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    setVoiceSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight }); }, [msgs, busy, tab]);

  const activeSkills = skills.filter((s) => s.active).length;
  const unread = notes.filter((n) => !n.read).length;

  const onPick = (list: FileList | null) => {
    if (!list) return;
    Array.from(list).slice(0, 6).forEach((f) => {
      if (f.size > 12 * 1024 * 1024) { alert(`${f.name} is too big (max 12MB).`); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || '');
        if (dataUrl) setFiles((xs) => [...xs, { name: f.name, mediaType: f.type || 'application/octet-stream', dataUrl }].slice(0, 6));
      };
      reader.readAsDataURL(f);
    });
  };

  const toggleMic = () => {
    const w = window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;
    if (listening) { (recRef.current as { stop?: () => void } | null)?.stop?.(); setListening(false); return; }
    const rec = new Ctor() as {
      lang: string; interimResults: boolean; continuous: boolean;
      onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
      onend: () => void; onerror: () => void; start: () => void; stop: () => void;
    };
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = '';
    rec.onresult = (e) => {
      let interim = '';
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i] as ArrayLike<{ transcript: string }> & { isFinal?: boolean };
        if ((r as { isFinal?: boolean }).isFinal) finalText += r[0].transcript; else interim += r[0].transcript;
      }
      setInput((finalText + interim).trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  const send = async () => {
    const text = input.trim();
    if ((!text && files.length === 0) || busy) return;
    setTab('chat');
    const tag = files.length ? `${text ? text + '\n' : ''}📎 ${files.map((f) => f.name).join(', ')}` : text;
    const next: Msg[] = [...msgs, { role: 'user', content: tag }];
    setMsgs(next);
    const attachments = files.map((f) => ({ name: f.name, mediaType: f.mediaType, dataBase64: f.dataUrl.split(',')[1] || '' }));
    setInput(''); setFiles([]); setBusy(true);
    try {
      const r = await fetch('/api/agent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, attachments, dept }),
      });
      const j = (await r.json().catch(() => ({}))) as { reply?: string; error?: string };
      setMsgs((xs) => [...xs, { role: 'assistant', content: j.reply || j.error || `No answer came back (${r.status}).` }]);
    } catch {
      setMsgs((xs) => [...xs, { role: 'assistant', content: 'Could not reach the server — check the connection and try again.' }]);
    } finally { setBusy(false); }
  };

  const markRead = async (m: AtlasMessage) => {
    if (m.read) return;
    setNotes((xs) => xs.map((x) => (x.id === m.id ? { ...x, read: true } : x)));
    try { await dbUpdate('atlas_messages', `id=eq.${m.id}`, { read: true }); } catch { /* view-only failure is fine */ }
  };

  const skillsHref = `/atlas-skills?dept=${encodeURIComponent(dept)}`;

  return (
    <aside className="atlas-dock" style={{ ['--c' as string]: color }}>
      <div className="dock-head">
        <div className="dock-tabs">
          <button
            className={`${tab === 'msgs' ? 'on' : ''} ${unread ? 'hasnew' : ''}`}
            onClick={() => openTab('msgs')}
            title="Messages from Atlas"
          >
            <em>✉</em><b>Msgs</b><span>{unread || notes.length}</span>
          </button>
          <button
            className={`${tab === 'cal' ? 'on' : ''} ${cal.length ? 'hasnew' : ''}`}
            onClick={() => openTab('cal')}
            title="Calendar alerts for this block"
          >
            <em>⏰</em><b>Cal</b><span>{cal.length}</span>
          </button>
        </div>
        {/* The logo IS the button — opens this department's skills & rules. */}
        <a
          className={`skill-dot ${activeSkills > 0 ? 'on' : 'off'}`}
          href={skillsHref}
          title={activeSkills > 0
            ? `${activeSkills} skill${activeSkills > 1 ? 's' : ''}/rules active here — click to manage`
            : 'no skills or rules on for this block yet — click to teach Atlas'}
        >
          <em />{activeSkills}
        </a>
        <a className="dock-logo" href={skillsHref} title={`Atlas skills, rules & workflow for ${d?.name || dept}`}>
          <LogoRainbow size={40} />
          <span className="dock-logo-word">Atlas</span>
        </a>
      </div>

      <div ref={logRef} className="dock-body">
        {tab === 'chat' && (
          <>
            {msgs.length === 0 && !busy && (
              <div className="dock-msg bot">Working {d?.name || 'this block'}. Tell me what to do — or upload a photo or document and I&apos;ll file it.</div>
            )}
            {msgs.map((m, i) => <div key={i} className={`dock-msg ${m.role === 'user' ? 'user' : 'bot'}`}>{m.content}</div>)}
            {busy && <div className="dock-thinking">Atlas is working…</div>}
          </>
        )}

        {tab === 'msgs' && (
          notes.length === 0
            ? <div className="dock-empty">No messages from Atlas on this block yet. Completed work and things needing attention land here.</div>
            : notes.map((m) => (
              <div key={m.id} className={`dock-note ${m.read ? '' : 'unread'} k-${m.kind || 'note'}`} onClick={() => markRead(m)}>
                <b>{m.title}</b>
                {m.body && <span>{m.body}</span>}
                <i>{new Date(m.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</i>
              </div>
            ))
        )}

        {tab === 'cal' && (
          cal.length === 0
            ? <div className="dock-empty">Nothing due on this block. Say &quot;remind me…&quot; and Atlas puts it on the real calendar.</div>
            : cal.map((i, n) => (
              <div key={n} className={`dock-note cal-${alertLevel(i)}`}>
                <b>{i.title}</b>
                <i>{fmtWhen(i)}</i>
              </div>
            ))
        )}
      </div>

      {files.length > 0 && (
        <div className="dock-files">
          {files.map((f, i) => (
            <span key={i} className="atlas-file">
              📎 {f.name.length > 18 ? f.name.slice(0, 15) + '…' : f.name}
              <button onClick={() => setFiles((xs) => xs.filter((_, j) => j !== i))} title="Remove">×</button>
            </span>
          ))}
        </div>
      )}

      <div className="dock-row">
        <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple style={{ display: 'none' }}
          onChange={(e) => { onPick(e.target.files); e.target.value = ''; }} />
        <button className="dock-btn" onClick={() => fileRef.current?.click()} disabled={busy} title="Upload an image or PDF">📎</button>
        {voiceSupported && (
          <button className={`dock-btn talk ${listening ? 'live' : ''}`} onClick={toggleMic} title={listening ? 'Listening… tap to stop' : 'Talk to Atlas'}>🎤 <b>Talk</b></button>
        )}
        <input className="dock-input" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder={listening ? 'Listening…' : 'Ask or tell Atlas — press Enter'} disabled={busy} />
      </div>
    </aside>
  );
}
