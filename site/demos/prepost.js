const AD = '4 versions of one ad. 1 budget. Launch Monday.';
export const meta = {
  id: 'prepost', slug: 'prepost', title: 'prepost · for campaign managers',
  flyer: 'You have one budget for 4 versions of an ad, and it launches Monday.',
  lead: '64 real ad clips scored on a brain-response model I run myself',
  for: 'For campaign managers',
  what: 'A model reads the first 3 seconds of an ad. It runs on Meta’s TRIBE v2.',
  caption: 'The curves in this demo are illustrative. The real scores are in the case file.',
  legend: '{hand} a person decides · A spoken · B motion · C text · D mid-scene',
  prov: 'I built it · used for a WSU class project',
  call: 'The campaign manager cuts the weak ad before the budget goes.',
  receipt: { text: '64 real ad clips scored on hardware I run', status: 'verified' },
  exits: [{ label: 'Join the PrePost waitlist', href: 'https://prepost-clw.pages.dev/', exit: 'prepost_live' }, { label: 'Code', href: 'https://github.com/rippere/tribe-social', exit: 'github' }],
  poster: 'Act D still: tiles in lanes, fan inside the first 90 frames, braid after 0:03, red trim on C at 0:02 with the hand, slip with the tip, maker line'
};
let n = 0;
const f = v => +v.toFixed(1), INK = '#e9e6df', IN2 = '#8d8f96', LN = '#2a2d35', SG = '#ff4b3a', NT = '#05060a', BG = '#0e1015';
const sm = p => { let d = 'M' + p[0].map(f); for (let i = 1; i < p.length - 1; i++) d += 'Q' + p[i].map(f) + ' ' + f((p[i][0] + p[i + 1][0]) / 2) + ',' + f((p[i][1] + p[i + 1][1]) / 2); return d + 'L' + p[p.length - 1].map(f); };
const HK = [[70, 80, 88, 90, 86, 74, 58], [58, 64, 66, 63, 62, 62, 58], [52, 46, 40, 35, 30, 42, 58], [28, 34, 42, 50, 55, 57, 58]];
const BD = [57, 55, 57, 54, 56];
const LS = [[INK, 1.8, ''], [IN2, 1.8, ''], [INK, 1.8, '5 3'], [IN2, 2.4, '.1 3.6']];

