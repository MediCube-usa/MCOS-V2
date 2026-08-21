'use client';

// The shared physical coil layout — every machine in the fleet (VC 8010-22S) uses this
// exact arrangement, laid out as SIX TRAY ROWS top-to-bottom like the real machine face
// (Joe, 2026-08-20). Coil 51 sits on the BOTTOM row. EVERY TRAY IS THE SAME WIDTH: the top
// three trays and the bottom tray are DOUBLES (each coil spans two single-widths), the middle
// two trays are SINGLES — so 5 doubles fill the same width as 10 singles.
//
// Each coil stores its physical spiral PITCH (mm). Pitch sets the units it holds (facings),
// which is the true max inventory per coil and drives the research fit-check + refill triggers
// (Joe, 2026-08-21).

import { useEffect, useMemo, useState } from 'react';
import { dbSelect, dbUpdate } from '@/lib/db';

// Pitch -> units spec. 105mm and 130mm exist on the spec sheet but MediCube never received
// them, so they're shown greyed and excluded from the quick picker's stocked set.
const PITCHES = [
  { mm: 28, units: 15, stocked: true },
  { mm: 38, units: 11, stocked: true },
  { mm: 60, units: 7, stocked: true },
  { mm: 70, units: 6, stocked: true },
  { mm: 86, units: 5, stocked: true },
  { mm: 105, units: 4, stocked: false },
  { mm: 130, units: 3, stocked: false },
];
const UNITS_BY_PITCH: Record<number, number> = Object.fromEntries(PITCHES.map((p) => [p.mm, p.units]));

const TRAYS: { label: string; coils: number[]; wide: boolean }[] = [
  { label: 'TRAY 1 · doubles', coils: [1, 3, 5, 7, 9], wide: true },
  { label: 'TRAY 2 · doubles', coils: [11, 13, 15, 17, 19], wide: true },
  { label: 'TRAY 3 · doubles', coils: [21, 23, 25, 27, 29], wide: true },
  { label: 'TRAY 4 · singles', coils: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40], wide: false },
  { label: 'TRAY 5 · singles', coils: [41, 42, 43, 44, 45, 46, 47, 48, 49, 50], wide: false },
  { label: 'TRAY 6 · doubles', coils: [51, 53, 55, 57, 59], wide: true },
];

interface CoilRow { coil: number; pitch_mm: number | null; }

