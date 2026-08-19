import { C, FONT, MONO, card, compact, esc, eyebrow, stars, textW } from "./theme.mjs";
import { languages, streaks } from "./data.mjs";

/* -------------------------------------------------------------- 1. Header */

const ROLES = [
  "Full-Stack Engineer",
  "AI / ML Engineer",
  "Backend Architect",
  "Deep Learning Researcher",
];

/**
 * Hero banner: aurora washes, a starfield, a typewriter role line with a
 * moving caret, and a small terminal that types out `whoami`.
 *
 * Every animated element is painted in its final state in the markup and only
 * animated afterwards, so if GitHub ever strips SMIL the banner still renders
 * a complete headline instead of an empty strip.
 */
export function header({ name, tagline }) {
  const w = 880;
  const h = 248;

  /* --- typewriter roles ------------------------------------------------ */
  const per = 3.2; // seconds per role
  const total = ROLES.length * per;
  const roleY = 148;
  const roleSize = 22;

  const roles = ROLES.map((role, i) => {
    const begin = (i * per).toFixed(2);
    const beginList = `${begin}s;cycle.end+${begin}s`;
    const width = Math.ceil(textW(role, roleSize, 700)) + 6;
    const clipId = `type-${i}`;
    /* Role 0 is fully visible in the markup; the others wait their turn. */
    return `    <clipPath id="${clipId}"><rect x="42" y="${roleY - 24}" width="${width}" height="34">
      <animate attributeName="width" values="0;${width};${width}" keyTimes="0;0.31;1" dur="${per}s" begin="${beginList}" fill="freeze"/>
    </rect></clipPath>
    <g opacity="${i === 0 ? 1 : 0}">
      <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.01;0.91;1" dur="${per}s" begin="${beginList}" fill="freeze"/>
      <g clip-path="url(#${clipId})">
        <text x="44" y="${roleY}" font-family="${FONT}" font-size="${roleSize}" font-weight="700" letter-spacing="-0.3" fill="url(#duo)">${esc(role)}</text>
      </g>
      <rect x="${44 + width}" y="${roleY - 18}" width="2.5" height="23" rx="1" fill="${C.brandInk}">
        <animate attributeName="x" values="46;${44 + width};${44 + width}" keyTimes="0;0.31;1" dur="${per}s" begin="${beginList}" fill="freeze"/>
        <animate attributeName="opacity" values="1;0;1" keyTimes="0;0.5;1" calcMode="discrete" dur="0.85s" repeatCount="indefinite"/>
      </rect>
    </g>`;
  }).join("\n");

  /* --- terminal card ---------------------------------------------------- */
  const term = { x: 556, y: 50, w: 282, h: 158 };
  const termLines = [
    { p: "$", cmd: " whoami" },
    { out: "full-stack + AI/ML engineer" },
    { p: "$", cmd: " cat stack.txt" },
    { out: "FastAPI · Django · Next.js · PyTorch" },
  ];
  const typed = termLines
    .map((line, i) => {
      const y = term.y + 52 + i * 21;
      /* One discrete animation running from t=0 flips the line on at its cue.
         The markup itself stays at opacity 1 so a stripped animation still
         leaves the terminal fully readable. */
      const dur = 3.4;
      const at = ((0.5 + i * 0.55) / dur).toFixed(3);
      const body = line.out
        ? `<text x="${term.x + 18}" y="${y}" font-family="${MONO}" font-size="10.5" fill="${C.inkMuted}">${esc(line.out)}</text>`
        : `<text x="${term.x + 18}" y="${y}" font-family="${MONO}" font-size="10.5" fill="${C.mintInk}">${esc(line.p)}<tspan fill="${C.ink}">${esc(line.cmd)}</tspan></text>`;
      return `    <g opacity="1">${body}<animate attributeName="opacity" values="0;1;1" keyTimes="0;${at};1" calcMode="discrete" dur="${dur}s" begin="0s" fill="freeze"/></g>`;
    })
    .join("\n");
  const cursorY = term.y + 52 + termLines.length * 21;

  const terminal = `  <g>
    <rect x="${term.x}" y="${term.y}" width="${term.w}" height="${term.h}" rx="12" fill="${C.surface}"/>
    <rect x="${term.x + 0.5}" y="${term.y + 0.5}" width="${term.w - 1}" height="${term.h - 1}" rx="11.5" stroke="${C.line}"/>
    <circle cx="${term.x + 18}" cy="${term.y + 16}" r="4.2" fill="#ff5f57"/>
    <circle cx="${term.x + 33}" cy="${term.y + 16}" r="4.2" fill="#febc2e"/>
    <circle cx="${term.x + 48}" cy="${term.y + 16}" r="4.2" fill="#28c840"/>
    <text x="${term.x + term.w / 2}" y="${term.y + 20}" text-anchor="middle" font-family="${MONO}" font-size="9" fill="${C.inkFaint}">a_h_piash — zsh</text>
    <path d="M${term.x} ${term.y + 32}H${term.x + term.w}" stroke="${C.lineSoft}"/>
${typed}
    <text x="${term.x + 18}" y="${cursorY}" font-family="${MONO}" font-size="10.5" fill="${C.mintInk}">$</text>
    <rect x="${term.x + 30}" y="${cursorY - 9}" width="6" height="11" fill="${C.brandInk}">
      <animate attributeName="opacity" values="1;0;1" keyTimes="0;0.5;1" calcMode="discrete" dur="0.85s" repeatCount="indefinite"/>
    </rect>
  </g>`;

  /* --- availability pill ------------------------------------------------ */
  const pillLabel = "Open to software & AI roles";
  const pillW = Math.ceil(textW(pillLabel, 11.5, 600)) + 44;
  const pill = `  <g transform="translate(${w - 42 - pillW},22)">
    <rect width="${pillW}" height="24" rx="12" fill="${C.mint}" opacity="0.1"/>
    <rect x="-0.5" y="-0.5" width="${pillW + 1}" height="25" rx="12.5" stroke="${C.mint}" stroke-opacity="0.35"/>
    <circle cx="15" cy="12" r="3.6" fill="${C.mint}"><animate attributeName="opacity" values="1;0.3;1" dur="2.4s" repeatCount="indefinite"/></circle>
    <text x="27" y="16" font-family="${FONT}" font-size="11.5" font-weight="600" fill="${C.mintInk}">${esc(pillLabel)}</text>
  </g>`;

  /* Tagline wraps to two lines so it never runs beneath the terminal. */
  const tag = splitTagline(tagline, 62);

  const inner = `  <g>
    <circle cx="110" cy="-40" r="210" fill="${C.brand}" opacity="0.11"/>
    <circle cx="800" cy="290" r="210" fill="${C.violet}" opacity="0.11"/>
    <circle cx="450" cy="300" r="170" fill="${C.mint}" opacity="0.06"/>
  </g>
${stars(w, h, { count: 26, seed: 20260819 })}
${eyebrow(44, 48, "Dhaka, Bangladesh · GMT+6")}
${pill}
  <text x="44" y="104" font-family="${FONT}" font-size="38" font-weight="800" letter-spacing="-1" fill="${C.ink}">${esc(name)}</text>
${roles}
  <animate id="cycle" attributeName="opacity" from="1" to="1" dur="${total}s" repeatCount="indefinite"/>
  <rect x="44" y="166" width="132" height="1.6" rx="0.8" fill="url(#accent)" opacity="0.9"/>
${tag
    .map(
      (line, i) =>
        `  <text x="44" y="${194 + i * 20}" font-family="${FONT}" font-size="13" fill="${C.inkMuted}">${esc(line)}</text>`,
    )
    .join("\n")}
${terminal}`;

  return card(w, h, inner, { gridOn: true });
}

