"""Regression tests for tools/export_tower.py and tools/tower_strip.py (stdlib unittest).

    python3 -m unittest tools/test_export_tower.py      # from the repo root
"""
from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import export_tower as E  # noqa: E402
from tower_strip import strip_css, strip_html, strip_js  # noqa: E402

NODE = shutil.which("node")
HOST = "bender" + "man"  # split, like the export script, so this repo does not carry the name in one piece


def devhost(b: bytes) -> bool:
    return any(rx.search(b) for rx in E.DEVHOST_RES)


def js_ok(src: str) -> bool:
    if not NODE:
        return True
    with tempfile.NamedTemporaryFile("w", suffix=".cjs", delete=False) as f:
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


if __name__ == "__main__":
    unittest.main()
