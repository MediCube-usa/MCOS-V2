/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from 'react';

// The real MCOS knot mark (transparent cut-out of the brand logo).
// Full-color for brand placements — the white outline is baked into the art.
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

const MASK: CSSProperties = {
  position: 'absolute',
  inset: 0,
  WebkitMaskImage: 'url(/mcos-mark.png)',
  maskImage: 'url(/mcos-mark.png)',
  WebkitMaskSize: 'contain',
  maskSize: 'contain',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskPosition: 'center',
  maskPosition: 'center'
};

// A recolored mark with a white outline: a white copy of the knot sits slightly
// larger behind the colored copy, so white shows as an edge all the way around.
function OutlinedMark({ size, fill, glow }: { size: number; fill: string; glow: string }) {
  const grow = 1 + Math.max(0.055, 4.5 / size); // thin white edge (kept, just lighter)
  return (
    <span
      aria-label="MCOS"
      role="img"
      style={{ position: 'relative', display: 'inline-block', width: size, height: size, filter: `drop-shadow(0 0 ${size / 5}px ${glow})` }}
    >
      <span style={{ ...MASK, background: '#ffffff', transform: `scale(${grow})`, transformOrigin: 'center' }} />
      <span style={{ ...MASK, background: fill }} />
    </span>
  );
}

// Rainbow mark (Atlas) — the knot filled with a full-spectrum sweep, white outline.
export function LogoRainbow({ size = 54 }: { size?: number }) {
  const grow = 1 + Math.max(0.055, 4.5 / size);
  return (
    <span aria-label="MCOS" role="img" style={{ position: 'relative', display: 'inline-block', width: size, height: size, filter: `drop-shadow(0 0 ${size / 5}px rgba(150,120,255,.55))` }}>
      <span style={{ ...MASK, background: '#ffffff', transform: `scale(${grow})`, transformOrigin: 'center' }} />
      <span style={{ ...MASK, background: 'conic-gradient(from 210deg, #ff3df2, #8b5cff, #2f7bff, #00ffea, #4dff88, #caff00, #ff8c1a, #ff3df2)' }} />
    </span>
  );
}

// The mark recolored to one color (per-agent), with the white outline.
export function LogoTint({ size = 34, color }: { size?: number; color: string }) {
  return <OutlinedMark size={size} fill={color} glow={`${color}aa`} />;
}