function splitTagline(text, max) {
  const words = text.split(" ");
  const lines = [""];
  for (const word of words) {
    const current = lines[lines.length - 1];
    if ((current + " " + word).trim().length > max) lines.push(word);
    else lines[lines.length - 1] = (current + " " + word).trim();
  }
  return lines.slice(0, 2);
}

/* --------------------------------------------------------------- 2. Stats */

/**
 * Deliberately reports contribution volume, streaks, repositories and reach of
 * languages rather than stars and followers. Those two are near zero on a
 * student account, and a card that leads with a zero reads worse than no card.
 */
export function stats(data) {
  const w = 430;
  const h = 250;
  const { longest } = streaks(data.days);
  const totalContrib = data.days.reduce((a, d) => a + d.count, 0);
  const activeDays = data.days.filter((d) => d.count > 0).length;
  const thisYear = data.days
    .filter((d) => d.date.startsWith(String(new Date().getUTCFullYear())))
    .reduce((a, d) => a + d.count, 0);
  const years = Math.max(
    1,
    Math.round(((Date.now() - new Date(data.createdAt)) / 31557600000) * 10) / 10,
  );
  const langCount = languages(data.repos).length;

  /* Every tile is cumulative. A "current streak" reads 0 on any day without a
     push, and a zero in the headline row undersells the rest. */
  const cells = [
    { v: compact(totalContrib), l: "Contributions", c: C.brandInk },
    { v: String(data.repoCount), l: "Repositories", c: C.violetInk },
    { v: String(activeDays), l: "Active days", c: C.mintInk },
    { v: String(longest), l: "Longest streak", c: C.brandInk },
    { v: compact(thisYear), l: "This year", c: C.violetInk },
    { v: String(langCount), l: "Languages", c: C.mintInk },
  ];

  const grid = cells
    .map((cell, i) => {
      const x = 30 + (i % 3) * 128;
      const y = 98 + Math.floor(i / 3) * 56;
      return `  <text x="${x}" y="${y}" font-family="${MONO}" font-size="23" font-weight="700" fill="${cell.c}">${esc(cell.v)}<animate attributeName="opacity" values="0.25;1" dur="0.5s" begin="${(i * 0.08).toFixed(2)}s" fill="freeze"/></text>
  <text x="${x}" y="${y + 16}" font-family="${FONT}" font-size="9.5" letter-spacing="1.1" fill="${C.inkFaint}">${esc(cell.l.toUpperCase())}</text>`;
    })
    .join("\n");

  /* --- weekly cadence sparkline ---------------------------------------- */
  const weeks = 26;
  const daily = data.days.slice(-weeks * 7);
  while (daily.length < weeks * 7) daily.unshift({ count: 0 });
  const weekly = [];
  for (let i = 0; i < weeks; i++) {
    weekly.push(daily.slice(i * 7, i * 7 + 7).reduce((a, d) => a + d.count, 0));
  }
  const maxW = Math.max(1, ...weekly);
  const chart = { x: 30, y: 200, w: 370, h: 34 };
  const pts = weekly.map((v, i) => [
    chart.x + (i / (weeks - 1)) * chart.w,
    chart.y + chart.h - (v / maxW) * chart.h,
  ]);
  const lineD = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
  const areaD = `${lineD}L${(chart.x + chart.w).toFixed(1)} ${chart.y + chart.h}L${chart.x} ${chart.y + chart.h}Z`;
  const pathLen = pts.reduce(
    (a, p, i) => (i ? a + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0),
    0,
  );
  const [endX, endY] = pts[pts.length - 1];

  const spark = `  <defs>
    <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${C.brand}" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="${C.brand}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <text x="30" y="188" font-family="${FONT}" font-size="8.5" letter-spacing="1.4" fill="${C.inkFaint}">WEEKLY CADENCE · LAST ${weeks} WEEKS</text>
  <path d="${areaD}" fill="url(#sparkfill)"><animate attributeName="opacity" values="0;1" dur="1s" begin="0.4s" fill="freeze"/></path>
  <path d="${lineD}" stroke="${C.brand}" stroke-width="1.75" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="${Math.ceil(pathLen)}">
    <animate attributeName="stroke-dashoffset" values="${Math.ceil(pathLen)};0" dur="1.3s" begin="0.15s" fill="freeze"/>
  </path>
  <circle cx="${endX.toFixed(1)}" cy="${endY.toFixed(1)}" r="3" fill="${C.brandInk}"/>
  <circle cx="${endX.toFixed(1)}" cy="${endY.toFixed(1)}" r="3" fill="none" stroke="${C.brandInk}" stroke-opacity="0.6">
    <animate attributeName="r" values="3;8" dur="1.8s" repeatCount="indefinite"/>
    <animate attributeName="stroke-opacity" values="0.6;0" dur="1.8s" repeatCount="indefinite"/>
  </circle>`;

  const inner = `${eyebrow(30, 42, "By the numbers")}
  <text x="30" y="64" font-family="${FONT}" font-size="12" fill="${C.inkMuted}">${esc(`Building publicly for ${years} years`)}</text>
${grid}
${spark}`;

  return card(w, h, inner);
}

