import type { Metadata } from "next";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { ExitLink } from "@/components/analytics";
import { SpotlightCard } from "@/components/ui/spotlight-card";

const SITE = "https://www.riphere.com";

export const metadata: Metadata = {
  title: "Hire Ben Rippere: résumé and contact",
  description:
    "Résumé and contact for Ben Rippere. AI Solutions Developer at Betson, graduating May 2027, looking for a full-time AI role.",
  alternates: { canonical: `${SITE}/hire` },
};

// The résumé PDF is opt-in: drop it at public/resume.pdf and the download
// button appears on the next build. Until then the button asks for it by email.
// (Checked at build time; the site is a static export.)
const HAS_RESUME = existsSync(join(process.cwd(), "public", "resume.pdf"));

const primaryBtn =
  "rounded-full bg-accent px-6 py-3 font-mono text-sm font-semibold text-paper transition-transform hover:-translate-y-0.5";
const secondaryBtn =
  "rounded-full border border-ink/20 px-6 py-3 font-mono text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent";

// DRAFT copy. Every fact below is from the brandbook's exact-facts list
// (portfolio-narrative/brand-identity/90_SYNTHESIS.md §2, §8).
const facts = [
  { k: "Now", v: "AI Solutions Developer, Betson (June 2026 – present)" },
  { k: "Study", v: "B.S. Psychology, Minor in Entrepreneurship, cognitive-science specialization · graduating May 2027" },
  { k: "Looking for", v: "Full-time from mid-2027: technical product or program lead, forward-deployed engineer, AI systems architect" },
];

export default function Hire() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-6">
        <section className="pt-12 pb-16 md:pt-28 md:pb-24">
          <p className="eyebrow text-accent">Hire me</p>
          <h1 className="mt-5 max-w-3xl font-display text-[2.4rem] font-medium leading-[1.06] tracking-[-0.02em] text-ink md:text-6xl">
            I&apos;m looking for a full-time AI role from mid-2027.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted md:text-xl">
            My résumé has the detail. If something here fits your team, email me.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {HAS_RESUME ? (
              <ExitLink exit="resume" href="/resume.pdf" external props={{ placement: "hire" }} className={primaryBtn}>
                Résumé (PDF) ↗
              </ExitLink>
            ) : (
              <ExitLink
                exit="resume"
                href="mailto:ben@riphere.com?subject=R%C3%A9sum%C3%A9%20request"
                props={{ placement: "hire", resume_mode: "request" }}
                className={primaryBtn}
              >
                Request my résumé
              </ExitLink>
            )}
            <ExitLink
              exit="contact"
              href="mailto:ben@riphere.com?subject=Hiring"
              props={{ placement: "hire", channel: "email" }}
              className={secondaryBtn}
            >
              ben@riphere.com
            </ExitLink>
            <ExitLink
              exit="contact"
              href="https://www.linkedin.com/in/benjamin-rippere/"
              external
              props={{ placement: "hire", channel: "linkedin" }}
              className={secondaryBtn}
            >
              LinkedIn ↗
            </ExitLink>
          </div>

          <ul className="mt-12 grid gap-4 md:grid-cols-3">
            {facts.map((f) => (
              <li key={f.k}>
                <SpotlightCard className="h-full p-5">
                  <span className="eyebrow text-accent">{f.k}</span>
                  <p className="mt-1.5 text-ink-2">{f.v}</p>
                </SpotlightCard>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
