export const meta = {
  id: 'riphere', slug: 'riphere-llc', title: 'Riphere LLC · for a law practice',
  flyer: 'The files can’t leave the office, so the attorney reads every page by hand.',
  for: 'For a small law or clinical practice',
  what: 'Private AI that stays on your premises.',
  caption: 'Composite scene, no client. The question, answer and page number are illustrative.',
  legend: '',
  prov: 'Riphere LLC · I founded it',
  call: 'The partner signs off on a cited answer. The files never left the office.',
  receipt: { text: 'I formed it in Oct 2026', status: 'verified' },
  poster: 'An attorney at a desk under a lamp, the pile of pages faded, has checked cited page 212, wired to the AI under the desk, with the hand mark: Your call. Formed Oct 2026.'
};
const I = '#e9e6df', J = '#8d8f96', L = '#2a2d35', R = '#ff4b3a', N = '#05060a', SH = '#14161c', ST = '#16181e', T = 14;
let U = 0;

function mount(el, { w, h, phone } = {}) {
  w = +w || el.clientWidth || 480; h = +h || el.clientHeight || 240;
  const ph = !!phone || Math.min(w / 480, h / 240) < .9, W0 = ph ? 320 : 480, H0 = ph ? 180 : 240;
  let W = W0, H = H0;
  if (w / h > W0 / H0) W = Math.round(H0 * w / h); else H = Math.round(W0 * h / w);
  const ox = (W - W0) / 2, oy = (H - H0) / 2, P = 'rh' + (++U), X0 = ph ? 12 : 16, C = {};
  let css = '', n = 0;
  const pc = t => +(t / T * 100).toFixed(3) + '%';
  const kf = st => {
    const id = st.join('|'); if (C[id]) return C[id];
    const k = C[id] = P + 'k' + (n++);
    css += `.${P} .${k}{${st.filter(f => f[0] <= 13).pop()[1]}}@keyframes ${k}{${st.map(([t, d, e]) => `${pc(t)}{${d}${e ? ';animation-timing-function:' + e : ''}}`).join('')}}.${P}.run .${k}{animation:${k} ${T}s steps(1,end) infinite}`;
    return k;
  };
  const o0 = 'opacity:0', o1 = 'opacity:1';
  const V = (a, b = T) => kf(a ? [[0, o0], [a, o1], ...(b < T ? [[b, o0]] : []), [T, o0]] : [[0, o1], [b, o0], [T, o1]]);
  const r = (x, y, a, b, s = '') => `<rect x="${x}" y="${y}" width="${a}" height="${b}" ${s}/>`;
  const p = (d, s = '') => `<path d="${d}" fill="none" ${s}/>`;
  const g = (c, s, a = '') => `<g class="${c}" ${a}>${s}</g>`;
  const tx = (x, y, s, z, c = '', a = '') => `<text x="${x}" y="${y}" class="${c}" style="font-size:${z}px" ${a}>${s}</text>`;
  const E = 'text-anchor="end"', fJ = `fill="${J}"`;

  const sheet = `fill="${SH}" stroke="currentColor" stroke-opacity=".7" stroke-width="${ph ? 1.4 : .8}"`, TB = { 5: V(0, 1), 7: V(1, 1.6), 9: V(1.6, 3.5) };
  const sh = i => { const x = 162 + i * 5 % 9, y = 106 - i * 7.5; return `<g transform="rotate(${i * 7 % 9 - 4} ${x + 22} ${y + 13})">${r(x, y, 44, 26, sheet)}${p(`M${x + 5} ${y + 7}h30M${x + 5} ${y + 13}h34M${x + 5} ${y + 19}h26`, `stroke="${J}" stroke-opacity=".6"`)}${TB[i] ? g(TB[i], r(x + 33, y - 7, 9, 9, `fill="${R}"`)) : ''}</g>`; };
  const pile = [0, 1, 2, 3, 4, 5].map(sh).join('') + g(V(1), sh(6) + sh(7)) + g(V(1.6), sh(8) + sh(9));
  const arm = d => p(d, `stroke="${N}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"`) + p(d, `stroke="${J}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"`);
  const legs = '<path d="M100 144L164 146 165 157H100zM154 150h11l-1 36h-11zM151 184h21v5h-21z"/>';
  const scene = p('M-400 190H900', `stroke="${L}"`)
    + r(404, 28, 64, 82, `fill="#090b10" stroke="${J}"`) + p('M436 28v82M404 69h64', `stroke="${L}"`) + p('M400 111h72', `stroke="${J}" stroke-width="2"`)
    + `<polygon points="64,76 90,66 300,190 124,190" fill="${I}" fill-opacity=".12"/>`
    + p('M26 190h28M40 190V64q2-12 16-13', `stroke="${J}" stroke-width="1.8"`)
    + `<polygon points="54,52 74,43 90,66 64,76" fill="${L}" stroke="${J}"/>` + p('M64 76L90 66', `stroke="${I}" stroke-width="2.5"`)
    + `<path d="M93 101l-9 9-3 44h18l-1-44z" fill="#3a3d45"/>` + p('M95 103l3 51M92 154h42M113 156v28M98 186h30', `stroke="${J}" stroke-width="2.5"`)
    + `<circle cx="100" cy="188" r="2" ${fJ}/><circle cx="126" cy="188" r="2" ${fJ}/>`
    + g(kf([[0, `${o1};color:${I}`], [3.5, ph ? o0 : `opacity:.18;color:${J}`], [T, `${o1};color:${I}`]]), pile)
    + g(V(0, 3.5), legs + '<path d="M100 152C97 130 100 110 112 100L128 96C138 102 138 126 134 152zM124 95l9-7 5 6-9 7z"/><circle cx="139" cy="85" r="10"/>'
      + arm('M128 102L156 128L150 92') + `<ellipse cx="149" cy="87" rx="5.5" ry="4.5" stroke="${N}" stroke-width="1.5"/>`, fJ)
    + g(V(3.5), legs + '<path d="M100 152C97 126 99 104 108 96L124 95C131 102 133 126 132 152zM112 86h9v11h-9z"/><circle cx="121" cy="80" r="10"/>'
      + arm('M124 102L145 128L190 129'), fJ)
    + r(136, 132, 258, 4, fJ) + r(140, 136, 3, 54, fJ) + r(388, 136, 3, 54, fJ)
    + r(322, 96, 56, 30, `fill="#12141a" stroke="${J}"`) + r(348, 126, 4, 6, fJ)
    + p('M328 104h30M328 110h40M328 116h24', `class="${V(3.5)}" stroke="${J}"`)
    + `<g data-hero>${r(326, 170, 36, 20, `fill="${ST}" stroke="${J}"`) + p('M332 177h14M332 182h14', `stroke="${L}"`) + r(351, 173, 5, 5, `fill="${I}"`)}</g>`;

  const [cx, cy, cw, chh] = ph ? [92, 26, 150, 34] : [198, 30, 156, 52];
  const [px, py, pw, phh, pz, ly, l1, l2, ci, ck, kw] = ph
    ? [92, 26, 44, 38, 11, [43, 49, 55, 61], 34, 26, 1, 'M106 50l5 6 13-15', 2.4]
    : [198, 30, 64, 64, 12, [54, 62, 70, 78, 86], 54, 46, 2, 'M220 74l8 9 19-22', 3];
  const hx = px + pw + 9, hy = py + phh + 9, dy = ph ? 125 : 165, rz = ph ? 20 : 24;
  const st = `<g transform="${ph ? 'translate(-4 5) scale(.62)' : 'translate(-2 -1) scale(.9)'}">${scene}</g>`
    + p(ph ? 'M215.5 89.3V110.4' : 'M316.6 121.4V152', `class="${V(3.5)}" stroke="${I}" stroke-width="1.2" stroke-dasharray="1.5 2.5"`)
    + (ph ? '' : tx(310, 146, 'AI under the desk', 12, V(3.5), E))
    + g(V(3.5, 7.5), r(cx, cy, cw, chh, `fill="#0e1015" stroke="${L}"`)
      + (ph ? tx(98, 39, 'Injury first noted?', 11) : tx(204, 44, 'When was the injury', 12) + tx(204, 57, 'first noted?', 12))
      + tx(cx + 6, ph ? 54 : 74, `First visit, <tspan fill="${R}">p. 212</tspan>`, 12, 'i ' + V(4.5, 7.5)))
    + g(V(7.5), r(px, py, pw, phh, `fill="${ST}" stroke="${I}"`) + tx(px + 5, py + (ph ? 11 : 13), '212', pz, 'i')
      + ly.map((y, i) => p(`M${px + 5} ${y}h${i % 2 ? l2 : l1}`, i === ci ? `stroke="${I}" stroke-width="1.4"` : `stroke="${J}" stroke-opacity=".55"`)).join('')
      + p(ck, `class="${V(8.5)}" stroke="${I}" stroke-width="${kw}" stroke-linecap="round" stroke-linejoin="round"`))
    + `<g data-hand class="${kf([[0, `${o0};transform:translateY(${dy}px)`], [8.1, `${o1};transform:translateY(${dy}px)`, 'cubic-bezier(.2,.7,.3,1)'], [8.5, `${o1};transform:none`], [T, `${o1};transform:none`]])}"><circle cx="${hx}" cy="${hy}" r="4.5" fill="${I}"/><circle cx="${hx}" cy="${hy}" r="8.5" fill="none" stroke="${I}"/></g>`
    + [[0, 3.5, 'The attorney reads every page.'], [3.5, 8.5, 'Cited, and the files stay.'], [8.5, T, 'Your call.']].map(([a, b, t]) => tx(X0, ph ? 144 : 196, t, rz, 'g ' + V(a, b), 'data-cap')).join('')
    + tx(X0, ph ? 158 : 214, 'Formed Oct 2026.', 10, V(11.5));

  const bb = H - 4, mx = ox + X0 + 36, hk = mx + 5.1;
  const o = r(0, 0, W, H, `fill="${N}"`) + `<g transform="translate(${ox} ${oy})">${st}</g>`
    + r(0, 0, W, 16, `fill="${ST}"`) + r(0, H - 16, W, 16, `fill="${ST}"`)
    + tx(ox + X0, 12, ph ? 'Riphere · for a law practice' : meta.title, 10)
    + '<g data-beat>' + [[0, 3.5], [3.5, 7.5], [7.5, T]].map(([a, b], i) => { const x = ox + X0 + i * 11; return r(x, bb - 4, 8, 2, `fill="${L}"`) + r(x, bb - 4, 8, 2, `fill="${I}" class="${V(a, b)}"`); }).join('')
    + tx(mx, bb, 'stuck', 10, V(0, 3.5)) + tx(mx, bb, 'unstuck', 10, V(3.5, 7.5))
    + g(V(8.5), `<circle cx="${hk}" cy="${bb - 3.5}" r="2.7" fill="${I}"/><circle cx="${hk}" cy="${bb - 3.5}" r="5.1" fill="none" stroke="${I}"/>` + tx(hk + 10.1, bb, 'a person decides', 10)) + '</g>'
    + tx(W - ox - X0, bb, 'composite · no client', 10, '', E);

  const Q = '.' + P;
  css += `${Q}{position:absolute;inset:0;overflow:hidden;background:${N}}${Q} svg{display:block;width:100%;height:100%}`
    + `${Q} text{font-family:"JetBrains Mono",monospace;font-weight:400;fill:${J}}${Q} .g{font-family:Archivo,sans-serif;font-weight:800;font-stretch:72%;fill:${I}}${Q} .i{fill:${I}}`
    + `${Q}.paused *{animation-play-state:paused!important}@media (prefers-reduced-motion:reduce){${Q} *{animation:none!important}}`;

  const root = document.createElement('div');
  root.className = P;
  root.innerHTML = `<style>${css}</style><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${meta.poster}" xmlns="http://www.w3.org/2000/svg">${o}</svg>`;
  el.appendChild(root);
  let rm = false; try { rm = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {  }
  const play = () => {
    root.classList.remove('paused');
    if (rm) return;
    root.classList.remove('run'); void root.offsetWidth; root.classList.add('run');
  };
  const stop = () => root.classList.add('paused');
  return { play, stop, pause: stop, destroy: () => root.remove() };
}

export default { id: 'riphere', meta, mount };
