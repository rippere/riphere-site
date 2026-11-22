export const meta = {
  id: 'floortool', slug: 'floor-tool', title: 'floor tool · for the arcade-game rep',
  flyer: 'How many arcade games fit in here?\nThe rep: “I’ll get back to you.”',
  for: 'For an arcade-game sales rep',
  what: 'It turns a measured room into a game count, graded, with its reasons.',
  caption: 'The room and the count are synthetic. The method is not shown.',
  legend: '',
  prov: 'I built it as an employee · an arcade-equipment distributor',
  call: 'The rep answers on the spot, not “I’ll get back to you.”',
  receipt: { text: 'It opens from a file and runs offline', status: 'unverified' },
  poster: 'The arcade owner’s question; the rep’s “I’ll get back to you.” struck and dimmed; under it the answer “30 games. Here’s why.” with the hand mark at its lower right; the traced room dimmed beside it, its door measured inside; caption “The rep’s call.”',
};

const INK = '#e9e6df', IN2 = '#8d8f96', SIG = '#ff4b3a', LN = '#2a2d35', BAR = '#16181e';

export default {
  id: 'floortool',
  mount(el, { w = 450, phone = false } = {}) {
    const ph = !!phone || w < 360, VW = ph ? 320 : 480, VH = ph ? 180 : 240, x0 = ph ? 12 : 16, css = [];
    let kn = 0;
    const K = ws => { const n = 'ft' + (ph ? 'p' : 'd') + kn++, z = ws.at(-1)[1];
      css.push(`@keyframes ${n}{${ws.map(([t, d]) => `${+(t / .14).toFixed(3)}%{${d}}`).join('')}100%{${z}}}.${n}{${z}}.ft-on .${n}{animation-name:${n}}`); return n; };
    const V = (on, ...ts) => K([[0, on], ...ts.map(t => [t, on ^= 1])].map(([t, v]) => [t, 'visibility:' + (v ? 'visible' : 'hidden')]));
    const F = (p, ...ws) => K(ws.map(([t, c]) => [t, p + ':' + c]));
    const T = (x, y, s, c, a = '') => `<text x="${x}" y="${y}" class="${c}"${a}>${s}</text>`;
    const RT = (x, y, w, h, a = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}"${a}/>`;
    const [qs, q1, q2, bx, by, bw, bh, tx, ty, bs, ay, st, hx, hy, rise, cy, cs, lx, ly, ls] = ph
      ? [15, 39, 55, 12, 62, 164, 24, 22, 80, 17, 32, 'M20 75h122', 185, 127, 64, 144, 20, 249.3, 118, 11]
      : [18, 46, 66, 16, 78, 240, 38, 28, 106.5, 26, 48, 'M26 98.5h189', 265, 173, 80, 196, 24, 373, 164, 12];
    const [room, jamb, swing, dFr, dIn] = ph
      ? ['M186 30H262.2V43.6H305.7V99.4H263.5M235 99.4H186V83H199.6V66.7H186V30', RT(235, 97.3, 4.8, 4.1) + RT(258.8, 97.3, 4.8, 4.1),
        'M258.8 99.4V80.4A19 19 0 0 0 239.7 99.4', 'M235 102V107M263.5 102V107M235 104.5H263.5', 'M239.7 102V107M258.8 102V107M239.7 104.5H258.8']
      : ['M280 34H392V54H456V136H394M352 136H280V112H300V88H280V34', RT(352, 133, 7, 6) + RT(387, 133, 7, 6),
        'M387 136V108A28 28 0 0 0 359 136', 'M352 140V150M394 140V150M352 145H394', 'M359 140V150M387 140V150M359 145H387'];
    const sy = VH - 16, mb = VH - 4, kx = x0 + 41.1;
    let s = '';
    s += `<text class="ft-q ${V(1, 3.5, 7.5)}"><tspan x="${x0}" y="${q1}">How many arcade games</tspan><tspan x="${x0}" y="${q2}">fit in here?</tspan></text>`;
    s += `<g data-hero class="${F('opacity', [0, 1], [3.5, .18], [7.5, 1], [8.5, .5])}">${RT(bx, by, bw, bh, ` fill="none" class="${F('stroke', [0, SIG], [3.5, IN2])}"`)}`
      + T(tx, ty, 'I’ll get back to you.', 'ft-b ' + F('fill', [0, INK], [3.5, IN2], [7.5, INK], [8.5, IN2]))
      + `<path d="${st}" stroke="${IN2}" class="${V(0, 8.5)}"/></g>`;
    s += `<g class="${V(0, 7.5)}">${RT(bx, by + ay, bw, bh, ` fill="none" class="${K([[0, `stroke:${IN2};stroke-dasharray:3 3`], [8.5, `stroke:${INK};stroke-dasharray:none`]])}"`)}`
      + T(tx, ty + ay, '30 games. Here’s why.', 'ft-b ' + F('fill', [0, IN2], [8.5, INK])) + '</g>';
    s += `<g fill="none" stroke="${IN2}" class="${K([[0, 'visibility:hidden;opacity:1'], [3.5, 'visibility:visible;opacity:1'], [7.5, 'visibility:visible;opacity:.5']])}">`
      + `<path d="${room}" stroke-width="1.4" stroke-linecap="square" class="${F('stroke', [0, INK], [7.5, IN2])}"/>${jamb}<path d="${swing}"/>`
      + `<path d="${dFr}" stroke-dasharray="2 2" class="${V(0, 3.5, 4.5)}"/>`
      + `<path d="${dIn}" class="${K([[0, 'visibility:hidden;stroke:' + SIG], [4.5, 'visibility:visible;stroke:' + SIG], [7.5, 'visibility:visible;stroke:' + IN2]])}"/>`
      + T(lx, ly, 'at the frame', 'ft-l ft-c2 ' + V(0, 3.5, 4.5), ' text-anchor="middle"') + T(lx, ly, 'inside', 'ft-l ft-ci ' + V(0, 4.5, 7.5), ' text-anchor="middle"') + '</g>';
    [[1, 'Waiting on a CAD drawing.', 3.5], [0, 'The room, measured.', 3.5, 8.5], [0, 'The rep’s call.', 8.5]]
      .forEach(([on, c, ...ts]) => s += T(x0, cy, c, 'ft-c ' + V(on, ...ts), ' data-cap'));
    s += `<g data-hand class="${K([[0, `visibility:hidden;transform:translateY(${rise}px)`], [8.1, `visibility:visible;transform:translateY(${rise}px);animation-timing-function:cubic-bezier(.2,.7,.3,1)`], [8.5, 'visibility:visible;transform:none']])}">`
      + `<circle cx="${hx}" cy="${hy}" r="4.5" fill="${INK}"/><circle cx="${hx}" cy="${hy}" r="8.5" fill="none" stroke="${INK}"/></g>`;
    const bar = (i, ...ws) => RT(x0 + i * 11, mb - 4, 8, 2, ` class="${F('fill', ...ws)}"`);
    s += RT(0, 0, VW, 16, ` fill="${BAR}"`) + T(x0, 12, ph ? 'floor tool · for the rep' : meta.title, 'ft-m ft-c2')
      + RT(0, sy, VW, 16, ` fill="${BAR}"`) + `<g data-beat>${bar(0, [0, INK], [3.5, LN])}${bar(1, [0, LN], [3.5, INK], [7.5, LN])}${bar(2, [0, LN], [7.5, INK])}`
      + T(x0 + 36, mb, 'stuck', 'ft-m ft-c2 ' + V(1, 3.5)) + T(x0 + 36, mb, 'unstuck', 'ft-m ft-c2 ' + V(0, 3.5, 7.5))
      + `<g class="${V(0, 8.5)}"><circle cx="${kx}" cy="${mb - 3.5}" r="2.7" fill="${INK}"/><circle cx="${kx}" cy="${mb - 3.5}" r="5.1" fill="none" stroke="${INK}"/>`
      + T(kx + 10.1, mb, 'a person decides', 'ft-m ft-c2') + '</g></g>' + T(VW - x0, mb, 'synthetic example', 'ft-m ft-c2', ' text-anchor="end"');

    const A = 'font-family:Archivo,sans-serif;font-weight:800;font-stretch:72%', JM = '"JetBrains Mono",ui-monospace,monospace';
    const sty = `.ft-r{position:absolute;inset:0;background:#0e1015}.ft-r svg{position:absolute;inset:0;width:100%;height:100%;display:block}
.ft-r text{white-space:pre}.ft-r .ft-m{font:400 10px ${JM}}.ft-r .ft-l{font:400 ${ls}px ${JM};stroke:none}
.ft-r .ft-q{${A};font-size:${qs}px;fill:${IN2}}.ft-r .ft-b{${A};font-size:${bs}px}.ft-r .ft-c{${A};font-size:${cs}px;fill:${INK}}
.ft-r .ft-ci{fill:${INK}}.ft-r .ft-c2{fill:${IN2}}.ft-on [class]{animation:14s steps(1,end) infinite}
${css.join('\n')}
.ft-pz *{animation-play-state:paused!important}@media (prefers-reduced-motion:reduce){.ft-r *{animation:none!important}}`;
    el.innerHTML = `<div class="ft-r"><style>${sty}</style><svg viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${meta.poster.replace(/"/g, '&quot;')}">${s}</svg></div>`;
    const root = el.firstChild;
    return {
      play() { root.classList.remove('ft-on', 'ft-pz'); void root.getBoundingClientRect(); root.classList.add('ft-on'); },
      stop() { root.classList.add('ft-pz'); },
      pause() { root.classList.add('ft-pz'); },
      destroy() { el.innerHTML = ''; },
    };
  },
};
