# re1thh.github.io

Personal portfolio site for Revanth Reddy. A single static page built with [Astro](https://astro.build): no client framework, a little vanilla JS (theme and list/grid toggles, expandable project rows, cover hover preview, section reveal) and self-hosted fonts. The only runtime request to another host is the contribution snake image from the `Re1thh/Re1thh` profile repo (`output` branch); if it fails to load, the Activity section hides itself.

## Run it

```sh
npm install
npm run dev       # local dev server at http://localhost:4321
npm run build     # static output in dist/
npm run preview   # serve the built dist/ locally
```

**Windows note:** if `npm run build` fails with "An Application Control policy has blocked this file" (Smart App Control blocking Astro's native compiler `astro.win32-x64-msvc.node`), install the WebAssembly build of the compiler locally without saving it, then build again:

```sh
npm i --no-save --force @astrojs/compiler-binding-wasm32-wasi@0.5.3
```

Astro falls back to it automatically. Re-run that after any `npm install`. CI (Linux) does not need it.

At build time the site fetches `https://api.github.com/users/Re1thh/repos` to fill in each project's language and last-push year, plus the star count when it is above 0. Set `GITHUB_TOKEN` to raise the rate limit; it is read from the Node process env at build time, sent only when non-empty, never logged, and if GitHub rejects it (401/403) the request is retried once without it. If the request still fails, times out (10 s) or is rate-limited, the build succeeds with the `fallback` values in `projects.json` (the fallback year is the year the project was built). The build log has one `[github]` line saying which path was used. `GITHUB_API_URL` overrides the endpoint (useful to test the fallback, e.g. `GITHUB_API_URL=http://127.0.0.1:9/ npm run build`).

## Edit the content

**`src/data/projects.json`** — your own repos under "Selected work".

| field | meaning |
|---|---|
| `repo` | exact GitHub repo name under `Re1thh` (used to match API data and build the link) |
| `title` | name shown on the page |
| `description` | one short line; it is truncated with an ellipsis in list view |
| `stack` | shown on the covers and as chips in the expanded row |
| `highlights` | 2–3 bullets shown when the row is expanded; describe only what the code really does |
| `note` | one honest line about the project's scope (e.g. a 2023 learning project) |
| `featured` | sort order (1 first) |
| `fallback` | `language`, `year`, `stars` used when the GitHub API is unavailable |

**`src/data/exploring.json`** — open-source projects by other people that you forked to study, shown under "Currently exploring" and labelled as not your work.

| field | meaning |
|---|---|
| `repo` | repository name (shown, links to `fork`) |
| `owner` | upstream owner, shown as the "by …" credit link to `upstream` |
| `description` | one short line about the upstream project |
| `studying` | one neutral clause: what you are reading it for |
| `fork` | your fork, `https://github.com/Re1thh/<repo>` |
| `upstream` | the original, `https://github.com/<owner>/<repo>` |

Other copy (hero, "Now" block, stack groups, experience) lives in `src/pages/index.astro`; shared facts (name, role, employer, links) in `src/lib/site.js`. Head tags, top bar and footer are in `src/layouts/Base.astro`, shared with `src/pages/404.astro`.

## SEO files

- `public/robots.txt` and `src/pages/sitemap.xml.js` (hand-written, one URL).
- `public/og.png` (1200×630, the social preview) is generated, then committed. Regenerate it after changing the name or role line with `npm run og` (`scripts/og.mjs`). It renders an HTML page with the self-hosted fonts in a locally installed headless Chrome, Chromium or Edge; set `CHROME_PATH` if the browser is not found. No npm dependency is involved.

## Deploy

`.github/workflows/deploy.yml` builds with `withastro/action` and deploys to GitHub Pages on push to `main`, on manual dispatch, and weekly. In the repository settings, set Pages -> Source to "GitHub Actions".
