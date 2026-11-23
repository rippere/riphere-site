const THROUGH = 'Decisions get stuck. I build what unsticks them. The person still decides.';
const NOTE = 'Plain version: this browser could not draw the 3D building, so its floors are listed here as text.';

const CSS = `
html.plain, html.plain body { overflow: hidden; }
html.plain #scene, html.plain #world, html.plain .film, html.plain #lift, html.plain #hint, html.plain #tb, html.plain #ctl,
html.plain #ph-plate, html.plain #fl07 { visibility: hidden !important; }
#plain { position: fixed; inset: 0; z-index: 1000; overflow-y: auto; background: #0b0c10; color: #e9e6df; -webkit-overflow-scrolling: touch;
  font: 400 17px/1.55 var(--t-read, Archivo, "Helvetica Neue", Arial, sans-serif); }
#plain .pw { max-width: 44rem; margin: 0 auto; padding: 40px 16px 64px; box-sizing: border-box; }
#plain h1 { font: 800 clamp(30px, 7vw, 44px)/1.05 var(--t-lab, Archivo, sans-serif); font-stretch: 112%; margin: 0 0 .2em; letter-spacing: .005em; }
#plain h2 { font: 700 13px/1.3 var(--t-lab, Archivo, sans-serif); font-stretch: 115%; letter-spacing: .04em; text-transform: uppercase; color: #b5b7bd; margin: 0 0 .5em; }
#plain h3 { font: 700 22px/1.25 var(--t-lab, Archivo, sans-serif); margin: 0 0 .35em; }
#plain .role { font: 700 13px/1.3 var(--t-lab, Archivo, sans-serif); font-stretch: 115%; letter-spacing: .06em; text-transform: uppercase; color: #ff4b3a; margin: 0 0 1.2em; }
#plain .q { font-size: 21px; line-height: 1.4; margin: 0 0 .6em; }
#plain .tl { color: #c9c6bf; margin: 0 0 1.4em; }
#plain section { border-top: 1px solid #2a2d35; padding: 26px 0 6px; }
#plain dl { margin: 0; display: grid; grid-template-columns: minmax(6.5em, max-content) 1fr; gap: .35em 1em; }
#plain dt { font: 700 12.5px/1.6 var(--t-lab, Archivo, sans-serif); font-stretch: 115%; letter-spacing: .03em; text-transform: uppercase; color: #8d8f96; }
#plain dd { margin: 0; }
#plain p { margin: 0 0 .8em; }
#plain .fine { color: #8d8f96; font-size: 14px; }
#plain a { color: #e9e6df; text-underline-offset: 3px; }
#plain a:focus-visible { outline: 2px solid #ff4b3a; outline-offset: 2px; }
#plain ul { margin: 0 0 .8em; padding-left: 1.2em; }
@media (max-width: 480px) { #plain dl { grid-template-columns: 1fr; gap: .1em; } #plain dd { margin-bottom: .5em; } }
`;

