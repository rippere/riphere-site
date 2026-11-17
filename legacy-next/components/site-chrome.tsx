import Link from "next/link";

/* ---------------------------------------------------------------
   Shared site chrome — header, footer, and the SectionHead helper.
   Extracted from app/page.tsx so the storefront route (/novacrm)
   wears the same nav/footer as the home page. Plain markup (no
   client hooks), so it stays a server component.

   Section links are route-absolute ("/#work") so they resolve from
   any route — on the home page they scroll; from /novacrm they
   navigate home first, then scroll.
---------------------------------------------------------------- */

const navLinks = [
  { href: "/#work", label: "Work" },
  { href: "/#about", label: "About" },
  { href: "/#consulting", label: "Consulting" },
  { href: "/novacrm", label: "NovaCRM" },
  { href: "/#connect", label: "Connect" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line/60 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/#top" className="font-display text-lg font-semibold tracking-tight text-ink">
          Ben Rippere<span className="text-accent">.</span>
        </Link>
        <nav className="hidden gap-7 font-mono text-[0.8rem] uppercase tracking-[0.12em] text-muted sm:flex">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="link-anim hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line/70">
      <div className="mx-auto max-w-6xl px-6 py-10 font-mono text-[0.78rem] text-faint">
        © {year} Ben Rippere · {" "}
        <a
          href="https://github.com/rippere"
          target="_blank"
          rel="noopener"
          className="link-anim text-muted"
        >
          github.com/rippere
        </a>
      </div>
    </footer>
  );
}

export function SectionHead({ num, title, sub }: { num: string; title: string; sub?: string }) {
  return (
    <>
      <span className="eyebrow text-faint">
        {num} <span className="text-line">—</span> {title}
      </span>
      <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink md:text-5xl">
        {title}
      </h2>
      {sub ? <p className="mt-3 max-w-2xl text-muted md:text-lg">{sub}</p> : null}
    </>
  );
}
