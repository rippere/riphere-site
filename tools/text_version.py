"""The text version of riphere.com: /text/index.html, and the same body as index.html's <noscript id="nojs">.

Built at export time from the sources the boards already use, so there is no second copy to drift:
  - demos/<id>.js `meta` (read with node): the credit line (prov), the call, who it is for, what it does, the exits;
  - work/<slug>/case.html: the dek, THE PROBLEM ("Who it's for"), MY WORK (the first subsection, "What it does") and
    RECEIPT ("Results", whose tagged line must be the board's meta.receipt, word for word, with its status tag);
  - identity.js: IDS, FLOORS (codes, labels, tags), FOUNDER (name, statement), MAIL, LANES;
  - billboard3d.html: the role (the <title>), the PH desk (credentials + the three method sheets), the FL 07 plate;
  - text.json (source tree, never shipped): the copy only this page has (the through-line, the intro, the why-notes) and
    the "about" lines, each of which must appear word for word in the case file it names.
Anything missing or out of step fails the export (the caller reports the problems); nothing is guessed.

Stdlib only; node is required (the demo meta is ES-module JavaScript).
"""
from __future__ import annotations

import html as htmllib
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path
from urllib.parse import quote

from tower_strip import strip_html

TEXT_PATH = "text/index.html"
FLOOR_ORDER = ["PH", "36", "26", "18", "08", "07", "M", "L"]
WHY_KEYS = {"soft-gl", "slow", "no-webgl", "scene", "asked"}

esc = lambda v: htmllib.escape(str(v), quote=True)  # noqa: E731
plain_text = lambda h: " ".join(htmllib.unescape(re.sub(r"<[^>]+>", " ", h)).split())  # noqa: E731


class TextProblem(Exception):
    pass


def need(cond, msg: str):
    if not cond:
        raise TextProblem(msg)


# ---------- sources ----------

_JS_STR = r"'((?:[^'\\]|\\.)*)'"


def js_unquote(s: str) -> str:
    """A single-quoted JS string body -> text (\\' \\" \\\\ \\n \\uXXXX \\u{X})."""
    def one(m: re.Match) -> str:
        e = m.group(1)
        if e[0] == "u" and len(e) > 1:
            return chr(int(e[1:].strip("{}"), 16))
        return {"n": "\n", "t": "\t"}.get(e, e)
    return re.sub(r"\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|.)", one, s)


def load_meta(src: Path, ids: list[str]) -> dict:
    node = shutil.which("node")
    need(node, "node is not on PATH; the text version reads demos/<id>.js meta with it (fail closed)")
    with tempfile.TemporaryDirectory() as td:
        pairs = []
        for i in ids:
            f = src / "demos" / f"{i}.js"
            need(f.is_file() and not f.is_symlink(), f"demos/{i}.js is missing")
            dest = Path(td) / f"{i}.mjs"
            dest.write_text(f.read_text("utf-8"), "utf-8")
            pairs.append([i, dest.as_uri()])
        code = ("const out = {}; for (const [id, u] of JSON.parse(process.argv[1])) { const m = await import(u); out[id] = m.meta; }"
                " process.stdout.write(JSON.stringify(out));")
        r = subprocess.run([node, "--input-type=module", "-e", code, json.dumps(pairs)], capture_output=True, text=True, cwd=td, timeout=60)
    need(r.returncode == 0, f"node could not read demos/*.js meta: {r.stderr.strip()[-300:]}")
    meta = json.loads(r.stdout)
    for i in ids:
        m = meta.get(i)
        need(isinstance(m, dict), f"demos/{i}.js exports no meta")
        for k in ("slug", "prov", "call", "for", "what", "receipt"):
            need(m.get(k), f"demos/{i}.js meta.{k} is empty")
        need(isinstance(m["receipt"], dict) and m["receipt"].get("text") and m["receipt"].get("status"), f"demos/{i}.js meta.receipt needs text and status")
    return meta


