/**
 * Shared palette and SVG helpers.
 *
 * Every panel paints its own dark card rather than relying on the page theme.
 * GitHub's dark mode is a site setting that does not always track the OS
 * `prefers-color-scheme`, so a panel that switches on that media query can end
 * up light-on-light. Self-contained cards read correctly in both.
 *
 * The palette mirrors the portfolio at ahpiashportfolio.vercel.app so the two
 * surfaces look like one identity.
 */
export const C = {
  canvas: "#090e1a",
  surface: "#0e1424",
  surface2: "#141c30",
  line: "#20294a",
  lineSoft: "#182138",
  ink: "#e9eef7",
  inkMuted: "#aebbd3",
  inkFaint: "#8494b0",
  brand: "#22d3ee",
  brandInk: "#67e8f9",
  violet: "#818cf8",
  violetInk: "#a5b4fc",
  mint: "#34d399",
  mintInk: "#6ee7b7",
  amber: "#fcd34d",
};

export const FONT =
  "-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif";
export const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

/** XML-escape text destined for an SVG text node or attribute. */
export function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Rough text width for layout, tuned per size/weight for the system stack. */
export function textW(str, size, weight = 400) {
  const factor = weight >= 700 ? 0.62 : weight >= 600 ? 0.6 : 0.56;
  return str.length * size * factor;
}

/** Deterministic PRNG so star positions never change between runs. */
export function seeded(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

/**
 * A twinkling star layer. Stars are painted at their brightest state in the
 * markup and only *animated* afterwards, so a stripped animation leaves a
 * complete sky rather than an empty one.
 */
export function stars(w, h, { count = 24, seed = 20260819, opacity = 0.8 } = {}) {
  const rand = seeded(seed);
  const out = [];
  for (let i = 0; i < count; i++) {
    const x = (rand() * w).toFixed(1);
    const y = (rand() * h).toFixed(1);
    const r = (0.6 + rand() * 1.1).toFixed(2);
    const base = (0.25 + rand() * 0.5) * opacity;
    const dur = (2.8 + rand() * 3.4).toFixed(2);
    const begin = (-rand() * 6).toFixed(2);
    out.push(
      `  <circle cx="${x}" cy="${y}" r="${r}" fill="${C.ink}" opacity="${base.toFixed(2)}"><animate attributeName="opacity" values="${base.toFixed(2)};${(base * 0.25).toFixed(2)};${base.toFixed(2)}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></circle>`,
    );
  }
  return out.join("\n");
}

/** Fine engineering grid, faded so it reads as texture rather than lines. */
export function grid(w, h, { step = 36, opacity = 0.05 } = {}) {
  const lines = [];
  for (let x = step; x < w; x += step) lines.push(`M${x} 0V${h}`);
  for (let y = step; y < h; y += step) lines.push(`M0 ${y}H${w}`);
  return `  <path d="${lines.join("")}" stroke="${C.ink}" stroke-opacity="${opacity}" stroke-width="1"/>`;
}

/**
 * Card shell: rounded panel, hairline gradient border and two soft colour
 * washes drifting in from opposite corners.
 *
 * Note every animation in these panels animates *from* the final look, never
 * into it. GitHub sanitises SVG before serving it, and if a `<style>` block or
 * SMIL tag is ever dropped the panel must still render complete rather than
 * invisible.
 */
export function card(w, h, inner, { glow = C.brand, glow2 = C.violet, gridOn = false } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" fill="none">
  <defs>
    <linearGradient id="stroke" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${glow}" stop-opacity="0.6"/>
      <stop offset="45%" stop-color="${glow}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${glow2}" stop-opacity="0.5"/>
    </linearGradient>
    <radialGradient id="wash" cx="12%" cy="0%" r="85%">
      <stop offset="0%" stop-color="${glow}" stop-opacity="0.17"/>
      <stop offset="100%" stop-color="${glow}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="wash2" cx="92%" cy="100%" r="80%">
      <stop offset="0%" stop-color="${glow2}" stop-opacity="0.17"/>
      <stop offset="100%" stop-color="${glow2}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${C.brand}"/>
      <stop offset="55%" stop-color="${C.violet}"/>
      <stop offset="100%" stop-color="${C.mint}"/>
    </linearGradient>
    <linearGradient id="duo" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${C.brandInk}"/>
      <stop offset="100%" stop-color="${C.violetInk}"/>
    </linearGradient>
    <clipPath id="cardClip"><rect width="${w}" height="${h}" rx="16"/></clipPath>
  </defs>
  <rect width="${w}" height="${h}" rx="16" fill="${C.canvas}"/>
  <rect width="${w}" height="${h}" rx="16" fill="url(#wash)"/>
  <rect width="${w}" height="${h}" rx="16" fill="url(#wash2)"/>
${gridOn ? `  <g clip-path="url(#cardClip)">
${grid(w, h)}
  </g>\n` : ""}  <rect x="0.75" y="0.75" width="${w - 1.5}" height="${h - 1.5}" rx="15.25" stroke="url(#stroke)" stroke-width="1.5"/>
${inner}
</svg>`;
}

/** Section eyebrow: a short gradient rule followed by a small caps label. */
export function eyebrow(x, y, label, color = C.brandInk) {
  return `  <rect x="${x}" y="${y - 4}" width="16" height="2" rx="1" fill="url(#accent)"/>
  <text x="${x + 24}" y="${y}" font-family="${FONT}" font-size="10.5" font-weight="700" letter-spacing="2.2" fill="${color}">${esc(label.toUpperCase())}</text>`;
}

/** Compact numbers: 12400 -> 12.4k */
export function compact(n) {
  if (n < 1000) return String(n);
  if (n < 10000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return Math.round(n / 1000) + "k";
}