let shown = false;
export async function show(why) {
  if (shown) return; shown = true;
  const I = window.IDL, esc = I ? I.esc : s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  try { if (I) await Promise.race([I.ready, new Promise(r => setTimeout(r, 4000))]); } catch {}
  try { window.SCENE3D = undefined; } catch {}
  const meta = (I && I.meta) || {}, floors = (I && I.FLOORS) || [], F = (I && I.FOUNDER) || { name: 'Ben Rippere', q: '' };
  const ids = (I && I.IDS) || [], cases = (window.CASES && typeof window.CASES === 'object') ? window.CASES : {};
  const role = (document.querySelector('#tb .tb-r') || {}).textContent || '';
  const anchor = code => 'fl-' + String(code).toLowerCase();
  const link = h => h.replace(/^\?case=riphere-llc$/, '#' + anchor('08'));
  const relink = a => { const h = a.getAttribute('href'); if (/^\?case=riphere-llc$/.test(h)) { a.setAttribute('href', link(h)); a.dataset.exit = 'riphere_llc'; } a.dataset.placement = 'plain'; };
  const row = (k, v) => v ? `<dt>${esc(k)}</dt><dd>${v}</dd>` : '';

  const BB = window.BB && window.BB.boards;
  const boards = ids.map((id, i) => {
    const m = meta[id] || {}, fl = floors.find(f => f.board === i) || {}, slug = (BB && BB[i] && BB[i].slug) || m.slug || '';
    const min = Number.isInteger(cases[slug]) && cases[slug] > 0 ? cases[slug] : 0;
    const rc = m.receipt || {};
    return `<section id="${anchor(fl.code || i)}" aria-labelledby="${anchor(fl.code || i)}-h">`
      + `<h2>FL ${esc(fl.code || '')}${fl.tag ? ' · ' + esc(fl.tag) : ''}</h2>`
      + `<h3 id="${anchor(fl.code || i)}-h">${esc(fl.label || m.title || id)}</h3>`
      + (m.flyer ? `<p class="tl">${esc(String(m.flyer).replace(/\n/g, ' '))}</p>` : '')
      + '<dl>'
      + row('Lead', m.lead ? esc(m.lead) : '') + row('For', m.for ? esc(m.for) : '') + row('What', m.what ? esc(m.what) : '')
      + row('Built', m.prov ? esc(m.prov) : '') + row('The call', m.call ? esc(m.call) : '')
      + row('Receipt', rc.text ? esc(rc.text) + (rc.status ? ` <span class="fine">(${esc(rc.status)})</span>` : '') : '')
      + row('Demo', m.caption ? `<span class="fine">${esc(m.caption)}</span>` : '')
      + row('See it', (Array.isArray(m.exits) ? m.exits : []).filter(x => x && x.href && x.label).map(x => `<a href="${esc(x.href)}" target="_blank" rel="noopener" data-exit="${esc(x.exit || '')}" data-placement="plain">${esc(x.label)}</a>`).join(' · '))
      + row('Why', min ? `<a href="/work/${esc(slug)}/" data-case="${esc(id)}" data-floor="${esc(fl.code || '')}" data-placement="plain_case">Why I built it, ${min} min</a>` : '')
      + '</dl></section>';
  }).join('');

  const desk = document.querySelector('#ph-plate'), sheets = desk ? [...desk.querySelectorAll('.ph-sheets .ph-sheet')] : [];
  const cred = desk && desk.querySelector('.ph-cred');
  const deskHTML = sheets.length ? `<section id="${anchor('PH')}" aria-labelledby="${anchor('PH')}-h"><h2>PH · ${esc((floors[0] && floors[0].label) || '')}</h2><h3 id="${anchor('PH')}-h">The desk</h3>`
    + (cred ? `<p>${esc(cred.textContent.trim())}</p>` : '')
    + '<dl>' + sheets.map(a => row((a.querySelector('h3') || {}).textContent || '', esc(((a.querySelector('.ph-b') || {}).textContent || '').trim())
      + ((a.querySelector('.ph-src') || {}).textContent ? ` <span class="fine">${esc(a.querySelector('.ph-src').textContent.trim())}</span>` : ''))).join('') + '</dl></section>' : '';

  const f7 = document.querySelector('#fl07');
  const f7HTML = f7 ? `<section id="${anchor('07')}" aria-labelledby="${anchor('07')}-h"><h2>FL 07 · ${esc((floors.find(f => f.code === '07') || {}).tag || '')}</h2>`
    + `<h3 id="${anchor('07')}-h">${esc((floors.find(f => f.code === '07') || {}).label || 'Consulting')}</h3>`
    + [...f7.querySelectorAll('.f7-go, .f7-ml')].map(p => {
      const c = p.cloneNode(true); for (const a of c.querySelectorAll('a[href]')) { relink(a); a.removeAttribute('data-href'); }
      return `<p>${c.innerHTML}</p>`; }).join('') + '</section>' : '';

  const tmp = document.createElement('div'); tmp.innerHTML = I && I.lanesHTML ? I.lanesHTML() : '';
  for (const a of tmp.querySelectorAll('a[href]')) relink(a);
  const lanes = [...tmp.querySelectorAll('.ln')].map(l => `<li>${l.innerHTML}</li>`).join('');
  const lanesHTML = `<section id="${anchor('L')}" aria-labelledby="${anchor('L')}-h"><h2>L · Contact</h2><h3 id="${anchor('L')}-h">${esc(F.name)}</h3>`
    + (lanes ? `<ul>${lanes}</ul>` : '') + `<p><a href="mailto:${esc((I && I.MAIL) || '')}">${esc((I && I.MAIL) || '')}</a></p></section>`;

  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const el = document.createElement('main'); el.id = 'plain'; el.dataset.why = why || '';
  el.innerHTML = `<div class="pw"><header><h1>${esc(F.name)}</h1>${role ? `<p class="role">${esc(role)}</p>` : ''}`
    + (F.q ? `<p class="q">${esc(F.q)}</p>` : '') + `<p class="tl">${esc(THROUGH)}</p><p class="fine">${esc(NOTE)}</p></header>`
    + deskHTML + boards + f7HTML + lanesHTML + '</div>';
  document.body.appendChild(el);
  document.documentElement.classList.add('plain');
  try { window.dispatchEvent(new CustomEvent('riphere:plain', { detail: { why } })); } catch {}
}
