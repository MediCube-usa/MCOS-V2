// MCOS interlocking-knot mark, recreated as SVG so it scales cleanly and glows
// in the neon theme. Two rounded loops (royal blue + cyan) interlaced, white halo.
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-label="MCOS" role="img"
      style={{ filter: 'drop-shadow(0 0 10px rgba(47,150,255,.55))' }}>
      <defs>
        <linearGradient id="mcosL" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1e5bff" />
          <stop offset="1" stopColor="#3b82ff" />
        </linearGradient>
        <linearGradient id="mcosR" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#67e3ff" />
          <stop offset="1" stopColor="#2fb2ff" />
        </linearGradient>
      </defs>
      <g fill="none" strokeLinejoin="round" strokeLinecap="round">
        {/* white halo behind both loops */}
        <rect x="21" y="33" width="54" height="54" rx="17" transform="rotate(45 48 60)" stroke="#e6f0ff" strokeWidth="22" />
        <rect x="45" y="33" width="54" height="54" rx="17" transform="rotate(45 72 60)" stroke="#e6f0ff" strokeWidth="22" />
        {/* colored loops */}
        <rect x="21" y="33" width="54" height="54" rx="17" transform="rotate(45 48 60)" stroke="url(#mcosL)" strokeWidth="13" />
        <rect x="45" y="33" width="54" height="54" rx="17" transform="rotate(45 72 60)" stroke="url(#mcosR)" strokeWidth="13" />
        {/* short over-strand on the left loop to suggest the weave */}
        <path d="M48 39 L34 53" stroke="url(#mcosL)" strokeWidth="13" />
      </g>
    </svg>
  );
}
