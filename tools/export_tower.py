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

Checks (any hit fails the export):
  1. employer    the employer's name (any case) in any exported file's bytes
                 or name. The one approved hit is assets/resume.pdf, which
                 is skipped.
  2. placeholder the string PLACEHOLDER (case-sensitive) in any text file.
  3. excluded    a file in the output that is not on the allowlist, sits on
                 the denylist, or is a symlink.
  4. reference   index.html points (src/href) at a local file that was not
                 exported, so the page would 404 on it.

Stdlib only.
"""
from __future__ import annotations

import argparse
import fnmatch
import gzip
import re
import shutil
import sys
from pathlib import Path

DEFAULT_SRC = Path("/mnt/external/vault-content/drafts/portfolio-v3/billboard-poc")
REPO_ROOT = Path(__file__).resolve().parent.parent

# (source path, exported path). Single files, copied verbatim.
ALLOW_FILES: list[tuple[str, str]] = [
    ("billboard3d.html", "index.html"),
    ("identity.css", "identity.css"),
    ("identity.js", "identity.js"),
    ("scene3d.js", "scene3d.js"),
    ("analytics.js", "analytics.js"),
]
# (source dir, glob on the file name, recursive?). Exported at the same path.
ALLOW_TREES: list[tuple[str, str, bool]] = [
    ("demos", "*.js", False),
    ("tex", "*", True),
    ("assets", "*", True),
]
# What the output may contain, as path patterns (the allowlist seen from site/).
ALLOWED_OUTPUT = ["index.html", "identity.css", "identity.js", "scene3d.js",
                  "analytics.js", "demos/*.js", "tex/**", "assets/**"]

# Belt and braces: these never ship, whatever the allowlist says.
# Matched case-insensitively against each path component.
DENY_COMPONENTS = ["billboard.html", "versions", "caps", "grades", "wf", "harness",
                   "variants", "inspiration", "reviews*", "next.md", "context.md",
                   "sources.md", "preview.html", ".git", ".gitignore", "node_modules",
                   ".ds_store", ".env*"]

# The only file allowed to contain the employer's name (Ben approved the resume).
EMPLOYER_ALLOWED = {"assets/resume.pdf"}
# Split so this public repo does not carry the name its own check looks for.
EMPLOYER_RE = re.compile(b"bet" + b"son", re.IGNORECASE)
PLACEHOLDER = b"PLACEHOLDER"

TEXT_SUFFIXES = {".html", ".css", ".js", ".mjs", ".json", ".md", ".txt", ".svg",
                 ".xml", ".webmanifest", ".map"}
REF_RE = re.compile(r"""\b(?:src|href)\s*=\s*["']([^"']+)["']""")


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
            if parent == head and fnmatch.fnmatchcase(base, name):
                return True
        elif rel == pat:
            return True
    return False


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
            if denied(rel):
                # e.g. .DS_Store under tex/: skipped here, reported in the manifest
                print(f"  skip (denylist {denied(rel)}): {rel}")
                continue
            plan.append((p, rel))
            n += 1
        if n == 0:
            problems.append(f"nothing matched {d}/{pattern}")
    return plan, problems


def check(out: Path) -> tuple[list[tuple[str, int, int | None]], list[str]]:
    """Walk the exported tree. Return (manifest rows, failures)."""
    rows: list[tuple[str, int, int | None]] = []
    fails: list[str] = []
    for p in sorted(out.rglob("*")):
        rel = p.relative_to(out).as_posix()
        if p.is_symlink():
            fails.append(f"excluded: symlink in output: {rel}")
            continue
        if p.is_dir():
            continue
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
        if text:
            for n, line in enumerate(data.split(b"\n"), 1):
                if PLACEHOLDER in line:
                    fails.append(f"placeholder: {rel}:{n}: {snippet(line, re.compile(re.escape(PLACEHOLDER)))}")

    index = out / "index.html"
    if index.is_file():
        html = index.read_text("utf-8", errors="replace")
        for n, line in enumerate(html.split("\n"), 1):
            for ref in REF_RE.findall(line):
                target = local_target(ref)
                if target is not None and not (out / target).is_file():
                    fails.append(f"reference: index.html:{n}: {ref} is not in the export")
    else:
        fails.append("excluded: index.html is missing from the output")
    return rows, fails


def local_target(ref: str) -> str | None:
    """The exported path a src/href points at, or None if it is not a local file."""
    if "${" in ref or ref.startswith(("#", "?", "data:", "mailto:", "tel:", "//")):
        return None
    if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:", ref):
        return None
    path = ref.split("#", 1)[0].split("?", 1)[0].lstrip("/")
    if not path or path.endswith("/"):
        return None
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
        for p, rel in plan:
            dest = staging / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(p, dest)  # contents only: no mode bits, no mtimes
        rows, fails = check(staging)

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

        if out.exists():
            shutil.rmtree(out)
        staging.rename(out)
        print(f"\nOK: {len(rows)} files exported, all checks passed")
        return 0
    finally:
        if staging.exists():
            shutil.rmtree(staging)


if __name__ == "__main__":
    sys.exit(main())
