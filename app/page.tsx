import Link from "next/link";
import { projects } from "@/lib/projects";
import { ProjectShowcase, Reveal } from "@/components/showcase";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { BlurText } from "@/components/ui/blur-text";
import { SiteHeader, SiteFooter, SectionHead } from "@/components/site-chrome";
import { ExitLink } from "@/components/analytics";

const connectLinks = [
  { href: "https://github.com/rippere", label: "GitHub ↗", primary: true },
  { href: "https://www.linkedin.com/in/benjamin-rippere/", label: "LinkedIn ↗" },
  { href: "https://x.com/rrippere", label: "X / Twitter ↗" },
  { href: "mailto:ben@riphere.com", label: "Email ↗" },
];

const creds = [
  { k: "Domain", v: "Agentic AI systems, grounded in the neuroscience of decision-making" },
  { k: "Builds", v: "NovaCRM · alfred-v2 · TRIBE v2 · Sector Flow · Executive Mind Matrix" },
  { k: "Studies", v: "Psychology & Entrepreneurship · cognitive science w/ a computational-neuroscience grounding" },
  { k: "Direction", v: "AI product / engineering at an early-stage team" },
];

// Consultancy offer — capability-framed, no clients, no metrics. Every claim
// maps to work already shown on the site (NovaCRM live, six bounded agents,
// self-healing infra, fail-loud systems).
const services = [
  {
    title: "Agentic systems",
    body: "Multi-agent pipelines where each agent has one bounded, verifiable job — not a single prompt hoping for the best.",
  },
  {
    title: "Decision intelligence",
    body: "Turning messy human information — email, docs, signals — into a prioritized, explainable next action.",
  },
  {
    title: "Production hardening",
    body: "Grounding, evals, and human-in-the-loop layers so a system fails loud, self-heals, and earns trust.",
  },
];

