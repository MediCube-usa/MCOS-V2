// The shared physical coil layout — every machine in the fleet uses this exact
// arrangement (verified against live_slots): odd-numbered coils 1–29 and 53–59 are
// WIDE slots, coils 31–51 run continuously as STANDARD slots. 40 coils total.
// Laid out as SIX TRAY ROWS, top to bottom, exactly like standing in front of
// the machine (Joe, 2026-08-20). Swap products like-for-like by slot width.

const TRAYS: { label: string; coils: number[]; wide: boolean }[] = [
  { label: 'TRAY 1 · coils 1–9 · WIDE', coils: [1, 3, 5, 7, 9], wide: true },
  { label: 'TRAY 2 · coils 11–19 · WIDE', coils: [11, 13, 15, 17, 19], wide: true },
  { label: 'TRAY 3 · coils 21–29 · WIDE', coils: [21, 23, 25, 27, 29], wide: true },
  { label: 'TRAY 4 · coils 31–40 · STANDARD', coils: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40], wide: false },
  { label: 'TRAY 5 · coils 41–51 · STANDARD', coils: [41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51], wide: false },
  { label: 'TRAY 6 · coils 53–59 · WIDE', coils: [53, 55, 57, 59], wide: true },
];

function CoilRow({ coils, wide, label }: { coils: number[]; wide?: boolean; label: string }) {
  return (
    <div className="coil-band">
      <div className="coil-band-label">{label}</div>
      <div className="coil-row">
        {coils.map((c) => <span key={c} className={`coil ${wide ? 'wide' : ''}`}>{c}</span>)}
      </div>
    </div>
  );
}

export function CoilMap() {
  return (
    <div>
      <p className="hub-note">Every machine has this <b>same coil setup</b> — 40 coils on six trays, shown here
        top-to-bottom the way you see them standing at the machine. <b>Wide</b> slots (the odd-numbered coils on
        trays 1–3 and 6) take the bigger items; <b>standard</b> slots (trays 4–5, coils 31–51) take the regular
        travel-size items. Real fill capacities run about 4–15 units per coil depending on product depth
        (see any planogram sheet); OurVend&apos;s reported capacity (199) is a default, not the physical fill.</p>

      <div className="coilmap">
        {TRAYS.map((t) => <CoilRow key={t.label} label={t.label} coils={t.coils} wide={t.wide} />)}
      </div>

      <div className="section" style={{ marginTop: 14 }}>
        <h3>Using this map</h3>
        <p>Planogram templates (built on the Templates block) assign a product, price and fill count to each of
          these 40 coils. Because the layout never changes machine-to-machine, any planogram fits any machine —
          the only rule is width: a wide-slot product can&apos;t drop into 31–51, and a standard item rattles in a
          wide coil unless the sheet says otherwise.</p>
      </div>
    </div>
  );
}