/* ----------------------------------------------------------- 3. Languages */

export function langPanel(data) {
  const w = 430;
  const h = 250;
  const all = languages(data.repos);
  const top = all.slice(0, 5);
  const restShare = all.slice(5).reduce((a, l) => a + l.share, 0);
  const scale = 1 / (top.reduce((a, l) => a + l.share, 0) + restShare || 1);

  const rows = top
    .map((lang, i) => {
      const y = 96 + i * 31;
      const share = lang.share * scale;
      const barW = Math.max(6, share * 370);
      return `  <text x="30" y="${y}" font-family="${FONT}" font-size="12.5" font-weight="600" fill="${C.ink}">${esc(lang.name)}</text>
  <text x="400" y="${y}" text-anchor="end" font-family="${MONO}" font-size="11" fill="${C.inkFaint}">${(share * 100).toFixed(1)}%</text>
  <rect x="30" y="${y + 7}" width="370" height="6" rx="3" fill="${C.surface2}"/>
  <rect x="30" y="${y + 7}" width="${barW.toFixed(1)}" height="6" rx="3" fill="${lang.color}">
    <animate attributeName="width" values="0;${barW.toFixed(1)}" dur="${(0.7 + i * 0.14).toFixed(2)}s" begin="0s" fill="freeze"/>
  </rect>`;
    })
    .join("\n");

  const inner = `${eyebrow(30, 42, "Language mix", C.violetInk)}
  <text x="30" y="64" font-family="${FONT}" font-size="12" fill="${C.inkMuted}">By bytes across ${data.repoCount} public repositories</text>
${rows}`;

  return card(w, h, inner, { glow: C.violet, glow2: C.brand });
}

