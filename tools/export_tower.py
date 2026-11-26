#!/usr/bin/env python3
"""Export the tower (riphere.com v3) from its private source tree into site/.

The source tree is private and stays private: its history holds strings that
must never reach this public repo. This script copies an allowlist of files,
nothing else, then checks the result before it replaces site/.

    python3 tools/export_tower.py                  # <repo>/site from the default source
    python3 tools/export_tower.py --out /tmp/x     # dry run into a scratch dir
    python3 tools/export_tower.py --src /path/to/source

Exit status: 0 = site/ written and clean; 1 = a check failed (the previous
site/ is left as it was); 2 = usage or source problem.

Transforms on copy (the source is never edited):
  - comments are stripped from .html / .js / .css (tools/tower_strip.py: tokenizers, no minifying);
  - index.html gets window.CASES = {slug: read minutes} for every work/<slug>/case.html in the source;
  - work/<slug>/index.html is built from work/_template.html + that case.html (only when it exists);
  - sitemap.xml and robots.txt are generated (sitemap lists / plus each built case file);
  - the dev tear controls (<details id="ctl">, shown in the source with ?ctl) are removed from index.html.

Checks (any hit fails the export):
  1. employer    the employer's name (any case) in any exported file's bytes
                 or name. The one approved hit is assets/resume.pdf, which
                 is skipped.
  2. placeholder in any text file: PLACEHOLDER, a "[N]" read time, "coming soon",
                 "unfilled slot", "TODO" / "FIXME", or a template token "{{".
  3. devhost     in any file (binary too): the dev box's name, a tailnet name
                 (*.ts.net) or CGNAT address (100.64.0.0/10), localhost /
                 127.0.0.1, or a local path (/mnt/, /home/).
  4. excluded    a file in the output that is not on the allowlist, sits on
                 the denylist, or is a symlink.
  5. required    a file that must ship is missing (the page, its scripts,
                 the headshots, the resume, the OG image, 404, robots, sitemap;
                 plus each OPTIONAL_FILES entry the source has, e.g.
                 apple-touch-icon.png).
  6. reference   an exported page or script points (src/href/url/"assets/...")
                 at a local file that was not exported, so it would 404.
  7. syntax      a stripped .js file (or inline script) fails `node --check`
                 (skipped with a warning when node is not on PATH).
  9. devpanel    the dev tear controls' markup or text in an exported page.

Stdlib only.
"""
from __future__ import annotations

import argparse
import fnmatch
import gzip
import html as htmllib
import json
import math
import os
import posixpath
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from urllib.parse import unquote

sys.path.insert(0, str(Path(__file__).resolve().parent))
from tower_strip import JS_SCRIPT_TYPES, script_kind, strip_css, strip_html, strip_js  # noqa: E402

DEFAULT_SRC = Path("/mnt/external/vault-content/drafts/portfolio-v3/billboard-poc")
REPO_ROOT = Path(__file__).resolve().parent.parent

# (source path, exported path). Single files.
ALLOW_FILES: list[tuple[str, str]] = [
    ("billboard3d.html", "index.html"),
    ("identity.css", "identity.css"),
    ("identity.js", "identity.js"),
    ("scene3d.js", "scene3d.js"),
    ("analytics.js", "analytics.js"),
    ("fallback.js", "fallback.js"),
    ("404.html", "404.html"),
    ("favicon.svg", "favicon.svg"),
]
# (source path, exported path, file signature). Copied when the source has them; once present they are
# required in that export (a source file that fails to arrive fails it). Absent from the source: not an error.
OPTIONAL_FILES: list[tuple[str, str, bytes]] = [
    ("apple-touch-icon.png", "apple-touch-icon.png", b"\x89PNG\r\n\x1a\n"),
]
# (source dir, glob on the file name, recursive?). Exported at the same path.
ALLOW_TREES: list[tuple[str, str, bool]] = [
    ("demos", "*.js", False),
    ("tex", "*", True),
    ("assets", "*", True),
]
# Case files: work/<slug>/case.html in the source -> work/<slug>/index.html in the export, built from
# work/_template.html. Slugs = the boards' slugs (billboard3d.html PROJECTS). A slug without case.html exports nothing.
CASE_SLUGS = {"floor-tool": ("36", "Floor tool"), "novacrm": ("26", "NovaCRM"),
              "prepost": ("18", "PrePost"), "riphere-llc": ("08", "Riphere LLC")}
