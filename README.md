# riphere.com

Ben Rippere's portfolio: the tower, a night building whose floors each carry one piece of work on a billboard.
It is a static three.js page with no build step and no dependencies to install.

## Layout

```
site/            the tower as served. Exported, never edited by hand.
tools/           export_tower.py: copies the tower into site/ and checks it
legacy-next/     the previous Next.js site, archived (rollback: see DEPLOY.md)
DEPLOY.md        Cloudflare Pages settings, rollback, open TODOs
```

## Where the source lives

The tower is developed in a private working tree. This repo only receives an export of it:
`tools/export_tower.py` copies an allowlist of files into `site/` and refuses to finish if anything
that should not be public is in the result.

```bash
python3 tools/export_tower.py                 # export into site/ (cleans it first)
python3 tools/export_tower.py --out /tmp/x    # dry run into a scratch dir
python3 tools/export_tower.py --src <path>    # another copy of the source tree
```

What is copied: the page (`index.html`), `identity.css`, `identity.js`, `scene3d.js`, `analytics.js`, `fallback.js`,
`404.html`, `favicon.svg`, `llms.txt`, `demos/*.js`, `tex/**` and `assets/**`. Nothing else. Built at export:
`work/<slug>/index.html` (case files), `text/index.html` (the text version; its body also fills `index.html`'s
`<noscript>`), `robots.txt` and `sitemap.xml`. See DEPLOY.md, "What the export ships".

The export fails (exit 1, `site/` left as it was) if:

- any exported file other than `assets/resume.pdf` contains the employer's name,
- any text file contains the string `PLACEHOLDER`,
- a file outside the allowlist, a denylisted path or a symlink is in the output,
- `index.html` points at a local file that was not exported.

It prints a manifest with byte and gzip sizes on every run. To change the site, change the source,
run the export, and commit `site/`.

## Preview

```bash
python3 -m http.server 8000 --directory site    # http://localhost:8000
```

Analytics stay off on localhost unless the URL carries `?ph=1`.

## The archived Next.js site

`legacy-next/` holds the Next.js app that served riphere.com before the tower, unchanged apart from the move.
It still builds on its own:

```bash
cd legacy-next
npm install
npm run build      # static export to legacy-next/out
```

`legacy-next/legacy/` is the zero-build site that came before that one.