const audience = [
  "Founders and teams with an AI demo that now has to become something operators rely on.",
  "Operators drowning in manual triage that agents could be doing — correctly and verifiably.",
  "Anyone who needs the system around the model built right, not just the model called.",
];

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
      <SiteHeader />

      <main id="top" className="mx-auto w-full max-w-6xl px-6">
        {/* HERO */}
        {/* HERO: DRAFT copy (2026-11 patch) built on the through-line
            "Decisions get stuck. I build what unsticks them. The person still decides."
            Pending Ben's approval; see the PR. */}
        <section className="pt-12 pb-16 md:pt-28 md:pb-24">
          <p className="eyebrow text-accent">Neuroscience → AI systems</p>
          <h1 className="mt-5 max-w-4xl font-display text-[2.4rem] font-medium leading-[1.04] tracking-[-0.02em] text-ink md:mt-6 md:text-7xl">
            <BlurText text="Decisions get stuck." />{" "}
            <BlurText
              text="I build what unsticks them."
              className="italic text-accent"
              delay={260}
            />
          </h1>
          <p className="mt-4 font-display text-2xl font-medium tracking-tight text-ink-2 md:mt-5 md:text-3xl">
            The person still decides.
          </p>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted md:mt-7 md:text-xl">
            I study how people make decisions at the neural level — reward, motivation,
            cognitive bias, risk tolerance — then build systems that account for those
            realities. Production-deployed, not notebooks.
          </p>
          {/* The two exits: hiring first, the consulting company second and quieter. */}
          <div className="mt-7 flex flex-wrap items-center gap-3 md:mt-9">
            <ExitLink
              exit="hire"
              href="/hire"
              props={{ placement: "hero" }}
              className="rounded-full bg-accent px-6 py-3 font-mono text-sm font-semibold text-paper transition-transform hover:-translate-y-0.5"
            >
              Hire me →
            </ExitLink>
            <ExitLink
              exit="riphere_llc"
              href="/riphere-llc"
              props={{ placement: "hero" }}
              className="rounded-full border border-ink/20 px-6 py-3 font-mono text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
            >
              Riphere LLC · on-prem AI →
            </ExitLink>
            <a href="#work" className="link-anim px-2 py-3 font-mono text-sm text-muted hover:text-ink">
              or see the work ↓
            </a>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-2 border-t border-line/70 pt-6 font-mono text-[0.72rem] uppercase tracking-[0.12em] text-faint md:mt-12">
            <span>
              <span className="text-muted">domain</span> · neuroscience
            </span>
            <span>
              <span className="text-muted">known for</span> · decision design
            </span>
            <span>
              <span className="text-muted">open to</span> · full-time AI roles
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
              front page. It’s all on GitHub.
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
              <ul className="space-y-4">
                {creds.map((c) => (
                  <li key={c.k}>
                    <SpotlightCard className="p-5">
                      <span className="eyebrow text-accent">{c.k}</span>
                      <p className="mt-1.5 text-ink-2">{c.v}</p>
                    </SpotlightCard>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </section>

        {/* CONSULTING — replaces the removed Building-in-public section. */}
        <section id="consulting" className="scroll-mt-20 border-t border-line/70 py-16 md:py-24">
          <Reveal>
            <SectionHead
              num="03"
              title="Work with me"
              sub="I help teams put agentic AI into production — the system around the model, built to ship and to hold up once real people depend on it."
            />

            <div className="mt-10 grid gap-10 md:grid-cols-[1.6fr_1fr]">
              {/* WHAT I DO */}
              <div className="space-y-6">
                <p className="text-lg leading-relaxed text-muted">
                  Most AI projects stall in the gap between a promising demo and something an
                  operator can trust on a Monday morning. That gap — ingestion, grounding,
                  verification, a human in the loop for the calls that matter — is the work I do.
                  I&apos;ve built it for my own systems; I build it with teams who need it for theirs.
                </p>
                <ul className="grid gap-4 sm:grid-cols-3">
                  {services.map((s) => (
                    <li key={s.title}>
                      <SpotlightCard className="h-full p-5">
                        <span className="eyebrow text-accent">{s.title}</span>
                        <p className="mt-1.5 text-ink-2">{s.body}</p>
                      </SpotlightCard>
                    </li>
                  ))}
                </ul>
              </div>

              {/* WHO IT'S FOR + SINGLE CLEAR CTA */}
              <div className="flex flex-col gap-6">
                <SpotlightCard className="p-6">
                  <span className="eyebrow text-faint">Who it&apos;s for</span>
                  <ul className="mt-3 space-y-3 text-ink-2">
                    {audience.map((a) => (
                      <li key={a} className="flex gap-3">
                        <span className="mt-1 text-accent" aria-hidden>
                          →
                        </span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </SpotlightCard>

                <div className="rounded-2xl border border-line bg-paper-2 p-6">
                  <p className="font-display text-2xl font-medium leading-snug tracking-tight text-ink">
                    Have a system that needs to make it to production?
                  </p>
                  <p className="mt-2 text-muted">
                    Tell me the problem in a paragraph. If it&apos;s a fit, we&apos;ll find a time to talk.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {/* Primary lead-gen CTA. Swap this mailto for a Cal.com/Calendly link once one exists. */}
                    <ExitLink
                      exit="contact"
                      href="mailto:ben@riphere.com?subject=Consulting%20inquiry"
                      props={{ placement: "home_consulting" }}
                      className="rounded-full bg-accent px-6 py-3 font-mono text-sm font-semibold text-paper transition-transform hover:-translate-y-0.5"
                    >
                      Start a conversation
                    </ExitLink>
                    <Link
                      href="/novacrm"
                      className="rounded-full border border-ink/20 px-6 py-3 font-mono text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
                    >
                      See a build in depth →
                    </Link>
                  </div>
                </div>
              </div>
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
              {connectLinks.map((l) =>
                l.href.startsWith("mailto") ? (
                  <ExitLink
                    key={l.href}
                    exit="contact"
                    href={l.href}
                    props={{ placement: "home_connect" }}
                    className="rounded-full border border-ink/20 px-6 py-3 font-mono text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
                  >
                    {l.label}
                  </ExitLink>
                ) : (
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
                ),
              )}
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
