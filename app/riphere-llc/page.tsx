import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { ExitLink } from "@/components/analytics";
import { SpotlightCard } from "@/components/ui/spotlight-card";

const SITE = "https://www.riphere.com";

export const metadata: Metadata = {
  title: "Riphere LLC: on-prem AI for practices",
  description:
    "Riphere LLC builds on-prem AI for a practice's document workflow. It runs on your hardware, and client files never leave the office.",
  alternates: { canonical: `${SITE}/riphere-llc` },
};

// DRAFT copy. One quiet page by design (brandbook decision #11/#25): hiring comes
// first on this site, consulting second. No clients, prices or numbers are claimed.
// The offer and segment come from Riphere/CONTEXT.md.
const points = [
  {
    title: "Runs on your hardware",
    body: "The AI is set up on machines in your office. Client files are not sent to a cloud model.",
  },
  {
    title: "Built for your documents",
    body: "Set up around the way your practice already handles its files, not a generic chat window.",
  },
  {
    title: "Starts with an assessment",
    body: "A fixed-fee look at your document workflow first. Then the build, then upkeep.",
  },
];

export default function RiphereLLC() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-6">
        <section className="pt-12 pb-16 md:pt-28 md:pb-24">
          <p className="eyebrow text-accent">Riphere LLC · on-prem AI</p>
          <h1 className="mt-5 max-w-3xl font-display text-[2.4rem] font-medium leading-[1.06] tracking-[-0.02em] text-ink md:text-6xl">
            AI on your files. The files never leave the office.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted md:text-xl">
            Riphere LLC is my consulting company. I build on-prem AI for small practices
            that handle sensitive records, starting with law firms whose cases run on
            medical records: workers&apos; comp, personal injury, SSDI.
          </p>

          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {points.map((p) => (
              <li key={p.title}>
                <SpotlightCard className="h-full p-5">
                  <span className="eyebrow text-accent">{p.title}</span>
                  <p className="mt-1.5 text-ink-2">{p.body}</p>
                </SpotlightCard>
              </li>
            ))}
          </ul>

          <div className="mt-10 max-w-2xl rounded-2xl border border-line bg-paper-2 p-6">
            <p className="font-display text-2xl font-medium leading-snug tracking-tight text-ink">
              Want AI on files you can&apos;t send to the cloud?
            </p>
            <p className="mt-2 text-muted">
              Tell me what your practice does and where the paperwork piles up.
            </p>
            <div className="mt-5">
              <ExitLink
                exit="contact"
                href="mailto:ben@riphere.com?subject=Riphere%20LLC%20inquiry"
                props={{ placement: "riphere_llc", channel: "email" }}
                className="inline-block rounded-full bg-accent px-6 py-3 font-mono text-sm font-semibold text-paper transition-transform hover:-translate-y-0.5"
              >
                Email ben@riphere.com
              </ExitLink>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
