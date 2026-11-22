"""Comment stripping for the tower export (stdlib only).

The source tree's comments are working notes (dates, review rounds, dev hosts); the public copy carries none.
Each stripper is a small tokenizer, not a regex, so strings, template literals and regex literals are copied
verbatim. A removed block comment becomes a newline if it spanned lines (keeps automatic semicolon insertion
as it was), else a space. Nothing else changes: no minifying, no reformatting.

    strip_js(text)   // and /* */ outside strings, templates and regex literals
    strip_css(text)  /* */ outside strings
    strip_html(text) <!-- --> in markup; <script> bodies through strip_js (except JSON / import maps),
                     <style> bodies through strip_css
"""
from __future__ import annotations

import re

# keywords after which a "/" starts a regex literal rather than a division
_REGEX_AFTER_WORDS = {"return", "typeof", "instanceof", "in", "of", "new", "delete", "void", "throw",
                      "case", "do", "else", "yield", "await"}
_REGEX_AFTER_PUNCT = set("(,=:[!&|?{};+-*%<>~^")
_CONTROL_WORDS = {"if", "while", "for", "with"}
# <script type> values whose body is JavaScript (stripped here, syntax-checked by the export). Anything else
# (JSON-LD, import maps, text/plain, ...) is left verbatim.
JS_SCRIPT_TYPES = {"", "module", "text/javascript", "application/javascript", "text/ecmascript", "application/ecmascript"}


def _gap(comment: str) -> str:
    return "\n" if "\n" in comment else " "


def strip_js(src: str) -> str:
    out: list[str] = []
    i, n = 0, len(src)
    # stack of brace depths, one per open template literal whose ${ ... } we are inside
    tpl: list[int] = []
    depth = 0
    parens: list[bool] = []      # one per open "(": was it opened by if / while / for / with?
    ctrl_close = False           # the last significant code char was the ")" of such a paren

    def last_sig() -> str:
        # the last significant (non-space) text emitted, for the regex-or-divide decision
        # chunks can be single characters, so gather enough of the tail to see a whole keyword
        k, acc = len(out) - 1, ""
        while k >= 0 and len(acc.strip()) < 16:
            acc = out[k] + acc
            k -= 1
        return acc.rstrip()

    def regex_allowed() -> bool:
        s = last_sig()
        if not s:
            return True
        c = s[-1]
        if s.endswith("++") or s.endswith("--"):
            return False  # i++ / 2: a postfix operator ends an expression, so "/" divides
        if c == ")":
            return ctrl_close  # if (x) /re/.test(s): regex; f(x) / 2: division
        if c in _REGEX_AFTER_PUNCT:
            return True
        if c == "}":
            return True  # a block ended; an expression ending in } before a / does not occur in this source
        m = re.search(r"(\.\s*)?([A-Za-z_$][\w$]*)$", s)
        if m and not m.group(1) and m.group(2) in _REGEX_AFTER_WORDS:
            return True  # a keyword, not a property such as o.in or o.return
        return False

    def read_template(j: int) -> int:
        """Copy template text from j (just after ` or }) to the closing ` or to ${; return the new index."""
        nonlocal depth
        while j < n:
            c = src[j]
            if c == "\\":
                out.append(src[j:j + 2]); j += 2; continue
            if c == "`":
                out.append(c); return j + 1
            if c == "$" and j + 1 < n and src[j + 1] == "{":
                out.append("${"); tpl.append(depth); depth += 1; return j + 2
            out.append(c); j += 1
        raise ValueError("unterminated template literal")

    while i < n:
        c = src[i]
        nxt = src[i + 1] if i + 1 < n else ""
        if c in "'\"":
            j = i + 1
            while j < n and src[j] != c:
                if src[j] == "\\":
                    j += 1
                elif src[j] == "\n":
                    raise ValueError(f"newline in string literal at offset {i}")
                j += 1
            out.append(src[i:j + 1]); ctrl_close = False; i = j + 1; continue
        if c == "`":
            out.append("`"); ctrl_close = False; i = read_template(i + 1); continue
        if c == "/" and nxt == "/":
            j = src.find("\n", i)
            j = n if j < 0 else j
            if _own_line(out):
                j = j + 1 if j < n else j  # a whole-line comment goes with its line
            i = j; continue  # otherwise the newline is kept by the next iteration
        if c == "/" and nxt == "*":
            j = src.find("*/", i + 2)
            if j < 0:
                raise ValueError(f"unterminated block comment at offset {i}")
            k = j + 2
            if _own_line(out) and (k >= n or src[k] == "\n"):
                i = k + 1; continue  # a block comment alone on its lines: drop the lines
            out.append(_gap(src[i:k])); i = k; continue
        if c == "/" and regex_allowed():
            j, in_class = i + 1, False
            while j < n:
                d = src[j]
                if d == "\\":
                    j += 2; continue
                if d == "\n":
                    raise ValueError(f"newline in regex literal at offset {i}")
                if d == "[":
                    in_class = True
                elif d == "]":
                    in_class = False
                elif d == "/" and not in_class:
                    break
                j += 1
            j += 1
            while j < n and (src[j].isalnum() or src[j] in "_$"):
                j += 1  # flags
            out.append(src[i:j]); ctrl_close = False; i = j; continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if tpl and depth == tpl[-1]:
                tpl.pop(); out.append("}"); ctrl_close = False; i = read_template(i + 1); continue
        if c == "(":
            # a control paren: "if (" etc., but not a property such as o.if(
            m = re.search(r"(\.\s*)?([A-Za-z_$][\w$]*)\s*$", last_sig())
            parens.append(bool(m and not m.group(1) and m.group(2) in _CONTROL_WORDS))
        if not c.isspace():
            ctrl_close = (parens.pop() if parens else False) if c == ")" else False
        out.append(c); i += 1
    if tpl:
        raise ValueError("unterminated ${ in template literal")
    return "".join(out)


