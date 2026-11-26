"""Regression tests for tools/export_tower.py and tools/tower_strip.py (stdlib unittest).

    python3 -m unittest tools/test_export_tower.py      # from the repo root
"""
from __future__ import annotations

import shutil
import subprocess
import sys
import re
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import export_tower as E  # noqa: E402
import text_version as T  # noqa: E402
from tower_strip import is_glsl, strip_css, strip_glsl_segments, strip_html, strip_js  # noqa: E402

NODE = shutil.which("node")
HOST = "bender" + "man"  # split, like the export script, so this repo does not carry the name in one piece


def devhost(b: bytes) -> bool:
    return any(rx.search(b) for rx in E.DEVHOST_RES)


def js_ok(src: str, module: bool = False) -> bool:
    if not NODE:
        return True
    with tempfile.NamedTemporaryFile("w", suffix=".mjs" if module else ".cjs", delete=False) as f:
        f.write(src)
    return subprocess.run([NODE, "--check", f.name], capture_output=True).returncode == 0


class DevHostIPs(unittest.TestCase):  # review HIGH 1
    def test_ip_next_to_a_period_matches(self):
        for b in [b"ssh to 100.101.102.103.", b"see 127.0.0.1.", b"http://100.101.102.103./x", b"Visit 100.101.102.103. Then",
                  b"(100.101.102.103)", b"100.101.102.103:8000", b"10.0.0.5", b"192.168.1.5", b"fd7a:115c:a1e0::1",
                  b"http://[::1]:8000", b"http://0.0.0.0:80", HOST.encode() + b".local", b"/Users/x", b"C:\\Users\\x"]:
            self.assertTrue(devhost(b), b)

    def test_longer_numbers_do_not_match(self):
        for b in [b"1100.101.102.103", b"100.101.102.103.5", b"100.128.0.1", b"three@0.160.0", b"a::b"]:
            self.assertFalse(devhost(b), b)


class CaseFiles(unittest.TestCase):  # review HIGH 2
    def setUp(self):
        self.td = Path(tempfile.mkdtemp())
        (self.td / "work" / "novacrm").mkdir(parents=True)
        (self.td / "work" / "_template.html").write_text(
            '<title>{{title}}</title><meta name="description" content="{{description}}"><script type="application/ld+json">{{jsonld}}</script>'
            '<a href="/?case={{slug}}">FL {{floor}} {{label}}</a>{{body}}')
        self.st = self.td / "st"
        self.st.mkdir()

    def tearDown(self):
        shutil.rmtree(self.td)

    def test_comments_never_reach_the_page_or_the_count(self):
        (self.td / "work" / "novacrm" / "case.html").write_text(
            '<h1>Real <!-- h1 secret --></h1><!-- <p class="dek">pw hunter2</p> --><p class="dek">Public dek.</p>'
            '<!-- ' + "secret " * 2000 + '--><p>one two three {{title}}</p>')
        cases, probs = E.build_cases(self.td, self.st)
        self.assertEqual(probs, [])
        page = (self.st / "work" / "novacrm" / "index.html").read_text()
        self.assertNotIn("hunter2", page)
        self.assertNotIn("secret", page)
        self.assertIn('content="Public dek."', page)
        self.assertEqual(cases, {"novacrm": 1})  # ~6 words, not 2000+
        self.assertIn("{{title}}", page)  # case-file text is never substituted (the export's {{ check then fails it)

    def test_commented_out_dek_fails_closed(self):
        (self.td / "work" / "novacrm" / "case.html").write_text('<h1>Real</h1><!-- <p class="dek">pw hunter2</p> --><p>x</p>')
        cases, probs = E.build_cases(self.td, self.st)
        self.assertEqual(cases, {})
        self.assertTrue(probs and "dek" in probs[0])


