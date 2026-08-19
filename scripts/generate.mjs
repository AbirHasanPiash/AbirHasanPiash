/**
 * Renders every dynamic panel on the profile into `assets/` as a plain SVG.
 *
 * Why generate instead of hot-linking: the community card services this profile
 * used before are unfunded free deployments. `github-readme-stats.vercel.app`
 * was returning 503 DEPLOYMENT_PAUSED and the top-languages fork had stopped
 * answering entirely, so two panels rendered as broken images. Files committed
 * here are served by GitHub itself, so they cannot 404, rate-limit or be paused.
 *
 * Both data sources are public, so no token is required anywhere. A token is
 * used when present only to raise the REST rate limit.
 *
 * Run:
 *   node scripts/generate.mjs              # writes assets/
 *   node scripts/generate.mjs --preview    # same data, writes preview/ instead
 */
import { mkdir, writeFile } from "node:fs/promises";
import { collect } from "./data.mjs";
import { activity, header, langPanel, linkPill, projectCard, stack, stats } from "./panels.mjs";

const LOGIN = process.env.PROFILE_LOGIN || "AbirHasanPiash";
/* The GitHub account's display name is the handle, so the banner sets the real
   name here rather than echoing the API. */
const DISPLAY_NAME = "MD. Abir Hasan Piash";
const TAGLINE =
  "Production systems end to end: FastAPI and Django services, Next.js interfaces, and the deep-learning models behind them.";

/** Featured work, rendered as clickable cards. Copy is hand-tuned to fit. */
const PROJECTS = [
  {
    slug: "medicare-sync",
    title: "MediCare Sync",
    category: "Full-Stack",
    accent: "brand",
    glyph: "MS",
    blurb: "Clinic platform where concurrent bookings can never collide.",
    metrics: "63 REST endpoints · 15 Prisma models · 4 roles",
    tech: ["Express", "React", "MongoDB", "Prisma", "JWT"],
  },
  {
    slug: "multiaimodel",
    title: "MultiAIModel",
    category: "AI / ML",
    accent: "violet",
    glyph: "AI",
    blurb: "One surface over OpenAI, Gemini and Claude, billing included.",
    metrics: "WebSocket streaming · Stripe + Razorpay · Celery",
    tech: ["FastAPI", "PostgreSQL", "Redis", "Celery"],
  },
  {
    slug: "eventpilot",
    title: "EventPilot",
    category: "Full-Stack",
    accent: "mint",
    glyph: "EP",
    blurb: "Event management from creation through to attendance.",
    metrics: "Role-based dashboards · 100% Swagger coverage",
    tech: ["Django REST", "PostgreSQL", "Next.js"],
  },
  {
    slug: "pzafira",
    title: "Pzafira",
    category: "E-commerce",
    accent: "brand",
    glyph: "PZ",
    blurb: "A complete clothing storefront with real payments.",
    metrics: "60+ endpoints · transactional email · JWT auth",
    tech: ["Django", "DRF", "PostgreSQL", "React"],
  },
];

/** Navigation pills under the banner. */
const LINKS = [
  { file: "link-portfolio.svg", label: "Portfolio", accent: "brand" },
  { file: "link-linkedin.svg", label: "LinkedIn", accent: "violet" },
  { file: "link-leetcode.svg", label: "LeetCode", accent: "#fcd34d" },
  { file: "link-codeforces.svg", label: "Codeforces", accent: "mint" },
  { file: "link-email.svg", label: "Email", accent: "brand" },
];

