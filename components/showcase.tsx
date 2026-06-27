"use client";

import React, { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Project } from "@/lib/projects";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ---------------------------------------------------------------
   Reveal — restrained fade-up for section entrances. Respects
   prefers-reduced-motion.
---------------------------------------------------------------- */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/* ---------------------------------------------------------------
   ContainerScroll — Aceternity's container-scroll animation.
   Faithful transform curve (rotateX 20°→0°, scale, header lift),
   re-skinned bezel for the warm cream palette.
---------------------------------------------------------------- */
function ContainerScroll({
  titleComponent,
  children,
}: {
  titleComponent: React.ReactNode;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Map progress across the element's pass: tilted as it enters from below,
  // flat (rotateX 0) by the time it's centered — a gradual glide, not a snap.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });
  const [isMobile, setIsMobile] = React.useState(false);
  const reduce = useReducedMotion();

  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const scaleDims = (): [number, number] => (isMobile ? [0.7, 0.9] : [1.04, 1]);
  const rotate = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : scaleDims());
  const translate = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, -100]);

  return (
    <div
      ref={ref}
      className="relative flex h-[44rem] items-center justify-center p-2 md:h-[58rem] md:p-10"
    >
      <div className="relative w-full" style={{ perspective: "1000px" }}>
        <ScrollHeader translate={translate}>{titleComponent}</ScrollHeader>
        <ScrollCard rotate={rotate} scale={scale}>
          {children}
        </ScrollCard>
      </div>
    </div>
  );
}

function ScrollHeader({
  translate,
  children,
}: {
  translate: MotionValue<number>;
  children: React.ReactNode;
}) {
  return (
    <motion.div style={{ y: translate }} className="mx-auto max-w-5xl">
      {children}
    </motion.div>
  );
}

function ScrollCard({
  rotate,
  scale,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          "0 30px 80px -28px rgba(25,24,21,0.45), 0 14px 34px -20px rgba(25,24,21,0.4)",
      }}
      className="mx-auto -mt-6 h-[25rem] w-full max-w-5xl rounded-[28px] border border-ink/15 bg-ink p-2 md:-mt-8 md:h-[34rem] md:p-3"
    >
      <div className="h-full w-full overflow-hidden rounded-[22px] bg-paper">
        {children}
      </div>
    </motion.div>
  );
}

/* ---------------------------------------------------------------
   The frame interior. One variant per project, matched to the
   strongest real asset that project actually has.
---------------------------------------------------------------- */
function FrameChrome({ project }: { project: Project }) {
  return (
    <div className="flex items-center justify-between border-b border-line/70 px-4 py-3 md:px-6 md:py-4">
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: project.accent }} />
        <span className="h-2.5 w-2.5 rounded-full bg-line" />
        <span className="h-2.5 w-2.5 rounded-full bg-line" />
      </div>
      <span className="hidden font-mono text-[0.7rem] uppercase tracking-[0.18em] text-faint sm:inline">
        {project.terminal}
      </span>
      <span className="flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-faint md:text-[0.7rem]">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: project.accent }} />
        live
      </span>
    </div>
  );
}

