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

// The same mark recolored to a single color via CSS mask — used to give each
// agent the logo in its own department color.
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
        WebkitMaskImage: 'url(/mcos-mark.png)',
        maskImage: 'url(/mcos-mark.png)',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        filter: `drop-shadow(0 0 ${size / 5}px ${color}aa)`
      }}
    />
  );
}
