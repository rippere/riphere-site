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

`tools/export_tower.py` copies the allowlist, strips comments on copy (`tools/tower_strip.py`; JS, CSS, HTML, and the
`//` / `/* */` comments inside GLSL template literals such as the shaders in `scene3d.js`), and adds:
`404.html` (Pages serves it for any unmatched path), `robots.txt`, `sitemap.xml`, `favicon.svg`, `assets/og.jpg`
(1200x630, the first screen; re-shoot with `harness/og.mjs` in the source tree), `llms.txt` (a plain summary for
AI tools, llmstxt.org format, hand-written in the source tree and copied byte for byte), and `fallback.js`.

**The text version (`/text/`).** `tools/text_version.py` builds `site/text/index.html` at export from the same sources
the boards use: each board's `demos/<id>.js` meta (credit line, the call, who it is for, what it does, links out), each
case file's THE PROBLEM, MY WORK ("What it does") and RECEIPT ("Results") sections, `identity.js` (floors, founder line,
email, street-sign lanes), the page's PH desk and FL 07 plate, and `text.json` in the source tree (the few lines only this
page has). The same body replaces `index.html`'s `<noscript id="nojs">`, so a reader with JavaScript off, a crawler, or an
AI tool that does not run scripts reads every floor from `/`. `/text/` is in the sitemap with its own canonical.
The home page sends a browser to `/text/` (via `fallback.js`) when it has no WebGL, three.js or `scene3d.js` fail, the URL
has `?plain`, the renderer is software (SwiftShader, llvmpipe, softpipe, Microsoft Basic Render: corporate VDI), or the
running scene measures under 12 frames a second. `/text/` then says why and links "Show the 3D version anyway" (`/?3d`,
remembered for the tab's session, which skips the software and frame-rate checks). Reduced motion is not a reason.
The source tree has no `/text/`: preview the text version, `?plain` and the fallback on an export.

**Dev panel.** The tear controls (`<details id="ctl">`, `?ctl` in the source tree) are removed from `index.html` on export.
`apple-touch-icon.png` at the root is optional: copied when the source tree has it (it must be a PNG), and from
then on required in that export; absent, the export does not fail.

**Case files.** Each board's door appears only when `work/<slug>/case.html` exists in the source tree
(slugs: `floor-tool`, `novacrm`, `prepost`, `riphere-llc`). The export then builds `site/work/<slug>/index.html`,
computes the door's read time from the word count (238 wpm), adds the URL to the sitemap, and fills
`window.CASES` in `index.html`. Without a case file a board has no door and its demo pane is not a link.
Format: `work/README.md` in the source tree.

**Checks.** The export fails (and leaves the old `site/` alone) on: the employer name outside `assets/resume.pdf`;
`PLACEHOLDER`, `[N]`, `coming soon`, `unfilled slot`, `TODO`/`FIXME`, `{{`; the dev box's name, a tailnet name or
100.64/10 address, localhost, or a local path in any file; anything off the allowlist; a missing required file
(page, scripts, both headshots, the résumé, the OG image, 404, robots, sitemap, llms.txt, text/index.html); a local
reference that 404s; a stripped script that fails `node --check`; the dev panel's markup or text in any page; a text
version that cannot be built (a source it reads is missing or changed shape; a case file's call or tagged receipt differs
from its board's meta; a `text.json` "about" line is not word for word in its case file; node is missing); an
`llms.txt` that does not quote each board's receipt word for word or link each case file and `/text/`.

## Ben's actions before cutover

- **PostHog project key.** The tower gets its own PostHog project (Ben approved a separate one). It has not been
  created. When it exists, paste its `phc_` key into `KEY` in the config block at the top of `analytics.js` in the
  source tree (the one place it lives), then re-export. Until then the export carries the shared Default project's
  key and every event is tagged `site = riphere-v3`. Tracking runs only on `riphere.com` / `www.riphere.com`; on the
  Pages preview (`*.pages.dev`) add `?ph=1`.
- **Canonical host.** Meta tags, JSON-LD, robots and sitemap use `https://www.riphere.com`. If the apex is the
  canonical host instead, change `SITE_URL` in `tools/export_tower.py` and the URLs in the page head.