class References(unittest.TestCase):  # review HIGH 3
    def run_check(self, files: dict[str, str]) -> list[str]:
        td = Path(tempfile.mkdtemp())
        try:
            for rel, text in files.items():
                (td / rel).parent.mkdir(parents=True, exist_ok=True)
                (td / rel).write_text(text)
            return [f for f in E.check(td)[1] if f.startswith("reference")]
        finally:
            shutil.rmtree(td)

    def test_relative_refs_resolve_from_the_page(self):
        fails = self.run_check({"index.html": '<link href="./identity.css">', "identity.css": "a{}",
                                "work/x/index.html": '<link href="../../identity.css"><img src="../../assets/a%20b.png">',
                                "assets/a b.png": "x"})
        self.assertEqual(fails, [])

    def test_refs_outside_the_export_and_missing_files_fail(self):
        fails = self.run_check({"index.html": '<link href="../secret.css"><SCRIPT SRC="nope.js"></SCRIPT>'})
        self.assertTrue(any("outside the export" in f for f in fails), fails)
        self.assertTrue(any("nope.js" in f for f in fails), fails)


class Employer(unittest.TestCase):  # review MEDIUM 6
    def test_hidden_spellings_are_found(self):
        name = "Bet" + "son"
        for t in [f"{name[:3]}&#115;on", f"B\\u0065{name[2:]}", f"{name[:4]}\u00ad{name[4:]}", f"{name[:3]}<b></b>{name[3:]}"]:
            self.assertTrue(E.EMPLOYER_RE.search(E.normalised(t.encode())), t)


class StripJS(unittest.TestCase):  # review MEDIUM 5
    def test_cases(self):
        cases = {
            "let i=1;\nlet a = i++ / 2; // half\n": "let i=1;\nlet a = i++ / 2;\n",
            "if (1) /a/.test('a') // c\n": "if (1) /a/.test('a')\n",
            "var o={in:4}; var z = o.in / 2 // c\n": "var o={in:4}; var z = o.in / 2\n",
            "const s = `a ${ `b ${ {x:1}.x } // not` } /* no */ c`; // real\n": "const s = `a ${ `b ${ {x:1}.x } // not` } /* no */ c`;\n",
            "const r = /\\/\\/[/]/g; // c\nconst d = a / b / c;\n": "const r = /\\/\\/[/]/g;\nconst d = a / b / c;\n",
            "function f(){ return /* a\n b */ 5 }\n": "function f(){ return\n 5 }\n",  # keeps the line break ASI sees
            "const u = 'http://x'; // c\n": "const u = 'http://x';\n",
        }
        for src, want in cases.items():
            got = strip_js(src)
            self.assertEqual(got, want, src)
            self.assertTrue(js_ok(got), got)
            self.assertEqual(strip_js(got), got)


