import { projects } from "@/lib/projects";
import { ProjectShowcase, Reveal } from "@/components/showcase";

const navLinks = [
  { href: "#work", label: "Work" },
  { href: "#about", label: "About" },
  { href: "#public", label: "In public" },
  { href: "#connect", label: "Connect" },
];

const connectLinks = [
  { href: "https://github.com/rippere", label: "GitHub ↗", primary: true },
  { href: "https://www.linkedin.com/in/benjamin-rippere/", label: "LinkedIn ↗" },
  { href: "https://x.com/rrippere", label: "X / Twitter ↗" },
  { href: "mailto:ben@riphere.com", label: "Email ↗" },
];

const receipts = [
  {
    tag: "Incident",
    text: "Caught a leaked DB credential in a freshly-public repo — rotated first, scrubbed history second, verified green by observation. Secret hygiene is a muscle worth building before you need it.",
  },
  {
    tag: "Rigor",
    text: "Pre-registered TRIBE v2’s validation protocol before the results — the goalposts live in git history with a timestamp, so future-me can’t move them.",
  },
  {
    tag: "Systems",
    text: "Gave my personal memory stack a 3-tier watchdog: detect → auto-heal → only then page me. The page is the last resort, not the first response.",
  },
];

const creds = [
  { k: "Domain", v: "Neuroscience & psychology — reward, motivation, decision-making" },
  { k: "Builds", v: "Agentic AI · decision intelligence · neural content models · self-hosted infra" },
  { k: "Direction", v: "AI product & management track" },
];

const year = new Date().getFullYear();

