/* eslint-disable @next/next/no-img-element */
// The MCOS HUD world-map concept, dimmed behind all pages, with a dark overlay
// so foreground content stays readable.
export function MapBackdrop() {
  return (
    <div className="hud-backdrop" aria-hidden>
      <img src="/mcos-hud-bg.png" alt="" />
      <div className="hud-veil" />
    </div>
  );
}
