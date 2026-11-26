export const meta = {
  id: 'novacrm', slug: 'novacrm', title: 'NovaCRM · for founders',
  flyer: 'You still owe a reply from 16 days ago.',
  for: 'For a founder who sells',
  what: 'It drafts your follow-ups, then waits for your yes.',
  caption: 'Sample data, not a customer. Approve & Send is the shipped Slack button.',
  legend: '',
  prov: 'I built it',
  call: 'The follow-up is already written. You just say yes.',
  receipt: { text: 'In use by a second department.', status: 'verified' },
  exits: [{ label: 'See NovaCRM live', href: 'https://app.riphere.com/', exit: 'novacrm_live' }],
  poster: 'The prospect’s pilot-proposal row reads sent: a person approved the drafted follow-up.'
};
const I = '#e9e6df', I2 = '#8d8f96', N = '#05060a', L = '#2a2d35', R = '#ff4b3a', S = '#16181e';
let U = 0;
export default {
  id: 'novacrm',
  mount(el, { phone } = {}) {
    const P = !!phone, W = P ? 320 : 480, H = P ? 180 : 240, u = ++U;
    const g = P ? { x: 22, e: 298, ly: 35, lz: 11, y: 78, p: 14, z: 14, cy: 63, ch: 60, d: [98], dz: 12, bx: 22, by: 85, bw: 26, bh: 14, dx: 74, dw: 26, c: 144, cz: 20, m: 12 }
      : { x: 28, e: 452, ly: 40, lz: 12, y: 96, p: 18, z: 17, cy: 77, ch: 87, d: [124, 144], dz: 13, bx: 28, by: 114, bw: 150, bh: 22, dx: 204, dw: 26, c: 196, cz: 24, m: 16 };
    let css = '', n = 0;
    const A = (st, inner, e = '') => { const k = `nc${u}-${n++}`; css += `@keyframes ${k}{${st.map(([t, s]) => +(t / .14).toFixed(3) + `%{${s}}`).join('')}}.nc .${k}{animation:${k} 14s steps(1,end) -13s infinite paused}`; return `<g class="${k}"${e}>${inner}</g>`; };
    const V = (r, inner, e) => { const s = [[0, 'opacity:0']]; for (const [a, b, o = 1] of r) { s.push([a, 'opacity:' + o]); if (b < 14) s.push([b, 'opacity:0']); } return A(s, inner, e); };
    const T = (x, y, s, z, c = '', e = '') => `<text x="${x}" y="${y}" style="font-size:${z}px"${c ? ` class="${c}"` : ''}${e}>${s}</text>`;
    const E = (x, y, s, z, c, e = '') => T(x, y, s, z, c, e + ' text-anchor="end"');
    const rect = (x, y, w, h, f, s = 'none') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" stroke="${s}"/>`;
    const w1 = [52, 40, 64, 46, 58], w2 = [120, 150, 96, 132, 84], k = P ? .66 : 1, bh = P ? 3 : 4;
    let bars = '';
    (P ? [-2, -1, 1, 2] : [-2, -1, 1, 2, 3]).forEach((j, i) => { const y = g.y + j * g.p - (P ? 6 : 8); bars += rect(g.x, y, w1[i] * k, bh, I2) + rect(g.x + w1[i] * k + 8, y, w2[i] * k, bh, I2) + rect(g.e - 16 * k, y, 16 * k, bh, I2); });
    const slot = V([[0, 3.5]], E(g.e, g.y, '16d', g.z, 's r')) + V([[3.5, 8.5]], E(g.e, g.y, 'draft', g.z, 's q')) + V([[8.5, 14]], E(g.e, g.y, 'sent', g.z, 's'));
    const hero = `<g data-hero>${T(g.x, g.y, 'Prospect · Re: pilot proposal', g.z, 's') + slot}</g>`;
    const card = V([[3.5, 14]], rect(P ? 12.5 : 16.5, g.cy + .5, W - (P ? 25 : 33), g.ch, S, I));
    const draft = V([[3.5, 7.5]], (P ? ['Hi, following up on the pilot proposal.'] : ['Hi, following up on the pilot proposal.', 'Could we pick a time for next steps?']).map((s, i) => T(g.x, g.d[i], s, g.dz, 'i')).join(''));
    const tb = g.by + g.bh / 2 + g.dz * .36, AP = 'Approve &amp; Send', ck = c => `<path d="M${g.bx + (P ? 8.5 : 8)} ${tb - 4}l3 3.5 6-8" fill="none" stroke="${c}" stroke-width="1.5"/>`;
    const btn = V([[7.5, 8.5]], rect(g.bx + .5, g.by + .5, g.bw, g.bh, 'none', I) + ck(I) + (P ? '' : T(g.bx + 23, tb, AP, g.dz, 's')))
      + V([[8.5, 14]], rect(g.bx, g.by, g.bw + 1, g.bh + 1, I) + ck(N) + (P ? '' : T(g.bx + 23, tb, AP, g.dz, 's n')));
    const x0 = g.dx + g.dw / 2, y0 = g.by + g.bh / 2;
    const dis = A([[0, 'opacity:0'], [7.5, 'opacity:1'], [8.5, 'opacity:.3']], rect(g.dx + .5, g.by + .5, g.dw, g.bh, 'none', I2) + `<path d="M${x0 - 4} ${y0 - 4}l8 8m0-8l-8 8" stroke="${I2}"/>`);
    const hx = g.bx + g.bw + 10, hy = g.by + g.bh + 10;
    const hand = `<circle cx="${hx}" cy="${hy}" r="4.5" fill="${I}"/><circle cx="${hx}" cy="${hy}" r="8.5" fill="none" stroke="${I}"/>`;
    const EZ = ';animation-timing-function:cubic-bezier(.65,0,.35,1)', at = ([x, y], dy = 0) => `transform:translate(${x - hx}px,${y - hy + dy}px)`;
    const [R0, D1, D2] = P ? [[311, 73], [274, 94], [274, 94]] : [[466, 91], [302, 120], [276, 140]];
    const ghost = A([[0, at(R0) + EZ], [.7, at(R0, -4) + EZ], [1.4, at(R0) + EZ], [2.1, at(R0, -4) + EZ], [2.8, at(R0)], [3.5, at(R0) + EZ], [4.1, at(D1) + EZ],
      [4.7, at(D1, -3) + EZ], [5.3, at(D1) + EZ], [5.8, at(D2) + EZ], [6.4, at(D2, -3) + EZ], [7, at(D2)], [7.5, at(D2) + EZ], [8.1, 'transform:none']],
      A([[0, 'opacity:1'], [8.1, 'opacity:0']], `<circle cx="${hx}" cy="${hy}" r="8.5" fill="none" stroke="${I}" stroke-width="1.6"/>`));
    const handA = ghost + A([[0, 'opacity:0;transform:none'], [8.1, 'opacity:1;transform:scale(1.15);animation-timing-function:ease-out'],
      [8.22, 'opacity:1;transform:scale(.78);animation-timing-function:cubic-bezier(.2,.7,.3,1)'], [8.5, 'opacity:1;transform:none']], hand, ' data-hand style="transform-box:fill-box;transform-origin:center"');
    const lab = V([[0, 3.5]], T(g.x, g.ly, 'inbox', g.lz, 'q'));
    const list = A([[0, 'opacity:.35'], [3.5, 'opacity:.18']], bars);
    const cap = s => T(g.m, g.c, s, g.cz, 'g');
    const caps = `<g data-cap>${V([[0, 3.5]], cap('Unanswered for 16 days.')) + V([[3.5, 8.5]], cap('Your follow-up, already written.')) + V([[8.5, 14]], cap('Your call.'))}</g>`;
    const aside = V([[11.5, 14]], T(g.m, P ? 158 : 214, 'The draft sends only when you approve.', 10, 'q'));
    const mb = H - 4, bar = (i, on) => rect(g.m + i * 11, mb - 4, 8, 2, on ? I : L), kx = g.m + 41.1;
    const marker = `<g data-beat>${V([[0, 3.5]], bar(0, 1) + bar(1) + bar(2) + T(g.m + 36, mb, 'stuck', 10, 'q'))
      + V([[3.5, 7.5]], bar(0) + bar(1, 1) + bar(2) + T(g.m + 36, mb, 'unstuck', 10, 'q'))
      + V([[7.5, 14]], bar(0) + bar(1) + bar(2, 1))
      + V([[8.5, 14]], `<circle cx="${kx}" cy="${mb - 3.5}" r="2.7" fill="${I}"/><circle cx="${kx}" cy="${mb - 3.5}" r="5.1" fill="none" stroke="${I}"/>` + T(kx + 10.1, mb, 'a person decides', 10, 'q'))}</g>`;
    const stage = lab + list + card + draft + hero + btn + dis + handA + caps + aside + marker;
    el.innerHTML = `<div class="nc"><style>
.nc{position:absolute;inset:0;background:#0e1015}.nc svg{display:block;width:100%;height:100%}
.nc text{font-family:"JetBrains Mono",monospace;fill:${I2}}.nc .g{font-family:Archivo,sans-serif;font-weight:800;font-stretch:72%;fill:${I}}
.nc .s{font-family:Inter,sans-serif;font-weight:600;fill:${I}}.nc .i{font-family:Inter,sans-serif;font-style:italic;fill:${I}}.nc .r{fill:${R}}.nc .n{fill:${N}}.nc text.q{fill:${I2}}
.nc.nc-run *{animation-delay:0s!important;animation-play-state:running!important}.nc.nc-run.nc-stop *{animation-play-state:paused!important}
@media (prefers-reduced-motion:reduce){.nc.nc-run.nc-run *{animation-delay:-13s!important;animation-play-state:paused!important}}
${css}</style>
<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${meta.poster}">
<rect width="${W}" height="16" fill="${S}"/>${T(g.m, 12, meta.title, 10, 'q')}
<rect y="${H - 16}" width="${W}" height="16" fill="${S}"/>${E(W - g.m, H - 4, 'sample data', 10, 'q')}
${stage}</svg></div>`;
    const root = el.firstElementChild;
    return {
      play() {
        root.classList.remove('nc-run', 'nc-stop'); void root.getBoundingClientRect(); root.classList.add('nc-run');
        try { root.getAnimations({ subtree: true }).forEach(a => { a.currentTime = 0; }); } catch {}
      },
      stop() { root.classList.add('nc-stop'); }, pause() { root.classList.add('nc-stop'); }, destroy() { el.innerHTML = ''; }
    };
  }
};