def read_identity(src: Path) -> dict:
    t = (src / "identity.js").read_text("utf-8")
    m = re.search(r"const IDS = \[([^\]]*)\];", t)
    need(m, "identity.js: IDS not found")
    ids = [js_unquote(x) for x in re.findall(_JS_STR, m.group(1))]
    m = re.search(r"const MAIL = " + _JS_STR + ";", t)
    need(m, "identity.js: MAIL not found")
    mail = js_unquote(m.group(1))
    m = re.search(r"const FOUNDER = \{ q: " + _JS_STR + r", name: " + _JS_STR, t)
    need(m, "identity.js: FOUNDER { q, name } not found")
    founder = {"q": js_unquote(m.group(1)), "name": js_unquote(m.group(2))}
    m = re.search(r"const FLOORS = \[(.*?)\n  \];", t, re.S)
    need(m, "identity.js: FLOORS not found")
    floors = []
    for row in re.findall(r"\{ (code: .*?) \},", m.group(1)):
        f = {k: js_unquote(v) for k, v in re.findall(r"(\w+): " + _JS_STR, row)}
        b = re.search(r"board: (\d+)", row)
        if b:
            f["board"] = int(b.group(1))
        floors.append(f)
    need([f.get("code") for f in floors] == FLOOR_ORDER, f"identity.js: FLOORS codes changed ({[f.get('code') for f in floors]}); update tools/text_version.py")
    m = re.search(r"const LANES = \[(.*?)\n  \];", t, re.S)
    need(m, "identity.js: LANES not found")
    lanes = []
    for k, parts in re.findall(r"\{ k: " + _JS_STR + r", parts: \[(.*?)\] \}", m.group(1)):
        ps = []
        for label, href in re.findall(r"\[" + _JS_STR + r", ([^\]]+)\]", parts):
            href = href.strip()
            if href.startswith("mailto("):
                href = "mailto"
            else:
                need(re.fullmatch(_JS_STR, href), f"identity.js: LANES href not understood: {href}")
                href = js_unquote(href[1:-1])
            ps.append((js_unquote(label), href))
        lanes.append((js_unquote(k), ps))
    need(len(lanes) == 2, "identity.js: LANES should have two lanes")
    return {"ids": ids, "mail": mail, "founder": founder, "floors": floors, "lanes": lanes}


def read_host(src: Path) -> dict:
    t = strip_html((src / "billboard3d.html").read_text("utf-8"))
    m = re.search(r"<title>(.*?)</title>", t, re.S)
    need(m and ", " in m.group(1), "billboard3d.html: <title> should read 'Name, Role'")
    name, role = [x.strip() for x in htmllib.unescape(m.group(1)).split(", ", 1)]
    m = re.search(r'<section id="ph-plate".*?</section>', t, re.S)
    need(m, "billboard3d.html: #ph-plate not found")
    ph = m.group(0)
    cred = re.findall(r'<p class="ph-cred">(.*?)</p>', ph, re.S)
    need(len(cred) == 1, "billboard3d.html: #ph-plate needs one .ph-cred")
    sheets = re.findall(r'<article class="ph-sheet">.*?<h3 class="ph-k">(.*?)</h3>.*?<p class="ph-b">(.*?)</p>\s*<p class="ph-src">(.*?)</p>\s*</article>', ph, re.S)
    need(len(sheets) == 3, f"billboard3d.html: expected 3 desk sheets, found {len(sheets)}")
    m = re.search(r'<section id="fl07".*?</section>', t, re.S)
    need(m, "billboard3d.html: #fl07 not found")
    f7 = m.group(0)
    co = re.findall(r'<p class="f7-co">(.*?)</p>', f7, re.S)
    ml = re.findall(r'<p class="f7-ml">(.*?)</p>', f7, re.S)
    need(len(co) == 1 and len(ml) == 1, "billboard3d.html: #fl07 needs one .f7-co and one .f7-ml")
    return {"name": name, "role": role, "cred": plain_text(cred[0]),
            "sheets": [(plain_text(h), plain_text(b), plain_text(s)) for h, b, s in sheets],
            "f7co": plain_text(co[0]), "f7ml": ml[0].strip()}


