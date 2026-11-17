import type { Metadata } from "next";
import Link from "next/link";
import { offer } from "@/lib/offer";
import { Reveal } from "@/components/showcase";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { BlurText } from "@/components/ui/blur-text";
import { SiteHeader, SiteFooter, SectionHead } from "@/components/site-chrome";

const SITE = "https://www.riphere.com";

export const metadata: Metadata = {
  title: "NovaCRM — done-for-you AI pipeline setup",
  description:
    "NovaCRM turns the email and Slack you already send into a prioritized deal pipeline. Try it free, or have it set up for you end-to-end.",
  alternates: { canonical: `${SITE}/novacrm` },
  openGraph: {
    type: "website",
    url: `${SITE}/novacrm`,
    title: "NovaCRM — done-for-you AI pipeline setup",
    description:
      "Turn your inbox into a prioritized sales pipeline. Free to start, or done-for-you onboarding in about two weeks.",
  },
  twitter: { card: "summary_large_image" },
};

const primaryBtn =
  "rounded-full bg-accent px-6 py-3 font-mono text-sm font-semibold text-paper transition-transform hover:-translate-y-0.5";
const secondaryBtn =
  "rounded-full border border-ink/20 px-6 py-3 font-mono text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent";

/** CTA pair — reused in the hero and the closing block. */
function CtaRow() {
  return (
    <div className="flex flex-wrap gap-3">
      <a href={offer.primaryCta.href} className={primaryBtn}>
        {offer.primaryCta.label}
      </a>
      <a
        href={offer.secondaryCta.href}
        target={offer.secondaryCta.external ? "_blank" : undefined}
        rel="noopener"
        className={secondaryBtn}
      >
        {offer.secondaryCta.label} ↗
      </a>
    </div>
  );
}

