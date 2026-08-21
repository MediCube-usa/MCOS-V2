'use client';
// The Atlas chat — lives inside the agent card on the Command Center.
// Talks to /api/agent (server route; the Anthropic key never reaches the
// browser). Conversation is per-page-load; the data behind every answer is
// re-fetched fresh on the server for each message.
//
// Voice: 🎤 dictation (browser SpeechRecognition where supported — the phone
// keyboard mic always works as a fallback) + 🔊 spoken replies (SpeechSynthesis).
import { useEffect, useRef, useState } from 'react';
import { LogoRainbow } from '@/components/Logo';

interface Msg { role: 'user' | 'assistant'; content: string; }

export function AgentChat({ greeting }: { greeting: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [speak, setSpeak] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<unknown>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [msgs, busy]);

  // Detect the browser's speech-to-text engine once (Chrome/Edge/Android).
  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    setVoiceSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  const say = (text: string) => {
    if (!speak || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.02;
      window.speechSynthesis.speak(u);
    } catch { /* ignore */ }
  };

  const toggleMic = () => {
    const w = window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;
    if (listening) {
      (recRef.current as { stop?: () => void } | null)?.stop?.();
      setListening(false);
      return;
    }
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
        const t = r[0].transcript;
        if ((r as { isFinal?: boolean }).isFinal) finalText += t;
        else interim += t;
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
      say(reply);
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
        <div className="t">
          Command Agent
          <button
            className={`atlas-speak ${speak ? 'on' : ''}`}
            onClick={() => { setSpeak((s) => !s); if (speak && window.speechSynthesis) window.speechSynthesis.cancel(); }}
            title={speak ? 'Atlas is reading replies aloud — tap to mute' : 'Tap so Atlas reads replies aloud'}
          >{speak ? '🔊' : '🔇'}</button>
        </div>
        <div ref={logRef} className="atlas-log">
          <div className="atlas-msg bot">{greeting}</div>
          {msgs.map((m, i) => (
            <div key={i} className={`atlas-msg ${m.role === 'user' ? 'user' : 'bot'}`}>{m.content}</div>
          ))}
          {busy && <div className="atlas-thinking">Atlas is checking the live data…</div>}
        </div>
        <div className="atlas-row">
          {voiceSupported && (
            <button
              className={`atlas-mic ${listening ? 'live' : ''}`}
              onClick={toggleMic}
              title={listening ? 'Listening… tap to stop' : 'Tap and speak'}
            >🎤</button>
          )}
          <input
            className="atlas-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            placeholder={listening ? 'Listening…' : 'Ask, or tap the mic and talk'}
            disabled={busy}
          />
          <button className="atlas-send" onClick={send} disabled={busy || !input.trim()}>Ask</button>
        </div>
      </div>
    </div>
  );
}
