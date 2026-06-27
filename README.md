# riphere.com — personal portfolio

Warm-editorial portfolio for Ben Rippere. **Next.js** (App Router) · **Tailwind v4** · **Motion**.
Featured work is a sequence of per-project scroll "stages" built on the Aceternity
**container-scroll animation** — each project tilts up into view in its own space.

## Develop
```bash
npm install
npm run dev        # http://localhost:3000
```

## Build (static export → ./out)
```bash
npm run build      # emits a fully static site to ./out
```

## Deploy (Cloudflare Pages — recommended)
- Framework preset: **Next.js (Static HTML Export)** (or "None")
- Build command: `npm run build`
- Output dir: `out`

Also works on Netlify / GitHub Pages — static, output = `out/`.

## Structure
```
app/         layout.tsx (fonts + metadata) · page.tsx (all sections) · globals.css (theme tokens) · icon.svg
components/   showcase.tsx — ContainerScroll + ProjectFrame + Reveal (the scroll stages)
lib/          projects.ts — featured-work content (edit here to add/edit projects)
legacy/       the previous zero-build static site (index.html + styles.css), archived
```

## Editing featured work
Everything for the work section lives in `lib/projects.ts`: name, category, accent
hue, tagline, headline metric, architecture rows, stack chips, links. Add an object
to the array and a new scroll stage appears automatically.

## Design direction
Cream canvas · navy-ink **Fraunces** display · **JetBrains Mono** technical labels ·
one electric-cobalt accent. Research behind it: `DESIGN_REFERENCES.md`.
