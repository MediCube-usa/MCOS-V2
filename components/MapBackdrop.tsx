// HUD world-map network backdrop — glowing nodes joined by arcs over a dot grid,
// echoing the command-center concept. Pure SVG, fixed behind all content.
// (For the exact concept image, drop it into /public and reference it here.)
const NODES: [number, number][] = [
  [16, 30], [24, 44], [30, 26], [38, 54], [46, 34], [52, 60],
  [60, 28], [66, 48], [72, 33], [78, 58], [84, 40], [90, 30],
  [20, 62], [34, 70], [58, 72], [70, 66], [82, 70], [44, 22]
];
const ARCS: [number, number, number, number][] = [
  [16, 30, 46, 34], [46, 34, 72, 33], [72, 33, 90, 30], [24, 44, 52, 60],
  [52, 60, 78, 58], [30, 26, 60, 28], [38, 54, 66, 48], [60, 28, 84, 40],
  [20, 62, 44, 22], [34, 70, 58, 72], [58, 72, 82, 70], [66, 48, 84, 40]
];

function arc(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  const my = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.35;
  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
}

export function MapBackdrop() {
  return (
    <div className="hud-backdrop" aria-hidden>
      <svg viewBox="0 0 100 80" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="hud-node" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#8fe8ff" stopOpacity="1" />
            <stop offset="0.4" stopColor="#2fb8ff" stopOpacity="0.7" />
            <stop offset="1" stopColor="#2fb8ff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g stroke="#4fd0ff" strokeWidth="0.18" fill="none" opacity="0.5">
          {ARCS.map((a, i) => <path key={i} d={arc(a[0], a[1], a[2], a[3])} />)}
        </g>
        <g>
          {NODES.map((n, i) => (
            <g key={i}>
              <circle cx={n[0]} cy={n[1]} r="2.6" fill="url(#hud-node)" />
              <circle cx={n[0]} cy={n[1]} r="0.7" fill="#dff6ff" />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