function ProjectFrame({ project }: { project: Project }) {
  const f = project.frame;

  // TRIBE v2 — a real brain-heatmap scorecard, full-bleed like a device screen.
  if (f.kind === "image") {
    return (
      <div className="relative h-full w-full bg-[#0b0d12]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={f.src} alt={f.alt} loading="lazy" className="h-full w-full object-cover object-left-top" />
        {f.caption ? (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-5 py-3 md:px-7 md:py-4">
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-white/85 md:text-[0.68rem]">
              {f.caption}
            </span>
          </div>
        ) : null}
      </div>
    );
  }

  // NovaCRM — a 2×2 grid of real production screenshots.
  if (f.kind === "gallery") {
    return (
      <div className="dotgrid flex h-full w-full flex-col">
        <FrameChrome project={project} />
        <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-2 p-3 md:gap-3 md:p-4">
          {f.shots.map((s) => (
            <figure key={s.src} className="relative overflow-hidden rounded-lg border border-line bg-paper-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.src} alt={s.label} loading="lazy" className="h-full w-full object-cover object-left-top" />
              <figcaption className="absolute left-2 top-2 rounded bg-ink/80 px-2 py-0.5 font-mono text-[0.52rem] uppercase tracking-wide text-paper md:text-[0.58rem]">
                {s.label}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    );
  }

  // Sector Flow — the validation numbers, with a regime-classifier strip.
  if (f.kind === "stats") {
    return (
      <div className="dotgrid flex h-full w-full flex-col">
        <FrameChrome project={project} />
        <div className="flex flex-1 flex-col justify-between gap-6 p-5 md:p-9">
          <span className="eyebrow" style={{ color: project.accent }}>
            {project.category}
          </span>
          <div className="grid gap-6 sm:grid-cols-3 sm:gap-4">
            {f.stats.map((s) => (
              <div key={s.label}>
                <p
                  className="font-display text-[1.7rem] font-medium leading-none tracking-tight md:text-[2.4rem]"
                  style={{ color: project.accent }}
                >
                  {s.value}
                </p>
                <p className="mt-2 font-mono text-[0.64rem] leading-snug text-muted md:text-[0.72rem]">{s.label}</p>
              </div>
            ))}
          </div>
          {f.regimes ? (
            <div>
              <span className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-faint">regime classifier</span>
              <div className="mt-2 flex h-9 overflow-hidden rounded-md border border-line md:h-10">
                {f.regimes.map((r) => (
                  <div
                    key={r.label}
                    className="flex flex-1 items-center justify-center font-mono text-[0.52rem] uppercase tracking-wide text-white md:text-[0.6rem]"
                    style={{ background: r.tone }}
                  >
                    {r.label}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // alfred-v2 — a designed architecture flow (no UI exists to screenshot).
  return (
    <div className="dotgrid flex h-full w-full flex-col">
      <FrameChrome project={project} />
      <div className="flex flex-1 flex-col justify-center p-5 md:p-9">
        <span className="eyebrow mb-5" style={{ color: project.accent }}>
          {project.category}
        </span>
        {f.flow.map((n, i) => (
          <div key={n.label}>
            <div className="flex items-center gap-3 rounded-lg border border-line bg-paper-2 px-4 py-2.5 md:px-5 md:py-3">
              <span className="font-mono text-[0.7rem] text-faint">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <p className="text-sm font-semibold text-ink md:text-[0.95rem]">{n.label}</p>
                <p className="font-mono text-[0.62rem] text-muted md:text-[0.68rem]">{n.sub}</p>
              </div>
            </div>
            {i < f.flow.length - 1 ? (
              <div className="ml-[1.65rem] h-4 w-0.5" style={{ background: project.accent }} />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   ProjectShowcase — one full-width scroll stage per project.
---------------------------------------------------------------- */
export function ProjectShowcase({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  const num = String(index + 1).padStart(2, "0");
  return (
    <ContainerScroll
      titleComponent={
        <div className="px-4 pb-10 text-center">
          <span className="eyebrow text-faint">
            {num} <span className="text-line">/</span>{" "}
            <span style={{ color: project.accent }}>{project.category}</span>
          </span>
          <h3 className="mt-3 font-display text-4xl font-medium tracking-tight text-ink md:text-6xl">
            {project.name}
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted md:text-lg">
            {project.tagline}
          </p>
          <p className="mx-auto mt-2 hidden max-w-2xl text-[0.95rem] leading-relaxed text-faint md:block">
            {project.blurb}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {project.links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener"
                className={cn(
                  "link-anim font-mono text-sm",
                  l.primary ? "font-semibold text-accent" : "text-muted hover:text-ink"
                )}
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      }
    >
      <ProjectFrame project={project} />
    </ContainerScroll>
  );
}
