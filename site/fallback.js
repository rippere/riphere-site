let sent = false;
export function show(why) {
  if (sent) return; sent = true;
  let hash = '';
  try {
    const q = new URLSearchParams(location.search), floors = (window.IDL && window.IDL.FLOORS) || [];
    const ask = ['case', 'floor', 'page'].map(k => q.has(k) ? `?${k}=${q.get(k)}` : '').find(Boolean);
    const f = ask && floors.find(x => x.href === ask);
    if (f) hash = '#fl-' + String(f.code).toLowerCase();
  } catch {}
  try { window.dispatchEvent(new CustomEvent('riphere:plain', { detail: { why } })); } catch {}
  location.replace('/text/?why=' + encodeURIComponent(why || '') + hash);
}