def strip_css(src: str) -> str:
    out: list[str] = []
    i, n = 0, len(src)
    while i < n:
        c = src[i]
        if c in "'\"":
            j = i + 1
            while j < n and src[j] != c:
                j += 2 if src[j] == "\\" else 1
            out.append(src[i:j + 1]); i = j + 1; continue
        if c == "/" and i + 1 < n and src[i + 1] == "*":
            j = src.find("*/", i + 2)
            if j < 0:
                raise ValueError(f"unterminated CSS comment at offset {i}")
            k = j + 2
            if _own_line(out) and (k >= n or src[k] == "\n"):
                i = k + 1; continue  # a comment alone on its lines: drop the lines
            out.append(_gap(src[i:k])); i = k; continue
        out.append(c); i += 1
    return "".join(out)


_TAG_RE = re.compile(r"<(script|style)\b([^>]*)>", re.IGNORECASE)
_TYPE_RE = re.compile(r"""(?<![\w-])type\s*=\s*["']?([^"'\s>]+)""", re.IGNORECASE)


def script_kind(attrs: str) -> str:
    """The lower-cased type="" of a <script> tag's attribute string ('' when absent)."""
    t = _TYPE_RE.search(attrs)
    return t.group(1).lower() if t else ""


def strip_html(src: str) -> str:
    out: list[str] = []
    i, n = 0, len(src)
    while i < n:
        lt = src.find("<", i)
        if lt < 0:
            out.append(src[i:]); break
        out.append(src[i:lt]); i = lt
        if src.startswith("<!--", i):
            if src.startswith("<!-->", i) or src.startswith("<!--->", i):  # empty comments (HTML spec)
                i += 5 if src.startswith("<!-->", i) else 6; continue
            end = src.find("-->", i + 4)
            if end < 0:
                raise ValueError(f"unterminated HTML comment at offset {i}")
            i = end + 3; continue
        tag = _TAG_RE.match(src, i)
        if tag:
            name = tag.group(1).lower()
            close = re.compile(rf"</{name}\s*>", re.IGNORECASE).search(src, tag.end())
            if not close:
                raise ValueError(f"unclosed <{name}> at offset {tag.start()}")
            body = src[tag.end():close.start()]
            if name == "style":
                body = strip_css(body)
            elif script_kind(tag.group(2)) in JS_SCRIPT_TYPES:
                body = strip_js(body)
            out.append(src[i:tag.end()]); out.append(body); out.append(close.group(0))
            i = close.end(); continue
        if i + 1 < n and (src[i + 1].isalpha() or src[i + 1] in "/!?"):
            # any other tag: copy it whole, quoted attribute values included (a "<!--" inside one is text)
            j, q = i + 1, ""
            while j < n:
                c = src[j]
                if q:
                    if c == q:
                        q = ""
                elif c in "\"'":
                    q = c
                elif c == ">":
                    break
                j += 1
            out.append(src[i:j + 1]); i = j + 1; continue
        out.append("<"); i += 1
    return "".join(out)


def _own_line(out: list[str]) -> bool:
    """True when everything emitted since the last newline is blank (the comment starts its own line).
    That blank indentation is code-state whitespace, so it is removed; trailing spaces before a comment
    that follows code on the same line are trimmed too (also code-state whitespace)."""
    tail = []
    while out:
        chunk = out[-1]
        k = chunk.rfind("\n")
        if k >= 0:
            rest = chunk[k + 1:]
            if rest.strip():
                out[-1] = chunk[:k + 1] + rest.rstrip(" \t")
                return False
            out[-1] = chunk[:k + 1]
            return True
        if chunk.strip():
            out[-1] = chunk.rstrip(" \t")
            return False
        tail.append(out.pop())
    return True  # start of input