class StripGLSL(unittest.TestCase):  # shader comments inside template literals
    def check(self, src: str, want: str):
        got = strip_js(src)
        self.assertEqual(got, want, src)
        self.assertTrue(js_ok(got), got)
        self.assertEqual(strip_js(got), got)

    def test_shader_comments_go(self):
        self.check("const F = `uniform float uA; // why\n  // own line\n  void main(){ float x = 1.; /* blk */ gl_FragColor = vec4(x); }\n  /* own\n  block */\n`;\n",
                   "const F = `uniform float uA;\n  void main(){ float x = 1.;   gl_FragColor = vec4(x); }\n`;\n")
        # three.js chunk injection: the template is GLSL by its #include line
        self.check("s = s.replace('#include <x>', `#include <x>\n  { vec3 a = b; // note\n  }`);\n",
                   "s = s.replace('#include <x>', `#include <x>\n  { vec3 a = b;\n  }`);\n")
        # comments after an interpolation, and a comment that ends the template
        self.check("const V = `void main(){\n  for (int i = 0; i < ${N}; i++) { x(); } // per stop\n  y(); } // end`;\n",
                   "const V = `void main(){\n  for (int i = 0; i < ${N}; i++) { x(); }\n  y(); }`;\n")

    def test_non_glsl_templates_untouched(self):
        for src in ["const u = `https://x.y/${p} // not a comment`;\n", "o.font = `800 ${fs}px Archivo /* x */, sans-serif`;\n",
                    "const c = `rgba(255,${g},0,${a})`; // c\n"]:
            self.assertFalse(is_glsl(src))
            self.assertEqual(strip_js(src), src.replace(" // c", ""))

    def test_unsafe_comments_left_verbatim(self):
        # a comment running into ${ ... } keeps the interpolation (and the comment); its tail is not rescanned
        src = "const F = `void main(){ a; // n = ${n} /* x */ more\n  b; /* k ${m} // y */ c; }`;\n"
        self.check(src, src)
        # a backslash in the comment: \n would end the GLSL line inside the comment, so nothing is removed
        src = "const F = `void main(){ a; // x\\n b; }\n`;\n"
        self.check(src, src)
        self.assertEqual(strip_glsl_segments([("x /* a ", False), (" b // c */ d // e", True)]), ["x /* a ", " b // c */ d"])
        self.assertEqual(strip_glsl_segments([("x; // a ", False), (" b /* c */\n y; // z\n", True)]), ["x; // a ", " b /* c */\n y;\n"])

    def test_nested_templates(self):
        self.check("const F = `void main(){ ${ok ? `vec3 c; // in` : ''} // out\n}`;\n",
                   "const F = `void main(){ ${ok ? `vec3 c; // in` : ''}\n}`;\n")

    @unittest.skipUnless((E.DEFAULT_SRC / "scene3d.js").is_file(), "private source tree not on this machine")
    def test_real_scene_has_no_shader_comments_left(self):
        got = strip_js((E.DEFAULT_SRC / "scene3d.js").read_text("utf-8"))
        self.assertTrue(js_ok(got, module=True))
        for t in re.findall(r"`[^`]*`", got):
            if is_glsl(t):
                self.assertNotRegex(t, r"//|/\*", t[:120])


class AppleTouchIcon(unittest.TestCase):
    PNG = b"\x89PNG\r\n\x1a\n" + b"\0" * 32

    def setUp(self):
        self.td = Path(tempfile.mkdtemp())

    def tearDown(self):
        shutil.rmtree(self.td)

    def icon_problems(self):
        plan, probs = E.collect(self.td)
        return [d for _, d in plan if d == "apple-touch-icon.png"], [p for p in probs if "apple-touch-icon" in p]

    def test_allowed_at_the_root_only(self):
        self.assertTrue(E.allowed_output("apple-touch-icon.png"))
        self.assertFalse(E.allowed_output("assets2/apple-touch-icon.png"))
        self.assertFalse(E.allowed_output("apple-touch-icon.jpg"))

    def test_absent_is_fine(self):
        self.assertEqual(self.icon_problems(), ([], []))
        self.assertEqual(E.optional_present(self.td), [])

    def test_present_is_copied_and_required(self):
        (self.td / "apple-touch-icon.png").write_bytes(self.PNG)
        self.assertEqual(self.icon_problems(), (["apple-touch-icon.png"], []))
        self.assertEqual(E.optional_present(self.td), ["apple-touch-icon.png"])
        out = self.td / "out"
        out.mkdir()
        fails = [f for f in E.check(out, E.optional_present(self.td))[1] if "apple-touch-icon" in f]
        self.assertEqual(fails, ["required: apple-touch-icon.png is missing from the output"])
        (out / "apple-touch-icon.png").write_bytes(self.PNG)
        self.assertEqual([f for f in E.check(out, ["apple-touch-icon.png"])[1] if "apple-touch-icon" in f], [])
        self.assertEqual(E.transform(self.td / "apple-touch-icon.png", "apple-touch-icon.png"), self.PNG)

    def test_wrong_type_or_symlink_fails(self):
        (self.td / "apple-touch-icon.png").write_bytes(b"<svg/>")
        self.assertIn("not the expected type", self.icon_problems()[1][0])
        (self.td / "apple-touch-icon.png").unlink()
        (self.td / "real.png").write_bytes(self.PNG)
        (self.td / "apple-touch-icon.png").symlink_to(self.td / "real.png")
        self.assertIn("symlink", self.icon_problems()[1][0])