WPM = 238  # silent reading, non-fiction (Brysbaert 2019)
SITE_URL = "https://www.riphere.com"
# What the output may contain, as path patterns (the allowlist seen from site/).
ALLOWED_OUTPUT = ["index.html", "identity.css", "identity.js", "scene3d.js", "analytics.js", "fallback.js",
                  "404.html", "favicon.svg", "apple-touch-icon.png", "robots.txt", "sitemap.xml",
                  "demos/*.js", "tex/**", "assets/**", "work/*/index.html"]
# Must be in every export (the founder billboard and every flyer lockup use the headshots).
REQUIRED_OUTPUT = ["index.html", "identity.css", "identity.js", "scene3d.js", "analytics.js", "fallback.js",
                   "404.html", "favicon.svg", "robots.txt", "sitemap.xml",
                   "assets/ben-headshot.jpg", "assets/ben-headshot-phone.jpg", "assets/resume.pdf", "assets/og.jpg",
                   "demos/floortool.js", "demos/novacrm.js", "demos/prepost.js", "demos/riphere.js"]

# Belt and braces: these never ship, whatever the allowlist says.
# Matched case-insensitively against each path component.
DENY_COMPONENTS = ["billboard.html", "versions", "caps", "grades", "wf", "harness",
                   "variants", "inspiration", "reviews*", "next.md", "context.md",
                   "sources.md", "preview.html", ".git", ".gitignore", "node_modules",
                   ".ds_store", ".env*", "readme*", "_template*", ".gitkeep", "zz-*", "*.mjs"]

# The only file allowed to contain the employer's name (Ben approved the resume).
EMPLOYER_ALLOWED = {"assets/resume.pdf"}
# Split so this public repo does not carry the name its own check looks for.
EMPLOYER_RE = re.compile(b"bet" + b"son", re.IGNORECASE)
PLACEHOLDER = b"PLACEHOLDER"
# Text-file checks: (label, pattern). Case-insensitive except where noted.
SLOT_RES = [
    ("placeholder", re.compile(b"PLACEHOLDER")),
    ("placeholder", re.compile(rb"\[N\]")),
    ("placeholder", re.compile(rb"coming soon", re.IGNORECASE)),
    ("placeholder", re.compile(rb"unfilled slot", re.IGNORECASE)),
    ("placeholder", re.compile(rb"\b(?:TODO|FIXME)\b")),
    ("placeholder", re.compile(rb"\{\{")),
]
# All-file checks (binaries too): dev hosts, private addresses and local paths. Host names are split so
# this public repo does not carry them in one piece. IPs: no digit, and no "digit." before; no digit and no
# ".digit" after, so "ssh to 100.101.102.103." still matches while "1100.101.102.103" or "100.101.102.103.5" do not.
_IP_B, _IP_A = rb"(?<!\d)(?<!\d\.)", rb"(?!\d)(?!\.\d)"
DEVHOST_RES = [
    re.compile(b"bender" + b"man", re.IGNORECASE),
    re.compile(rb"\b" + b"spa" + rb"rk(?:-\d+)?\b", re.IGNORECASE),                 # the local-LLM box
    re.compile(rb"[a-z0-9-]+\.ts\.net\b", re.IGNORECASE),                            # tailnet names
    re.compile(_IP_B + rb"100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}" + _IP_A),  # tailnet / CGNAT
    re.compile(rb"fd7a:115c:a1e0:", re.IGNORECASE),                                    # tailnet IPv6
    re.compile(_IP_B + rb"(?:10\.\d{1,3}|192\.168|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}" + _IP_A),  # RFC 1918
    re.compile(_IP_B + rb"(?:127\.0\.0\.1|0\.0\.0\.0)" + _IP_A),
    re.compile(rb"\blocalhost\b|\[::1\]|(?<![\w:])::1(?![\w:])", re.IGNORECASE),
    re.compile(rb"/mnt/|/home/|/Users/|[A-Za-z]:\\Users\\", re.IGNORECASE),
]
# The employer grep also runs on a normalised copy of each text file: HTML entities and \uXXXX / \xXX
# escapes decoded, soft hyphens and zero-width characters removed, tags dropped.
_ESC_RE = re.compile(r"\\u\{?([0-9a-fA-F]{2,6})\}?|\\x([0-9a-fA-F]{2})")
_INVISIBLE_RE = re.compile("[\u00ad\u200b-\u200d\u2060\ufeff]")


