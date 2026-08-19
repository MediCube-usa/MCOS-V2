// The shared physical coil layout — every machine in the fleet uses this exact
// arrangement (verified against live_slots): odd-numbered coils 1–29 and 53–59 are
// WIDE slots, coils 31–51 run continuously as STANDARD slots. 40 coils total.
// Swap products like-for-like by slot width so the new product physically fits.

const WIDE_TOP = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29];
const STANDARD = [31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51];
const WIDE_BOTTOM = [53, 55, 57, 59];

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
      <p className="hub-note">Every machine has this <b>same coil setup</b> — 40 coils. When you swap a product,
        replace it with one that fits the same slot type: <b>wide</b> slots (odd numbers, top and bottom bands)
        take the bigger items; <b>standard</b> slots (31–51) take the regular travel-size items.
        Real fill capacities run about 4–15 units per coil depending on product depth
        (see any planogram sheet); OurVend&apos;s reported capacity (199) is a default, not the physical fill.</p>

      <div className="coilmap">
        <CoilRow label={`WIDE · ${WIDE_TOP.length} coils`} coils={WIDE_TOP} wide />
        <CoilRow label={`STANDARD · ${STANDARD.length} coils`} coils={STANDARD} />
        <CoilRow label={`WIDE · ${WIDE_BOTTOM.length} coils`} coils={WIDE_BOTTOM} wide />
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