class StripHTML(unittest.TestCase):  # review MEDIUM 4 + LOW
    def test_types_and_attributes(self):
        self.assertEqual(strip_html("<p title='<!-- x -->'>a</p><!-- c -->"), "<p title='<!-- x -->'>a</p>")
        self.assertEqual(strip_html('<script data-type="x">a=1; // c\n</script>'), '<script data-type="x">a=1;\n</script>')
        self.assertEqual(strip_html('<script type="application/javascript">a=1; // c\n</script>'),
                         '<script type="application/javascript">a=1;\n</script>')
        self.assertEqual(strip_html('<script type="application/ld+json">{"a":"//x"}</script>'),
                         '<script type="application/ld+json">{"a":"//x"}</script>')
        self.assertEqual(strip_html("<!--> x"), " x")

    def test_css_strings_untouched(self):
        self.assertEqual(strip_css('a{content:"/* x */"} /* c */'), 'a{content:"/* x */"} ')
        self.assertEqual(strip_css('a{content:"l\\\n\n\n x"}'), 'a{content:"l\\\n\n\n x"}')


class OutGuard(unittest.TestCase):  # review MEDIUM 7
    def test_only_site_inside_the_repo(self):
        src = Path("/nonexistent-src")
        self.assertIsNone(E.safe_out(E.REPO_ROOT / "site", src))
        self.assertIsNotNone(E.safe_out(E.REPO_ROOT / "tools", src))
        self.assertIsNotNone(E.safe_out(E.REPO_ROOT / "legacy-next" / "out", src))
        self.assertIsNotNone(E.safe_out(E.REPO_ROOT, src))


class DevPanel(unittest.TestCase):  # 11-25: the #ctl dev tear controls never ship
    PANEL = '<details id="ctl" open hidden>\n  <summary>Dev</summary><div class="seg" data-k="tear"><button>Peel</button></div>\n  <button id="replay">Re-hang the ads</button>\n</details>\n'

    def test_removed_from_index_and_fails_when_absent(self):
        td = Path(tempfile.mkdtemp())
        try:
            (td / "index.html").write_text('<nav id="lift"></nav>\n' + self.PANEL + '<script>$("#ctl")?.removeAttribute("open")</script>')
            self.assertEqual(E.strip_dev_panel(td), [])
            html = (td / "index.html").read_text()
            self.assertNotIn("Re-hang", html)
            self.assertIn('$("#ctl")', html)  # the guarded script reference stays
            self.assertTrue(E.strip_dev_panel(td))  # a second pass finds none: fail closed
        finally:
            shutil.rmtree(td)

    def test_check_fails_on_panel_markup_or_text(self):
        td = Path(tempfile.mkdtemp())
        try:
            (td / "index.html").write_text(self.PANEL)
            (td / "work" / "x").mkdir(parents=True)
            (td / "work" / "x" / "index.html").write_text("<p>Re-hang the ads</p>")
            fails = [f for f in E.check(td)[1] if f.startswith("devpanel")]
            self.assertTrue(any(f.startswith("devpanel: index.html") for f in fails), fails)
            self.assertTrue(any("work/x/index.html" in f for f in fails), fails)
        finally:
            shutil.rmtree(td)