def normalised(data: bytes) -> bytes:
    t = data.decode("utf-8", errors="replace")
    t = _ESC_RE.sub(lambda m: chr(int(m.group(1) or m.group(2), 16)), t)
    t = htmllib.unescape(t)
    t = re.sub(r"<[^>]*>", "", t)
    return _INVISIBLE_RE.sub("", t).encode("utf-8")


# assets/** and tex/** may only carry these file types (no .bak, .orig, .psd, .txt notes)
TREE_SUFFIXES = {"assets": {".jpg", ".jpeg", ".png", ".webp", ".avif", ".svg", ".pdf"},
                 "tex": {".jpg", ".jpeg", ".png", ".webp", ".ktx2"}}
TREE_EXTRA = {"tex/CREDITS.md"}

# The dev tear controls (billboard3d.html <details id="ctl">): removed from index.html on export; any of these in an
# exported page fails it.
CTL_RE = re.compile(r'<details id="ctl"[^>]*>.*?</details>[ \t]*\n?', re.S)
DEVPANEL_RES = [re.compile(rb'<details\b[^>]*\bid=["\']?ctl\b', re.I), re.compile(rb"Re-hang the ads"),
                re.compile(rb'class="seg" data-k="(?:tear|boards|timing)"')]

TEXT_SUFFIXES = {".html", ".css", ".js", ".mjs", ".json", ".md", ".txt", ".svg",
                 ".xml", ".webmanifest", ".map"}
REF_RE = re.compile(r"""(?<![\w-])(?:src|href)\s*=\s*["']([^"']+)["']""", re.IGNORECASE)
SRCSET_RE = re.compile(r"""(?<![\w-])srcset\s*=\s*["']([^"']+)["']""", re.IGNORECASE)
CSS_URL_RE = re.compile(r"""url\(\s*["']?([^"')]+)["']?\s*\)""")
ASSET_RE = re.compile(r"""["'`](assets/[^"'`$\s]+|tex/[^"'`$\s]+|demos/[^"'`$\s]+\.js)["'`]""")


def is_text(path: Path, data: bytes) -> bool:
    if path.suffix.lower() in TEXT_SUFFIXES:
        return True
    if b"\0" in data[:8192]:
        return False
    try:
        data.decode("utf-8")
    except UnicodeDecodeError:
        return False
    return True


def denied(rel: str) -> str | None:
    for part in Path(rel).parts:
        low = part.lower()
        for pat in DENY_COMPONENTS:
            if fnmatch.fnmatchcase(low, pat):
                return pat
    return None


def allowed_output(rel: str) -> bool:
    for pat in ALLOWED_OUTPUT:
        if pat.endswith("/**"):
            if rel.startswith(pat[:-2]):
                return True
        elif "/" in pat:
            head, name = pat.rsplit("/", 1)
            parent, _, base = rel.rpartition("/")
            # fnmatch's * also matches "/", so the folder depth must match too (work/*/index.html is one level)
            if parent.count("/") == head.count("/") and fnmatch.fnmatchcase(parent, head) and fnmatch.fnmatchcase(base, name):
                return True
        elif rel == pat:
            return True
    return False


def optional_present(src: Path) -> list[str]:
    """Exported paths of the OPTIONAL_FILES the source has (each then becomes required in the export)."""
    return [d for s, d, _ in OPTIONAL_FILES if (src / s).is_symlink() or (src / s).exists()]