function SectionHead({ num, title, sub }: { num: string; title: string; sub?: string }) {
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

export default function Home() {
  return (
    <>
      <a
        href="#work"
        className="sr-only rounded-br-lg bg-accent px-4 py-2 font-mono text-sm text-paper focus:not-sr-only focus:absolute focus:left-0 focus:top-0 focus:z-[100]"
      >
        Skip to work
      </a>

      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-line/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#top" className="font-display text-lg font-semibold tracking-tight text-ink">
            Ben Rippere<span className="text-accent">.</span>
          </a>
          <nav className="hidden gap-7 font-mono text-[0.8rem] uppercase tracking-[0.12em] text-muted sm:flex">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="link-anim hover:text-ink">
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main id="top" className="mx-auto w-full max-w-6xl px-6">
        {/* HERO */}
        <section className="pt-20 pb-16 md:pt-32 md:pb-24">
          <p className="eyebrow text-accent">Behavioral science → AI systems · Behavioral finance</p>
          <h1 className="mt-6 max-w-4xl font-display text-[2.6rem] font-medium leading-[1.04] tracking-[-0.02em] text-ink md:text-7xl">
            Behavioral scientist building AI systems that{" "}
            <span className="italic text-accent">think like teams, act like operators.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted md:text-xl">
            I study how people make decisions at the neural level — reward, motivation,
            cognitive bias, risk tolerance — then build systems that account for those
            realities. Production-deployed, not notebooks.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="#work"
              className="rounded-full bg-accent px-6 py-3 font-mono text-sm font-semibold text-paper transition-transform hover:-translate-y-0.5"
            >
              See the work
            </a>
            <a
              href="https://github.com/rippere"
              target="_blank"
              rel="me noopener"
              className="rounded-full border border-ink/20 px-6 py-3 font-mono text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
            >
              GitHub ↗
            </a>
          </div>
          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-2 border-t border-line/70 pt-6 font-mono text-[0.72rem] uppercase tracking-[0.12em] text-faint">
            <span>
              <span className="text-muted">domain</span> · neuroscience
            </span>
            <span>
              <span className="text-muted">builds</span> · agentic AI
            </span>
            <span>
              <span className="text-muted">status</span> · building in public
            </span>
          </div>
        </section>

        {/* WORK */}
        <section id="work" className="scroll-mt-20 border-t border-line/70 py-16 md:py-24">
          <Reveal className="mb-6">
            <SectionHead
              num="01"
              title="Featured work"
              sub="Live systems with real stakes — each one its own space. Scroll through; every frame links to source."
            />
          </Reveal>
          <div className="-mx-2 md:-mx-6">
            {projects.map((p, i) => (
              <ProjectShowcase key={p.slug} project={p} index={i} />
            ))}
          </div>
          <Reveal className="mt-6 flex flex-col items-center gap-2 text-center">
            <p className="max-w-md font-mono text-sm text-muted">
              Sentiment models, automation infra, and the experiments that don’t make the
              front page — the receipts are all public.
            </p>
            <a
              href="https://github.com/rippere?tab=repositories"
              target="_blank"
              rel="noopener"
              className="link-anim font-mono text-sm font-semibold text-accent"
            >
              All repositories ↗
            </a>
          </Reveal>
        </section>

        {/* ABOUT */}
        <section id="about" className="scroll-mt-20 border-t border-line/70 py-16 md:py-24">
          <Reveal>
            <SectionHead num="02" title="About" />
            <div className="mt-10 grid gap-10 md:grid-cols-[1.6fr_1fr]">
              <div className="space-y-5 text-lg leading-relaxed text-muted">
                <p>
                  I study how people make decisions at the neural level — reward systems,
                  motivation, cognitive bias, impulsivity — then I build systems that account
                  for those realities. My edge isn’t that I read{" "}
                  <span className="text-ink">Thinking, Fast and Slow</span>; it’s that the
                  dopamine circuits and risk-tolerance mechanisms behind trading psychology
                  are literally what I study at the bench.
                </p>
                <p>
                  That’s the through-line: adversarial agents that mirror how good investment
                  committees structure disagreement; content scoring grounded in measured
                  brain response; infrastructure designed to recover without a human in the
                  loop. Syntax is a commodity in 2026 — systems thinking at this level is not.
                </p>
                <p>
                  I’m pursuing an AI product-management track and PMP because the biggest
                  leverage point isn’t a better model — it’s a better system around people.
                  Long term, I want to build and lead the teams doing that work.
                </p>
              </div>
              <ul className="space-y-6 border-l border-line pl-6">
                {creds.map((c) => (
                  <li key={c.k}>
                    <span className="eyebrow text-accent">{c.k}</span>
                    <p className="mt-1.5 text-ink-2">{c.v}</p>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </section>

        {/* BUILDING IN PUBLIC */}
        <section id="public" className="scroll-mt-20 border-t border-line/70 py-16 md:py-24">
          <Reveal>
            <SectionHead
              num="03"
              title="Building in public"
              sub="What I shipped, what broke, what I learned — with the diff attached."
            />
            <div className="mt-10 divide-y divide-line/70 border-y border-line/70">
              {receipts.map((r) => (
                <div key={r.tag} className="grid gap-3 py-6 md:grid-cols-[9rem_1fr] md:gap-8">
                  <span className="eyebrow text-accent">{r.tag}</span>
                  <p className="text-muted md:text-lg">{r.text}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* CONNECT */}
        <section id="connect" className="scroll-mt-20 border-t border-line/70 py-16 md:py-28">
          <Reveal>
            <span className="eyebrow text-faint">
              04 <span className="text-line">—</span> Connect
            </span>
            <h2 className="mt-3 max-w-3xl font-display text-3xl font-medium leading-tight tracking-tight text-ink md:text-5xl">
              Building decision intelligence, behavioral AI, or agentic tooling? I’d like to
              compare notes.
            </h2>
            <div className="mt-9 flex flex-wrap gap-3">
              {connectLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target={l.href.startsWith("mailto") ? undefined : "_blank"}
                  rel="me noopener"
                  className={
                    l.primary
                      ? "rounded-full bg-accent px-6 py-3 font-mono text-sm font-semibold text-paper transition-transform hover:-translate-y-0.5"
                      : "rounded-full border border-ink/20 px-6 py-3 font-mono text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
                  }
                >
                  {l.label}
                </a>
              ))}
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-line/70">
        <div className="mx-auto max-w-6xl px-6 py-10 font-mono text-[0.78rem] text-faint">
          © {year} Ben Rippere · Built in public ·{" "}
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
    </>
  );
}