/* ------------------------------------------------------------ 4. Activity */

/**
 * A 53-week contribution heatmap. This is the panel that community services
 * normally supply and that most often disappears with them, so it is drawn from
 * the raw calendar instead.
 */
export function activity(data) {
  const w = 880;
  const h = 226;
  const cell = 12;
  const gap = 3;
  const weeks = 53;

  const byDate = new Map(data.days.map((d) => [d.date, d.count]));
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  end.setUTCDate(end.getUTCDate() - end.getUTCDay() + 6); // end of current week
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (weeks * 7 - 1));

  const counts = [];
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    counts.push({ date: d, count: byDate.get(d.toISOString().slice(0, 10)) ?? 0 });
  }

  /* Bucket by quartile of the active days rather than linearly against the peak.
     One unusually busy day would otherwise flatten every other day to the
     faintest shade. */
  const active = counts.map((c) => c.count).filter((n) => n > 0).sort((a, b) => a - b);
  const q = (p) => active.length ? active[Math.min(active.length - 1, Math.floor(active.length * p))] : 1;
  const cuts = [q(0.25), q(0.5), q(0.75)];
  const ramp = [C.surface2, "#155a70", "#1990ab", "#1fb9d6", C.brandInk];
  const level = (n) =>
    n === 0 ? 0 : n <= cuts[0] ? 1 : n <= cuts[1] ? 2 : n <= cuts[2] ? 3 : 4;

  const originX = 42;
  const originY = 78;
  const squares = [];
  const months = [];
  let lastMonth = -1;

  counts.forEach((c, i) => {
    const wk = Math.floor(i / 7);
    const dow = i % 7;
    const x = originX + wk * (cell + gap);
    const y = originY + dow * (cell + gap);
    const lv = level(c.count);
    squares.push(
      `  <rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="3" fill="${ramp[lv]}"${lv === 0 ? ' opacity="0.85"' : ""}/>`,
    );
    if (dow === 0) {
      const m = c.date.getUTCMonth();
      if (m !== lastMonth && wk < weeks - 1) {
        lastMonth = m;
        months.push(
          `  <text x="${x}" y="${originY - 10}" font-family="${FONT}" font-size="10" fill="${C.inkFaint}">${c.date.toLocaleString("en", { month: "short", timeZone: "UTC" })}</text>`,
        );
      }
    }
  });

  const dayLabels = ["Mon", "Wed", "Fri"]
    .map((label, i) => {
      const dow = [1, 3, 5][i];
      return `  <text x="${originX - 10}" y="${originY + dow * (cell + gap) + 10}" text-anchor="end" font-family="${FONT}" font-size="9.5" fill="${C.inkFaint}">${label}</text>`;
    })
    .join("\n");

  /* A soft light band sweeps the calendar; parked off-canvas if ever static. */
  const gridH = 7 * (cell + gap) - gap;
  const scan = `  <defs>
    <linearGradient id="scan" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${C.ink}" stop-opacity="0"/>
      <stop offset="50%" stop-color="${C.ink}" stop-opacity="0.07"/>
      <stop offset="100%" stop-color="${C.ink}" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="scanClip"><rect x="${originX}" y="${originY}" width="${weeks * (cell + gap) - gap}" height="${gridH}" rx="3"/></clipPath>
  </defs>
  <g clip-path="url(#scanClip)">
    <rect x="-150" y="${originY - 4}" width="130" height="${gridH + 8}" fill="url(#scan)">
      <animateTransform attributeName="transform" type="translate" values="0 0;${w + 300} 0" dur="7s" repeatCount="indefinite"/>
    </rect>
  </g>`;

  const legendX = w - 190;
  const legendY = h - 16;
  const legend = ramp
    .map(
      (fill, i) =>
        `  <rect x="${legendX + 34 + i * 15}" y="${legendY - 9}" width="11" height="11" rx="3" fill="${fill}"/>`,
    )
    .join("\n");

  const total = counts.reduce((a, c) => a + c.count, 0);

  const inner = `${eyebrow(42, 42, "Contribution activity", C.mintInk)}
  <text x="${w - 42}" y="42" text-anchor="end" font-family="${MONO}" font-size="12" fill="${C.inkMuted}">${compact(total)} in the last year</text>
${months.join("\n")}
${dayLabels}
${squares.join("\n")}
${scan}
  <text x="${legendX}" y="${legendY}" font-family="${FONT}" font-size="9.5" fill="${C.inkFaint}">Less</text>
${legend}
  <text x="${legendX + 34 + 5 * 15 + 4}" y="${legendY}" font-family="${FONT}" font-size="9.5" fill="${C.inkFaint}">More</text>`;

  return card(w, h, inner, { glow: C.mint, glow2: C.brand });
}