def read_case(src: Path, slug: str) -> dict:
    frag = strip_html((src / "work" / slug / "case.html").read_text("utf-8"))
    dek = re.findall(r'<p class="dek">(.*?)</p>', frag, re.S)
    call = re.findall(r'<p class="call"><span class="ck">The call</span>(.*?)</p>', frag, re.S)
    need(len(dek) == 1 and len(call) == 1, f"work/{slug}/case.html: needs one .dek and one .call")

    def section(label: str, whole: bool) -> str:
        m = re.search(r'<p class="lbl">' + label + r'</p>(.*?)(?=<p class="lbl">|\Z)', frag, re.S)
        need(m, f"work/{slug}/case.html: no {label} label")
        body = m.group(1).strip()
        h = re.match(r"<h2\b[^>]*>.*?</h2>\s*", body, re.S)
        need(h, f"work/{slug}/case.html: {label} should open with an <h2>")
        body = body[h.end():]
        if not whole:
            body = re.split(r"<h2\b", body, maxsplit=1)[0]
        need(re.search(r"<(p|ul|ol)\b", body), f"work/{slug}/case.html: {label} has no text")
        need(not re.search(r"<h[12456]\b", body), f"work/{slug}/case.html: {label} has a heading the text version does not expect (h3 only)")
        return re.sub(r"<(/?)h3\b", r"<\1h4", body).strip()  # under the page's h3 labels (THE PROBLEM / MY WORK / RECEIPT)

    return {"frag": frag, "dek": plain_text(dek[0]), "call": plain_text(call[0]),
            "problem": section("THE PROBLEM", True), "work": section("MY WORK", False), "receipt": section("RECEIPT", False)}


def read_copy(src: Path, cases: dict[str, dict]) -> dict:
    p = src / "text.json"
    need(p.is_file(), "text.json is missing from the source tree (the text version's own copy)")
    c = json.loads(p.read_text("utf-8"))
    for k in ("title", "description", "through", "intro", "nojs", "to3d", "anyway", "why", "about"):
        need(c.get(k), f"text.json: {k} is empty")
    need(set(c["why"]) == WHY_KEYS, f"text.json: why needs exactly {sorted(WHY_KEYS)}")
    for q in c["about"]:
        slug = re.fullmatch(r"work/([\w-]+)/case\.html", q.get("from", ""))
        need(slug and slug.group(1) in cases, f"text.json: about line names an unknown case file: {q.get('from')}")
        need(q["text"] in plain_text(cases[slug.group(1)]["frag"]), f"text.json: about line drifted from {q['from']}: {q['text'][:60]}")
    return c


# ---------- render ----------

