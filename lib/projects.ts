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
      stats: { value: string; label: string }[];
      regimes?: { label: string; tone: string }[];
    }
  | { kind: "diagram"; flow: { label: string; sub: string }[] };

export interface Project {
  slug: string;
  name: string;
  category: string;
  accent: string; // category hue (hex)
  tagline: string;
  blurb: string;
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
    tagline: "Neural content intelligence",
    blurb:
      "Scores short-form video by predicted brain response — trained on fMRI data, shipped with a pre-registered validation protocol so the claim can be proven wrong.",
    stack: ["FastAPI", "Next.js", "RunPod / A100", "fMRI encoding"],
    links: [{ label: "View project ↗", href: "https://github.com/rippere/tribe-v2", primary: true }],
    terminal: "tribe-v2 · neural-scorer",
    frame: {
      kind: "image",
      src: "/showcase/tribe-scorecard.png",
      alt: "TRIBE v2 brain-encoding content scorecard: a per-region neural-attention radar, hook/mean/offset deltas by brain region, and a 0–100 neural score.",
      caption: "live scorecard · brain-region attention · 0–100 neural score",
    },
  },
  {
    slug: "sector-flow-analyzer",
    name: "Sector Flow Analyzer",
    category: "Behavioral finance",
    accent: "#1c8a5b",
    tagline: "Real-time sector-rotation analyzer",
    blurb:
      "Ingests public SSGA fund-flow data and price history, classifies the market regime with self-calibrating thresholds, and streams the live signal to a physical e-ink panel. Decision-support only.",
    stack: ["Python", "WebSocket", "regime models", "e-ink hardware"],
    links: [{ label: "View project ↗", href: "https://github.com/rippere/sector-flow-analyzer", primary: true }],
    terminal: "sector-flow · regime-monitor",
    frame: {
      kind: "stats",
      stats: [
        { value: "p = 3.26e-20", label: "Welch t · signal-validity test" },
        { value: "13 yr", label: "out-of-sample walk-forward · 3,283 days" },
        { value: "60.7%", label: "risk-on hit rate · vs 55% baseline" },
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
    tagline: "Self-hosted memory & RAG",
    blurb:
      "A pgvector semantic knowledge graph over six domain vaults, an MCP query bridge, and a daemon fleet that ingests ambiently — with a 3-tier watchdog that self-heals before it pages me.",
    stack: ["pgvector", "MCP", "daemon fleet", "self-healing"],
    links: [{ label: "View project ↗", href: "https://github.com/rippere/alfred-v2", primary: true }],
    terminal: "alfred-v2 · ~/vault",
    frame: {
      kind: "diagram",
      flow: [
        { label: "Obsidian vaults", sub: "6 domains · ambient sync" },
        { label: "pgvector graph", sub: "MiniLM-L6 · 30k+ records" },
        { label: "MCP query bridge", sub: "sub-second retrieval" },
        { label: "self-healing watchdog", sub: "detect → heal → page" },
      ],
    },
  },
  {
    slug: "crm-agentic",
    name: "NovaCRM",
    category: "Agentic product",
    accent: "#2735e6",
    tagline: "AI-native CRM + PM intelligence",
    blurb:
      "A unified sales pipeline and communication-extraction platform that turns scattered signal into structured next-steps, with autonomous nightly agents — live in production.",
    stack: ["FastAPI", "Next.js", "Supabase", "Railway"],
    links: [
      { label: "Visit live app ↗", href: "https://app.riphere.com", primary: true },
      { label: "View project ↗", href: "https://github.com/rippere/crm-agentic" },
    ],
    terminal: "novacrm · pipeline",
    frame: {
      kind: "gallery",
      shots: [
        { src: "/showcase/novacrm-dashboard.png", label: "Dashboard" },
        { src: "/showcase/novacrm-pipeline.png", label: "Pipeline" },
        { src: "/showcase/novacrm-agents.png", label: "Agents" },
        { src: "/showcase/novacrm-nova.png", label: "Nova AI" },
      ],
    },
  },
];
