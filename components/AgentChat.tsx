'use client';
// The Atlas chat — lives inside the agent card on the Command Center.
// Talks to /api/agent (server route; the Anthropic key never reaches the
// browser). Conversation is per-page-load; the data behind every answer is
// re-fetched fresh on the server for each message.
import { useEffect, useRef, useState } from 'react';
import { LogoRainbow } from '@/components/Logo';

interface Msg { role: 'user' | 'assistant'; content: string; }

export function AgentChat({ greeting }: { greeting: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [msgs, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next: Msg[] = [...msgs, { role: 'user', content: text }];
    setMsgs(next);
    setInput('');
    setBusy(true);
    try {
      const r = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      const j = (await r.json().catch(() => ({}))) as { reply?: string; error?: string };
      const reply = j.reply || j.error || `No answer came back (${r.status}).`;
      setMsgs((xs) => [...xs, { role: 'assistant', content: reply }]);
    } catch {
      setMsgs((xs) => [...xs, { role: 'assistant', content: 'Could not reach the server — check the connection and try again.' }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="agent-card">
      <div className="agentbadge">
        <LogoRainbow size={56} />
        <span className="agent-name">Atlas</span>
        <span className="agent-sub" style={{ color: '#b9a6ff' }}>Executive</span>
      </div>
      <div className="agent-card-body">
        <div className="t">Command Agent</div>
        <div ref={logRef} className="atlas-log">
          <div className="atlas-msg bot">{greeting}</div>
          {msgs.map((m, i) => (
            <div key={i} className={`atlas-msg ${m.role === 'user' ? 'user' : 'bot'}`}>{m.content}</div>
          ))}
          {busy && <div className="atlas-thinking">Atlas is checking the live data…</div>}
        </div>
        <div className="atlas-row">
          <input
            className="atlas-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            placeholder='Ask about the fleet, stock, dates — or "remind me…"'
            disabled={busy}
          />
          <button className="atlas-send" onClick={send} disabled={busy || !input.trim()}>Ask</button>
        </div>
      </div>
    </div>
  );
}
