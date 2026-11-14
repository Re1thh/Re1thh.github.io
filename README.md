# re1thh.github.io

Personal portfolio site for Revanth Reddy. A single static page built with [Astro](https://astro.build), with two small vanilla scripts (theme toggle, list/grid toggle) and self-hosted fonts.

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

At build time the site fetches `https://api.github.com/users/Re1thh/repos` to fill in each project's language, last-push year and stars. Set `GITHUB_TOKEN` to raise the rate limit. If the request fails, times out (6 s) or is rate-limited, the build still succeeds and uses the `fallback` values in `projects.json`. `GITHUB_API_URL` overrides the endpoint (useful to test the fallback, e.g. `GITHUB_API_URL=http://127.0.0.1:9/ npm run build`).

## Edit the content

**`src/data/projects.json`** — your own repos under "Selected work".

| field | meaning |
|---|---|
| `repo` | exact GitHub repo name under `Re1thh` (used to match API data and build the link) |
| `title` | name shown on the page |
| `description` | one short line; it is truncated with an ellipsis in list view |
| `stack` | shown on the grid card cover |
| `featured` | sort order (1 first) |
| `fallback` | `language`, `year`, `stars` used when the GitHub API is unavailable |

**`src/data/exploring.json`** — open-source projects you forked to study, shown under "Currently exploring" and labelled as not your work.

| field | meaning |
|---|---|
| `name` | `owner/repo` as shown |
| `description` | one short line |
| `url` | link target; currently the upstream repo |
| `upstream` | `true` labels the link "upstream"; set `false` (and point `url` at your fork) to label it "fork" |

Other copy (hero, "Now" block, experience) lives in `src/pages/index.astro`.

## Deploy

`.github/workflows/deploy.yml` builds with `withastro/action` and deploys to GitHub Pages on push to `main`, on manual dispatch, and weekly. In the repository settings, set Pages -> Source to "GitHub Actions".