def collect(src: Path) -> tuple[list[tuple[Path, str]], list[str]]:
    """Return ([(source file, exported rel path)], problems)."""
    plan: list[tuple[Path, str]] = []
    problems: list[str] = []
    for s, d in ALLOW_FILES:
        p = src / s
        if p.is_symlink() or not p.is_file():
            problems.append(f"missing source file: {s}")
        else:
            plan.append((p, d))
    for s, d, magic in OPTIONAL_FILES:
        p = src / s
        if not p.is_symlink() and not p.exists():
            continue  # optional: not there yet
        if p.is_symlink() or not p.is_file():
            problems.append(f"optional source file is a symlink or not a file: {s}")
        elif not p.read_bytes().startswith(magic):
            problems.append(f"optional source file is not the expected type: {s}")
        else:
            plan.append((p, d))
    for d, pattern, recursive in ALLOW_TREES:
        root = src / d
        if root.is_symlink() or not root.is_dir():
            problems.append(f"missing source dir: {d}/")
            continue
        found = sorted(root.rglob("*") if recursive else root.iterdir())
        n = 0
        for p in found:
            rel = p.relative_to(src).as_posix()
            if p.is_symlink():
                problems.append(f"symlink in source, not copied: {rel}")
                continue
            if not p.is_file() or not fnmatch.fnmatchcase(p.name, pattern):
                continue
            if d in TREE_SUFFIXES and p.suffix.lower() not in TREE_SUFFIXES[d] and rel not in TREE_EXTRA:
                problems.append(f"file type not allowed under {d}/: {rel}")
                continue
            if denied(rel):
                # e.g. .DS_Store under tex/: skipped here, reported in the manifest
                print(f"  skip (denylist {denied(rel)}): {rel}")
                continue
            plan.append((p, rel))
            n += 1
        if n == 0:
            problems.append(f"nothing matched {d}/{pattern}")
    return plan, problems


def check(out: Path, extra_required: list[str] | tuple[str, ...] = ()) -> tuple[list[tuple[str, int, int | None]], list[str]]:
    """Walk the exported tree. Return (manifest rows, failures). extra_required: paths that must be present
    too (the OPTIONAL_FILES this source has)."""
    rows: list[tuple[str, int, int | None]] = []
    fails: list[str] = []
    present: set[str] = set()
    for p in sorted(out.rglob("*")):
        rel = p.relative_to(out).as_posix()
        if p.is_symlink():
            fails.append(f"excluded: symlink in output: {rel}")
            continue
        if p.is_dir():
            continue
        present.add(rel)
        hit = denied(rel)
        if hit:
            fails.append(f"excluded: {rel} is on the denylist ({hit})")
        elif not allowed_output(rel):
            fails.append(f"excluded: {rel} is not on the allowlist")

        data = p.read_bytes()
        text = is_text(p, data)
        rows.append((rel, len(data), len(gzip.compress(data, 9)) if text else None))

        if rel not in EMPLOYER_ALLOWED:
            if EMPLOYER_RE.search(rel.encode()):
                fails.append(f"employer: file name {rel}")
            for n, line in enumerate(data.split(b"\n"), 1):
                if EMPLOYER_RE.search(line):
                    where = f"{rel}:{n}" if text else f"{rel} (binary)"
                    fails.append(f"employer: {where}: {snippet(line, EMPLOYER_RE) if text else 'raw bytes match'}")
                    if not text:
                        break
        if text and rel not in EMPLOYER_ALLOWED and not EMPLOYER_RE.search(data) and EMPLOYER_RE.search(normalised(data)):
            fails.append(f"employer: {rel}: hidden behind an escape, entity, soft hyphen or tag")
        for rx in DEVHOST_RES:
            if text:
                for n, line in enumerate(data.split(b"\n"), 1):
                    if rx.search(line):
                        fails.append(f"devhost: {rel}:{n}: {snippet(line, rx)}")
            elif rx.search(data):
                fails.append(f"devhost: {rel} (binary): raw bytes match {rx.pattern!r}")
        if text and rel.endswith(".html"):
            for rx in DEVPANEL_RES:
                for n, line in enumerate(data.split(b"\n"), 1):
                    if rx.search(line):
                        fails.append(f"devpanel: {rel}:{n}: {snippet(line, rx)}")
        if text:
            for label, rx in SLOT_RES:
                for n, line in enumerate(data.split(b"\n"), 1):
                    if rx.search(line):
                        fails.append(f"{label}: {rel}:{n}: {snippet(line, rx)}")

    for rel in [*REQUIRED_OUTPUT, *extra_required]:
        if rel not in present:
            fails.append(f"required: {rel} is missing from the output")

    # references: every exported page (src/href/srcset), stylesheet (url()) and script ("assets/..." strings)
    for rel in sorted(present):
        suf = Path(rel).suffix.lower()
        if suf not in (".html", ".css", ".js"):
            continue
        txt = (out / rel).read_text("utf-8", errors="replace")
        base = Path(rel).parent
        for n, line in enumerate(txt.split("\n"), 1):
            refs = []
            if suf == ".html":
                refs += REF_RE.findall(line)
                for r in SRCSET_RE.findall(line):
                    refs += [x.strip().split(" ")[0] for x in r.split(",") if x.strip()]
            refs += CSS_URL_RE.findall(line) if suf in (".css", ".html") else []
            refs += ASSET_RE.findall(line)
            for ref in refs:
                target = local_target(ref)
                if target is None:
                    continue
                # root-relative refs resolve from site/; relative refs from the page's folder (scripts resolve
                # against the page that loads them, which sits at the root)
                rel_base = "" if ref.startswith("/") or suf == ".js" else base.as_posix()
                path = posixpath.normpath(posixpath.join(rel_base, target))
                if path == ".." or path.startswith("../"):
                    fails.append(f"reference: {rel}:{n}: {ref} points outside the export")
                elif path not in present:
                    fails.append(f"reference: {rel}:{n}: {ref} is not in the export")
    return rows, fails


