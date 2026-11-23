(() => {
  'use strict';
  const IDS = ['floortool', 'novacrm', 'prepost', 'riphere'];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const MAIL = 'ben@riphere.com';
  const mailto = subject => `mailto:${MAIL}?subject=${encodeURIComponent(subject)}`;
  const HAND = '<svg class="hand" viewBox="-9.5 -9.5 19 19" aria-hidden="true"><circle r="4.5"/><circle r="8.5"/></svg>';
  const FOOTER = 'This scene is a composite.';

  const FLOORS = [
    { code: 'PH', label: 'B. Rippere', kind: 'about', href: '?floor=PH', final: '/about' },
    { code: '36', label: 'Floor tool', tag: 'employer', kind: 'case', href: '?case=floor-tool', final: '/work/floor-tool', board: 0 },
    { code: '26', label: 'NovaCRM', tag: 'own product', kind: 'case', href: '?case=novacrm', final: '/work/novacrm', board: 1 },
    { code: '18', label: 'PrePost', tag: 'own research', kind: 'case', href: '?case=prepost', final: '/work/prepost', board: 2 },
    { code: '08', label: 'Riphere LLC', tag: 'the company', kind: 'case', href: '?case=riphere-llc', final: '/work/riphere-llc', board: 3 },
    { code: '07', label: 'Consulting', tag: 'Riphere LLC', kind: 'consulting', href: '?page=consulting', final: '/consulting' },
    { code: 'M', label: 'Résumé', tag: 'PDF', kind: 'resume', href: 'assets/resume.pdf', final: 'assets/resume.pdf', ext: true },
    { code: 'L', label: 'Contact', kind: 'contact', href: '?floor=L', final: '/#contact' },
  ];
  const NUM = { PH: 40, L: 0 };
  const LANES = [
    { k: 'Hiring', parts: [['résumé', 'assets/resume.pdf'], ['email', mailto('Hiring · from street sign')]] },
    { k: 'A project', parts: [['Riphere LLC, FL 08', '?case=riphere-llc'], ['email', mailto('Project · from street sign')]] },
  ];
  const tagHTML = F => F.tag ? ` <small class="kt">${esc(F.tag)}</small>` : '';
  const rowOpen = (F, k, style = '') => (F.inert ? `<a class="inert" aria-disabled="true"` : `<a href="${esc(F.href)}" data-href="${esc(F.final)}"${F.ext ? ' data-ext target="_blank" rel="noopener"' : ''}`)
    + ` data-k="${k}" data-code="${esc(F.code)}"${style ? ` style="${style}"` : ''}>`;
  const rowLabel = F => `${esc(F.label)}${tagHTML(F)}`;
  const feltHead = '<h2>RIPHERE</h2><p class="fsub">work of Ben Rippere</p>';

  const meta = {}, mods = {}, failed = {};
  const ready = Promise.all(IDS.map(id => import(`./demos/${id}.js`).then(
    m => { mods[id] = m; meta[id] = m && m.meta && typeof m.meta === 'object' ? m.meta : null; },
    e => { failed[id] = String(e && e.message || e); meta[id] = null; })));
  const M = b => (b && meta[b.id]) || null;
  const phoneNow = () => innerWidth < 700;
  let reduced = false; try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch {}

  const tx = (x, y, s, t, a = '') => `<text x="${x}" y="${y}" font-size="${s}"${a}>${t}</text>`;
  const cab = ([x, y]) => `<rect x="${x}" y="${y}" width="22" height="20"/><path d="M${x + 3} ${y + 6}h16"/><circle cx="${x + 11}" cy="${y + 13}" r="2.6" class="fl"/>`;
  const ART = {
    floortool: '<path d="M118 172H28v-52h16V96H28V38h150v26h90v108H150"/><path d="M118 172v-32" stroke-width="3.4"/><path class="dash" d="M118 140a32 32 0 0 1 32 32"/>'
      + [[52, 44], [80, 44], [108, 44], [136, 44], [196, 70], [224, 70]].map(cab).join('')
      + '<g class="i2"><rect class="dash" x="150" y="104" width="50" height="40"/>' + tx(175, 136, 34, '?', ' text-anchor="middle" class="big"') + '</g>',
    novacrm: '<rect x="14" y="16" width="272" height="168" rx="5"/><path d="M14 40h272"/><circle cx="28" cy="28" r="3.5"/><circle cx="40" cy="28" r="3.5"/>'
      + '<g class="bar"><path d="M50 62h96M50 76h150M50 150h70M50 164h96"/></g><circle cx="32" cy="69" r="7"/><circle cx="32" cy="157" r="7"/>'
      + '<rect class="row" x="18" y="92" width="264" height="40"/><circle cx="32" cy="112" r="7" class="fl"/>' + tx(48, 119, 20, 'Re: pilot proposal', ' class="b"')
      + '<g class="i2" transform="rotate(-8 222 152)"><rect class="ko" x="160" y="120" width="124" height="64" rx="3"/><rect x="164" y="124" width="116" height="56" rx="2" stroke-width="1.4"/>'
      + tx(222, 145, 20, 'UNANSWERED', ' text-anchor="middle"') + tx(222, 173, 30, '16 DAYS', ' text-anchor="middle" class="big"') + '</g>',
    prepost: [0, 1, 2, 3].map(k => `<rect x="${12 + k * 48}" y="14" width="40" height="72" rx="5"/><path class="fl" d="M${27 + k * 48} 42l12 8-12 8z"/>${tx(19 + k * 48, 36, 20, 'ABCD'[k])}`).join('')
      + '<g class="i2"><path class="dash" d="M104 128L32 92M104 128L80 92M104 128L128 92M104 128L176 92"/>' + tx(28, 168, 40, '?', ' text-anchor="middle" class="big"') + '</g><rect x="52" y="128" width="104" height="44" rx="3"/>' + tx(104, 157, 22, '1 budget', ' text-anchor="middle"')
      + '<rect x="210" y="92" width="78" height="96" rx="3"/><g class="i2"><rect class="fl" x="210" y="92" width="78" height="26" rx="3"/>'
      + tx(249, 112, 20, 'LAUNCH', ' text-anchor="middle" class="ko"') + '<ellipse cx="249" cy="152" rx="36" ry="24" fill="none" transform="rotate(-6 249 152)"/></g>' + tx(249, 162, 30, 'MON', ' text-anchor="middle" class="big"')
      + '<path d="M228 86v12M270 86v12" stroke-width="3"/>',
    riphere: '<g class="pg"><path d="M44 52l120-10 12 132-120 10z"/><path d="M36 46h122v134H36z"/><path d="M28 38h122v112l-22 22H28z"/><path d="M128 172v-22h22" stroke-width="1.6"/></g>'
      + '<g class="bar"><path d="M42 58h90M42 72h96M42 86h70M42 100h92M42 114h84M42 128h60"/></g><path d="M48 26v24q0 6 6 6t6-6V30" stroke-width="2.4"/>'
      + '<path d="M212 70a18 18 0 0 1 4-35 24 24 0 0 1 44 4 16 16 0 0 1 2 31z"/><path d="M237 92V56M227 66l10-10 10 10M214 92l46-56" stroke-width="2.4"/>'
      + '<g class="i2" transform="rotate(-11 150 128)"><rect class="ko" x="66" y="102" width="196" height="52" rx="3"/><rect x="70" y="106" width="188" height="44" rx="2" stroke-width="1.4"/>'
      + tx(164, 137, 23, 'DO NOT UPLOAD', ' text-anchor="middle" class="big"') + '</g>',
  };
  function flyerHTML(b) {
    const m = M(b), line = m && m.flyer, q = s => esc(s).replace(/\n/g, ' <br class="fy-br">');
    const body = line ? `<p class="fy-q">${q(line)}</p>`
      : `<p class="fy-q fy-ph" data-missing="demos/${esc(b.id)}.js meta.flyer" hidden></p>`;
    const art = ART[b.id] ? `<div class="fy-art" aria-hidden="true"><svg viewBox="0 0 300 200">${ART[b.id]}</svg></div>` : '';
    return `<div class="face paper flyer${line ? '' : ' is-ph'}" data-flyer="${esc(b.id)}"><div class="fy-wall" aria-hidden="true"></div><div class="fy-sheet">`
      + `<div class="fy-tb"><span class="fy-k">THE PROBLEM</span><span class="fy-v">FL ${esc(b.code)}</span></div>${art}${body}`
      + `<div class="fy-ft">${FOOTER}</div><div class="fy-sig"><div class="fy-cta">My answer is under this sheet.</div>`
      + `<img class="fy-hd" src="assets/ben-headshot-phone.jpg" width="480" height="585" alt="" decoding="async">`
      + `<div class="fy-id"><span class="fy-nm">${esc(FOUNDER.name)}</span><span class="fy-mu"><span class="fy-mk">RIPHERE</span><span class="fy-url">${esc(FOUNDER.url)}</span></span></div></div></div></div>`;
  }
  function ledLines(b) {
    const m = M(b), s = String((m && m.flyer) || 'THE PROBLEM').replace(/\n/g, ' ').toUpperCase().replace(/[‘’]/g, "'").replace(/[^A-Z0-9 .,'\-:;/?!>@·]/g, '');
    const out = []; let cur = '';
    for (const w of s.split(/\s+/).filter(Boolean)) { if (cur && (cur + ' ' + w).length > 18) { out.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; }
    if (cur) out.push(cur); return out.slice(0, 4);
  }
  function fitSentence(faceEl) {
    const q = faceEl.querySelector('.fy-q'), tb = faceEl.querySelector('.fy-tb'), sheet = faceEl.querySelector('.fy-sheet'); if (!q || !sheet) return;
    q.style.fontSize = '';
    const end = sheet.clientHeight - parseFloat(getComputedStyle(sheet).paddingBottom);
    const over = () => q.offsetTop + q.offsetHeight > end + 1 || (tb && q.offsetTop < tb.offsetTop + tb.offsetHeight + 2) || q.scrollWidth > q.clientWidth + 1;
    let fs = parseFloat(getComputedStyle(q).fontSize) || 24; const min = phoneNow() ? 15 : 18;
    for (let k = 0; k < 30 && over() && fs > min; k++) { fs *= .96; q.style.fontSize = fs.toFixed(1) + 'px'; }
  }
  function fitFace(faceEl) {
    if (!faceEl || !faceEl.classList.contains('flyer')) return null;
    fitSentence(faceEl);
    return faceEl.outerHTML;
  }

  function paneDims(cw, ch, phone, fs) {
    const cap = Math.round(fs * 1.35 * 2 + 6);
    if (phone) { const dw = cw, dh = Math.round(cw * 9 / 16); return { dw, dh, cap }; }
    let dw = Math.round(Math.min(Math.max(cw * .55, 440), cw - 270)), dh = Math.round(dw / 2);
    if (dh + cap > ch) { dh = Math.max(60, ch - cap); dw = dh * 2; }
    return { dw, dh, cap };
  }
  const ph = (t, cls = '') => `<span class="ph-slot${cls}" data-missing="${esc(t)}" hidden></span>`;
  const caseMin = slug => { try { const n = window.CASES && window.CASES[slug]; return Number.isInteger(n) && n > 0 ? n : 0; } catch { return 0; } };
  function caseHTML(b, cw, ch, fs) {
    const phone = phoneNow(), m = M(b), min = caseMin(b.slug), href = esc(`/work/${b.slug}/`);
    const { dw, dh } = paneDims(cw, ch, phone, fs), title = esc((m && m.title) || b.name);
    const rc = m && m.receipt;
    const xs = (m && Array.isArray(m.exits) ? m.exits : []).filter(x => x && x.href && x.label), x0 = xs[0];
    const xHTML = xs.map((x, i) => `<a class="door x${i ? ' alt' : ''}" href="${esc(x.href)}" target="_blank" rel="noopener" data-exit="${esc(x.exit || '')}" data-placement="case_exit" data-on>${esc(x.label)} \u2197</a>`).join('');
    const hold = failed[b.id] ? 'not landed' : 'loads on tear';
    const pending = !(b.id in meta) ? ' data-pending="1"' : '';
    return `<div class="case${phone ? ' stack' : ''}"${pending} style="--dw:${dw}px;--dh:${dh}px">`
      + `<div class="cs-pane">${x0 ? `<a class="demo" href="${esc(x0.href)}" target="_blank" rel="noopener" data-exit="${esc(x0.exit || '')}" data-placement="case_pane" aria-label="${title}: the demo; opens ${esc(x0.label)}">` : min ? `<a class="demo" href="${href}" aria-label="${title}: the demo; opens why I built it">` : `<div class="demo" role="img" aria-label="${title}: the demo">`}`
      + `<div class="dm-mount" data-demo="${esc(b.id)}" style="width:${dw}px;height:${dh}px"><span class="dm-hold">demos/${esc(b.id)}.js · ${hold}</span></div>${min || x0 ? '</a>' : '</div>'}`
      + `<p class="dm-cap">${m && m.caption ? esc(m.caption) + (m.legend ? '<span class="dm-lg">' + esc(m.legend).replace(/\{hand\}|●/g, HAND) + '</span>' : '') : ph('under-pane caption from meta.caption')}</p></div>`
      + `<div class="cf">${m && m.lead ? `<div class="lead" data-on>${esc(m.lead)}</div>` : ''}<div class="cf-a"><div class="cf-tb" data-on><span class="cf-k">MY WORK</span><span class="cf-v">FL ${esc(b.code)}</span></div>`
      + `<div class="for" data-on>${m && m.for ? esc(m.for) : ph('FOR: who uses it, from meta.for')}</div>`
      + `<div class="what" data-on>${m && m.what ? esc(m.what) : ph('what it does, from meta.what')}</div>`
      + `<div class="prov" data-on>${esc((m && m.prov) || b.art.prov)}</div></div>`
      + `<div class="cf-b"><div class="k" data-on>The call</div>${m && m.call ? `<div class="call" data-on>${esc(m.call)}</div>` : `<div class="call tbd" data-on data-missing="the call, from meta.call" hidden></div>`}`
      + `<div class="k" data-on>Receipt <span class="tag">${esc(rc && rc.status ? rc.status : 'unverified')}</span></div>`
      + `<div class="rc" data-on>${rc && rc.text ? esc(rc.text) : ph('receipt from meta.receipt')}</div></div>`
      + (min || xs.length ? `<div class="cf-c">${xHTML}${min ? `<a class="door${xs.length ? ' alt' : ''}" href="${href}" data-on>Why I built it, ${min} min</a>` : ''}</div>` : '') + `</div></div>`;
  }
  const HOLD = { floortool: .2752 };
  function fitCase(b, art) {
    const c = art && art.querySelector('.case'); if (!c) return;
    const mount = c.querySelector('.dm-mount'), cf = c.querySelector('.cf'), cap = c.querySelector('.dm-cap'), pane = c.querySelector('.cs-pane');
    if (!mount || !cf || !cap || !pane) return;
    if (c.classList.contains('stack')) {
      const end = () => Math.max(...[...c.querySelectorAll('[data-on], .dm-cap')].map(e => e.getBoundingClientRect().bottom)) - art.getBoundingClientRect().bottom;
      for (let k = 0; k < 9 && end() > -2; k++) { const w = Math.round(mount.offsetWidth * .97), h = Math.round(w * 9 / 16);
        mount.style.width = w + 'px'; mount.style.height = h + 'px'; c.style.setProperty('--dw', w + 'px'); c.style.setProperty('--dh', h + 'px'); }
      return;
    }
    const cw = c.clientWidth, ch = c.clientHeight; if (!cw || !ch) return;
    const gap = parseFloat(getComputedStyle(c).columnGap) || 0, pg = parseFloat(getComputedStyle(pane).rowGap) || 6;
    const sc = c.getBoundingClientRect().height / ch || 1;
    let dh = mount.offsetHeight;
    const set = dw => { dh = Math.round(dw / 2); c.style.setProperty('--dw', dw + 'px'); c.style.setProperty('--dh', dh + 'px'); mount.style.width = dw + 'px'; mount.style.height = dh + 'px'; };
    if (c.dataset.dw0) set(+c.dataset.dw0); else c.dataset.dw0 = mount.offsetWidth;
    const colH = () => { const ks = cf.querySelectorAll('[data-on]'); return ks.length ? (ks[ks.length - 1].getBoundingClientRect().bottom - ks[0].getBoundingClientRect().top) / sc : 0; };
    const fits = () => colH() <= ch - 2 && dh + pg + cap.offsetHeight <= ch - 8;
    const lim = f => Math.min(cw - f - gap, Math.floor(ch - pg - cap.offsetHeight - 8) * 2), dw0 = mount.offsetWidth;
    const dead = () => (ch - dh - pg - cap.offsetHeight) / 2;
    c.classList.remove('cmp'); c.style.removeProperty('--cz');
    const hold = HOLD[b.id], held = hold ? Math.floor(lim(Math.max(250, Math.round(cw * hold)))) : 0;
    if (held > dw0 + 8) {
      set(held);
      if (colH() > ch - 2) { c.classList.add('cmp'); const f0 = parseFloat(getComputedStyle(cf).fontSize) || 15;
        for (let z = .97; colH() > ch - 2 && f0 * z >= 15; z *= .97) c.style.setProperty('--cz', z.toFixed(3)); }
      if (fits()) { b.paneDead = Math.round(dead()); return; }
      c.classList.remove('cmp'); c.style.removeProperty('--cz'); set(dw0);
    }
    if (colH() > ch - 2) c.classList.add('cmp');
    let want = lim(c.classList.contains('cmp') ? 220 : 250);
    if (want <= dw0 + 8) return;
    const grow = () => { set(want); if (fits()) return want; let lo = dw0, hi = want;
      while (hi - lo > 6) { const mid = Math.round((lo + hi) / 2); set(mid); if (fits()) lo = mid; else hi = mid; }
      set(lo); return lo; };
    grow();
    b.paneDead = Math.round(dead());
  }

  const FOUNDER = { q: 'I design around how decisions actually get made, by people and by models.', name: 'Ben Rippere', url: 'riphere.com',
    alt: 'Ben Rippere, smiling, in a dark suit and red tie' };
  const founderHTML = () => `<div class="fb"><picture class="fb-ph"><source media="(max-width: 699px)" srcset="assets/ben-headshot-phone.jpg">`
    + `<img src="assets/ben-headshot.jpg" width="800" height="998" alt="${esc(FOUNDER.alt)}" fetchpriority="high" decoding="async"></picture>`
    + `<div class="fb-tx"><h1 class="fb-q">${esc(FOUNDER.q)}</h1><div class="fb-sig"><p class="fb-nm">${esc(FOUNDER.name)}</p>`
    + `<p class="fb-br"><span class="fb-mk">RIPHERE</span><span class="fb-url">${esc(FOUNDER.url)}</span></p></div></div></div>`;
  let topEl = null;
  function fitTop() {
    const tx = topEl && topEl.querySelector('.fb-tx'), q = tx && tx.querySelector('.fb-q'); if (!q || !tx.clientHeight) return;
    const ph = phoneNow(), w = topEl.offsetWidth; let fs = w * (ph ? .095 : .072); const min = ph ? 17 : 24;
    const sig = tx.querySelector('.fb-sig'), cs = getComputedStyle(tx), room = tx.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const over = () => q.offsetHeight + parseFloat(getComputedStyle(q).marginBottom) + sig.offsetHeight > room + .5 || q.scrollWidth > q.clientWidth + 1;
    q.style.fontSize = fs.toFixed(1) + 'px';
    for (let k = 0; k < 40 && over() && fs > min; k++) { fs *= .97; q.style.fontSize = fs.toFixed(1) + 'px'; }
  }

  let phEl = null, phBack = null, f7 = null;
  const put = (el, x, y, w) => { el.style.left = Math.round(x) + 'px'; el.style.top = Math.round(y) + 'px'; el.style.width = Math.round(w) + 'px'; };
  function decorateTop(top, R) {
    if (!top || !R) return;
    const pan = top.querySelector('.panel'); topEl = top;
    if (pan) { pan.insertAdjacentHTML('beforeend', founderHTML()); top.classList.add('fb-on'); fitTop(); }
    const world = top.parentNode, BB = window.BB, b = BB && BB.boards[3]; if (!world) return;
    if (!phEl && (phEl = document.getElementById('ph-plate'))) {
      phEl.querySelector('.ph-x').addEventListener('click', () => phOpen(false)); if (deepCode() === 'PH') setTimeout(() => phOpen(true, false));
    }
    if (phEl) { world.appendChild(phEl); phR = R; placePh(); }
    f7 = f7 || document.getElementById('fl07');
    if (f7 && b && BB.BASE.F0) { world.appendChild(f7); f7.hidden = false; const w = R.phone ? innerWidth - 32 : 520; put(f7, (BB.facadeW - w) / 2, (b.y + b.h + BB.BASE.F0) / 2, w); }
  }
  let phR = null;
  function placePh() {
    const R = phR; if (!phEl || !R) return;
    if (R.phone) return put(phEl, 16, R.y + R.h + 44, innerWidth - 32);
    const w = Math.min(R.w, 720), x = R.x + (R.w - w) / 2; put(phEl, x, R.y + R.h + 44, w);
    if (phEl.hidden) return;
    const h = Math.max(...[...phEl.querySelectorAll('.ph-sheet')].map(e => e.offsetTop + e.offsetHeight)) + 10;
    put(phEl, x, Math.max(R.y + R.h - 6, Math.min(R.y + R.h + 44, innerHeight - h - 16)), w);
  }
  function phOpen(on, focus = true) {
    if (!phEl) return;
    if (on) { if (phEl.hidden) phBack = document.activeElement; phEl.hidden = false; placePh(); if (focus) try { phEl.focus({ preventScroll: true }); } catch {} }
    else { phEl.hidden = true; if (phBack && phBack.focus) try { phBack.focus({ preventScroll: true }); } catch {} phBack = null; }
  }
  document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[href="?floor=PH"]'); if (a && !e.button) phOpen(true); }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && phEl && !phEl.hidden) phOpen(false); });

  let io = null;
  try { io = new IntersectionObserver(es => { for (const e of es) { const b = e.target.__rhb; if (!b || !b.demo) continue; try { e.isIntersecting ? b.demo.play && b.demo.play() : b.demo.stop && b.demo.stop(); } catch (err) { console.warn('demo play/stop', b.id, err); } } }, { threshold: 0 }); } catch {}
  async function mountDemo(b) {
    let el = b && b.el && b.el.querySelector('.dm-mount'); if (!el || el.dataset.state) return;
    el.dataset.state = 'loading';
    await ready;
    if (el.isConnected && el.closest('.case[data-pending]') && typeof window.fillArt === 'function') {
      window.fillArt(b); el = b.el.querySelector('.dm-mount'); if (!el) return; el.dataset.state = 'loading';
    }
    const mod = mods[b.id];
    if (!mod || !mod.default || typeof mod.default.mount !== 'function' || !el.isConnected) { el.dataset.state = 'none'; return; }
    try {
      el.innerHTML = '';
      const ctl = mod.default.mount(el, { w: el.offsetWidth, h: el.offsetHeight, phone: phoneNow() });
      b.demo = ctl || null; el.dataset.state = 'on';
      if (b.demo && b.demo.play) b.demo.play();
      const a = el.closest('.demo'); if (a && io) { a.__rhb = b; io.observe(a); }
    } catch (err) { el.dataset.state = 'err'; el.innerHTML = `<span class="dm-hold">demos/${esc(b.id)}.js · mount failed</span>`; console.warn('demo mount', b.id, err); }
  }
  function unmount(b) {
    if (!b || !b.demo) return;
    try { b.demo.stop && b.demo.stop(); } catch {}
    const a = b.el && b.el.querySelector('.demo'); if (a && io) io.unobserve(a);
    b.demo = null;
  }
  function pip(b) { const k = FLOORS.findIndex(f => f.board === b.i); const a = document.querySelector(`#lift a[data-k="${k}"]`); if (a) a.classList.add('lit'); }
  addEventListener('board-torn', e => { const bb = window.BB && window.BB.boards, b = bb && bb[(e.detail || {}).i]; if (b) { mountDemo(b); pip(b); } });

  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('.fl07 a[href^="?case="]');
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    try { history.pushState(null, '', a.getAttribute('href') + location.hash); } catch {}
    const l = document.querySelector('#lift a[data-code="08"]'); if (l) l.click();
  });

  function deepCode() { try { const f = new URLSearchParams(location.search).get('floor'); return f ? f.toUpperCase() : ''; } catch { return ''; } }
  function deepFloor() {
    const q = new URLSearchParams(location.search), c = q.get('case'), f = q.get('floor'), p = q.get('page');
    const k = c ? FLOORS.findIndex(F => F.href === '?case=' + c) : f ? FLOORS.findIndex(F => F.code === f.toUpperCase()) : p ? FLOORS.findIndex(F => F.href === '?page=' + p) : -1;
    return k >= 0 && !FLOORS[k].inert && !FLOORS[k].ext ? k : -1;
  }
  function floorNum(rows, y) {
    const pts = rows.filter(F => F.y != null && !F.inert).map(F => [F.y, F.code in NUM ? NUM[F.code] : +F.code]).sort((a, c) => a[0] - c[0]);
    let v = pts[0][1];
    for (let k = 0; k < pts.length - 1; k++) { const [ya, va] = pts[k], [yb, vb] = pts[k + 1]; if (y >= ya && y <= yb) { v = yb > ya ? va + (vb - va) * (y - ya) / (yb - ya) : vb; break; } if (y > yb) v = vb; }
    v = Math.round(v); return v >= 40 ? 'PH' : v <= 0 ? 'L' : String(v).padStart(2, '0');
  }
  function lanesHTML() {
    return LANES.map(L => `<span class="ln"><span class="lk">${esc(L.k)}</span> → ${L.parts.map(([t, h]) => h ? `<a href="${esc(h)}"${/\.pdf$/.test(h) ? ' target="_blank" rel="noopener"' : ''}>${esc(t)}</a>` : `<span class="inert">${esc(t)}</span>`).join(' + ')}</span>`).join('<span class="sep"> · </span>');
  }

  let rf = 0; const refitAll = () => { clearTimeout(rf); rf = setTimeout(() => { fitTop(); const bb = window.BB && window.BB.boards; if (bb) for (const b of bb) if (b.el) fitCase(b, b.el.querySelector('.art')); }, 80); };
  try { document.fonts.addEventListener('loadingdone', refitAll); document.fonts.ready.then(refitAll); } catch {}

  window.IDL = { IDS, FLOORS, MAIL, meta, ready, failed, reduced: () => reduced, flyerHTML, ledLines, fitFace, caseHTML, fitCase, paneDims,
    decorateTop, phOpen, rowOpen, rowLabel, feltHead, mountDemo, unmount, deepFloor, floorNum, lanesHTML, esc, FOUNDER };
})();
