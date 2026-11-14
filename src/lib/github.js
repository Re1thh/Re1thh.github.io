// Build-time GitHub data. Never throws: on any failure (offline, rate limit,
// timeout, bad JSON) it returns an empty map and the curated JSON fallbacks win.
//
// Env:
//   GITHUB_TOKEN    optional; raises the rate limit (passed in by the deploy workflow)
//   GITHUB_API_URL  optional; overrides the repos endpoint (handy for testing the fallback)

const DEFAULT_URL = "https://api.github.com/users/Re1thh/repos?per_page=100";
const TIMEOUT_MS = 6000;

let cached;

export async function fetchRepos() {
  if (cached) return cached;
  cached = load();
  return cached;
}

async function load() {
  const url = process.env.GITHUB_API_URL || DEFAULT_URL;
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "portfolio-site-build",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    if (!res.ok) {
      console.warn(`[github] ${res.status} ${res.statusText}; using fallback data`);
      return new Map();
    }
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("unexpected response shape");
    console.log(`[github] fetched ${data.length} repos`);
    return new Map(data.map((r) => [String(r.name).toLowerCase(), r]));
  } catch (err) {
    console.warn(`[github] fetch failed (${err?.name === "AbortError" ? "timeout" : err?.message || err}); using fallback data`);
    return new Map();
  } finally {
    clearTimeout(timer);
  }
}

/** Merge live repo data into curated entries, falling back field by field. */
export async function getProjects(curated) {
  const repos = await fetchRepos();
  return [...curated]
    .sort((a, b) => (a.featured ?? 99) - (b.featured ?? 99))
    .map((p) => {
      const live = repos.get(p.repo.toLowerCase());
      const fb = p.fallback || {};
      const pushed = live?.pushed_at ? new Date(live.pushed_at) : null;
      return {
        ...p,
        url: live?.html_url || `https://github.com/Re1thh/${p.repo}`,
        language: live?.language || fb.language || p.stack?.[0] || "",
        year: pushed && !isNaN(pushed) ? String(pushed.getUTCFullYear()) : fb.year || "",
        stars: typeof live?.stargazers_count === "number" ? live.stargazers_count : fb.stars ?? 0,
        live: Boolean(live),
      };
    });
}