/* --------------------------------------------------------------- 5. Stack */

/**
 * The stack strip inlines each icon's own SVG path data at generation time, so
 * the published panel makes no network request at all when someone views the
 * profile. Each icon sits on its own surface tile and floats gently.
 */
export function stack(icons) {
  const w = 880;
  const h = 240;
  const perRow = 10;
  const size = 30;
  const tile = 56;
  const gapX = 84;
  const startX = 60;
  const rowY = [84, 164];

  const nodes = icons
    .map((icon, i) => {
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      const cx = startX + col * gapX;
      const cy = rowY[row] ?? rowY[rowY.length - 1];
      const s = size / icon.viewBox;
      const paint = icon.fill ? ` fill="${icon.fill}"` : "";
      const dur = (3.8 + (i % 5) * 0.55).toFixed(2);
      const begin = (-(i * 0.37) % 4).toFixed(2);
      return `  <g>
    <animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>
    <rect x="${cx - tile / 2}" y="${cy - tile / 2}" width="${tile}" height="${tile}" rx="15" fill="${C.surface}"/>
    <rect x="${cx - tile / 2 + 0.5}" y="${cy - tile / 2 + 0.5}" width="${tile - 1}" height="${tile - 1}" rx="14.5" stroke="${C.line}"/>
    <g transform="translate(${cx - size / 2},${cy - size / 2})">
      <g transform="scale(${s.toFixed(4)})"${paint}>${icon.body}</g>
    </g>
  </g>
  <text x="${cx}" y="${cy + tile / 2 + 15}" text-anchor="middle" font-family="${FONT}" font-size="9.5" fill="${C.inkFaint}">${esc(icon.label)}</text>`;
    })
    .join("\n");

  const inner = `${eyebrow(42, 42, "Daily drivers")}
${nodes}`;

  return card(w, h, inner, { glow: C.brand, glow2: C.mint });
}

/* ------------------------------------------------------- 6. Project cards */

const ACCENTS = {
  brand: { main: "#22d3ee", ink: "#67e8f9" },
  violet: { main: "#818cf8", ink: "#a5b4fc" },
  mint: { main: "#34d399", ink: "#6ee7b7" },
};