/** devicon slugs, resolved to inline paths at build time. */
const STACK = [
  { slug: "python", label: "Python", file: "python-original" },
  { slug: "typescript", label: "TypeScript", file: "typescript-original" },
  { slug: "javascript", label: "JavaScript", file: "javascript-original" },
  { slug: "react", label: "React", file: "react-original" },
  // Drawn for light pages: a bare circle plus gradient strokes. `none` keeps the
  // circle from painting a solid disc over the mark.
  { slug: "nextjs", label: "Next.js", file: "nextjs-original", fill: "none" },
  { slug: "tailwindcss", label: "Tailwind", file: "tailwindcss-original" },
  { slug: "fastapi", label: "FastAPI", file: "fastapi-original" },
  // Django ships as very dark green; use the brand's light green instead.
  { slug: "django", label: "Django", file: "django-plain", fill: "#44B78B" },
  { slug: "nodejs", label: "Node.js", file: "nodejs-original" },
  { slug: "express", label: "Express", file: "express-original", fill: "#e9eef7" },
  { slug: "pytorch", label: "PyTorch", file: "pytorch-original" },
  { slug: "tensorflow", label: "TensorFlow", file: "tensorflow-original" },
  { slug: "numpy", label: "NumPy", file: "numpy-original" },
  { slug: "postgresql", label: "PostgreSQL", file: "postgresql-original" },
  { slug: "mongodb", label: "MongoDB", file: "mongodb-original" },
  { slug: "redis", label: "Redis", file: "redis-original" },
  { slug: "docker", label: "Docker", file: "docker-original" },
  { slug: "amazonwebservices", label: "AWS", file: "amazonwebservices-original-wordmark" },
  { slug: "git", label: "Git", file: "git-original" },
  { slug: "linux", label: "Linux", file: "linux-original" },
];

/**
 * Pull an icon and reduce it to a body + viewBox we can transplant.
 *
 * Two things have to be corrected before an upstream icon can share a document
 * with nineteen others:
 *
 *  - IDs are namespaced. Several devicon files declare `id="a"` for their
 *    gradients; dropped into one SVG unchanged, the last definition wins and
 *    earlier icons render with the wrong paint.
 *  - Monochrome icons are recoloured. Devicon draws these for light pages, so
 *    they arrive with a dark fill or none at all and disappear against this
 *    card. `fill` in the stack entry sets what they should become.
 */
async function fetchIcon({ slug, label, file, fill }) {
  const url = `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}/${file}.svg`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`icon ${slug} -> HTTP ${res.status}`);
  const svg = await res.text();

  const vb = svg.match(/viewBox=["']([^"']+)["']/);
  const size = vb ? parseFloat(vb[1].trim().split(/\s+/)[2]) : 128;

  let body = svg
    .replace(/<\?xml[^>]*\?>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<svg[^>]*>/, "")
    .replace(/<\/svg>/, "")
    .replace(/<title>[\s\S]*?<\/title>/g, "")
    .trim();

  // Namespace every id and every reference to one.
  const ids = [...body.matchAll(/\sid=["']([^"']+)["']/g)].map((m) => m[1]);
  for (const id of new Set(ids)) {
    const safe = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    body = body
      .replace(new RegExp(`(\\sid=["'])${safe}(["'])`, "g"), `$1${slug}-${id}$2`)
      .replace(new RegExp(`url\\(#${safe}\\)`, "g"), `url(#${slug}-${id})`)
      .replace(new RegExp(`((?:xlink:)?href=["'])#${safe}(["'])`, "g"), `$1#${slug}-${id}$2`);
  }

  return { slug, label, viewBox: size || 128, body, fill };
}

async function main() {
  const preview = process.argv.includes("--preview");
  const token = process.env.GITHUB_TOKEN || null;

  console.log(`• collecting data for ${LOGIN}${token ? "" : " (unauthenticated)"}`);
  const data = await collect(LOGIN, token);
  console.log(`  ${data.repoCount} repos, ${data.days.length} days of history`);

  console.log("• fetching stack icons");
  const icons = [];
  for (const entry of STACK) {
    try {
      icons.push(await fetchIcon(entry));
    } catch (err) {
      // One unavailable icon must not fail the whole run.
      console.warn(`  ! skipped ${entry.slug}: ${err.message}`);
    }
  }

  const outDir = preview ? "preview" : "assets";
  await mkdir(outDir, { recursive: true });

  const files = {
    "header.svg": header({ name: DISPLAY_NAME, tagline: TAGLINE }),
    "stats.svg": stats(data),
    "languages.svg": langPanel(data),
    "activity.svg": activity(data),
    "stack.svg": stack(icons),
  };
  for (const project of PROJECTS) {
    files[`project-${project.slug}.svg`] = projectCard(project);
  }
  for (const link of LINKS) {
    files[link.file] = linkPill(link);
  }

  for (const [name, svg] of Object.entries(files)) {
    await writeFile(`${outDir}/${name}`, svg + "\n", "utf8");
    console.log(`  ✓ ${outDir}/${name}  ${(svg.length / 1024).toFixed(1)} KB`);
  }

  if (preview) console.log("\nPreview run — assets/ untouched.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
