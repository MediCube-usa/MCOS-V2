// MCOS interlocking-knot mark as scalable SVG. Two rounded loops woven together.
// - default (brand): royal-blue left loop, cyan right loop — the full-color mark.
// - tint: pass an agent/department color and the whole mark takes that color
//   (left strand solid, right strand lightened) so the logo becomes that agent.
//
// NOTE: this is a faithful SVG recreation, not the exact raster. Drop the real
// PNG/SVG into /public and swap the <img> in one place for a 1:1 match.

function sanitize(s: string) {
  return s.replace(/[^a-zA-Z0-9]/g, '');
}

export function Logo({ size = 40, tint }: { size?: number; tint?: string }) {
  const id = tint ? `mcos-${sanitize(tint)}` : 'mcos-brand';
  const leftStroke = tint ? tint : `url(#${id}-l)`;
  const rightStroke = tint ? tint : `url(#${id}-r)`;

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" role="img" aria-label="MCOS"
      style={{ filter: `drop-shadow(0 0 ${size / 5}px ${tint ? hexGlow(tint) : 'rgba(47,150,255,.55)'})`, display: 'block' }}>
      {!tint && (
        <defs>
          <linearGradient id={`${id}-l`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1a54ff" /><stop offset="1" stopColor="#3f86ff" />
          </linearGradient>
          <linearGradient id={`${id}-r`} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6fe6ff" /><stop offset="1" stopColor="#2fb0ff" />
          </linearGradient>
        </defs>
      )}
      <g fill="none" strokeLinejoin="round" strokeLinecap="round">
        {/* white halo behind both loops */}
        <rect x="22" y="34" width="52" height="52" rx="18" transform="rotate(45 48 60)" stroke="#eaf2ff" strokeWidth="21" />
        <rect x="46" y="34" width="52" height="52" rx="18" transform="rotate(45 72 60)" stroke="#eaf2ff" strokeWidth="21" />
        {/* colored loops */}
        <rect x="22" y="34" width="52" height="52" rx="18" transform="rotate(45 48 60)" stroke={leftStroke} strokeWidth="12.5" />
        <rect x="46" y="34" width="52" height="52" rx="18" transform="rotate(45 72 60)" stroke={rightStroke} strokeWidth="12.5" />
        {/* right strand lightened for the two-tone weave look when tinted */}
        {tint && (
          <rect x="46" y="34" width="52" height="52" rx="18" transform="rotate(45 72 60)" stroke="#ffffff" strokeOpacity="0.30" strokeWidth="12.5" />
        )}
        {/* left over-strand at the top crossing, to read as woven */}
        <rect x="22" y="34" width="52" height="52" rx="18" transform="rotate(45 48 60)" stroke={leftStroke} strokeWidth="12.5"
          strokeDasharray="20 300" strokeDashoffset="-6" />
      </g>
    </svg>
  );
}

// a soft glow color from a hex tint
function hexGlow(hex: string) {
  return `${hex}88`;
}