export function CoilMap() {
  const [pitch, setPitch] = useState<Record<number, number | null>>({});
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [msg, setMsg] = useState('');
  const [sel, setSel] = useState<number | null>(null);
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 2200); };

  useEffect(() => {
    (async () => {
      try {
        const rows = await dbSelect<CoilRow>('coil_layout', 'select=coil,pitch_mm&order=coil.asc');
        const map: Record<number, number | null> = {};
        for (const r of rows) map[r.coil] = r.pitch_mm;
        setPitch(map); setStatus('ready');
      } catch (e) { setStatus('error'); setMsg(e instanceof Error ? e.message : 'load failed'); }
    })();
  }, []);

  // write one coil's pitch (null clears it)
  const assign = async (coil: number, mm: number | null) => {
    setPitch((p) => ({ ...p, [coil]: mm }));
    try { await dbUpdate('coil_layout', `coil=eq.${coil}`, { pitch_mm: mm }); }
    catch { flash('Save failed'); }
  };
  // write every coil in a tray at once (PostgREST in-list patch)
  const assignTray = async (coils: number[], mm: number | null) => {
    setPitch((p) => { const n = { ...p }; for (const c of coils) n[c] = mm; return n; });
    try { await dbUpdate('coil_layout', `coil=in.(${coils.join(',')})`, { pitch_mm: mm }); flash(mm ? `Tray set to ${mm}mm` : 'Tray cleared'); }
    catch { flash('Save failed'); }
  };

  const totals = useMemo(() => {
    let set = 0, units = 0;
    for (const t of TRAYS) for (const c of t.coils) {
      const mm = pitch[c];
      if (mm) { set++; units += UNITS_BY_PITCH[mm] || 0; }
    }
    return { set, units };
  }, [pitch]);

  const selTray = sel != null ? TRAYS.find((t) => t.coils.includes(sel)) : undefined;

  if (status === 'loading') return <div className="section"><p>Loading coil map…</p></div>;
  if (status === 'error') return <div className="banner building">Could not load coil map: {msg}</div>;

  return (
    <div>
      <p className="hub-note">Every machine has this <b>same coil setup</b> — 40 selections on six trays, shown
        top-to-bottom the way you see them at the machine (coil <b>51 sits on the bottom row</b>). Each coil stores
        its physical <b>spiral pitch (mm)</b>, and the pitch sets how many units it holds — the true max inventory
        per coil. Tap a coil to set its pitch, or set a whole tray at once. Capacity, the <b>Inventory</b> block,
        and the research fit-check all read from these numbers.</p>

      {/* pitch reference */}
      <div className="pitch-legend">
        <span className="pl-title">PITCH → UNITS</span>
        {PITCHES.map((p) => (
          <span key={p.mm} className={`pl-chip ${p.stocked ? '' : 'pl-out'}`} title={p.stocked ? 'in our fleet' : 'never received — not in our fleet'}>
            {p.mm}mm<b>{p.units}u</b>{!p.stocked && <em>n/a</em>}
          </span>
        ))}
      </div>

      {/* capacity summary */}
      <div className="sb-bar">
        <div className="sb-counts">
          <span className="sb-count"><b>{totals.units.toLocaleString()}</b> units — full machine capacity</span>
          <span className="sb-count"><b>{totals.set}</b> / 40 coils set</span>
        </div>
      </div>
      {msg && <div className="sb-msg">{msg}</div>}

      {/* the tray map */}
      <div className="coilmap">
        {TRAYS.map((t) => (
          <div className="coil-band" key={t.label}>
            <div className="coil-band-label">{t.label}</div>
            <div className="coil-row-grid">
              {t.coils.map((c) => {
                const mm = pitch[c];
                const u = mm ? UNITS_BY_PITCH[mm] : null;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSel(sel === c ? null : c)}
                    className={`coil ${t.wide ? 'wide' : ''} ${mm ? 'coil-set' : ''} ${sel === c ? 'coil-sel' : ''}`}
                    style={{ gridColumn: `span ${t.wide ? 2 : 1}` }}
                  >
                    {c}
                    <em className="coil-meta">{mm ? `${mm}→${u}u` : '—'}</em>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* editor bar */}
      {sel != null ? (
        <div className="coil-editor">
          <div className="ce-head">Coil <b>{sel}</b> · {selTray?.label}</div>
          <div className="ce-pitches">
            {PITCHES.filter((p) => p.stocked).map((p) => (
              <button key={p.mm} className={`ce-pitch ${pitch[sel] === p.mm ? 'on' : ''}`} onClick={() => assign(sel, p.mm)}>
                {p.mm}mm · {p.units}u
              </button>
            ))}
            <button className="ce-pitch ce-clear" onClick={() => assign(sel, null)}>clear</button>
          </div>
          {selTray && (
            <div className="ce-tray">
              <span>Apply to whole {selTray.label.split(' · ')[0].toLowerCase()}:</span>
              {PITCHES.filter((p) => p.stocked).map((p) => (
                <button key={p.mm} className="ce-traybtn" onClick={() => assignTray(selTray.coils, p.mm)}>{p.mm}mm</button>
              ))}
              <button className="ce-traybtn ce-clear" onClick={() => assignTray(selTray.coils, null)}>clear</button>
            </div>
          )}
        </div>
      ) : (
        <p className="tbl-cap">Tap any coil above to set its pitch. Doubles and singles can each be any pitch — pitch is the
          spiral spacing, independent of coil width.</p>
      )}

      {/* machine spec */}
      <div className="section" style={{ marginTop: 16 }}>
        <h3>Machine — VC 8010-22S</h3>
        <div className="spec-grid">
          <span><b>22&quot;</b> touchscreen</span>
          <span><b>40</b> selections</span>
          <span><b>6</b> shelves</span>
          <span><b>5-wide</b> config</span>
          <span><b>dual</b> spirals</span>
          <span><b>485</b> lb</span>
          <span>49.65&quot; W × 30.35&quot; D × 76.38&quot; H</span>
        </div>
        <p className="tbl-cap">Factory spec (vc8010-22s.pdf). Pitches 105mm &amp; 130mm are on the spec sheet but were
          never received, so they&apos;re marked n/a above and left out of the quick picker.</p>
      </div>
    </div>
  );
}