def node_check(out: Path) -> list[str]:
    """`node --check` every exported .js and every inline script of each .html. Returns failures."""
    node = shutil.which("node")
    if not node:
        print("warning: node not on PATH; skipped the syntax check of stripped scripts", file=sys.stderr)
        return []
    fails: list[str] = []
    with tempfile.TemporaryDirectory() as td:
        jobs: list[tuple[str, str, bool]] = []
        for p in sorted(out.rglob("*.js")):
            t = p.read_text("utf-8")
            jobs.append((p.relative_to(out).as_posix(), t, bool(re.search(r"^\s*(import|export)\b", t, re.M))))
        for p in sorted(out.rglob("*.html")):
            t = p.read_text("utf-8")
            for k, m in enumerate(re.finditer(r"<script\b([^>]*)>(.*?)</script\s*>", t, re.S | re.I)):
                attrs, body = m.group(1), m.group(2)
                if "src=" in attrs or not body.strip():
                    continue
                kind = script_kind(attrs)
                if kind not in JS_SCRIPT_TYPES:
                    if kind in ("importmap", "application/ld+json"):
                        try:
                            json.loads(body)
                        except ValueError as e:
                            fails.append(f"syntax: {p.relative_to(out).as_posix()} <script type={kind}> #{k}: {e}")
                    continue
                jobs.append((f"{p.relative_to(out).as_posix()} <script> #{k}", body, kind == "module"))
        for k, (name, body, module) in enumerate(jobs):
            f = Path(td) / f"c{k}.{'mjs' if module else 'cjs'}"
            f.write_text(body, "utf-8")
            r = subprocess.run([node, "--check", str(f)], capture_output=True, text=True)
            if r.returncode:
                fails.append(f"syntax: {name}: {r.stderr.strip().splitlines()[-1] if r.stderr.strip() else 'node --check failed'}")
    return fails


def transform(src_path: Path, rel: str) -> bytes:
    """Copy-time transform: comments out of .html / .js / .css. Everything else is copied byte for byte."""
    data = src_path.read_bytes()
    suf = Path(rel).suffix.lower()
    if suf not in (".html", ".svg", ".js", ".css"):
        return data
    text = data.decode("utf-8")
    text = strip_html(text) if suf in (".html", ".svg") else strip_js(text) if suf == ".js" else strip_css(text)
    return text.encode("utf-8")


def words(fragment: str) -> int:
    text = re.sub(r"<(script|style)\b.*?</\1\s*>", " ", fragment, flags=re.S | re.I)
    text = htmllib.unescape(re.sub(r"<[^>]+>", " ", text))
    return len(re.findall(r"[\w’'-]+", text))


