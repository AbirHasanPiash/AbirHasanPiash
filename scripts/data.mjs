/**
 * Data layer. Two public sources, no secrets required.
 *
 *  - Contributions come from `github.com/users/<login>/contributions`, the same
 *    fragment the profile page itself renders. It needs no authentication and
 *    accepts a date range, so the full history can be walked a year at a time.
 *  - Repositories and language bytes come from the REST API. A token is used
 *    when one is present (Actions always provides one) purely for the higher
 *    rate limit; without it the unauthenticated quota covers one run.
 *
 * Keeping both paths tokenless by default means the panels can be regenerated
 * and reviewed locally, and the workflow needs no secret configured.
 */

const UA = "profile-readme-generator";

/* ------------------------------------------------------------ REST helper */

async function rest(path, token) {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": UA };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) throw new Error(`REST ${path} -> ${res.status}`);
  return res.json();
}

/* ----------------------------------------------------- Contribution graph */

/**
 * Parse one contributions fragment into {date, count} pairs.
 *
 * Each day is a <td> carrying data-date and an id; the exact number lives in a
 * sibling <tool-tip for="<that id>">. `data-level` alone is only a 0-4 bucket,
 * so the tooltip is what makes real totals possible.
 */
function parseContributions(html) {
  const dates = new Map();
  for (const m of html.matchAll(/<td[^>]*?data-date="(\d{4}-\d{2}-\d{2})"[^>]*?id="([^"]+)"[^>]*?>/g)) {
    dates.set(m[2], m[1]);
  }
  // Some responses order the attributes the other way round.
  for (const m of html.matchAll(/<td[^>]*?id="([^"]+)"[^>]*?data-date="(\d{4}-\d{2}-\d{2})"[^>]*?>/g)) {
    if (!dates.has(m[1])) dates.set(m[1], m[2]);
  }

  const tips = new Map();
  for (const m of html.matchAll(/<tool-tip[^>]*?for="([^"]+)"[^>]*>([\s\S]*?)<\/tool-tip>/g)) {
    tips.set(m[1], m[2].replace(/\s+/g, " ").trim());
  }

  const days = [];
  for (const [id, date] of dates) {
    const text = tips.get(id) ?? "";
    const m = text.match(/^(No|[\d,]+)\s+contribution/);
    const count = !m || m[1] === "No" ? 0 : parseInt(m[1].replace(/,/g, ""), 10);
    days.push({ date, count });
  }
  return days;
}

async function fetchYear(login, from, to) {
  const url = `https://github.com/users/${encodeURIComponent(login)}/contributions?from=${from}&to=${to}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" } });
  if (!res.ok) throw new Error(`contributions ${from} -> HTTP ${res.status}`);
  return parseContributions(await res.text());
}

/** Every day from account creation to today, de-duplicated and sorted. */
async function fetchCalendar(login, createdAt) {
  const start = new Date(createdAt);
  const now = new Date();
  const merged = new Map();

  for (let year = start.getUTCFullYear(); year <= now.getUTCFullYear(); year++) {
    try {
      for (const day of await fetchYear(login, `${year}-01-01`, `${year}-12-31`)) {
        // A ranged request pads out to whole weeks, so boundary days appear in
        // two responses. Keep the larger value rather than letting a pad of
        // zero overwrite a real count.
        merged.set(day.date, Math.max(merged.get(day.date) ?? 0, day.count));
      }
    } catch (err) {
      console.warn(`  ! ${year} contributions unavailable: ${err.message}`);
    }
  }

  return [...merged.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/* ------------------------------------------------------------- Statistics */

/**
 * Streaks are counted in UTC. An empty today does not break a run: commits made
 * later in the day would otherwise reset a live streak every time the schedule
 * fired before the first push.
 */
export function streaks(days) {
  const byDate = new Map(days.map((d) => [d.date, d.count]));
  const iso = (d) => d.toISOString().slice(0, 10);

  let longest = 0;
  let run = 0;
  for (const d of days) {
    run = d.count > 0 ? run + 1 : 0;
    if (run > longest) longest = run;
  }

  let current = 0;
  const cursor = new Date();
  if ((byDate.get(iso(cursor)) ?? 0) === 0) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while ((byDate.get(iso(cursor)) ?? 0) > 0) {
    current++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return { current, longest };
}

/** Markup and config that would otherwise dominate a language breakdown. */
const IGNORED = new Set([
  "HTML", "CSS", "SCSS", "Less", "Dockerfile", "Shell", "PowerShell",
  "Batchfile", "Makefile", "Procfile", "Roff", "Mako",
]);

/** Linguist colours, so the bar stays readable when a colour is missing. */
const LANG_COLOR = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  "Jupyter Notebook": "#DA5B0B",
  HTML: "#e34c26",
  CSS: "#563d7c",
  C: "#555555",
  "C++": "#f34b7d",
  Java: "#b07219",
  Assembly: "#6E4C13",
  Dart: "#00B4AB",
  Go: "#00ADD8",
  Rust: "#dea584",
  PHP: "#4F5D95",
  Ruby: "#701516",
};

export function languages(repos, { keepMarkup = false } = {}) {
  const totals = new Map();
  for (const repo of repos) {
    for (const lang of repo.languages) {
      if (!keepMarkup && IGNORED.has(lang.name)) continue;
      totals.set(lang.name, (totals.get(lang.name) ?? 0) + lang.size);
    }
  }
  const total = [...totals.values()].reduce((a, b) => a + b, 0) || 1;
  return [...totals.entries()]
    .map(([name, size]) => ({
      name,
      size,
      share: size / total,
      color: LANG_COLOR[name] ?? "#7e8ca8",
    }))
    .sort((a, b) => b.size - a.size);
}

/* --------------------------------------------------------------------- API */

export async function collect(login, token) {
  const user = await rest(`/users/${login}`, token);

  const listing = await rest(`/users/${login}/repos?per_page=100&type=owner&sort=pushed`, token);
  const owned = listing.filter((r) => !r.fork);

  const repos = [];
  for (const r of owned) {
    let langs = [];
    try {
      const body = await rest(`/repos/${login}/${r.name}/languages`, token);
      langs = Object.entries(body).map(([name, size]) => ({ name, size }));
    } catch {
      /* An unauthenticated run can exhaust the hourly quota part-way through.
         The listing already reports a primary language, which keeps the mix
         approximately right rather than dropping the repository entirely. */
      if (r.language) langs = [{ name: r.language, size: r.size || 1 }];
    }
    repos.push({ name: r.name, stars: r.stargazers_count, forks: r.forks_count, languages: langs });
  }

  const days = await fetchCalendar(login, user.created_at);

  return {
    login,
    name: user.name ?? login,
    createdAt: user.created_at,
    followers: user.followers,
    repoCount: owned.length,
    repos,
    days,
  };
}
