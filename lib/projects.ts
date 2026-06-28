export interface ProjectLink {
  label: string;
  href: string;
  primary?: boolean;
}

// What renders inside each project's tilting frame. One variant per project,
// matched to the strongest real asset that project actually has.
export type FrameVariant =
  | { kind: "image"; src: string; alt: string; caption?: string }
  | { kind: "gallery"; shots: { src: string; label: string }[] }
  | {
      kind: "stats";
      headline?: string;
      stats: { value: string; label: string }[];
      regimes?: { label: string; tone: string }[];
    }
  | { kind: "diagram"; headline?: string; flow: { label: string; sub: string }[] };

export interface Project {
  slug: string;
  name: string;
  category: string;
  accent: string; // category hue (hex)
  tagline: string; // short, plain hook
  blurb: string; // one-sentence, layperson explanation (shown above the frame)
  stack: string[];
  links: ProjectLink[];
  terminal: string; // mono label shown in the frame's window chrome
  frame: FrameVariant;
}

export const projects: Project[] = [
  {
    slug: "tribe-v2",
    name: "TRIBE v2",
    category: "Neuro × ML",
    accent: "#6d3bd6",
    tagline: "Predicts how a video lands in the brain",
    blurb:
      "It scores short-form video by predicted brain response — modeled from the video alone, no scanner — and commits its success criteria to git before the results, so the claim can be proven wrong.",
    stack: ["FastAPI", "Next.js", "RunPod / A100", "fMRI encoding"],
    links: [{ label: "View project ↗", href: "https://github.com/rippere/tribe-v2", primary: true }],
    terminal: "tribe-v2 · neural-scorer",
    frame: {
      kind: "image",
      src: "/showcase/tribe-scorecard.png",
      alt: "TRIBE v2 brain-encoding content scorecard: a per-region neural-attention radar, hook/mean/offset deltas by brain region, and a 0–100 neural score.",
      caption: "Each bar is a brain region's predicted response (attention, social, valuation…) — the 89/100 is overall predicted engagement.",
    },
  },
  {
    slug: "sector-flow-analyzer",
    name: "Sector Flow Analyzer",
    category: "Behavioral finance",
    accent: "#1c8a5b",
    tagline: "Catches sector rotation before it hits price",
    blurb:
      "It detects institutional money rotating between market sectors in the covariance structure — before the move shows up in price. Decision-support only.",
    stack: ["Python", "WebSocket", "regime models", "e-ink hardware"],
    links: [{ label: "View project ↗", href: "https://github.com/rippere/sector-flow-analyzer", primary: true }],
    terminal: "sector-flow · regime-monitor",
    frame: {
      kind: "stats",
      headline: "Spots regime shifts early — and it's been tested honestly.",
      stats: [
        { value: "p = 3.26e-20", label: "the signal is real, not random noise" },
        { value: "13 yr", label: "validated on unseen, out-of-sample data" },
        { value: "60.7%", label: "calls right — vs a 55% coin-flip" },
      ],
      regimes: [
        { label: "crisis", tone: "#c2552a" },
        { label: "risk-off", tone: "#b23a6b" },
        { label: "neutral", tone: "#8b8475" },
        { label: "rotation", tone: "#2735e6" },
        { label: "risk-on", tone: "#1c8a5b" },
      ],
    },
  },
  {
    slug: "alfred-v2",
    name: "alfred-v2",
    category: "Systems",
    accent: "#b25a26",
    tagline: "My always-on second brain",
    blurb:
      "A self-hosted memory system that captures everything I read, answers in under a second, and repairs itself before it ever pages me.",
    stack: ["pgvector", "MCP", "daemon fleet", "self-healing"],
    links: [{ label: "View project ↗", href: "https://github.com/rippere/alfred-v2", primary: true }],
    terminal: "alfred-v2 · ~/vault",
    frame: {
      kind: "diagram",
      headline: "Capture → recall in under a second → self-repair",
      flow: [
        { label: "Obsidian vaults", sub: "everything I read · 6 domains" },
        { label: "pgvector graph", sub: "30k+ records, embedded" },
        { label: "MCP query bridge", sub: "answers in under a second" },
        { label: "self-healing watchdog", sub: "detect → heal → page (last resort)" },
      ],
    },
  },
  {
    slug: "crm-agentic",
    name: "NovaCRM",
    category: "Agentic product",
    accent: "#2735e6",
    tagline: "Turns inbox chaos into a sales pipeline",
    blurb:
      "A live AI-native CRM where six agents read scattered email and Slack and turn them into structured, prioritized deals — with a human in the loop for the calls that matter.",
    stack: ["FastAPI", "Next.js", "Supabase", "Railway"],
    links: [
      { label: "Visit live app ↗", href: "https://app.riphere.com", primary: true },
      { label: "View project ↗", href: "https://github.com/rippere/crm-agentic" },
    ],
    terminal: "novacrm · pipeline",
    frame: {
      kind: "image",
      src: "/showcase/novacrm-pipeline.png",
      alt: "NovaCRM pipeline board — deals across stages with AI win-probability and deal-health scoring.",
      caption: "The live pipeline — six agents sort email + Slack into prioritized deals, each with an AI-scored win probability.",
    },
  },
];
