/* ============================================================
   Offer content for the /novacrm storefront route.

   The OFFER MECHANICS are locked (hybrid: paid done-for-you
   onboarding as the primary path, free NovaCRM as the secondary).
   The WEDGE — who the one narrow buyer is and the sharpened angle
   that speaks to them — is deliberately UNRESOLVED. Every field
   that depends on that decision is marked `TODO(wedge)` so the
   whole angle can be slotted in later as a one-file edit:
     grep -n "TODO(wedge)" lib/offer.ts
   ============================================================ */

export interface OfferCTA {
  label: string;
  href: string;
  /** external target opens in a new tab; internal/mailto stays in-tab */
  external?: boolean;
}

export interface OfferStep {
  n: string;
  title: string;
  sub: string;
}

export interface OfferProof {
  stat: string;
  label: string;
}

export const offer = {
  /* ── HERO ────────────────────────────────────────────────── */
  eyebrow: "NovaCRM · done-for-you setup",

  // TODO(wedge): replace with the bounded promise for ONE narrow buyer.
  // Placeholder is intentionally offer-shaped, not range-shaped.
  angleHeadline: "Your inbox is already a pipeline. I'll turn it into one.",
  // TODO(wedge): re-point this lead at the specific buyer's world.
  angleLead:
    "NovaCRM reads the email and Slack you already send and receive, and turns it into a prioritized deal pipeline — who to follow up with, which deals are going cold, what you actually committed to. I set the whole thing up for you.",

  /* ── CTAs (hybrid — locked) ──────────────────────────────── */
  primaryCta: {
    label: "Book onboarding",
    // TODO(wedge): swap this mailto for a real calendar link (Cal.com / Calendly)
    // once the booking flow exists.
    href: "mailto:ben@riphere.com?subject=NovaCRM%20onboarding",
  } satisfies OfferCTA,
  secondaryCta: {
    label: "Try NovaCRM free",
    href: "https://app.riphere.com",
    external: true,
  } satisfies OfferCTA,

  /* ── WHO IT'S FOR — the single swappable wedge block ─────── */
  audience: {
    // TODO(wedge): name the ONE narrow buyer (e.g. "boutique agencies",
    // "solo B2B founders", "independent brokers"). All copy below should
    // then be rewritten to that buyer's specific language.
    who: "people whose next deal lives in a follow-up they haven't sent yet",
    // TODO(wedge): rewrite these three pains in the chosen buyer's own words.
    painPoints: [
      "The follow-up that would've closed it is buried three days deep in your inbox.",
      "You know a deal is going cold, but not which one, or when it started to.",
      "What got promised on the last call is a note somewhere — not a task, not a reminder.",
    ],
  },

  /* ── HOW IT WORKS ────────────────────────────────────────── */
  steps: [
    { n: "01", title: "Connect", sub: "Hook up Gmail + Slack over OAuth. Tokens are encrypted; nothing leaves your control." },
    { n: "02", title: "Read", sub: "Six agents classify contacts, score leads, and sort scattered messages into structured deals." },
    { n: "03", title: "Prioritize", sub: "Every deal gets a win-probability and a deal-health score, so the cold ones surface before they die." },
    { n: "04", title: "Act", sub: "You get the next-step queue and draft follow-ups — with a human in the loop for the calls that matter." },
  ] satisfies OfferStep[],

  /* ── WHAT YOU GET ────────────────────────────────────────── */
  onboarding: {
    name: "Done-for-you setup",
    // TODO(wedge): set the real flat price once the offer is priced.
    price: "$X",
    priceNote: "flat, one-time",
    timeframe: "~2 weeks",
    deliverables: [
      "Gmail + Slack connected and verified end-to-end",
      "Your real contacts and deals imported and de-duplicated",
      "Lead-scoring and deal-health tuned to your pipeline",
      "Your follow-up cadence wired into the next-step queue",
      "A working walkthrough so your team actually uses it",
    ],
  },
  freeTier: {
    name: "Or try it yourself",
    lead: "NovaCRM is live and free to start. Kick the tires before you book.",
    points: [
      "Sign in and connect one inbox",
      "See the pipeline build itself",
      "Upgrade to done-for-you whenever you want it handled",
    ],
  },

  /* ── PROOF (NovaCRM is real and shipped — grounded facts) ── */
  proof: [
    { stat: "6 agents", label: "classification, lead scoring, drafting, summarization, pipeline, churn — each a bounded, verifiable job" },
    { stat: "Live", label: "in production at app.riphere.com, watched by a self-healing ops agent" },
    { stat: "Gmail + Slack", label: "OAuth ingest with Fernet-encrypted tokens and a fail-safe human-in-the-loop layer" },
    { stat: "MCP server", label: "the pipeline is queryable by other tools and AI assistants over JSON-RPC" },
  ] satisfies OfferProof[],

  repoHref: "https://github.com/rippere/crm-agentic",
  appHref: "https://app.riphere.com",
} as const;