CSS = """
.tv { max-width: 42rem; margin: 0 auto; padding: 32px 16px 72px; box-sizing: border-box; color: #e9e6df; text-align: left;
  font: 400 18px/1.6 "Archivo", "Helvetica Neue", Arial, sans-serif; overflow-wrap: break-word; }
.tv *, .tv *::before { box-sizing: border-box; }
.tv h1 { font: 800 clamp(34px, 9vw, 52px)/1.04 "Archivo", sans-serif; font-stretch: 112%; margin: 0 0 .2em; color: #e9e6df; }
.tv h2 { font: 800 clamp(26px, 6vw, 34px)/1.1 "Archivo", sans-serif; font-stretch: 112%; margin: .1em 0 .4em; color: #e9e6df; }
.tv h4 { font: 700 19px/1.3 "Archivo", sans-serif; margin: 1.4em 0 .4em; color: #e9e6df; }
.tv p, .tv ul, .tv ol, .tv dl { margin: 0 0 1em; }
.tv ul { padding-left: 1.2em; }
.tv li { margin: 0 0 .4em; }
.tv a { color: #e9e6df; text-underline-offset: 3px; }
.tv a:focus-visible { outline: 2px solid #ff4b3a; outline-offset: 2px; }
.tv .tv-role { font: 700 13px/1.3 "Archivo", sans-serif; font-stretch: 115%; letter-spacing: .06em; text-transform: uppercase; color: #ff4b3a; margin: 0 0 1.2em; }
.tv .tv-q { font-size: 22px; line-height: 1.4; }
.tv .tv-tl { color: #c9c6bf; }
.tv .tv-note { border: 1px solid #2a2d35; padding: .8em 1em; font-size: 16px; color: #c9c6bf; }
.tv .tv-note.on { border-color: #e9e6df; color: #e9e6df; }
.tv .tv-note a { font-weight: 700; }
.tv .tv-toc { list-style: none; padding: 0; display: flex; flex-wrap: wrap; gap: .3em 1.2em; font: 700 14px/1.5 "Archivo", sans-serif; font-stretch: 112%; }
.tv .tv-toc li { margin: 0; }
.tv section { border-top: 1px solid #2a2d35; margin-top: 2.6em; padding-top: 1.6em; scroll-margin-top: 16px; }
.tv .tv-k { font: 400 14px/1.4 ui-monospace, "SFMono-Regular", Menlo, monospace; color: #8d8f96; margin: 0; }
.tv .tv-dek { font-size: 20px; line-height: 1.45; color: #c9c6bf; }
.tv .tv-cred { font-size: 15px; color: #8d8f96; }
.tv .tv-call { font: 800 24px/1.15 "Archivo", sans-serif; font-stretch: 75%; margin: 1.2em 0 1em; }
.tv .tv-ck { display: block; margin-bottom: .35em; font: 700 13px/1.3 "Archivo", sans-serif; font-stretch: 115%; letter-spacing: .04em; text-transform: uppercase; color: #8d8f96; }
.tv .tv-lbl { display: table; margin: 2em 0 .8em; border: 1.5px solid #e9e6df; padding: .4em .6em .34em; font: 700 13px/1 "Archivo", sans-serif; font-stretch: 115%; letter-spacing: .01em; text-transform: uppercase; color: #e9e6df; }
.tv .tv-lead { font-weight: 700; }
.tv .tag { display: inline-block; margin-left: .35em; border: 1px solid #5b5e66; padding: 0 .4em; font: 400 14px/1.5 ui-monospace, "SFMono-Regular", Menlo, monospace; color: #8d8f96; vertical-align: .08em; }
.tv .tv-more { margin-top: 1.4em; font-weight: 700; }
.tv .tv-more span { font-weight: 400; color: #8d8f96; }
.tv dl { display: grid; grid-template-columns: minmax(7.5em, max-content) 1fr; gap: .5em 1em; }
.tv dt { font: 700 13px/1.75 "Archivo", sans-serif; font-stretch: 115%; letter-spacing: .03em; text-transform: uppercase; color: #8d8f96; }
.tv dd { margin: 0; }
.tv .tv-src { display: block; font-size: 15px; color: #8d8f96; }
.tv .tv-end { border-top: 1px solid #2a2d35; margin-top: 3em; padding-top: 1.2em; font-size: 15px; color: #8d8f96; }
@media (max-width: 480px) { .tv { font-size: 17px; } .tv dl { grid-template-columns: 1fr; gap: .1em; } .tv dd { margin-bottom: .7em; } }
""".strip()


def anchor(code: str) -> str:
    return "fl-" + code.lower()


