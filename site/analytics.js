(() => {
  'use strict';
  const KEY = 'phc_pdPhamimcmvy7aZQJJGfupfhTPM3eK7dRFJ5mrVmWro9';
  const HOST = 'https://us.i.posthog.com', SITE = 'riphere-v3';
  const PROD_HOSTS = ['riphere.com', 'www.riphere.com'];
  const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'], UTM_STORE = 'riphere_utm';

  let q = null; try { q = new URLSearchParams(location.search); } catch {}
  const ss = () => { try { return window.sessionStorage; } catch { return null; } };

  try {
    const found = {}; if (q) for (const k of UTM_KEYS) { const v = q.get(k); if (v) found[k] = v.slice(0, 200); }
    if (Object.keys(found).length) ss()?.setItem(UTM_STORE, JSON.stringify(found));
  } catch {}
  function utm() {
    try {
      const raw = ss()?.getItem(UTM_STORE), o = raw ? JSON.parse(raw) : null, out = {};
      if (o && typeof o === 'object') for (const k of UTM_KEYS) if (typeof o[k] === 'string') out[k] = o[k];
      return out;
    } catch { return {}; }
  }

  let on = false;
  try {
    const h = location.hostname.toLowerCase();
    on = !!KEY && /^https?:$/.test(location.protocol) && (PROD_HOSTS.includes(h) || (q && q.get('ph') === '1'));
  } catch {}

  if (on) try {
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog&&window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId captureTraceFeedback captureTraceMetric".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    window.posthog.init(KEY, {
      api_host: HOST,
      person_profiles: 'identified_only',
      capture_pageview: true,
      loaded: ph => { try { ph.register({ site: SITE }); } catch {} },
    });
    window.posthog.register({ site: SITE });
  } catch { on = false; }

  function send(ev, props, opt) {
    if (!on) return;
    try { const p = window.posthog; if (p && typeof p.capture === 'function') p.capture(ev, props, opt); } catch {}
  }

  const placementOf = a => a.dataset.placement
    || (a.closest('.lanes') ? 'street_lanes' : a.closest('.final') ? 'street_sign' : a.closest('#fl07') ? 'fl07_plate'
      : a.closest('#lift') ? 'lift' : a.closest('.felt') ? 'lobby_directory' : a.closest('.case') ? (a.classList.contains('door') ? 'case_door' : 'case_pane')
        : a.closest('#ph-plate') ? 'ph_plate' : 'page');
  function boardOf(a) {
    try { const el = a.closest('.board'), bb = window.BB && window.BB.boards; return (el && bb && bb.find(b => b.el === el)) || null; } catch { return null; }
  }
  function exitOf(a, href) {
    if (a.dataset.exit) return a.dataset.exit;
    const h = href.toLowerCase();
    if (h.startsWith('mailto:')) return /subject=hiring/.test(h) ? 'hire' : 'contact';
    if (/\.pdf($|[?#])/.test(h)) return 'resume';
    if (/(^|\/\/|\.)github\.com/.test(h)) return 'github';
    if (/(^|\/\/|\.)linkedin\.com/.test(h)) return 'linkedin';
    if (/(?:[?&]case=riphere-llc|^\/work\/riphere-llc\/?)(?:[&#?/]|$)/.test(h) && !a.closest('#lift, .felt')) return 'riphere_llc';
    return '';
  }
  function onLink(e) {
    try {
      if (e.type === 'auxclick' && e.button !== 1) return;
      const a = e.target && e.target.closest && e.target.closest('a[href]'); if (!a) return;
      const href = a.getAttribute('href') || '', placement = placementOf(a), u = utm(), exit = exitOf(a, href);
      if (exit) {
        const props = { exit, placement, href, ...u };
        try { window.dispatchEvent(new CustomEvent('riphere:exit_click', { detail: props })); } catch {}
        send('exit_click', props, { transport: 'sendBeacon', send_instantly: true });
        return;
      }
      if ((a.closest('.case') || a.dataset.case) && href.startsWith('/work/')) {
        const b = boardOf(a); send('case_open', { project: b ? b.id : a.dataset.case || href.split('/')[2], floor: b ? b.code : a.dataset.floor || null, placement, href, ...u });
      }
    } catch {}
  }
  document.addEventListener('click', onLink, true);
  document.addEventListener('auxclick', onLink, true);

  const ripped = new Set();
  addEventListener('board-torn', e => {
    try {
      const i = (e.detail || {}).i, b = window.BB && window.BB.boards && window.BB.boards[i]; if (!b || ripped.has(b.id)) return;
      ripped.add(b.id);
      send('board_rip', { project: b.id, floor: b.code, slug: b.slug, mode: b.rm ? 'tap' : b.hand ? 'hand' : 'scroll', ...utm() });
    } catch {}
  });

  let fvT = 0, lastFloor = '';
  addEventListener('floor-parked', e => {
    try {
      clearTimeout(fvT); const d = e.detail || {}; if (!d.code || d.code === lastFloor) return;
      fvT = setTimeout(() => { lastFloor = d.code; send('floor_view', { floor: d.code, label: d.label || '', via: d.via || 'scroll', ...utm() }); }, 800);
    } catch {}
  });
  addEventListener('floor-left', () => { clearTimeout(fvT); });
})();
