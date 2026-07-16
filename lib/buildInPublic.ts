// ============================================================
// Building in public — the publish gate.
//
// HOW TO USE: this is the only file that controls what shows in
// the "Building in public" section. Every item below has a
// `publish` flag:
//   publish: true   → shows on riphere.com
//   publish: false  → stays here, invisible, forever
//
// DEFAULT-DENY: nothing renders unless you deliberately set
// publish: true. Drop half-finished or not-yet-public work in
// here with publish: false and it will never leak to the site.
//
// To change what's live: edit this file → commit → push.
// Backstage, the /ideas engine fills IDEAS.md with candidates;
// when one's worth showing, paste it here and flip publish: true.
// ============================================================

export type Lane = "Incident" | "Rigor" | "Craft" | "Systems" | "Product";

export interface BuildInPublicItem {
  slug: string; // stable id + dedup key
  lane: Lane; // category tag shown on the site
  text: string; // 1–2 sentence, outsider-legible story
  date: string; // ISO "YYYY-MM-DD" — used to sort + flag staleness
  receipt?: string; // optional proof link (repo / PR / commit)
  publish: boolean; // THE GATE — renders only when true
  featured?: boolean; // optional: pin to the top
}

export const buildInPublic: BuildInPublicItem[] = [
  {
    slug: "honest-landing-page",
    lane: "Rigor",
    text: "Caught my own product's landing page overselling. Ripped out fabricated ML claims, rewrote it to the real stack, and wrote an honest demo script. Credibility over hype, even on your own front door.",
    date: "2026-06-27",
    receipt: "https://github.com/rippere/crm-agentic",
    publish: true,
    featured: true,
  },
  {
    slug: "self-healing-vector-store",
    lane: "Incident",
    text: "My memory system's vector store corrupted under a bad write window. Instead of paging me, it now self-heals the corruption and shrinks the window that caused it, so the same failure fixes itself and gets rarer. Fix the condition, not the symptom.",
    date: "2026-06-02",
    receipt: "https://github.com/rippere/alfred-v2",
    publish: true,
  },
  {
    slug: "fail-loud-cockpit",
    lane: "Systems",
    text: "Built a cross-venue financial hub edge-first: the signal is vendored so a dead disk mount can't silently kill it. It fails loud with EDGE-DOWN, and every recommendation is bound to a P&L trust gate. The dangerous failure is the silent one.",
    date: "2026-06-15",
    publish: true,
  },
  {
    slug: "tribe-a100",
    lane: "Product",
    text: "Got TRIBE's video scorer running end-to-end on a persistent A100, including unwrapping a silently-failing nested output and validating each clip's size and length before paying for GPU time. Validate inputs before you spend on compute.",
    date: "2026-06-10",
    receipt: "https://github.com/rippere/tribe-v2",
    publish: true,
  },

  // ---- Example of the gate in action: never renders until you flip it. ----
  // {
  //   slug: "wip-thing",
  //   lane: "Systems",
  //   text: "(half-finished, not for public yet)",
  //   date: "2026-06-26",
  //   publish: false,
  // },
];