/**
 * One featured-work card. The README wraps each in a link, so the whole card
 * is clickable — a generated, on-brand replacement for a markdown table row.
 */
export function projectCard(project) {
  const w = 430;
  const h = 152;
  const accent = ACCENTS[project.accent] ?? ACCENTS.brand;

  const catW = Math.ceil(textW(project.category, 9.5, 700) * 1.1) + 22;
  const chips = [];
  let cx = 24;
  for (const tech of project.tech) {
    const cw = Math.ceil(textW(tech, 9.5, 400) * 1.12) + 16;
    if (cx + cw > w - 24) break;
    chips.push(
      `  <rect x="${cx}" y="120" width="${cw}" height="19" rx="9.5" fill="${C.surface2}"/>
  <rect x="${cx + 0.5}" y="120.5" width="${cw - 1}" height="18" rx="9" stroke="${C.line}"/>
  <text x="${cx + cw / 2}" y="133" text-anchor="middle" font-family="${MONO}" font-size="9.5" fill="${C.inkMuted}">${esc(tech)}</text>`,
    );
    cx += cw + 7;
  }

  const inner = `  <text x="${w - 18}" y="122" text-anchor="end" font-family="${FONT}" font-size="64" font-weight="800" letter-spacing="-2" fill="${accent.main}" opacity="0.07">${esc(project.glyph)}</text>
  <rect x="24" y="24" width="${catW}" height="20" rx="10" fill="${accent.main}" opacity="0.1"/>
  <rect x="24.5" y="24.5" width="${catW - 1}" height="19" rx="9.5" stroke="${accent.main}" stroke-opacity="0.32"/>
  <text x="${24 + catW / 2}" y="37.5" text-anchor="middle" font-family="${FONT}" font-size="9.5" font-weight="700" letter-spacing="1" fill="${accent.ink}">${esc(project.category.toUpperCase())}</text>
  <g stroke="${accent.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M${w - 40} 38 L${w - 28} 26 M${w - 37} 26 H${w - 28} V35"/>
  </g>
  <text x="24" y="72" font-family="${FONT}" font-size="17.5" font-weight="700" letter-spacing="-0.4" fill="${C.ink}">${esc(project.title)}</text>
  <text x="24" y="93" font-family="${FONT}" font-size="11.5" fill="${C.inkMuted}">${esc(project.blurb)}</text>
  <text x="24" y="110" font-family="${MONO}" font-size="10" fill="${C.inkFaint}">${esc(project.metrics)}</text>
${chips.join("\n")}`;

  return card(w, h, inner, { glow: accent.main, glow2: C.violet });
}

/* ---------------------------------------------------------- 7. Link pills */

/**
 * Navigation pills for the top of the README. Generated rather than pulled
 * from a badge service, for the same reason as every other panel.
 */
export function linkPill({ label, accent }) {
  const color = ACCENTS[accent]?.main ?? accent ?? C.brand;
  const inkColor = ACCENTS[accent]?.ink ?? C.ink;
  const tw = Math.ceil(textW(label, 12.5, 600));
  const w = 16 + 9 + 9 + tw + 9 + 9 + 14;
  const h = 34;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" fill="none">
  <rect width="${w}" height="${h}" rx="17" fill="${C.surface}"/>
  <rect x="0.75" y="0.75" width="${w - 1.5}" height="${h - 1.5}" rx="16.25" stroke="${color}" stroke-opacity="0.38" stroke-width="1.5"/>
  <circle cx="18" cy="${h / 2}" r="4" fill="${color}"/>
  <circle cx="18" cy="${h / 2}" r="4" fill="none" stroke="${color}" stroke-opacity="0.5">
    <animate attributeName="r" values="4;8" dur="2.2s" repeatCount="indefinite"/>
    <animate attributeName="stroke-opacity" values="0.5;0" dur="2.2s" repeatCount="indefinite"/>
  </circle>
  <text x="30" y="${h / 2 + 4.5}" font-family="${FONT}" font-size="12.5" font-weight="600" fill="${C.ink}">${esc(label)}</text>
  <g stroke="${inkColor}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M${w - 24} ${h / 2 + 4} L${w - 16} ${h / 2 - 4} M${w - 22} ${h / 2 - 4} H${w - 16} V${h / 2 + 2}"/>
  </g>
</svg>`;
}
