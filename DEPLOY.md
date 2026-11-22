# Deploy

riphere.com is served by Cloudflare Pages (project `riphere-site`, built from `rippere/riphere-site`,
production branch `main`). The tower is plain static files, so Pages has nothing to build.

## Cloudflare Pages settings for this layout

Settings → Builds & deployments → Build configuration:

| Setting                | Value                |
| ---------------------- | -------------------- |
| Framework preset       | None                 |
| Build command          | (empty)              |
| Build output directory | `site`               |
| Root directory         | `/` (the repo root)  |

No environment variables are needed. The Next.js site used `npm run build` with output `out`; both change.

Order of operations for the cutover (Ben confirms it; it is outward-facing):

1. Run `python3 tools/export_tower.py` and commit `site/` on `tower-v3`. Exit 0 is required.
2. Push the branch. Pages builds a preview deployment for it. Preview builds use the same build
   configuration as production, so the settings above have to be in place first; until `main` carries
   the tower, a production build of `main` with these settings would fail, so do not trigger one.
3. Check the preview URL (wfr4 at d1600 and p390, PostHog with `?ph=1`, Ben's iPhone).
4. Merge to `main`. Pages deploys production.

## Rollback

Rollback = put the last Next.js deployment back.

- Fast: Pages → Deployments → the last production deployment of the Next.js site → Rollback to this
  deployment. This re-serves the already-built files and needs no settings change.
- From git: the last Next.js commit on `main` is `65b0325` ("fix(showcase): restore scroll-tilt motion
  on mobile"). Redeploying it means setting the build command back to `npm run build` and the output
  directory back to `out`, since at that commit the app sits at the repo root.

`legacy-next/` on this branch is that same app, moved. To build it from the current tree instead, set
Root directory to `legacy-next`, build command `npm run build`, output `out`.

## What the export ships (S3, 2026-11-22)

`tools/export_tower.py` copies the allowlist, strips comments on copy (`tools/tower_strip.py`), and adds:
`404.html` (Pages serves it for any unmatched path), `robots.txt`, `sitemap.xml`, `favicon.svg`, `assets/og.jpg`
(1200x630, the first screen; re-shoot with `harness/og.mjs` in the source tree), and `fallback.js` (the plain
text version of the floors, shown when WebGL is missing, three.js fails to load, or the URL has `?plain`).

**Case files.** Each board's door appears only when `work/<slug>/case.html` exists in the source tree
(slugs: `floor-tool`, `novacrm`, `prepost`, `riphere-llc`). The export then builds `site/work/<slug>/index.html`,
computes the door's read time from the word count (238 wpm), adds the URL to the sitemap, and fills
`window.CASES` in `index.html`. Without a case file a board has no door and its demo pane is not a link.
Format: `work/README.md` in the source tree.

**Checks.** The export fails (and leaves the old `site/` alone) on: the employer name outside `assets/resume.pdf`;
`PLACEHOLDER`, `[N]`, `coming soon`, `unfilled slot`, `TODO`/`FIXME`, `{{`; the dev box's name, a tailnet name or
100.64/10 address, localhost, or a local path in any file; anything off the allowlist; a missing required file
(page, scripts, both headshots, the résumé, the OG image, 404, robots, sitemap); a local reference that 404s;
a stripped script that fails `node --check`.

## Ben's actions before cutover

- **PostHog project key.** The tower gets its own PostHog project (Ben approved a separate one). It has not been
  created. When it exists, paste its `phc_` key into `KEY` in the config block at the top of `analytics.js` in the
  source tree (the one place it lives), then re-export. Until then the export carries the shared Default project's
  key and every event is tagged `site = riphere-v3`. Tracking runs only on `riphere.com` / `www.riphere.com`; on the
  Pages preview (`*.pages.dev`) add `?ph=1`.
- **Canonical host.** Meta tags, JSON-LD, robots and sitemap use `https://www.riphere.com`. If the apex is the
  canonical host instead, change `SITE_URL` in `tools/export_tower.py` and the URLs in the page head.
