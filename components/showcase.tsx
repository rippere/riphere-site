"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";
import type { Project } from "@/lib/projects";

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

   The scroll tilt (rotateX 20°→0°, scale, header lift) needs a tall
   scroll runway, so the stage reserves a large fixed height. That
   runway is ONLY worth reserving where the effect actually reads:
   wide (md+) pointer/scroll viewports.

   On phones the tilt is imperceptible, yet the old code still forced
   h-[44rem] per card plus a -mt-6 pull and a -100px header lift —
   which reserved dead scroll space and, because the header height is
   variable per project, let the header and card overlap. It also
   only zeroed the *transforms* under prefers-reduced-motion, never
   the oversized heights, so the dead space survived there too.

   Fix: the tilt is gated behind `enableEffect = (md+ viewport) &&
   !prefers-reduced-motion`. When it's off we render a plain,
   content-sized stack — no fixed giant height, no negative margin,
   no transforms. Default is off (static) so SSR / first paint /
   mobile never reserve the runway; desktop upgrades on mount.
---------------------------------------------------------------- */
function ContainerScroll({
  titleComponent,
  children,
}: {
  titleComponent: React.ReactNode;
  children: React.ReactNode;
}) {
  // Always render a content-sized static stage. The earlier scroll-tilt
  // reserved a tall runway (h-[58rem]) that read as dead space on mobile and
  // could overlap; a static frame is reliable on every viewport.
  return (
    <div className="relative flex flex-col items-center px-2 py-8 md:px-10">
      <div className="w-full">
        <div className="mx-auto max-w-5xl">{titleComponent}</div>
        <StaticCard>{children}</StaticCard>
      </div>
    </div>
  );
}

/* Static, non-animated card. Sizes to a fixed frame height (not a
   scroll runway) with a normal positive gap above it — no negative
   margin, so it can never overlap the header. */
function StaticCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto mt-6 h-[24rem] w-full max-w-5xl rounded-[28px] border border-ink/15 bg-ink p-2 shadow-[0_30px_80px_-28px_rgba(25,24,21,0.45),0_14px_34px_-20px_rgba(25,24,21,0.4)] sm:h-[28rem] md:h-[34rem] md:p-3">
      <div className="h-full w-full overflow-hidden rounded-[22px] bg-paper">
        {children}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   The frame interior. (origin/main verbatim from here down.)
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

  if (f.kind === "stats") {
    return (
      <div className="dotgrid flex h-full w-full flex-col">
        <FrameChrome project={project} />
        <div className="flex flex-1 flex-col justify-between gap-5 p-5 md:p-9">
          <div>
            <span className="eyebrow" style={{ color: project.accent }}>
              {project.category}
            </span>
            {f.headline ? (
              <p className="mt-2 max-w-md font-display text-xl leading-snug text-ink md:text-2xl">
                {f.headline}
              </p>
            ) : null}
          </div>
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
        <span className="eyebrow" style={{ color: project.accent }}>
          {project.category}
        </span>
        {f.headline ? (
          <p className="mb-5 mt-2 max-w-md font-display text-xl leading-snug text-ink md:text-2xl">
            {f.headline}
          </p>
        ) : (
          <div className="mb-5" />
        )}
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
          <p className="mx-auto mt-2 max-w-2xl text-[0.95rem] leading-relaxed text-muted">
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
