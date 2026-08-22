'use client';
// The Screen Feed box on the Command Center — a real player, not a placeholder.
//
// Joe adds ad videos by pasting a link or uploading a file; the playlist lives in
// `screen_media`, so what plays changes without a rebuild. Autoplay + muted +
// looping (browsers only allow autoplay when muted), and a Picture-in-Picture
// pop-out so the reel can float over other windows.
//
// Handles three kinds: a direct video file, a YouTube link, and a still image
// (shown for its duration_sec). Anything Joe pastes is sniffed into one of those.
import { useCallback, useEffect, useRef, useState } from 'react';
import { dbSelect, dbInsert, dbDelete, uploadToBucket } from '@/lib/db';

interface Media {
  id: string;
  title: string;
  url: string;
  kind: string | null;
  duration_sec: number | null;
  sort: number | null;
}

// YouTube links come in several shapes; the player needs the /embed/ one.
function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : null;
}
function sniffKind(url: string): 'video' | 'youtube' | 'image' {
  if (youtubeId(url)) return 'youtube';
  if (/\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url)) return 'video';
  if (/\.(png|jpe?g|gif|webp|avif)(\?|$)/i.test(url)) return 'image';
  return 'video';
}

export function ScreenFeed() {
  const [items, setItems] = useState<Media[]>([]);
  const [idx, setIdx] = useState(0);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    dbSelect<Media>('screen_media', 'select=id,title,url,kind,duration_sec,sort&active=eq.true&machine_id=is.null&order=sort.asc,created_at.asc')
      .then((rows) => { setItems(rows); setIdx((i) => (i < rows.length ? i : 0)); })
      .catch(() => setItems([]));
  }, []);

  useEffect(() => { load(); }, [load]);

  const current = items[idx];
  const next = useCallback(() => setIdx((i) => (items.length ? (i + 1) % items.length : 0)), [items.length]);

  // Stills and YouTube don't fire 'ended', so they advance on a timer.
  useEffect(() => {
    if (!current || items.length < 2) return;
    if (current.kind === 'video') return;
    const secs = current.kind === 'image' ? (current.duration_sec || 12) : 60;
    const t = setTimeout(next, secs * 1000);
    return () => clearTimeout(t);
  }, [current, items.length, next]);

  const popOut = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      const doc = document as Document & { pictureInPictureElement?: Element | null };
      if (doc.pictureInPictureElement) await document.exitPictureInPicture();
      else await v.requestPictureInPicture();
    } catch { setNote('This browser blocked pop-out.'); }
  };

  const add = async (url: string, title: string) => {
    const clean = url.trim();
    if (!clean) return;
    setBusy(true); setNote('');
    try {
      await dbInsert('screen_media', {
        title: title || clean.split('/').pop()?.slice(0, 60) || 'Untitled',
        url: clean,
        kind: sniffKind(clean),
        sort: items.length,
      });
      setDraft(''); setAdding(false); load();
    } catch { setNote('Could not save that link.'); }
    finally { setBusy(false); }
  };

  const onPick = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > 90 * 1024 * 1024) { setNote('Too big — keep it under 90MB.'); return; }
    setBusy(true); setNote('Uploading…');
    try {
      const url = await uploadToBucket('mcos-docs', `screen/${f.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`, f);
      await add(url, f.name);
      setNote('');
    } catch { setNote('Upload failed.'); }
    finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    try { await dbDelete('screen_media', `id=eq.${id}`); load(); } catch { /* leave it */ }
  };

  return (
    <div className="video-box">
      <div className="video-head">
        <span>📺 Screen Feed</span>
        <span className="video-actions">
          {items.length > 1 && <button onClick={next} title="Next">⏭</button>}
          {current?.kind === 'video' && <button onClick={popOut} title="Pop out (Picture-in-Picture)">⧉</button>}
          <button onClick={() => setAdding((a) => !a)} title="Add a video or link">{adding ? '×' : '＋'}</button>
        </span>
      </div>

      <div className="video-screen">
        {!current && !adding && (
          <button className="video-empty" onClick={() => setAdding(true)}>
            <span className="video-play">▶</span>
            <b>Add an ad video</b>
            <i>paste a link or upload a file</i>
          </button>
        )}

        {current && current.kind === 'video' && (
          <video
            key={current.id}
            ref={videoRef}
            src={current.url}
            autoPlay
            muted
            playsInline
            loop={items.length === 1}
            onEnded={next}
            controls={false}
          />
        )}

        {current && current.kind === 'youtube' && (
          <iframe
            key={current.id}
            src={`https://www.youtube.com/embed/${youtubeId(current.url)}?autoplay=1&mute=1&loop=1&playlist=${youtubeId(current.url)}&controls=0&modestbranding=1&rel=0`}
            allow="autoplay; encrypted-media; picture-in-picture"
            title={current.title}
          />
        )}

        {current && current.kind === 'image' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={current.id} src={current.url} alt={current.title} />
        )}

        {adding && (
          <div className="video-add">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') add(draft, ''); }}
              placeholder="Paste a video or YouTube link…"
              disabled={busy}
            />
            <div className="video-add-row">
              <button onClick={() => add(draft, '')} disabled={busy || !draft.trim()}>Add link</button>
              <button onClick={() => fileRef.current?.click()} disabled={busy}>Upload file</button>
            </div>
            <input ref={fileRef} type="file" accept="video/*,image/*" style={{ display: 'none' }}
              onChange={(e) => { onPick(e.target.files?.[0]); e.target.value = ''; }} />
            {items.length > 0 && (
              <div className="video-list">
                {items.map((m, i) => (
                  <span key={m.id} className={i === idx ? 'on' : ''}>
                    <button onClick={() => { setIdx(i); setAdding(false); }} title={m.url}>{m.title.slice(0, 22)}</button>
                    <button className="x" onClick={() => remove(m.id)} title="Remove">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="video-note">
        {note || (current
          ? `${current.title.slice(0, 34)}${items.length > 1 ? ` · ${idx + 1}/${items.length}` : ''}`
          : 'no media yet — ＋ to add one')}
      </div>
    </div>
  );
}
