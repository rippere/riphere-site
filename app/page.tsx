import { projects } from "@/lib/projects";
import { ProjectShowcase, Reveal } from "@/components/showcase";
import { buildInPublic } from "@/lib/buildInPublic";

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

const receipts = buildInPublic
  .filter((i) => i.publish)
  .sort((a, b) =>
    a.featured === b.featured ? b.date.localeCompare(a.date) : a.featured ? -1 : 1
  );

const creds = [
  { k: "Domain", v: "Agentic AI systems, grounded in the neuroscience of decision-making" },
  { k: "Builds", v: "NovaCRM · alfred-v2 · TRIBE v2 · Sector Flow · Executive Mind Matrix" },
  { k: "Studies", v: "Psychology & Entrepreneurship · cognitive science w/ a computational-neuroscience grounding" },
  { k: "Direction", v: "AI product / engineering at an early-stage team" },
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
          <p className="eyebrow text-accent">Neuroscience → AI systems</p>
          <h1 className="mt-6 max-w-4xl font-display text-[2.6rem] font-medium leading-[1.04] tracking-[-0.02em] text-ink md:text-7xl">
            I build AI systems that{" "}
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
                  I build agentic AI systems: software where autonomous agents read through
                  messy human information, reason about it, and carry the work all the way to
                  action. I come at it from an unusual angle. I study how people actually
                  decide (reward, motivation, bias, at the neural level) and design systems
                  with those realities built in. Builder first; the science is the lens I
                  build through.
                </p>
                <p>
                  My main system, <span className="text-ink">NovaCRM</span>, is a live
                  AI-native CRM where six specialized agents turn scattered email and Slack
                  into a structured pipeline. Each agent has one bounded, verifiable job, and
                  a person stays in the loop for the moments that matter. It grew out of
                  Executive Mind Matrix, where three agents with competing cognitive biases
                  argue a decision before routing it. Around them I’ve built a knowledge
                  system that self-heals before it pages me, a model that scores video by
                  predicted brain response (success criteria committed to git{" "}
                  <span className="text-ink">before</span> the results), and a
                  behavioral-finance tool that catches institutional rotation in covariance
                  before it shows up in price.
                </p>
                <p>
                  The thread through all of it: the bottleneck is rarely the model. It’s the
                  system around it, and the people it’s for. I care about the gap between good
                  thinking and executed action, because I’ve watched capable people drown in
                  operational overhead while their best ideas never ship. So I’m putting real
                  agentic systems into production and learning in the open, headed toward an
                  early-stage team where building the system and understanding the people it
                  serves are the same job.
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
                <div key={r.slug} className="grid gap-3 py-6 md:grid-cols-[9rem_1fr] md:gap-8">
                  <span className="eyebrow text-accent">{r.lane}</span>
                  <div>
                    <p className="text-muted md:text-lg">{r.text}</p>
                    {r.receipt ? (
                      <a
                        href={r.receipt}
                        target="_blank"
                        rel="noopener"
                        className="link-anim mt-2 inline-block font-mono text-xs text-faint hover:text-accent"
                      >
                        receipt ↗
                      </a>
                    ) : null}
                  </div>
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