def render_body(mode: str, ident: dict, host: dict, meta: dict, cases: dict[str, dict], minutes: dict[str, int], copy: dict) -> str:
    """The text version's <main class="tv">. mode 'page' (/text/) or 'nojs' (index.html with JavaScript off)."""
    floors = {f["code"]: f for f in ident["floors"]}
    mail = ident["mail"]
    out = [f'<main class="tv" id="tv">', '<header>',
           f'<h1>{esc(host["name"])}</h1>', f'<p class="tv-role">{esc(host["role"])}</p>',
           f'<p class="tv-q">{esc(ident["founder"]["q"])}</p>', f'<p class="tv-tl">{esc(copy["through"])}</p>']
    if mode == "page":
        out.append(f'<p class="tv-note" id="tv-note"><span id="tv-why">{esc(copy["intro"])}</span> <a id="tv-3d" href="/">{esc(copy["to3d"])}</a></p>')
    else:
        out.append(f'<p class="tv-note">{esc(copy["nojs"])} <a href="/text/">{esc(copy["intro_link"]) if copy.get("intro_link") else "Text version"}</a></p>')
    toc = [("PH", "About")] + [(floors[c]["code"], floors[c]["label"]) for c in ("36", "26", "18", "08", "07")] + [("L", "Contact")]
    out.append('<nav aria-label="On this page"><ul class="tv-toc">' + "".join(
        f'<li><a href="#{anchor(c)}">{esc(lbl)}</a></li>' for c, lbl in toc) + '</ul></nav>')
    out.append('</header>')

    # PH: who I am
    ph = floors["PH"]
    out += [f'<section id="{anchor("PH")}" aria-labelledby="{anchor("PH")}-h">', f'<p class="tv-k">PH · {esc(ph["label"])}</p>',
            f'<h2 id="{anchor("PH")}-h">About</h2>', f'<p>{esc(host["cred"])}</p>']
    out += [f'<p>{esc(q["text"])}</p>' for q in copy["about"]]
    out.append('<h3 class="tv-lbl">The desk</h3><dl>' + "".join(
        f'<dt>{esc(h.capitalize())}</dt><dd>{esc(b)}<span class="tv-src">{esc(s)}</span></dd>' for h, b, s in host["sheets"]) + '</dl></section>')

    # the four project floors, top down
    by_board = {f["board"]: f for f in ident["floors"] if "board" in f}
    for i, mid in enumerate(ident["ids"]):
        f, m = by_board[i], meta[mid]
        slug, c = m["slug"], cases[m["slug"]]
        a = anchor(f["code"])
        out += [f'<section id="{a}" aria-labelledby="{a}-h">', f'<p class="tv-k">FL {esc(f["code"])} · {esc(f.get("tag", ""))}</p>',
                f'<h2 id="{a}-h">{esc(f["label"])}</h2>', f'<p class="tv-dek">{esc(c["dek"])}</p>',
                f'<p class="tv-cred">{esc(m["prov"])}</p>',
                f'<p class="tv-call"><span class="tv-ck">The call</span> {esc(m["call"])}</p>',
                '<h3 class="tv-lbl">The problem</h3>', f'<p class="tv-lead">{esc(m["for"])}</p>', c["problem"],
                '<h3 class="tv-lbl">My work</h3>', f'<p class="tv-lead">{esc(m["what"])}</p>', c["work"],
                '<h3 class="tv-lbl">Receipt</h3>', c["receipt"]]
        links = [f'<a href="/work/{esc(slug)}/">Read the {esc(f["label"])} case file</a> <span>{minutes[slug]} min</span>']
        links += [f'<a href="{esc(x["href"])}">{esc(x["label"])}</a>' for x in (m.get("exits") or []) if x.get("href") and x.get("label")]
        out += ['<p class="tv-more">' + " · ".join(links) + '</p>', '</section>']

    # FL 07: consulting
    f7 = floors["07"]
    out += [f'<section id="{anchor("07")}" aria-labelledby="{anchor("07")}-h">', f'<p class="tv-k">FL 07 · {esc(f7.get("tag", ""))}</p>',
            f'<h2 id="{anchor("07")}-h">{esc(f7["label"])}</h2>', f'<p>{esc(host["f7co"])}</p>', f'<p>{host["f7ml"]}</p>', '</section>']

    # L: contact (the street-sign lanes) and M: the résumé
    lane_href = lambda k, h: (f"mailto:{mail}?subject=" + quote(f"{k} · from the text version")) if h == "mailto" \
        else "#" + anchor("08") if h == "?case=riphere-llc" else "/" + h if h.endswith(".pdf") else h  # noqa: E731
    lanes = "".join(f'<li>{esc(k)} → ' + " + ".join(f'<a href="{esc(lane_href(k, h))}">{esc(t)}</a>' for t, h in ps) + '</li>' for k, ps in ident["lanes"])
    resume = floors["M"]
    out += [f'<section id="{anchor("L")}" aria-labelledby="{anchor("L")}-h">', f'<p class="tv-k">L · {esc(floors["L"]["label"])}</p>',
            f'<h2 id="{anchor("L")}-h">{esc(ident["founder"]["name"])}</h2>', f'<ul>{lanes}</ul>',
            f'<p><a href="mailto:{esc(mail)}">{esc(mail)}</a> · <a href="/{esc(resume["href"])}">{esc(resume["label"])} ({esc(resume["tag"])})</a></p>',
            '</section>']
    out.append('<p class="tv-end">riphere.com · <a href="/work/floor-tool/">Floor tool</a> · <a href="/work/novacrm/">NovaCRM</a> · '
               '<a href="/work/prepost/">PrePost</a> · <a href="/work/riphere-llc/">Riphere LLC</a></p>')
    out.append('</main>')
    return "\n".join(out)


