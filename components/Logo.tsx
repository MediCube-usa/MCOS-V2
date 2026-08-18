/* eslint-disable @next/next/no-img-element */
// The real MCOS knot mark (transparent cut-out of the brand logo).
// Full-color for brand placements.
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <img
      src="/mcos-mark.png"
      alt="MCOS"
      width={size}
      height={size}
      style={{ display: 'block', objectFit: 'contain', filter: `drop-shadow(0 0 ${size / 6}px rgba(47,150,255,.45))` }}
    />
  );
}

// A crisp white edge around a masked mark, built from offset drop-shadows —
// like the original logo's white outline.
function whiteOutline(size: number) {
  const o = Math.max(1, Math.round(size / 20));
  const d = Math.round(o * 1.4);
  return [
    `${o}px 0 0 #fff`, `-${o}px 0 0 #fff`, `0 ${o}px 0 #fff`, `0 -${o}px 0 #fff`,
    `${d}px ${d}px 0 #fff`, `-${d}px -${d}px 0 #fff`, `${d}px -${d}px 0 #fff`, `-${d}px ${d}px 0 #fff`
  ].map((s) => `drop-shadow(${s})`).join(' ');
}

const MASK: React.CSSProperties = {
  WebkitMaskImage: 'url(/mcos-mark.png)',
  maskImage: 'url(/mcos-mark.png)',
  WebkitMaskSize: 'contain',
  maskSize: 'contain',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskPosition: 'center',
  maskPosition: 'center'
};

// Rainbow mark (Atlas) — the knot filled with a full-spectrum sweep, white outline.
export function LogoRainbow({ size = 54 }: { size?: number }) {
  return (
    <span
      aria-label="MCOS"
      role="img"
      style={{
        display: 'block',
        width: size,
        height: size,
        background: 'conic-gradient(from 210deg, #ff3df2, #8b5cff, #2f7bff, #00ffea, #4dff88, #caff00, #ff8c1a, #ff3df2)',
        ...MASK,
        filter: `${whiteOutline(size)} drop-shadow(0 0 ${size / 5}px rgba(150,120,255,.55))`
      }}
    />
  );
}

// The mark recolored to one color (per-agent), with the white outline.
export function LogoTint({ size = 34, color }: { size?: number; color: string }) {
  return (
    <span
      aria-label="MCOS"
      role="img"
      style={{
        display: 'block',
        width: size,
        height: size,
        background: color,
        ...MASK,
        filter: `${whiteOutline(size)} drop-shadow(0 0 ${size / 4}px ${color}aa)`
      }}
    />
  );
}