function mount(el, o = {}) {
  const w = o.w || el.clientWidth || 480, ph = o.phone ?? w < 360, R = 'fm' + ++n, D = !ph;
  const W = D ? 480 : 320, H = D ? 240 : 180, sx0 = D ? 104 : 40, sx1 = D ? 468 : 310, fw = (sx1 - sx0) / 8;
  const ry0 = D ? 64 : 61, rh = D ? 18 : 13, rs = D ? 24 : 17, rE = ry0 + 3 * rs + rh, bt = ry0 - 2;
  const cy0 = D ? 78 : 63, cy1 = D ? 139 : 100, ly = D ? 145 : 112, ls = D ? 4.75 : 4, lh = D ? 3.5 : 3, rl = D ? 165 : 129;
  const X = t => sx0 + t * fw, Y = v => cy1 - v * (cy1 - cy0), cap = D ? 196 : 158, H2 = H - (D ? 16 : 13), MS = D ? 11.4 : 11.7, CW = MS * .6, rt = rl + (D ? 10.5 : 11);
  let css = '', k = 0;
  const L = 14.6, tm = t => t <= 1.8 ? t * 3 / 1.8 : t <= 3.4 ? 3 + (t - 1.8) * 3 / 1.6 : t + 2.6;
  const pc = t => +(tm(t) / L * 100).toFixed(3) + '%';
  const Tw = (p, a, tf, post) => { const c = 'k' + k++; let fr = ''; for (let i = 0; i < a.length; i += 2) fr += `${pc(a[i])}{${p}:${a[i + 1]}}`; css += `.${R} .${c}{${p}:${post}}.${R}.run .${c}{animation:${R}${c} ${L}s ${tf} infinite}@keyframes ${R}${c}{${fr}100%{${p}:${a[a.length - 1]}}}`; return c; };
  const O = (a, post) => Tw('opacity', a, 'step-end', post);
  const G = (a, post, s) => `<g class="${O(a, post)}">${s}</g>`;
  const C = (s, a, post = 0) => G([0, 0, ...a], post, s);
  const tx = (x, y, s, t, a = '') => `<text x="${f(x)}" y="${f(y)}" font-size="${s}" ${a}>${t}</text>`;
  const m = (x, y, t, a = '') => tx(x, y, MS, t, `${a} class="m" fill="${IN2}"`);
  const g = (x, y, s, t, wt, c, a = '') => tx(x, y, s, t, `font-weight="${wt}" fill="${c}" ${a}`);
  const hl = (x, y, s, t) => g(x, y, s, t, 800, INK, 'style="font-stretch:72%"');
  const cp = (t, a, post = 0) => C(g(12, cap, D ? 14 : 13, t, 700, INK, 'style="font-stretch:85%"'), a, post);
  const hand = (x, y, s = 1) => `<circle cx="${f(x)}" cy="${f(y)}" r="${4.5 * s}" fill="${INK}"/><circle cx="${f(x)}" cy="${f(y)}" r="${8.5 * s}" fill="none" stroke="${INK}"/>`;
  const Q = t => `translateX(${f(t * fw)}px)`, end = 'text-anchor="end"';

  let st = '', lab = '';
  const names = D ? ['A spoken', 'B motion', 'C text', 'D mid-scene'] : ['A', 'B', 'C', 'D'];
  for (let r = 0; r < 4; r++) {
    const y = ry0 + r * rs, [s, sw, da] = LS[r], my = y + rh / 2, sc = lh / rh, L = ly + r * ls;
    lab += `<path d="M${D ? 12 : 4},${f(my)}h${D ? 14 : 11}" stroke="${s}" stroke-width="${sw}" stroke-dasharray="${da}"/>` + g(D ? 30 : 19, my + 4, D ? 11.4 : 11.7, names[r], D ? 400 : 700, INK);
    let row = '';
    for (let i = 0; i < 8; i++) {
      const x = sx0 + i * fw, c = x + fw / 2;
      row += `<rect x="${f(x + .5)}" y="${y}" width="${f(fw - 1)}" height="${rh}" fill="${i < 3 ? (r == 3 ? NT : ['#2a2e37', '#323741', '#2d3139'][i]) : '#23262d'}"/>`;
      row += i > 2 ? `<rect x="${f(c - 1.5)}" y="${f(y + rh * .35)}" width="3" height="${f(rh * .45)}" fill="${IN2}"/><rect x="${f(c - 1)}" y="${f(y + rh * .35 - 2.4)}" width="2" height="1.8" fill="${IN2}"/><path d="M${f(x + 3)},${f(y + rh * .82)}h${f(fw - 6)}" stroke="#30343d"/>`
        : r == 0 ? [.3, .45, .6].map((d, j) => `<path d="M${f(x + fw * d)},${f(my - rh * [.15, .3, .2][j])}v${f(rh * [.3, .6, .4][j])}" stroke="${IN2}"/>`).join('')
        : r == 1 ? `<path d="M${f(x + fw * .25)},${f(y + rh - 3)}l6,-${rh - 6}m4,${rh - 6}l6,-${rh - 6}" stroke="${IN2}"/>`
        : r == 2 ? `<rect x="${f(x + 4)}" y="${f(my - 1.5)}" width="${f(fw - 8)}" height="3" fill="${IN2}"/>` : '';
    }
    row += `<path d="M${sx0},${y - 2}H${sx1}M${sx0},${y + rh + 2}H${sx1}" stroke="${LN}" stroke-width="${D ? 1.6 : 1.2}" stroke-dasharray="2.4 ${f(fw / 4 - 2.4)}" style="stroke-linecap:butt"/>`;
    const to = `translateY(${f(L - y * sc)}px) scaleY(${+sc.toFixed(3)})`;
    st += `<g class="${Tw('transform', [0, 'none', 3.4, 'none', 3.8, to], 'ease-out', to)}">${row}</g>`;
  }
  const strike = [0, 1, 2, 3].map(r => { const y = ry0 + r * rs; return `M${f(X(0) + 5)},${f(y + rh - 2)}L${f(X(1.5))},${f(y + rh * .5 + [1, -1, 2, 0][r])}L${f(X(3) - 4)},${f(y + 2)}`; }).join('');
  const band = `<rect x="${f(X(0))}" y="${bt}" width="${f(3 * fw)}" height="${rl - bt}" fill="${SG}" fill-opacity=".21"/><path d="M${f(X(0))},${bt}V${rl}M${f(X(3))},${bt}V${rl}" stroke="${SG}"/>`;
  const head = `<path d="M${f(X(0))},${bt - 1}V${rE + 3}" stroke="${SG}" stroke-width="1.3"/><rect x="${f(X(0) - 2.5)}" y="${bt - 4}" width="5" height="4" fill="${SG}"/>`;
  const curve = r => { const p = HK[r].map((v, i) => [X(i / 2), Y(v / 100)]).concat(BD.map((v, i) => [X(4 + i), Y(v / 100)])), [s, sw, da] = LS[r]; return `<path d="${sm(p)}" stroke="${s}" stroke-width="${sw}" stroke-dasharray="${da}"/>`; };
  const x2 = X(2), yT = Y(.3), rx = D ? 8 : 7, hb = D ? 13 : 10;
  const H0 = 'translate(0px,0px) scale(1)', HF = D ? 'translate(58px,34px) scale(1.25)' : 'translate(44px,24px) scale(1.2)';
  const ring = sm([...Array(10)].map((_, i) => { const a = -2.6 + i * .73, q = [1, 1.06, .95, 1.04, .97, 1.08, .96, 1.03, 1.1, 1.15][i]; return [x2 + Math.cos(a) * rx * q, yT + Math.sin(a) * rx * .8 * q]; }));
  const sl = D ? [300, 112, 468, 168] : [234, 84, 310, 106];
  let jag = `M${sl[0]},${sl[1] + 3}`; for (let x = sl[0], i = 0; x < sl[2]; i++) { x = Math.min(sl[2], x + 6 + (i * 7) % 5); jag += `L${x},${sl[1] + [0, 3, 1, 4, 2][i % 5]}`; }
  const slip = `<path d="${jag}V${sl[3]}H${sl[0]}Z" style="fill:${INK}"/>`
    + (D ? m(308, 148, 'tip: tighten the hook.', `fill="${NT}"`) : '')
;
  const mono = D ? '~530 s each, rented GPU' : 'score 4 clips', mw = mono.length * CW, my = D ? 92 : 70;

  const stage = lab + st
    + (D ? C(`<path d="M${f(X(3) + 1)},${rE + 4}v4H${sx1 - 1}v-4" stroke="${IN2}"/>` + g((X(3) + sx1) / 2, rE + 19, 11.4, 'same body after 0:03', 600, IN2, 'text-anchor="middle"'), [0, 1, 3.4, 0]) : '')
    + G([0, 0, 3.8, 1], 1, `<g class="${O([0, 1, 7.6, .4], .4)}">${[3, 1, 0].map(curve).join('')}</g>` + curve(2)
      + `<rect class="${Tw('transform', [0, Q(0), 3.8, Q(2), 4, Q(4), 4.2, Q(6), 4.4, Q(10)], 'step-end', Q(10))}" x="${sx0 - 3}" y="${cy0 - 10}" width="${sx1 - sx0 + 9}" height="${cy1 - cy0 + 14}" fill="${BG}"/>`)
    + G([0, 1, 7.6, 0], 0, band)
    + C(`<path d="M${f(X(0))},${bt + 4}V${bt}H${f(X(3))}v4" stroke="${IN2}"/>`, [7.6, 1], 1)
    + (D ? C(g(X(0) + 5, bt + 11, 11.4, 'first 3 s (the hook)', 600, INK, 'style="font-stretch:88%"'), [3.8, 1], 1) : '')
    + G([0, 1, 1.8, 0], 0, `<g class="${Tw('transform', [0, Q(.3), .3, Q(1.2), .6, Q(2.1), .9, Q(2.8), 1.2, Q(1.6), 1.4, Q(.8), 1.6, Q(1.8)], 'step-end', Q(.3))}">${head}</g>`)
    + C(`<path class="${Tw('stroke-dashoffset', [0, 1, 1.8, 1, 2.2, 0], 'ease-out', 0)}" d="${strike}" pathLength="1" stroke-dasharray="1 1" stroke="${SG}" stroke-width="2.2"/>`, [1.8, 1, 3.4, 0])
    + G([0, 0, 3.4, 1, D ? 12 : 9.6, D ? 1 : 0], D ? 1 : 0, `<path d="M${sx0},${rl}H${sx1}" stroke="${IN2}"/>` + [0, 3].map(t => `<path d="M${f(X(t))},${rl}v3" stroke="${IN2}"/>`).join(''))
    + C(`<path d="${ring}" stroke="${SG}" stroke-width="1.6"/>`, [6.4, 1, 7.6, 0])
    + C(D ? g(x2 - 3, yT + 17, 11.4, 'C dips at 0:02', 600, INK, end) : g(x2 + 22, yT + 4, 11.7, 'C dips at 0:02', 600, INK), [6.4, 1], 1)
    + (D ? C(g(X(3) + 6, Y(.8), 11.4, 'A holds', 600, INK), [7, 1]) : '')
    + C(`<path d="M${f(x2 + 4)},${f(yT - hb)}h-4v${hb + 3}h4" stroke="${SG}" stroke-width="2"/>`, [8.15, 1], 1)
    + C(`<g class="${Tw('transform', [0, HF, 7.6, HF, 8.1, H0, 8.2, 'translate(0px,0px) scale(.78)', 8.35, H0], 'ease-out', H0)}" style="transform-box:fill-box;transform-origin:center">${hand(x2 + 12.8, yT + (D ? 11.8 : 10.5))}</g>`, [7.6, 1], 1)
    + (D ? C(slip, [8.2, 1], 1) + C(tx(sx1, 120, 10, 'higher = holding', `class="m" fill="${IN2}" ${end}`) + tx(sx1, 131, 10, 'dip = where it thinks viewers drift', `class="m" fill="${IN2}" ${end}`), [3.8, 1, 8.2, 0]) : '')
    + C((D ? m(sx1, my - 13, 'score 4 clips:', end) : '') + m(sx1, my, mono, end) + `<path d="M${f(sx1 - mw)},${my + 6}H${sx1}" stroke="${LN}"/><path class="${Tw('transform', [0, 'scaleX(0)', 3.8, 'scaleX(0)', 4.6, 'scaleX(1)'], 'steps(4,end)', 'scaleX(1)')}" style="transform-box:fill-box;transform-origin:left" d="M${f(sx1 - mw)},${my + 6}H${sx1}" stroke="${IN2}"/>`, [3.4, 1, 4.8, 0]);

  const svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${AD}" font-family="Archivo,sans-serif">`
    + `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" fill="${BG}" stroke="#3a3d45"/>`
    + `<rect x="1" y="1" width="${W - 2}" height="14" fill="#16181e"/>` + m(8, 11.5, `prepost · <tspan fill="${INK}">for ${D ? 'campaign managers' : 'paid social'}</tspan>`) + m(W - 8, 11.5, 'demo', `fill="${INK}" ${end}`)
    + (D ? hl(12, 38, 24, AD) : hl(12, 33, 20, '4 versions of one ad. 1 budget.') + hl(12, 52, 20, 'Launch Monday.'))
    + `<g class="${O([0, 1, 9.6, .15], 1)}">${stage}</g>`
    + (D ? C(m(12, 54, 'before: your 4 versions', `fill="${INK}"`), [0, 1, 3.4, 0]) + C(m(12, 54, `with prepost: <tspan fill="${IN2}">how strongly a brain model responds, per second</tspan>`, `fill="${INK}"`), [3.4, 1], 1)
      : C(m(sx1, my, 'dip = it sees a drift', end), [4.8, 1, 9.6, 0]))
    + C([0, 3].map((t, i) => m(X(t), rt, '0:0' + t, i ? 'text-anchor="middle"' : '')).join(''), [3.4, 1, 9.6, 0], D ? 1 : 0)
    + cp(D ? 'Only the first 3 seconds differ.' : 'Only 0:00–0:03 differs.', [0, 1, 1.8, 0])
    + cp(D ? 'Run all four. Pay to find the weak one.' : 'Pay to find the weak one.', [1.8, 1, 3.4, 0])
    + cp('A brain model scores each one.', [3.4, 1, 4.8, 0])
    + cp('Where each one drifts.', [4.8, 1, 7.6, 0])
    + cp(D ? 'Back in the edit. Your call.' : 'Your call.', [7.6, 1, 9.6, 0])
    + (D ? C(hand(W - 20 - 16 * CW, 211.5, .6) + m(W - 12, 215, 'a person decides', end), [7.6, 1, 9.6, 0], 1)
      + cp('Ben Rippere is testing that in public.', [9.6, 1], 1)
      + C(m(12, rt + 2, 'Next: a paid test of whether the curves predict real results.'), [9.6, 1])
      : C(g(12, rt, 11.7, 'Ben Rippere is testing this.', 600, INK), [9.6, 1], 1))
    + `<rect x="1" y="${H2}" width="${W - 2}" height="${H - H2 - 1}" fill="#121419"/><path d="M1,${H2}H${W - 1}" stroke="${LN}"/>`
    + G([0, 1, 7.6, 0], 0, m(8, H - 4.5, D ? 'Monday: guess on 4 versions' : 'Monday: a guess', `fill="${SG}"`))
    + C(m(8, H - 4.5, 'Monday: your call', `fill="${INK}"`), [7.6, 1], 1)
    + m(W - 8, H - 4.5, 'illustrative curves', end) + '</svg>';
  css += `.${R}{width:100%;height:100%;background:${BG}}.${R} svg{display:block}.${R} path{fill:none;stroke-linecap:round;stroke-linejoin:round}.${R} .m{font-family:"JetBrains Mono",monospace;font-variant-numeric:tabular-nums}`
    + `.${R}.hold *{animation-play-state:paused!important}@media (prefers-reduced-motion:reduce){.${R}.run *{animation:none!important}}`;
  el.innerHTML = `<div class="${R}"><style>${css}</style>${svg}</div>`;
  const root = el.firstChild, rm = matchMedia('(prefers-reduced-motion: reduce)');
  const stop = () => root.classList.add('hold');
  return { play() { root.classList.remove('hold', 'run'); if (rm.matches) return; root.getBoundingClientRect(); root.classList.add('run'); }, stop, pause: stop, destroy() { el.innerHTML = ''; } };
}
export default { id: 'prepost', meta, mount };