def render_page(body: str, copy: dict, site_url: str) -> str:
    ld = [{"@context": "https://schema.org", "@type": "ProfilePage", "url": f"{site_url}/text/", "name": copy["title"],
           "mainEntity": {"@type": "Person", "@id": f"{site_url}/#person", "name": "Ben Rippere", "url": f"{site_url}/"}},
          {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
              {"@type": "ListItem", "position": 1, "name": "riphere.com", "item": f"{site_url}/"},
              {"@type": "ListItem", "position": 2, "name": "Text version", "item": f"{site_url}/text/"}]}]
    why = {k: v for k, v in copy["why"].items()}
    script = ("(() => { try {\n"
              f"  const W = {json.dumps(why, ensure_ascii=False)}, A = {json.dumps(copy['anyway'], ensure_ascii=False)};\n"
              "  const why = new URLSearchParams(location.search).get('why');\n"
              "  if (!Object.prototype.hasOwnProperty.call(W, why)) return;\n"
              "  const n = document.getElementById('tv-note'), t = document.getElementById('tv-why'), a = document.getElementById('tv-3d');\n"
              "  t.textContent = W[why]; n.classList.add('on'); n.setAttribute('role', 'status');\n"
              "  if (why !== 'asked') { a.textContent = A; a.href = '/?3d'; }\n"
              "} catch (e) {} })();")
    return "\n".join([
        "<!doctype html>", '<html lang="en">', '<meta charset="utf-8">', '<meta name="viewport" content="width=device-width, initial-scale=1">',
        f'<title>{esc(copy["title"])}</title>', f'<meta name="description" content="{esc(copy["description"])}">',
        f'<link rel="canonical" href="{site_url}/text/">', '<meta name="theme-color" content="#05060a">',
        '<meta property="og:type" content="website">', '<meta property="og:site_name" content="riphere.com">',
        f'<meta property="og:url" content="{site_url}/text/">', f'<meta property="og:title" content="{esc(copy["title"])}">',
        f'<meta property="og:description" content="{esc(copy["description"])}">', f'<meta property="og:image" content="{site_url}/assets/og.jpg">',
        '<meta name="twitter:card" content="summary_large_image">', '<link rel="icon" type="image/svg+xml" href="/favicon.svg">',
        '<link rel="preconnect" href="https://fonts.googleapis.com">',
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&display=swap">',
        '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False).replace("</", "<\\/") + '</script>',
        '<style>\n:root { color-scheme: dark; }\nhtml, body { margin: 0; background: #0b0c10; color: #e9e6df; }\n' + CSS + '\n</style>',
        body, "<script>\n" + script.replace("</", "<\\/") + "\n</script>", ""])


