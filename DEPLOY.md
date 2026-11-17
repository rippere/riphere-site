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

## TODO for S3

- **PostHog project key.** The tower gets its own PostHog project (Ben approved a separate one). It has
  not been created. When it exists, its `phc_` key goes into `analytics.js` in the source tree, then
  re-export. Until then the exported `analytics.js` carries whatever key the source has.
- `/work/<slug>` routes for the case files, page title / description / OG image / favicon, a 404 page,
  and a fallback for browsers without WebGL. Each new file has to be added to the allowlist in
  `tools/export_tower.py` or the export will not carry it.
