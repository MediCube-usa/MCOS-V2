// The shared physical coil layout — every machine in the fleet uses this exact
// arrangement, laid out as SIX TRAY ROWS top-to-bottom like the real machine face
// (Joe, 2026-08-20). Coil 51 sits on the BOTTOM row. EVERY TRAY IS THE SAME WIDTH,
// mirroring the machine: the top three trays and the bottom tray are DOUBLES (each
// coil spans two single-widths), the middle two trays are SINGLES. So 5 doubles fill
// the same tray width as 10 singles — the rows line up edge-to-edge like the machine.
//
// Each coil has a SIZE that sets its FACINGS (how many products deep it holds) —
// more facings = fewer refills = more profit. Joe loads the sizes; until then the
// size/facings line shows "—". Those facings also seed inventory capacity per slot
// and the research coil-fit check (does a product's packaging fit this coil).

const TRAYS: { label: string; coils: number[]; wide: boolean }[] = [
  { label: 'TRAY 1 · coils 1–9 · WIDE', coils: [1, 3, 5, 7, 9], wide: true },
  { label: 'TRAY 2 · coils 11–19 · WIDE', coils: [11, 13, 15, 17, 19], wide: true },
  { label: 'TRAY 3 · coils 21–29 · WIDE', coils: [21, 23, 25, 27, 29], wide: true },
  { label: 'TRAY 4 · coils 31–40 · STANDARD', coils: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40], wide: false },
  { label: 'TRAY 5 · coils 41–50 · STANDARD', coils: [41, 42, 43, 44, 45, 46, 47, 48, 49, 50], wide: false },
  { label: 'TRAY 6 · coils 51–59 · WIDE', coils: [51, 53, 55, 57, 59], wide: true },
];

// Per-coil size + facings — Joe loads these. Shape ready: { [coil]: { size, facings } }.
// facings = how many units that coil holds (drives inventory capacity + refill trigger).
const COIL_META: Record<number, { size?: string; facings?: number }> = {};

function CoilRow({ coils, wide, label }: { coils: number[]; wide?: boolean; label: string }) {
  // Every tray is 10 single-widths across. A DOUBLE spans 2 of those columns, a
  // SINGLE spans 1 — so a 5-double row and a 10-single row are exactly the same width.
  return (
    <div className="coil-band">
      <div className="coil-band-label">{label}</div>
      <div className="coil-row-grid">
        {coils.map((c) => {
          const m = COIL_META[c];
          return (
            <span key={c} className={`coil ${wide ? 'wide' : ''}`} style={{ gridColumn: `span ${wide ? 2 : 1}` }}>
              {c}
              <em className="coil-meta">{m?.facings ? `${m.facings}×` : (m?.size || '—')}</em>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function CoilMap() {
  return (
    <div>
      <p className="hub-note">Every machine has this <b>same coil setup</b> — 40 coils on six trays, shown
        top-to-bottom the way you see them at the machine (coil <b>51 sits on the bottom row</b>). Each coil&apos;s
        <b> size</b> sets its <b>facings</b> — how many units it holds going back. More facings = fewer refills =
        more profit. The little number under each coil is its facings/size; it reads <b>—</b> until the coil sizes
        are loaded, then it feeds inventory capacity and the research fit-check.</p>

      <div className="coilmap">
        {TRAYS.map((t) => <CoilRow key={t.label} label={t.label} coils={t.coils} wide={t.wide} />)}
      </div>

      <div className="section" style={{ marginTop: 14 }}>
        <h3>Coil sizes &amp; facings — loading next</h3>
        <p>Joe is loading the physical <b>size of each coil</b>, which sets how many products deep it holds
          (facings). Once in, each coil above shows its capacity, the <b>Inventory</b> block auto-fills per-slot
          capacity from it, and the <b>Research</b> tab can check a new product&apos;s packaging size against every
          coil to show exactly which slots it fits — so we pick the size/brand/packaging that maximizes units per
          coil and cuts refill frequency.</p>
      </div>
    </div>
  );
}