export default function NovaCRMOffer() {
  return (
    <>
      <a
        href="#offer"
        className="sr-only rounded-br-lg bg-accent px-4 py-2 font-mono text-sm text-paper focus:not-sr-only focus:absolute focus:left-0 focus:top-0 focus:z-[100]"
      >
        Skip to the offer
      </a>

      <SiteHeader />

      <main id="top" className="mx-auto w-full max-w-6xl px-6">
        {/* HERO */}
        <section id="offer" className="pt-20 pb-16 md:pt-32 md:pb-24">
          <p className="eyebrow text-accent">{offer.eyebrow}</p>
          <h1 className="mt-6 max-w-4xl font-display text-[2.4rem] font-medium leading-[1.06] tracking-[-0.02em] text-ink md:text-6xl">
            <BlurText text={offer.angleHeadline} />
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted md:text-xl">
            {offer.angleLead}
          </p>
          <div className="mt-9">
            <CtaRow />
          </div>
          <p className="mt-4 font-mono text-[0.72rem] text-faint">
            {offer.onboarding.timeframe} · {offer.onboarding.price} {offer.onboarding.priceNote} · or start free
          </p>
        </section>

        {/* WHO IT'S FOR — the single swappable wedge block (see lib/offer.ts) */}
        <section className="scroll-mt-20 border-t border-line/70 py-16 md:py-24">
          <Reveal>
            <SectionHead num="01" title="Who it's for" sub={`For ${offer.audience.who}.`} />
            <ul className="mt-10 grid gap-4 md:grid-cols-3">
              {offer.audience.painPoints.map((p) => (
                <li key={p}>
                  <SpotlightCard className="h-full p-5">
                    <p className="text-ink-2 md:text-lg">{p}</p>
                  </SpotlightCard>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        {/* HOW IT WORKS */}
        <section className="scroll-mt-20 border-t border-line/70 py-16 md:py-24">
          <Reveal>
            <SectionHead
              num="02"
              title="How it works"
              sub="Four steps from a messy inbox to a pipeline that tells you what to do next."
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {offer.steps.map((s) => (
                <div
                  key={s.n}
                  className="rounded-2xl border border-line bg-paper-2 p-5"
                >
                  <span className="font-mono text-[0.7rem] text-faint">{s.n}</span>
                  <p className="mt-2 font-display text-xl font-medium tracking-tight text-ink">
                    {s.title}
                  </p>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{s.sub}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* WHAT YOU GET */}
        <section className="scroll-mt-20 border-t border-line/70 py-16 md:py-24">
          <Reveal>
            <SectionHead num="03" title="What you get" />
            <div className="mt-10 grid gap-6 md:grid-cols-[1.5fr_1fr]">
              {/* Done-for-you */}
              <SpotlightCard className="p-7 md:p-9">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <span className="eyebrow text-accent">{offer.onboarding.name}</span>
                  <span className="font-mono text-sm text-faint">{offer.onboarding.timeframe}</span>
                </div>
                <p className="mt-3 font-display text-4xl font-medium tracking-tight text-ink md:text-5xl">
                  {offer.onboarding.price}
                  <span className="ml-2 align-middle font-mono text-sm font-normal text-muted">
                    {offer.onboarding.priceNote}
                  </span>
                </p>
                <ul className="mt-6 space-y-3">
                  {offer.onboarding.deliverables.map((d) => (
                    <li key={d} className="flex gap-3 text-ink-2">
                      <span className="mt-1 text-accent" aria-hidden>
                        ✓
                      </span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-7">
                  <a href={offer.primaryCta.href} className={primaryBtn}>
                    {offer.primaryCta.label}
                  </a>
                </div>
              </SpotlightCard>

              {/* Free tier */}
              <div className="rounded-2xl border border-line bg-paper-2 p-7 md:p-9">
                <span className="eyebrow text-faint">{offer.freeTier.name}</span>
                <p className="mt-3 text-muted md:text-lg">{offer.freeTier.lead}</p>
                <ul className="mt-6 space-y-3">
                  {offer.freeTier.points.map((p) => (
                    <li key={p} className="flex gap-3 text-ink-2">
                      <span className="mt-1 text-faint" aria-hidden>
                        →
                      </span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-7">
                  <a
                    href={offer.secondaryCta.href}
                    target={offer.secondaryCta.external ? "_blank" : undefined}
                    rel="noopener"
                    className={secondaryBtn}
                  >
                    {offer.secondaryCta.label} ↗
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* PROOF */}
        <section className="scroll-mt-20 border-t border-line/70 py-16 md:py-24">
          <Reveal>
            <SectionHead
              num="04"
              title="It's real, and it's shipped"
              sub="NovaCRM runs in production today. The receipts are public."
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {offer.proof.map((p) => (
                <div key={p.stat} className="rounded-2xl border border-line bg-paper-2 p-6">
                  <p className="font-display text-2xl font-medium tracking-tight text-accent md:text-3xl">
                    {p.stat}
                  </p>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{p.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
              <a
                href={offer.appHref}
                target="_blank"
                rel="noopener"
                className="link-anim font-mono text-sm font-semibold text-accent"
              >
                Visit the live app ↗
              </a>
              <a
                href={offer.repoHref}
                target="_blank"
                rel="noopener"
                className="link-anim font-mono text-sm text-muted hover:text-ink"
              >
                View the source ↗
              </a>
            </div>
          </Reveal>
        </section>

        {/* CLOSING CTA */}
        <section className="scroll-mt-20 border-t border-line/70 py-16 md:py-28">
          <Reveal>
            <h2 className="max-w-3xl font-display text-3xl font-medium leading-tight tracking-tight text-ink md:text-5xl">
              Stop losing deals to follow-ups you never sent.
            </h2>
            <p className="mt-4 max-w-2xl text-muted md:text-lg">
              Book the done-for-you setup, or try NovaCRM free first — either way, your pipeline
              starts building itself.
            </p>
            <div className="mt-9">
              <CtaRow />
            </div>
            <p className="mt-6 font-mono text-[0.78rem] text-faint">
              Not sure it&apos;s for you?{" "}
              <Link href="/#work" className="link-anim text-muted hover:text-ink">
                See the rest of the work ↗
              </Link>
            </p>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