def build_cases(src: Path, staging: Path) -> tuple[dict[str, int], list[str]]:
    """Build work/<slug>/index.html for each case.html in the source. Returns ({slug: minutes}, problems).
    The fragment's comments are stripped first, so nothing in a comment reaches the title, the meta
    description, the page, or the word count."""
    cases: dict[str, int] = {}
    problems: list[str] = []
    tpl_path = src / "work" / "_template.html"
    for slug, (floor, label) in CASE_SLUGS.items():
        frag_path = src / "work" / slug / "case.html"
        if not frag_path.is_file():
            continue
        try:
            if not tpl_path.is_file():
                problems.append("work/_template.html is missing but a case file exists")
                break
            frag = strip_html(frag_path.read_text("utf-8"))
            dek_rx = re.compile(r"""<p\b[^>]*class=["'][^"']*\bdek\b[^"']*["'][^>]*>(.*?)</p>""", re.S | re.I)
            h1 = re.findall(r"<h1\b[^>]*>(.*?)</h1>", frag, re.S | re.I)
            dek = dek_rx.findall(frag)
            if len(h1) != 1 or len(dek) != 1:
                problems.append(f"work/{slug}/case.html needs exactly one <h1> and one <p class=\"dek\"> (found {len(h1)} and {len(dek)})")
                continue
            plain = lambda h: " ".join(htmllib.unescape(re.sub(r"<[^>]+>", " ", h)).split())
            title, desc = plain(h1[0]), plain(dek[0])
            n = words(frag)
            minutes = max(1, math.ceil(n / WPM))
            dek_end = dek_rx.search(frag).end()
            body = frag[:dek_end] + f'\n    <p class="min">{minutes} min read</p>' + frag[dek_end:]
            crumbs = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "riphere.com", "item": SITE_URL + "/"},
                {"@type": "ListItem", "position": 2, "name": title, "item": f"{SITE_URL}/work/{slug}/"}]}
            esc = lambda v: htmllib.escape(v, quote=True)
            values = {"title": esc(title), "description": esc(desc), "slug": slug, "floor": floor, "label": esc(label),
                      "jsonld": json.dumps(crumbs, ensure_ascii=False).replace("</", "<\\/"), "body": body}
            tpl = tpl_path.read_text("utf-8")
            unknown = sorted(set(re.findall(r"\{\{(\w+)\}\}", tpl)) - set(values))
            if unknown:
                problems.append(f"work/_template.html: unknown token(s) {unknown}")
                continue
            # one pass over the template only, so text inside the case file is never treated as a token
            page = re.sub(r"\{\{(\w+)\}\}", lambda m: values[m.group(1)], tpl)
            dest = staging / "work" / slug / "index.html"
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(strip_html(page), "utf-8")
            cases[slug] = minutes
            print(f"  case file: work/{slug}/ ({n} words, {minutes} min)")
        except (OSError, ValueError, UnicodeDecodeError) as e:
            problems.append(f"work/{slug}/case.html: {e}")
    return cases, problems


CASES_RE = re.compile(r"<script>window\.CASES = \{\};</script>")


def strip_dev_panel(staging: Path) -> list[str]:
    """Remove the dev tear controls from index.html (the source keeps them for ?ctl). Returns problems."""
    index = staging / "index.html"
    html = index.read_text("utf-8")
    if len(CTL_RE.findall(html)) != 1:
        return ['index.html: expected exactly one <details id="ctl"> (the dev tear controls) to remove']
    index.write_text(CTL_RE.sub("", html), "utf-8")
    return []


def write_meta(staging: Path, cases: dict[str, int]) -> list[str]:
    """window.CASES into index.html; robots.txt and sitemap.xml. Returns problems."""
    problems: list[str] = []
    index = staging / "index.html"
    html = index.read_text("utf-8")
    if len(CASES_RE.findall(html)) != 1:
        problems.append("index.html: expected exactly one <script>window.CASES = {};</script> to fill")
    else:
        html = CASES_RE.sub(lambda m: f"<script>window.CASES = {json.dumps(cases, sort_keys=True)};</script>", html)
        index.write_text(html, "utf-8")
    (staging / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}/sitemap.xml\n", "utf-8")
    urls = [f"{SITE_URL}/"] + [f"{SITE_URL}/work/{slug}/" for slug in sorted(cases)]
    (staging / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                                         + "".join(f"  <url><loc>{u}</loc></url>\n" for u in urls) + "</urlset>\n", "utf-8")
    return problems


def local_target(ref: str) -> str | None:
    """The exported path a src/href points at, or None if it is not a local file."""
    if "${" in ref or ref.startswith(("#", "?", "data:", "mailto:", "tel:", "//")):
        return None
    if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:", ref):
        return None
    path = unquote(ref.split("#", 1)[0].split("?", 1)[0])
    path = path.lstrip("/") if path.startswith("/") else path
    if not path:
        return None
    if path.endswith("/"):
        return path + "index.html" if path.startswith("work/") else None  # a case-file route must exist
    if not Path(path).suffix:
        return None  # a route such as /work/<slug>; not a file this script can vouch for
    return path