class TextVersion(unittest.TestCase):  # 11-25: /text/ and the no-JS home page
    def test_text_route_is_checked(self):
        self.assertEqual(E.local_target("/text/"), "text/index.html")
        self.assertEqual(E.local_target("/text/#fl-26"), "text/index.html")
        self.assertIsNone(E.local_target("/about/"))
        self.assertTrue(E.allowed_output("text/index.html") and E.allowed_output("llms.txt"))
        self.assertFalse(E.allowed_output("text/other.html"))

    def test_js_unquote(self):
        self.assertEqual(T.js_unquote(r"it\'s \u00e9 \u{1F600} a\\b"), "it's \u00e9 \U0001F600 a\\b")

    def case_dir(self, body: str) -> Path:
        td = Path(tempfile.mkdtemp())
        (td / "work" / "x").mkdir(parents=True)
        (td / "work" / "x" / "case.html").write_text(
            '<h1>X</h1><p class="call"><span class="ck">The call</span> Say yes.</p><p class="dek">Dek.</p>' + body)
        return td

    def test_sections_and_heading_demotion(self):
        td = self.case_dir('<h2>Why</h2><p>skip</p><p class="lbl">THE PROBLEM</p><h2>Who</h2><p>P1</p>'
                           '<p class="lbl">MY WORK</p><h2>What</h2><p>W1</p><h2>How</h2><p>not this</p>'
                           '<p class="lbl">RECEIPT</p><h2>Results</h2><ul><li>R <span class="tag">verified</span></li></ul><h3>Pilot</h3><p>n</p><h2>Next</h2><p>no</p>')
        try:
            c = T.read_case(td, "x")
            self.assertEqual(c["problem"], "<p>P1</p>")
            self.assertEqual(c["work"], "<p>W1</p>")
            self.assertIn("<h4>Pilot</h4>", c["receipt"])
            self.assertNotIn("Next", c["receipt"])
            self.assertEqual(c["call"], "Say yes.")
        finally:
            shutil.rmtree(td)

    def test_missing_label_fails_closed(self):
        td = self.case_dir('<p class="lbl">THE PROBLEM</p><h2>Who</h2><p>P1</p>')
        try:
            with self.assertRaises(T.TextProblem):
                T.read_case(td, "x")
        finally:
            shutil.rmtree(td)

    def test_about_lines_must_be_word_for_word(self):
        td = Path(tempfile.mkdtemp())
        try:
            copy = {"title": "t", "description": "d", "through": "x", "intro": "i", "nojs": "n", "to3d": "3", "anyway": "a",
                    "why": {k: k for k in T.WHY_KEYS}, "about": [{"from": "work/x/case.html", "text": "I built it."}]}
            (td / "text.json").write_text(__import__("json").dumps(copy))
            T.read_copy(td, {"x": {"frag": "<p>I <em>built</em> it.</p>"}})
            with self.assertRaises(T.TextProblem):
                T.read_copy(td, {"x": {"frag": "<p>I made it.</p>"}})
        finally:
            shutil.rmtree(td)

    def test_llms_txt_quotes_each_receipt(self):
        td = Path(tempfile.mkdtemp())
        try:
            meta = {"a": {"receipt": {"text": "Used by two teams."}}}
            (td / "llms.txt").write_text("# Ben\n\nReceipt: Used by two teams. https://s/work/a/ https://s/text/\n")
            self.assertEqual(T.check_llms(td, meta, ["a"], "https://s"), [])
            (td / "llms.txt").write_text("# Ben\n\nReceipt: Used by 2 teams. https://s/work/a/\n<!-- note -->\n")
            probs = T.check_llms(td, meta, ["a"], "https://s")
            self.assertEqual(len(probs), 3, probs)
        finally:
            shutil.rmtree(td)

    @unittest.skipUnless(NODE and (E.DEFAULT_SRC / "text.json").is_file(), "private source tree or node not on this machine")
    def test_real_source_builds(self):
        st = Path(tempfile.mkdtemp())
        try:
            (st / "index.html").write_text('<p>x</p><noscript id="nojs"><p>old</p></noscript>')
            built, probs = T.build_text(E.DEFAULT_SRC, st, {"floor-tool": 5, "novacrm": 3, "prepost": 5, "riphere-llc": 5}, E.SITE_URL)
            self.assertTrue(built, probs)
            self.assertEqual(probs, [])
            page, index = (st / "text" / "index.html").read_text(), (st / "index.html").read_text()
            for slug in E.CASE_SLUGS:
                self.assertIn(f'href="/work/{slug}/"', page)
                self.assertIn(f'href="/work/{slug}/"', index)
            self.assertIn('<link rel="canonical" href="https://www.riphere.com/text/">', page)
            self.assertEqual(page.count("<h1>"), 1)
            self.assertNotIn("<p>old</p>", index)
            self.assertEqual(index.count('<span class="tag">verified</span>'), 4)
        finally:
            shutil.rmtree(st)


if __name__ == "__main__":
    unittest.main()
