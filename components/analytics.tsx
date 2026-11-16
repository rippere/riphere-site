"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { initAnalytics, trackExit, type ExitKind } from "@/lib/analytics";

/** Mount once in the root layout. Renders nothing. */
export function AnalyticsInit() {
  useEffect(() => {
    initAnalytics();
  }, []);
  return null;
}

/**
 * A link that records an `exit_click` before it navigates.
 * Internal paths use next/link; everything else (mailto, PDF, external) is a plain <a>.
 */
export function ExitLink({
  exit,
  href,
  className,
  children,
  external = false,
  props: extra,
}: {
  exit: ExitKind;
  href: string;
  className?: string;
  children: ReactNode;
  /** open in a new tab */
  external?: boolean;
  /** extra event properties, e.g. { placement: "hero" } */
  props?: Record<string, string>;
}) {
  const onClick = () => trackExit(exit, { href, ...extra });

  if (href.startsWith("/") && !href.endsWith(".pdf")) {
    return (
      <Link href={href} className={className} onClick={onClick} data-exit={exit}>
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      className={className}
      onClick={onClick}
      data-exit={exit}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener" : undefined}
    >
      {children}
    </a>
  );
}