def snippet(line: bytes, rx: re.Pattern[bytes], width: int = 48) -> str:
    m = rx.search(line)
    assert m
    a, b = max(0, m.start() - width), min(len(line), m.end() + width)
    s = line[a:b].decode("utf-8", errors="replace").strip()
    return ("..." if a else "") + s + ("..." if b < len(line) else "")


def safe_out(out: Path, src: Path) -> str | None:
    if out == src or out in src.parents or src in out.parents:
        return "--out must not be the source tree, inside it, or above it"
    if out == REPO_ROOT or out in REPO_ROOT.parents:
        return "--out must not be this repo's root or above it"
    if REPO_ROOT in out.parents and out != REPO_ROOT / "site":
        return "--out inside this repo must be site/ (use a path outside the repo for a dry run)"
    if out.exists() and not out.is_dir():
        return "--out exists and is not a directory"
    if out.is_dir() and ((out / ".git").exists() or (out / "package.json").exists()):
        return "--out looks like a project (has .git or package.json); refusing to clean it"
    return None


def main() -> int:
    ap = argparse.ArgumentParser(description="Export the tower allowlist into site/ and check it.")
    ap.add_argument("--src", type=Path, default=DEFAULT_SRC, help=f"private source tree (default {DEFAULT_SRC})")
    ap.add_argument("--out", type=Path, default=REPO_ROOT / "site", help="output dir, cleaned first (default <repo>/site)")
    args = ap.parse_args()
    src, out = args.src.resolve(), args.out.resolve()

    if not src.is_dir():
        print(f"error: source tree not found: {src}", file=sys.stderr)
        return 2
    err = safe_out(out, src)
    if err:
        print(f"error: {err}: {out}", file=sys.stderr)
        return 2

    print(f"source: {src}")
    print(f"output: {out}")
    plan, problems = collect(src)
    if problems:
        for p in problems:
            print(f"error: {p}", file=sys.stderr)
        return 2

    # Build beside the target, check, then swap: a failed export never replaces a good site/.
    staging = out.with_name(out.name + ".staging")
    if staging.exists():
        shutil.rmtree(staging)
    try:
        fails: list[str] = []
        for p, rel in plan:
            dest = staging / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            try:
                dest.write_bytes(transform(p, rel))  # contents only: no mode bits, no mtimes
            except (ValueError, UnicodeDecodeError) as e:
                fails.append(f"strip: {rel}: {e}")
        cases, probs = build_cases(src, staging)
        fails += probs
        if (staging / "index.html").is_file():
            try:
                fails += strip_dev_panel(staging)
                fails += write_meta(staging, cases)
            except (OSError, ValueError, UnicodeDecodeError) as e:
                fails.append(f"meta: {e}")
        print(f"  doors: {json.dumps(cases, sort_keys=True) if cases else 'none (no work/<slug>/case.html yet; every door hidden)'}")
        rows, more = check(staging, optional_present(src))
        fails += more + node_check(staging)

        print(f"\nmanifest ({len(rows)} files)")
        print(f"  {'bytes':>10}  {'gzip -9':>9}  path")
        total = gz_total = 0
        for rel, size, gz in rows:
            total += size
            gz_total += gz or 0
            print(f"  {size:>10,}  {(format(gz, ',') if gz is not None else '-'):>9}  {rel}")
        print(f"  {total:>10,}  {gz_total:>9,}  total (gzip column: text files only)")
        budget = sum(gz or 0 for rel, _, gz in rows if rel == "identity.js" or rel.startswith("demos/"))
        print(f"  demos + identity.js gzip -9: {budget:,} B (budget 30,720)")

        if fails:
            print(f"\nFAILED: {len(fails)} problem(s); {out} was not touched", file=sys.stderr)
            for f in fails:
                print(f"  {f}", file=sys.stderr)
            return 1

        # swap: old aside, new in, then drop the old (a crash in between leaves site.old, never a half-written site/)
        old = out.with_name(out.name + ".old")
        if old.exists():
            shutil.rmtree(old)
        if out.exists():
            os.replace(out, old)
        os.replace(staging, out)
        if old.exists():
            shutil.rmtree(old)
        print(f"\nOK: {len(rows)} files exported, all checks passed")
        return 0
    finally:
        if staging.exists():
            shutil.rmtree(staging)


if __name__ == "__main__":
    sys.exit(main())
