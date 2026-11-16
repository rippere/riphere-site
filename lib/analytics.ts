/* ---------------------------------------------------------------
   Client-side analytics: PostHog (optional) + session UTM capture.

   The site is a static export, so everything here runs in the browser.

   - PostHog loads only when BOTH NEXT_PUBLIC_POSTHOG_KEY and
     NEXT_PUBLIC_POSTHOG_HOST are set at build time. When either is
     unset, nothing is imported and nothing is sent.
   - UTM params on the landing URL are kept in sessionStorage for the
     rest of the session, so an exit click three pages later still
     carries the campaign that brought the visitor in.
   - Every exit click also dispatches a `riphere:exit_click` DOM event
     (key or no key), and logs to the console when debug is on
     (`?debug_analytics=1`, or localStorage `riphere_debug_analytics=1`).
---------------------------------------------------------------- */

import type { PostHog } from "posthog-js";

export type ExitKind = "hire" | "resume" | "riphere_llc" | "contact";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
const UTM_STORAGE_KEY = "riphere_utm";
const DEBUG_STORAGE_KEY = "riphere_debug_analytics";

type Utm = Partial<Record<(typeof UTM_KEYS)[number], string>>;

let posthog: PostHog | null = null;
let initStarted = false;
let debug = false;

function safeSession(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Store UTM params from the current URL (if any) for the rest of the session. */
function captureUtm(): void {
  const params = new URLSearchParams(window.location.search);
  const found: Utm = {};
  for (const k of UTM_KEYS) {
    const v = params.get(k);
    if (v) found[k] = v.slice(0, 200);
  }
  // Only overwrite when the URL actually carries a campaign, so internal
  // navigation (no query string) keeps the landing attribution.
  if (Object.keys(found).length === 0) return;
  try {
    safeSession()?.setItem(UTM_STORAGE_KEY, JSON.stringify(found));
  } catch {
    /* storage full or blocked: attribution is best-effort */
  }
}

export function getUtm(): Utm {
  try {
    const raw = safeSession()?.getItem(UTM_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Utm = {};
    for (const k of UTM_KEYS) {
      const v = (parsed as Record<string, unknown>)[k];
      if (typeof v === "string") out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

function readDebugFlag(): boolean {
  try {
    if (new URLSearchParams(window.location.search).get("debug_analytics") === "1") {
      window.localStorage.setItem(DEBUG_STORAGE_KEY, "1");
      return true;
    }
    return window.localStorage.getItem(DEBUG_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Idempotent. Call once on the client (see <AnalyticsInit />). */
export function initAnalytics(): void {
  if (typeof window === "undefined" || initStarted) return;
  initStarted = true;
  debug = readDebugFlag();
  captureUtm();

  if (!POSTHOG_KEY || !POSTHOG_HOST) {
    if (debug) console.info("[analytics] PostHog disabled (no key/host); exit clicks are local-only.");
    return;
  }

  import("posthog-js")
    .then(({ default: ph }) => {
      ph.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        person_profiles: "identified_only",
        // Static export with client-side <Link> navigation: count route changes too.
        capture_pageview: "history_change",
      });
      const utm = getUtm();
      if (Object.keys(utm).length) ph.register_for_session(utm);
      posthog = ph;
      if (debug) console.info("[analytics] PostHog initialised.");
    })
    .catch(() => {
      /* blocked by an ad-blocker or offline: the site must not care */
    });
}

/** Record a click on one of the site's exits (hire / résumé / Riphere LLC / contact). */
export function trackExit(exit: ExitKind, extra: Record<string, string> = {}): void {
  if (typeof window === "undefined") return;
  const props = { exit, ...extra, ...getUtm() };

  window.dispatchEvent(new CustomEvent("riphere:exit_click", { detail: props }));
  if (debug) console.info("[analytics] exit_click", props);

  // sendBeacon so the event survives the page navigating away (PDF, mailto, new route).
  posthog?.capture("exit_click", props, { transport: "sendBeacon", send_instantly: true });
}