def render_nojs(body: str) -> str:
    return ('<noscript id="nojs"><style>\n#nojs-v { position: fixed; inset: 0; z-index: 1000; overflow-y: auto; background: #0b0c10; }\n'
            + CSS + '\n</style><div id="nojs-v">\n' + body + '\n</div></noscript>')


NOJS_RE = re.compile(r'<noscript id="nojs">.*?</noscript>', re.S)


def check_llms(src: Path, meta: dict, slugs: list[str], site_url: str) -> list[str]:
    """llms.txt (hand-written) must quote each board's receipt word for word and link each case file and the text version."""
    p = src / "llms.txt"
    if not p.is_file():
        return ["llms.txt is missing from the source tree"]
    t = p.read_text("utf-8")
    probs = []
    if not t.startswith("# "):
        probs.append("llms.txt: must start with '# <name>' (llmstxt.org)")
    for i, m in meta.items():
        if m["receipt"]["text"] not in t:
            probs.append(f"llms.txt: the {i} receipt is not quoted word for word: {m['receipt']['text'][:60]}")
    for u in [f"{site_url}/work/{s}/" for s in slugs] + [f"{site_url}/text/"]:
        if u not in t:
            probs.append(f"llms.txt: no link to {u}")
    if re.search(r"<!--|\{\{", t):
        probs.append("llms.txt: has a comment or template token (it ships byte for byte)")
    return probs


def build_text(src: Path, staging: Path, minutes: dict[str, int], site_url: str) -> tuple[bool, list[str]]:
    """Write staging/text/index.html and swap index.html's <noscript id="nojs"> for the same body. Returns (built, problems)."""
    try:
        ident = read_identity(src)
        host = read_host(src)
        meta = load_meta(src, ident["ids"])
        slugs = [meta[i]["slug"] for i in ident["ids"]]
        missing = [s for s in slugs if s not in minutes]
        need(not missing, f"the text version needs every case file; missing: {missing}")
        cases = {s: read_case(src, s) for s in slugs}
        for i in ident["ids"]:
            m, c = meta[i], cases[meta[i]["slug"]]
            need(plain_text(c["call"]) == plain_text(m["call"]), f"work/{m['slug']}/case.html: the call differs from demos/{i}.js meta.call")
            rc = m["receipt"]
            need(re.search(r'<span class="tag">' + re.escape(rc["status"]) + r'</span>', c["receipt"]),
                 f"work/{m['slug']}/case.html: Results has no '{rc['status']}' tag (demos/{i}.js meta.receipt.status)")
            need(rc["text"] in plain_text(c["receipt"]), f"work/{m['slug']}/case.html: Results does not carry demos/{i}.js meta.receipt.text word for word")
        copy = read_copy(src, cases)
        page = render_page(render_body("page", ident, host, meta, cases, minutes, copy), copy, site_url)
        nojs = render_nojs(render_body("nojs", ident, host, meta, cases, minutes, copy))
        index = staging / "index.html"
        h = index.read_text("utf-8")
        need(len(NOJS_RE.findall(h)) == 1, 'index.html: expected exactly one <noscript id="nojs"> to fill')
        index.write_text(NOJS_RE.sub(lambda _: nojs, h), "utf-8")
        dest = staging / TEXT_PATH
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(strip_html(page), "utf-8")
        return True, check_llms(src, meta, slugs, site_url)
    except TextProblem as e:
        return False, [f"text version: {e}"]
    except (OSError, ValueError, UnicodeDecodeError, subprocess.SubprocessError) as e:
        return False, [f"text version: {type(e).__name__}: {e}"]
