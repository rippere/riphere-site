import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

const BB = window.BB;
const SHARED = new Set(), SHARED_TEX = new Set();
const PR = () => Math.min(1.5, window.devicePixelRatio || 1);
const sm01 = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const lerp = (a, b, t) => a + (b - a) * t;
function mulberry(seed) { return () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const R = new THREE.WebGLRenderer({ canvas: BB.canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
R.setClearColor(0x050608, 1);
R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.15;
R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
RectAreaLightUniformsLib.init();

const sceneH = new THREE.Scene(), sceneB = new THREE.Scene();
const camH = new THREE.PerspectiveCamera(), camB = new THREE.PerspectiveCamera();
const FOG = new THREE.Color(0x17130f);
sceneH.fog = new THREE.FogExp2(FOG, 0); sceneB.fog = new THREE.FogExp2(FOG, 0);

const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(R, rt);
const passH = new RenderPass(sceneH, camH);
const passB = new RenderPass(sceneB, camB); passB.clear = false;
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .5, .55, 1.15);
{
  const tc = bloom.compositeMaterial.uniforms.bloomTintColors.value;
  [[1, .9, .8], [1, .62, .42], [1, .42, .26], [1, .3, .18], [.9, .22, .12]].forEach((c, i) => tc[i].set(...c));
  const bf = bloom.compositeMaterial.uniforms.bloomFactors.value; [1, .85, .7, .6, .55].forEach((v, i) => bf[i] = v);
}
const Grade = {
  uniforms: { tDiffuse: { value: null }, uAsp: { value: 1 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uAsp; varying vec2 vUv;
  void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; float l = dot(c, vec3(.299, .587, .114));
    c = mix(c, c * vec3(.9, 1.0, 1.05) + vec3(0., .004, .008), (1. - smoothstep(0., .5, l)) * .7);
    c = mix(c, c * vec3(1.06, 1., .9), smoothstep(.35, 1., l) * .5);
    vec2 d = vUv - .5; d.x *= uAsp; c *= mix(.62, 1., smoothstep(.95, .3, length(d)));
    gl_FragColor = vec4(c, 1.); }`,
};
const gradePass = new ShaderPass(Grade);
composer.addPass(passH); composer.addPass(passB); composer.addPass(bloom); composer.addPass(new OutputPass()); composer.addPass(gradePass);

let texOK = false; const LM = new THREE.LoadingManager(() => { texOK = true; G.compiled = false; });
const BMP = (async () => { try {
  const c = document.createElement('canvas'); c.width = 1; c.height = 2; const o = c.getContext('2d'); o.fillStyle = '#f00'; o.fillRect(0, 0, 1, 1); o.fillStyle = '#00f'; o.fillRect(0, 1, 1, 1);
  const b = await createImageBitmap(c, { imageOrientation: 'flipY' }), d = document.createElement('canvas'); d.width = 1; d.height = 2; const p = d.getContext('2d'); p.drawImage(b, 0, 0); if (b.close) b.close();
  const px = p.getImageData(0, 0, 1, 1).data; return px[2] > 200 && px[0] < 50; } catch { return false; } })();
const IL = new THREE.ImageLoader();
function loadMap(t, url) {
  LM.itemStart(url);
  const done = img => { if (img) { t.image = img; t.needsUpdate = true; } LM.itemEnd(url); };
  const viaImg = () => IL.load(url, done, undefined, () => { LM.itemError(url); done(null); });
  BMP.then(ok => ok ? fetch(url, { priority: 'low' }).then(r => { if (!r.ok) throw new Error(r.status); return r.blob(); })
    .then(b => createImageBitmap(b, { imageOrientation: 'flipY', premultiplyAlpha: 'none', colorSpaceConversion: 'none' }))
    .then(b => { t.flipY = false; done(b); }, viaImg) : viaImg());
}
const maxAniso = R.capabilities.getMaxAnisotropy();
const tex = (f, srgb) => { const t = new THREE.Texture(); loadMap(t, 'tex/' + f); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = Math.min(8, maxAniso); if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
const pbr = n => ({ map: tex(n + '_diff_1k.jpg', true), normalMap: tex(n + '_nor_1k.jpg'), roughnessMap: tex(n + '_rough_1k.jpg') });
const T_SLAB = pbr('concrete_slab_wall_02'), T_PANEL = pbr('concrete'), T_PAVE = pbr('concrete_tiles_02'), T_ASPH = pbr('clean_asphalt');
const pbrArm = (n, d, a) => { const arm = tex(`${n}_arm_${a}.jpg`); return { map: tex(`${n}_diff_${d}.jpg`, true), normalMap: tex(`${n}_nor_gl_${d}.jpg`), roughnessMap: arm, aoMap: arm }; };
const T_PCAST = pbrArm('concrete_wall_006', '1k', '1k'), T_BOARD = pbrArm('wood_textured_concrete', '1k', '1k'), T_BUSH = pbrArm('brushed_concrete_04', '1k', '1k');
const canvasTex = (c, srgb = true) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(4, maxAniso); return t; };
const mkC = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

const ENV_SRC = (() => {
  const c = mkC(512, 256), o = c.getContext('2d'), g = o.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#040507'); g.addColorStop(.38, '#0c0c10'); g.addColorStop(.48, '#3a2a1e'); g.addColorStop(.52, '#2a1f18'); g.addColorStop(.6, '#120f0d'); g.addColorStop(1, '#0a0908');
  o.fillStyle = g; o.fillRect(0, 0, 512, 256);
  const r = mulberry(11); for (let i = 0; i < 900; i++) { const y = 128 + r() * 70, a = .2 + r() * .6; o.fillStyle = `rgba(255,${180 + r() * 60 | 0},${110 + r() * 80 | 0},${a})`; o.fillRect(r() * 512, y, 1 + r() * 2, 1); }
  const t = canvasTex(c); t.mapping = THREE.EquirectangularReflectionMapping; return t;
})();
const PM = { gen: null, rt: null };
function envKick() {
  try { const pm = new THREE.PMREMGenerator(R); pm.compileEquirectangularShader(); pm._setSize(ENV_SRC.image.width / 4); const rt = pm._allocateTargets(); pm._compileMaterial(pm._blurMaterial); PM.gen = pm; PM.rt = rt; }
  catch { PM.gen = PM.rt = null; }
}
function envMake() {
  if (sceneH.environment) return;
  const pm = PM.gen || new THREE.PMREMGenerator(R), env = pm.fromEquirectangular(ENV_SRC, PM.rt).texture; pm.dispose(); PM.gen = PM.rt = null;
  sceneH.environment = env; sceneB.environment = env;
}

const ATLAS = (() => {
  const S = 128, c = mkC(S * 4, S * 2), o = c.getContext('2d'), r = mulberry(5);
  const cell = (k, fn) => { o.save(); o.translate((k % 4) * S, Math.floor(k / 4) * S); o.beginPath(); o.rect(0, 0, S, S); o.clip(); fn(); o.restore(); };
  const ceil = (top, bot) => { const g = o.createLinearGradient(0, 0, 0, S); g.addColorStop(0, top); g.addColorStop(.35, bot); g.addColorStop(1, bot); o.fillStyle = g; o.fillRect(0, 0, S, S); };
  const desks = col => { o.save(); o.filter = 'blur(3px)'; o.globalAlpha = .55; o.fillStyle = col; o.fillRect(0, S * .78, S, S * .22); for (let i = 0; i < 3; i++) { const x = r() * S * .9; o.fillRect(x, S * .64, 14 + r() * 22, S * .16); } o.globalAlpha = .35; o.fillRect(r() * S * .5, S * .3, S * .35, S * .5); o.restore(); };
  const blinds = (down, col) => { o.fillStyle = col; for (let y = 0; y < S * down; y += 5) o.fillRect(0, y, S, 3); };
  cell(0, () => { ceil('#fff1d4', '#a8835a'); desks('#2a2016'); });
  cell(1, () => { ceil('#f2f8ff', '#8fa2b4'); o.fillStyle = '#ffffff'; for (let i = 0; i < 3; i++) o.fillRect(10 + i * 42, 4, 26, 5); desks('#1f262d'); });
  cell(2, () => { ceil('#ffe6bf', '#b18c60'); blinds(.62, 'rgba(70,52,34,.55)'); desks('#2a2016'); });
  cell(3, () => { o.fillStyle = '#3a2a1a'; o.fillRect(0, 0, S, S); const g = o.createRadialGradient(S * .25, S * .72, 2, S * .25, S * .72, S * .8); g.addColorStop(0, '#ffd9a0'); g.addColorStop(.35, '#9a6a3a'); g.addColorStop(1, '#2a1c12'); o.fillStyle = g; o.fillRect(0, 0, S, S); });
  cell(4, () => { ceil('#d9e6f0', '#6d7d8a'); blinds(1, 'rgba(30,38,46,.5)'); });
  cell(5, () => { o.fillStyle = '#4a4033'; o.fillRect(0, 0, S, S); o.fillStyle = '#c9b08a'; o.fillRect(S * .35, 0, S * .3, S); o.fillStyle = '#e9e2cf'; o.fillRect(S * .44, S * .1, S * .12, S * .05); });
  cell(6, () => { ceil('#ffd8a8', '#9c6f45'); for (let x = 0; x < S; x += 9) { o.fillStyle = `rgba(60,38,20,${.25 + r() * .3})`; o.fillRect(x, 0, 4, S); } });
  cell(7, () => { o.fillStyle = '#1a2230'; o.fillRect(0, 0, S, S); const g = o.createRadialGradient(S * .6, S * .6, 2, S * .6, S * .6, S * .7); g.addColorStop(0, '#9fc0ff'); g.addColorStop(1, '#141a24'); o.fillStyle = g; o.fillRect(0, 0, S, S); });
  return canvasTex(c);
})();

function facadeMat(set, color, rough = 1, ns = .9) {
  const m = new THREE.MeshStandardMaterial({ ...set, color, roughness: rough, metalness: 0, vertexColors: true, envMapIntensity: .35 });
  m.normalScale.set(ns, ns);
  m.onBeforeCompile = sh => {
    sh.uniforms.uStain = STAIN.u; sh.uniforms.uStainR = STAIN.r;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; attribute vec3 aGlow; varying vec3 vGlow;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.)).xyz; vGlow = aGlow;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vGlow; uniform sampler2D uStain; uniform vec4 uStainR;')
      .replace('#include <map_fragment>', '#include <map_fragment>\n{ vec2 su = clamp((vWP.xy - uStainR.xy) / uStainR.zw, 0., 1.); vec3 st = texture2D(uStain, su).rgb; diffuseColor.rgb *= st * 2.; }')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vGlow * diffuseColor.rgb;');
  };
  m.customProgramCacheKey = () => 'stain';
  return m;
}
const STAIN = { u: { value: null }, r: { value: new THREE.Vector4(0, 0, 1, 1) } };
const M_PCAST = facadeMat(T_PCAST, 0xe4ded6, 1, 1.1), M_BOARD = facadeMat(T_BOARD, 0xd8d2c9, 1, 1.3), M_BUSH = facadeMat(T_BUSH, 0xd6d0c8, 1, 1.2);
M_PCAST.color.setRGB(1.7, 2.2, 3.0); M_BOARD.color.setRGB(1.04, 1.3, 1.82); M_BUSH.color.setRGB(1.32, 1.66, 2.1);
const M_BACK = new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: .95, envMapIntensity: .1 });
const M_MULL = new THREE.MeshStandardMaterial({ color: 0x3b3833, roughness: .36, metalness: .7, envMapIntensity: 1.2 });
const M_LOUV = new THREE.MeshStandardMaterial({ color: 0x2a2826, roughness: .5, metalness: .6, envMapIntensity: .7, side: THREE.DoubleSide });
const M_GLASS = (() => {
  const m = new THREE.MeshStandardMaterial({ color: 0x07090b, roughness: .08, metalness: 0, envMapIntensity: 1.1 });
  m.onBeforeCompile = sh => {
    sh.uniforms.uAtlas = { value: ATLAS };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aWin; varying vec4 vWin; varying vec2 vUv2;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWin = aWin; vUv2 = uv;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uAtlas; varying vec4 vWin; varying vec2 vUv2;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      { vec3 vd = normalize(vViewPosition); vec2 par = clamp(vd.xy / max(.25, vd.z), -1.5, 1.5) * .09;
        vec2 ruv = clamp(vUv2 - par, .02, .98);
        vec2 cell = vec2(mod(vWin.x, 4.), floor(vWin.x / 4.)); vec2 auv = vec2((cell.x + ruv.x) / 4., 1. - (cell.y + 1. - ruv.y) / 2.);
        vec3 room = texture2D(uAtlas, auv).rgb;
        float head = mix(.5, 1., smoothstep(.99, .8, vUv2.y)) * mix(.7, 1., smoothstep(0., .12, min(vUv2.x, 1. - vUv2.x)));
        totalEmissiveRadiance += room * vWin.y * head;
        if (vWin.y < .01) {
          float k = fract(vWin.z * 7.31 + vWin.x * .17), sl = step(.45, fract(vUv2.y * 46.)), drop = step(1. - vUv2.y, .35 + .6 * fract(vWin.z * 3.7));
          vec3 bl = vec3(.05, .043, .034) * (.6 + .4 * sl) * drop * mix(.5, 1., vUv2.y);
          vec3 cu = vec3(.04, .03, .022) * (.75 + .25 * sin(vUv2.x * 60. + vWin.z * 9.));
          vec3 rf = mix(vec3(.004, .005, .007), vec3(.026, .019, .013), smoothstep(.1, 1., vUv2.y + par.y * 2.)) * (.6 + .8 * fract(vWin.z * 5.3));
          totalEmissiveRadiance += k < .22 ? bl : k < .32 ? cu : rf; } }`);
  };
  m.customProgramCacheKey = () => 'win';
  return m;
})();
const M_DARKMETAL = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: .45, metalness: .6, envMapIntensity: .6 });
const M_POLE = new THREE.MeshStandardMaterial({ color: 0x1d1e1f, roughness: .55, metalness: .5, envMapIntensity: .5 });
const M_GALV = new THREE.MeshStandardMaterial({ color: 0x77736c, roughness: .5, metalness: .55, envMapIntensity: .9 }), M_TYRE = new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: .9 });
const M_CANOPY = new THREE.MeshStandardMaterial({ color: 0x101011, roughness: .38, metalness: .25, envMapIntensity: .8 });
const M_SOFFIT = new THREE.MeshStandardMaterial({ ...T_PANEL, color: 0x5a5753, roughness: .9, envMapIntensity: .3 });
const M_PAVE = new THREE.MeshStandardMaterial({ ...T_PAVE, color: 0x8e8a84, roughness: .62, envMapIntensity: .55 });
const M_CURB = new THREE.MeshStandardMaterial({ ...T_SLAB, color: 0x8a867f, roughness: .8, envMapIntensity: .4 });
const M_ROAD = new THREE.MeshStandardMaterial({ ...T_ASPH, color: 0x55524e, roughness: .42, envMapIntensity: .9 });
M_ROAD.normalScale.set(.6, .6);
const M_PAINT = new THREE.MeshStandardMaterial({ color: 0x8f8b82, roughness: .5, envMapIntensity: .6, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
[M_PCAST, M_BOARD, M_BUSH, M_BACK, M_MULL, M_LOUV, M_CANOPY, M_SOFFIT].forEach(m => m.shadowSide = THREE.DoubleSide);
[M_GLASS, M_DARKMETAL, M_POLE, M_GALV, M_TYRE, M_CANOPY, M_SOFFIT, M_PAVE, M_CURB, M_ROAD, M_PAINT, M_PCAST, M_BOARD, M_BUSH, M_BACK, M_MULL, M_LOUV].forEach(m => SHARED.add(m));
[T_SLAB, T_PANEL, T_PAVE, T_ASPH, T_PCAST, T_BOARD, T_BUSH].forEach(t => Object.values(t).forEach(x => SHARED_TEX.add(x))); SHARED_TEX.add(ATLAS);
const emis = (hex, k) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), toneMapped: true, fog: false });

class GB {
  constructor() { this.p = []; this.n = []; this.uv = []; this.c = []; this.g = []; this.i = []; this.tint = 1; this.glow = null; }
  quad(a, b, c, d, nr, T, ao, glow) {
    if (!nr) { const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]], n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], l = Math.hypot(...n) || 1; nr = [n[0] / l, n[1] / l, n[2] / l]; }
    const ax = Math.abs(nr[0]), ay = Math.abs(nr[1]), az = Math.abs(nr[2]), base = this.p.length / 3; glow = glow || this.glow;
    for (const v of [a, b, c, d]) {
      this.p.push(v[0], v[1], v[2]); this.n.push(nr[0], nr[1], nr[2]);
      const u = az >= ax && az >= ay ? [v[0], v[1]] : ax >= ay ? [v[2], v[1]] : [v[0], v[2]];
      this.uv.push(u[0] / T, u[1] / T); const k = (typeof ao === 'function' ? ao(v, nr) : ao) * this.tint; this.c.push(k, k, k);
      const gl = typeof glow === 'function' ? glow(v, nr) : glow; if (gl) this.g.push(gl[0], gl[1], gl[2]); else this.g.push(0, 0, 0);
    }
    this.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  face(pts, out, T, ao, glow) {
    const [a, b, , d] = pts, u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] < 0) pts = [pts[0], pts[3], pts[2], pts[1]];
    this.quad(pts[0], pts[1], pts[2], pts[3], null, T, ao, glow);
  }
  box(x0, y0, z0, x1, y1, z1, T, ao = 1, faces = 'xXyYzZ') {
    if (faces.includes('Z')) this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], T, ao);
    if (faces.includes('z')) this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], T, ao);
    if (faces.includes('X')) this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], T, ao);
    if (faces.includes('x')) this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], T, ao);
    if (faces.includes('Y')) this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], T, ao);
    if (faces.includes('y')) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], T, ao);
  }
  cbox(x0, y0, z0, x1, y1, z1, c, T, ao = 1, faces = 'xXyYZ', cf = 'xXyY') {
    const fx0 = x0 + (cf.includes('x') ? c : 0), fx1 = x1 - (cf.includes('X') ? c : 0), fy0 = y0 + (cf.includes('y') ? c : 0), fy1 = y1 - (cf.includes('Y') ? c : 0), zc = z1 - c;
    if (faces.includes('Z')) this.quad([fx0, fy0, z1], [fx1, fy0, z1], [fx1, fy1, z1], [fx0, fy1, z1], [0, 0, 1], T, ao);
    const s2 = Math.SQRT1_2;
    if (cf.includes('X')) this.face([[fx1, fy0, z1], [x1, y0, zc], [x1, y1, zc], [fx1, fy1, z1]], [s2, 0, s2], T, ao);
    if (cf.includes('x')) this.face([[fx0, fy0, z1], [x0, y0, zc], [x0, y1, zc], [fx0, fy1, z1]], [-s2, 0, s2], T, ao);
    if (cf.includes('Y')) this.face([[fx0, fy1, z1], [x0, y1, zc], [x1, y1, zc], [fx1, fy1, z1]], [0, s2, s2], T, ao);
    if (cf.includes('y')) this.face([[fx0, fy0, z1], [x0, y0, zc], [x1, y0, zc], [fx1, fy0, z1]], [0, -s2, s2], T, ao);
    const zx = cf.includes('X') ? zc : z1, zxx = cf.includes('x') ? zc : z1, zy = cf.includes('Y') ? zc : z1, zyy = cf.includes('y') ? zc : z1;
    if (faces.includes('X') && zx > z0) this.quad([x1, y0, zx], [x1, y0, z0], [x1, y1, z0], [x1, y1, zx], [1, 0, 0], T, ao);
    if (faces.includes('x') && zxx > z0) this.quad([x0, y0, z0], [x0, y0, zxx], [x0, y1, zxx], [x0, y1, z0], [-1, 0, 0], T, ao);
    if (faces.includes('Y') && zy > z0) this.quad([x0, y1, zy], [x1, y1, zy], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], T, ao);
    if (faces.includes('y') && zyy > z0) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, zyy], [x0, y0, zyy], [0, -1, 0], T, ao);
  }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aGlow', new THREE.Float32BufferAttribute(this.g, 3)); g.setIndex(this.i);
    return g;
  }
}
const boxMesh = (x0, y0, z0, x1, y1, z1, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); return m; };

const G = {};
let grpH = new THREE.Group(), grpB = new THREE.Group(); sceneH.add(grpH); sceneB.add(grpB);
const L = {};
const live = [];

function disposeGroup(g) {
  g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (SHARED.has(m)) return; for (const k of ['map', 'alphaMap']) if (m[k] && !SHARED_TEX.has(m[k])) m[k].dispose(); m.dispose(); }); });
  g.parent && g.parent.remove(g);
}

function initLights() {
  const add = (mk, both = true) => { const a = mk(); sceneH.add(a); if (a.target) sceneH.add(a.target); let b = null; if (both) { b = mk(); sceneB.add(b); if (b.target) sceneB.add(b.target); } return [a, b]; };
  L.hemi = add(() => new THREE.HemisphereLight(0x8a9ab4, 0x3a3027, 1.7));
  L.moon = add(() => new THREE.DirectionalLight(0xa9bcdc, 1.4)); L.moon[0].color.set(0xcbc8c2);
  L.city = add(() => new THREE.DirectionalLight(0xffb98c, 0), false)[0];
  L.top = add(() => new THREE.RectAreaLight(0xffe2b8, 0, 10, 10), false)[0];
  L.sign = add(() => new THREE.RectAreaLight(0xf0e6d6, 0, 10, 10));
  L.lobbyIn = add(() => new THREE.RectAreaLight(0xffd9aa, 0, 10, 10), false)[0];
  L.spill = add(() => new THREE.RectAreaLight(0xffd2a0, 0, 10, 10));
  L.lamp = add(() => { const s = new THREE.SpotLight(0xffa955, 0, 0, .95, .75, 2); return s; });
  L.up = add(() => new THREE.PointLight(0xffb070, 0, 0, 2));
  L.cab = add(() => new THREE.PointLight(0xff3a20, 0, 0, 2), false)[0]; sceneH.remove(L.cab); sceneB.add(L.cab);
  { const mh = L.moon[0]; mh.castShadow = true; mh.shadow.mapSize.set(2048, 2048); mh.shadow.bias = -.0004; mh.shadow.normalBias = 2.4; mh.shadow.radius = 2.5; }
  const sb = L.lamp[1]; sb.castShadow = true; sb.shadow.mapSize.set(1024, 1024); sb.shadow.bias = -.0004; sb.shadow.radius = 4;
}
initLights();

function bakeStain(fw, yTopCss, groundCss, floors, groups, colX, colW) {
  const H = groundCss - yTopCss, sc = Math.min(.5, 4096 / H), cw = Math.max(64, Math.round(fw * sc)), ch = Math.round(H * sc), M = G.M;
  const c = mkC(cw, ch), o = c.getContext('2d'), r = mulberry(1977), X = x => x * sc, Yc = y => (y - yTopCss) * sc;
  o.fillStyle = '#808080'; o.fillRect(0, 0, cw, ch);
  for (const f of floors) { o.fillStyle = `rgba(${r() < .5 ? '0,0,0' : '255,255,255'},${(r() * .07).toFixed(3)})`; o.fillRect(0, Yc(f.y0), cw, (f.y1 - f.y0) * sc); }
  for (let i = 0; i < 260; i++) { const x = r() * cw, y = r() * ch, rr = (20 + r() * 140) * sc * 2, g = o.createRadialGradient(x, y, 0, x, y, rr), dk = r() < .7;
    g.addColorStop(0, dk ? `rgba(20,16,12,${.05 + r() * .08})` : `rgba(255,250,240,${.04 + r() * .05})`); g.addColorStop(1, 'rgba(0,0,0,0)'); o.fillStyle = g; o.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  const run = (x, y0, len, w, a) => { const g = o.createLinearGradient(0, y0, 0, y0 + len); g.addColorStop(0, `rgba(18,14,10,${a.toFixed(3)})`); g.addColorStop(.5, `rgba(18,14,10,${(a * .45).toFixed(3)})`); g.addColorStop(1, 'rgba(18,14,10,0)'); o.fillStyle = g; o.fillRect(x - w / 2, y0, w, len); };
  const px = m => Math.max(1, m * M * sc);
  for (const f of floors) {
    for (const [x0, x1] of groups) {
      const n = Math.round((x1 - x0) / (.3 * M));
      for (let k = 0; k < n; k++) { const u = r(), edge = Math.min(u, 1 - u) < .07; if (!edge && r() < .5) continue;
        run(X(lerp(x0, x1, u)), Yc(f.ledge), px((edge ? 1.2 + r() * 2.2 : .3 + r() * 1.1)), px(.03 + r() * .1), (edge ? .3 : .12) + r() * .22); }
    }
    for (const [ox0, ox1, sy] of f.sills) {
      for (const x of [ox0 + .06 * M, ox1 - .06 * M]) if (r() < .85) run(X(x + (r() - .5) * .1 * M), Yc(sy), px(.5 + r() * 2.4), px(.05 + r() * .12), .22 + r() * .35);
      run(X((ox0 + ox1) / 2), Yc(sy), px(.4 + r() * .6), X(ox1 - ox0) * .85, .06 + r() * .08);
    }
  }
  for (const x of colX) for (let i = 0; i < 26; i++) run(X(x + (r() - .5) * colW * .9), r() * ch, px(1 + r() * 9), px(.03 + r() * .08), .12 + r() * .2);
  for (let i = 0; i < 40; i++) { const x = r() * cw, y = r() * ch * .6, len = ch * (.05 + r() * .2), g = o.createLinearGradient(0, y, 0, y + len); g.addColorStop(0, 'rgba(15,12,9,.28)'); g.addColorStop(1, 'rgba(15,12,9,0)'); o.fillStyle = g; o.fillRect(x, y, 1 + r() * 3, len); }
  const sb = o.createLinearGradient(0, ch - 18 * M * sc, 0, ch); sb.addColorStop(0, 'rgba(10,8,6,0)'); sb.addColorStop(1, 'rgba(10,8,6,.4)'); o.fillStyle = sb; o.fillRect(0, ch - 18 * M * sc, cw, 18 * M * sc);
  const t = canvasTex(c, false); t.anisotropy = 1; t.minFilter = THREE.LinearMipmapLinearFilter; return t;
}
function signTex(lines, w, h, opt = {}) {
  const c = mkC(w, h), o = c.getContext('2d');
  o.fillStyle = opt.bg || '#e9e6dc'; o.fillRect(0, 0, w, h); o.strokeStyle = opt.fg || '#141414'; o.lineWidth = w * .04; o.strokeRect(w * .05, w * .05, w - w * .1, h - w * .1);
  o.fillStyle = opt.fg || '#141414'; o.textAlign = 'center'; o.textBaseline = 'middle'; let fs = opt.fs || h / (lines.length + 1.2);
  const font = () => o.font = `800 ${fs}px Archivo, "Arial Narrow", Arial, sans-serif`; font();
  const mw = Math.max(...lines.map(t => o.measureText(t).width)), k = Math.min(1, w * .8 / mw), sx = Math.max(.7, k); if (sx > k) { fs *= k / sx; font(); }
  o.save(); o.translate(w / 2, 0); o.scale(sx, 1); lines.forEach((s, i) => o.fillText(s, 0, h / 2 + (i - (lines.length - 1) / 2) * fs * 1.05)); o.restore();
  const r = mulberry(w + h); for (let i = 0; i < 300; i++) { o.fillStyle = `rgba(60,50,40,${r() * .15})`; o.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); }
  return canvasTex(c);
}
function personTex(seed, smear) {
  const w = 128, h = 192, c = mkC(w, h), o = c.getContext('2d'), r = mulberry(seed);
  const coats = ['#1b1c20', '#2a2420', '#3b3026', '#14161b', '#4a3a28', '#262a2e'], col = coats[seed % coats.length];
  const draw = (dx, a) => {
    o.globalAlpha = a; o.fillStyle = col; const cx = 64 + dx, sh = 15 + r() * 4, hem = 17 + r() * 6, legs = r() < .5;
    o.beginPath(); o.ellipse(cx, 24, 9, 11, 0, 0, 6.283); o.fill();
    if (r() < .35) { o.fillRect(cx - 11, 12, 22, 5); o.fillRect(cx - 7, 4, 14, 10); }
    o.beginPath(); o.moveTo(cx - sh, 42); o.lineTo(cx + sh, 42); o.lineTo(cx + hem, 120 + r() * 14); o.lineTo(cx - hem, 120 + r() * 14); o.closePath(); o.fill();
    o.fillRect(cx - sh - 3, 44, 6, 58); o.fillRect(cx + sh - 3, 44, 6, 58);
    o.fillStyle = '#0c0c0e'; if (legs) { o.fillRect(cx - 10, 118, 8, 68); o.fillRect(cx + 3, 118, 8, 68); } else { o.save(); o.translate(cx, 120); o.rotate(.18); o.fillRect(-9, 0, 8, 68); o.restore(); o.save(); o.translate(cx, 120); o.rotate(-.2); o.fillRect(2, 0, 8, 68); o.restore(); }
    if (r() < .4) { o.fillStyle = '#22180f'; o.fillRect(cx + sh - 2, 92, 14, 18); }
  };
  o.filter = 'blur(1.2px)';
  if (smear > 0) for (let k = 0; k < 7; k++) draw((k - 3) * smear, .22); else draw(0, 1);
  o.filter = 'none';
  return canvasTex(c);
}
function softRectTex() { const c = mkC(128, 128), o = c.getContext('2d'); o.filter = 'blur(14px)'; o.fillStyle = '#fff'; o.fillRect(26, 26, 76, 76); return canvasTex(c, false); }
function streakTex() {
  const c = mkC(32, 256), o = c.getContext('2d'), g = o.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.06, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  o.fillStyle = g; o.fillRect(0, 0, 32, 256); o.globalCompositeOperation = 'destination-in';
  const h = o.createLinearGradient(0, 0, 32, 0); h.addColorStop(0, 'rgba(0,0,0,0)'); h.addColorStop(.5, 'rgba(0,0,0,1)'); h.addColorStop(1, 'rgba(0,0,0,0)'); o.fillStyle = h; o.fillRect(0, 0, 32, 256);
  return canvasTex(c, false);
}
const TEX_SOFT = softRectTex(), TEX_STREAK = streakTex(); SHARED_TEX.add(TEX_SOFT); SHARED_TEX.add(TEX_STREAK);

const NSTOP = 24;
const StreakShader = {
  vertex: `
  attribute vec3 aNext; attribute float aSide; attribute float aS; attribute vec4 aR; attribute float aF;
  uniform float uTime, uM, uCycle, uPxK, uWid, uSw, uMin; uniform float uStop[${NSTOP}]; uniform float uQ[${NSTOP}]; uniform float uPh[${NSTOP}];
  varying float vX; varying float vS; varying vec4 vR; varying float vB; varying float vDepth; varying float vThin; varying float vF;
  float bunch(float s) { float b = 0.;
    for (int i = 0; i < ${NSTOP}; i++) { float d = (uStop[i] - s) / uM; if (d < -8. || d > 140.) continue;
      float ph = fract((uTime + uPh[i]) / uCycle), grow = ph < .55 ? max(0., 1. - ph / .2) : (ph - .55) / .45;
      float q = uQ[i] * (.35 + .65 * grow);
      b += smoothstep(-6., 1., d) * (1. - smoothstep(q * .55, q, d)) * (.6 + .4 * grow) + .7 * exp(-d * d / 30.) * step(-4., d); }
    return min(b, 2.2); }
  void main() {
    vec4 a = modelViewMatrix * vec4(position, 1.), b = modelViewMatrix * vec4(aNext, 1.);
    vec3 d = normalize(b.xyz - a.xyz); vec3 side = normalize(cross(d, normalize(a.xyz)));
    float B = bunch(aS); vB = B;
    float w = aR.z * uM * (1. + uSw * B);
    float px = w * uPxK / max(1., -a.z);
    vThin = clamp(px / uMin, .08, 1.); w *= 1. / vThin;
    a.xyz += side * aSide * w * uWid;
    vX = aSide * uWid; vS = aS; vR = aR; vDepth = -a.z; vF = aF;
    gl_Position = projectionMatrix * a; }`,
  fragment: `
  uniform float uTime, uM, uFogD, uGain, uGlow, uBB, uGap, uFar; varying float vX; varying float vS; varying vec4 vR; varying float vB; varying float vDepth; varying float vThin; varying float vF;
  float hs(float n) { return fract(sin(n) * 43758.5453); }
  float vn(float x) { float i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(hs(i), hs(i + 1.), f); }
  void main() {
    float sm = vS / uM, sd = vR.x * 17.31;
    float flow = smoothstep(.18, .5, vn(sm * .021 + sd - uTime * .06)) * (.45 + .9 * vn(sm * .13 + sd * 3.1)) * (.75 + .5 * vn(sm * .6 + sd));
    flow *= mix(1., smoothstep(.2, .34, vn(sm * .17 + sd * 7.)), uGap);
    float I = (flow + vB * uBB) * (.75 + .25 * vn(sm * 2.3 + sd * 5.)) * vF * mix(1., uFar, smoothstep(150., 1400., vDepth / uM));
    float core = exp(-vX * vX * 3.2), glow = exp(-vX * vX * .9) * uGlow;
    vec3 red = mix(vec3(1., .07, .025), vec3(1., .32, .14), core * (.4 + .3 * min(vB, 1.)));
    vec3 white = vec3(1., .84, .62) * .55;
    vec3 col = (vR.y > .5 ? white : red) * I * (core + glow) * uGain * vR.w * vThin;
    float f = exp(-pow(vDepth * uFogD, 2.));
    gl_FragColor = vec4(col * f, 1.); }`,
};
function streakMaterial(stops) {
  const u = { uTime: { value: 0 }, uM: { value: 1 }, uCycle: { value: 16 }, uPxK: { value: 1 }, uFogD: { value: 0 }, uGain: { value: 2.4 },
    uWid: { value: 1.5 }, uSw: { value: 1.4 }, uMin: { value: 1.6 }, uGlow: { value: .35 }, uBB: { value: 1.6 }, uGap: { value: 0 }, uFar: { value: 1 },
    uStop: { value: new Float32Array(NSTOP).fill(-1e9) }, uQ: { value: new Float32Array(NSTOP) }, uPh: { value: new Float32Array(NSTOP) } };
  stops.slice(0, NSTOP).forEach((s, i) => { u.uStop.value[i] = s.s; u.uQ.value[i] = s.q; u.uPh.value[i] = s.ph; });
  return new THREE.ShaderMaterial({ uniforms: u, vertexShader: StreakShader.vertex, fragmentShader: StreakShader.fragment, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
}
function ribbonGeo(list) {
  const P = [], N = [], SD = [], S = [], RR = [], F = [], I = [];
  for (const rb of list) {
    const pts = rb.pts, n = pts.length;
    for (let k = 0; k < n; k++) {
      const p = pts[k], q = pts[Math.min(n - 1, k + 1)], qq = k === n - 1 ? [2 * p[0] - pts[k - 1][0], 2 * p[1] - pts[k - 1][1], 2 * p[2] - pts[k - 1][2]] : q;
      for (const sd of [-1, 1]) { P.push(p[0], p[1], p[2]); N.push(qq[0], qq[1], qq[2]); SD.push(sd); S.push(p[3]); F.push(p[4] ?? 1); RR.push(rb.seed, rb.white ? 1 : 0, rb.w, rb.gain); }
      if (k < n - 1) { const b = (P.length / 3) - 2; I.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aNext', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('aSide', new THREE.Float32BufferAttribute(SD, 1)); g.setAttribute('aS', new THREE.Float32BufferAttribute(S, 1)); g.setAttribute('aR', new THREE.Float32BufferAttribute(RR, 4)); g.setAttribute('aF', new THREE.Float32BufferAttribute(F, 1));
  g.setIndex(I); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9);
  return g;
}

const BldShader = {
  vertex: `attribute vec4 aB; attribute vec4 aC; varying vec3 vWP; varying vec3 vN; varying vec4 vB; varying vec4 vC; varying float vDepth;
  void main() { vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.); vWP = wp.xyz; vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
    vB = aB; vC = aC; vec4 mv = viewMatrix * wp; vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
  fragment: `uniform sampler2D uTex; uniform float uM, uGround, uFogD; uniform vec3 uFogC;
  varying vec3 vWP; varying vec3 vN; varying vec4 vB; varying vec4 vC; varying float vDepth;
  float h1(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
  void main() {
    vec3 n = normalize(vN); float hm = (vWP.y - uGround) / uM; bool top = n.y > .5;
    float u = abs(n.x) > .5 ? vWP.z / uM : vWP.x / uM, face = abs(n.x) > .5 ? sign(n.x) : 2. + sign(n.z);
    vec3 tx = texture2D(uTex, top ? vWP.xz / uM / 3. : vec2(u, hm) / 2.6).rgb;
    vec3 base = vC.rgb * (.45 + .9 * tx);
    vec3 col;
    if (top) col = base * .035;
    else if (vC.a > 3.5) {
      vec3 up = vec3(1., .62, .34) * .5 * exp(-hm / 14.);
      col = base * (.05 + .025 * max(n.y, 0.) + up) * (vC.a > 5.5 ? .8 : 1.);
      if (vC.a > 4.5 && vC.a < 5.5) col = base * vec3(1., .74, .48) * (.12 + 1.1 * exp(-max(0., hm - vB.y) / 3.5)) * (.55 + .45 * smoothstep(.2, .45, abs(fract(u / 1.6) - .5) * 2.));
    }
    else {
      float fh = vB.y, bw = vB.z, st = vC.a, fl = floor(hm / fh), fv = fract(hm / fh), by = floor(u / bw), fu = fract(u / bw);
      vec4 wr = st < .5 ? vec4(.1, .9, .36, .94) : st < 1.5 ? vec4(-.1, 1.1, .46, .86) : st < 2.5 ? vec4(.32, .68, .36, .8) : vec4(.2, .8, .22, .8);
      float inW = step(wr.x, fu) * step(fu, wr.y) * step(wr.z, fv) * step(fv, wr.w);
      inW *= smoothstep(.06, .4, abs(dot(n, normalize(cameraPosition - vWP))));
      vec3 up = vec3(1., .62, .34) * .5 * exp(-hm / 14.);
      float strk = mix(1., .8 + .2 * h1(vec3(floor(u * 2.5), vB.x, face)), smoothstep(.0, .3, fv));
      vec3 conc = base * (.05 + .025 * max(n.y, 0.) + up) * strk;
      vec3 cid = vec3(fl, by + face * 997., vB.x), r = vec3(h1(cid), h1(cid + 3.1), h1(cid + 7.3));
      float lit = step(r.x, vB.w * (.6 + .8 * h1(vec3(fl, vB.x, 1.))));
      vec3 lc = mix(vec3(1., .7, .4), vec3(.72, .84, 1.), step(.72, r.y)) * (.5 + 1.7 * r.z);
      float head = smoothstep(wr.w, wr.w - .14, fv);
      vec3 glass = vec3(.006, .007, .01) + vec3(.02, .014, .01) * (1. - fv) + up * .05;
      vec3 wcol = lit > .5 ? lc * (.3 + .7 * head) : glass;
      col = mix(conc, wcol, inW * step(5., hm));
      if (hm < 5.) {
        float sf = step(.12, fu) * step(fu, .94) * step(.3, hm) * step(hm, 4.1), on = step(h1(vec3(by, face, vB.x) + 11.), .55);
        vec3 sfc = vec3(1., .72, .44) * (.6 + 1.3 * h1(vec3(by, face, vB.x) + 5.)) * on + vec3(.008) * (1. - on);
        col = mix(conc * 1.6, sfc, sf);
      }
    }
    float f = 1. - exp(-pow(vDepth * uFogD, 2.));
    gl_FragColor = vec4(mix(col, uFogC, f), 1.); }`,
};
const M_BLD = new THREE.ShaderMaterial({ uniforms: { uTex: { value: T_PANEL.map }, uM: { value: 1 }, uGround: { value: 0 }, uFogD: { value: 0 }, uFogC: { value: FOG.clone() } },
  vertexShader: BldShader.vertex, fragmentShader: BldShader.fragment }); SHARED.add(M_BLD);

const M_SKY = new THREE.ShaderMaterial({ uniforms: {}, depthWrite: false, side: THREE.BackSide, fog: false,
  vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: `varying vec3 vD; float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
  void main(){ vec3 d = normalize(vD); float e = d.y; vec3 zen = vec3(.004, .005, .008), hor = vec3(.06, .04, .028);
    vec3 c = mix(hor, zen, smoothstep(-.02, .32, e));
    float cl = n2(d.xz / max(.08, e + .1) * 1.6 + 3.) * n2(d.xz / max(.08, e + .1) * 4.2);
    c += vec3(.05, .03, .018) * cl * smoothstep(.45, .02, e) * smoothstep(-.02, .05, e);
    c += vec3(.09, .055, .03) * exp(-abs(e) * 18.);
    gl_FragColor = vec4(c, 1.); }` }); SHARED.add(M_SKY);

function rebuild() {
  disposeGroup(grpH); disposeGroup(grpB); live.length = 0;
  grpH = new THREE.Group(); grpB = new THREE.Group(); sceneH.add(grpH); sceneB.add(grpB);
  const W = BB.W, VH = BB.VH, phone = W < 700, fw = phone ? W : BB.facadeW, B = BB.BASE;
  const M = phone ? W / 15 : fw / 26;
  const fov = phone ? 50 : 40, D = VH / (2 * Math.tan(fov * Math.PI / 360));
  const Y = css => -css, gY = Y(B.groundY);
  Object.assign(G, { W, VH, phone, fw, M, D, gY, F0: B.F0, eyeH: (phone ? 2.4 : 1.75) * M, heroX: fw * (phone ? .5 : .52), bgX: phone ? W * .5 : fw + (W - fw) * .3 });
  const fogD = .00069 / M; sceneH.fog.density = fogD * .5; sceneB.fog.density = fogD; G.fogD = fogD;
  const own = (o, g = grpH) => { g.add(o); return o; };
  const add = (o, g = grpH) => { g.add(o); return o; };

  const pierW = 1.5 * M, colW = .95 * M, rev = 1.05 * M, fh = 3.7 * M, zf = -.4 * M, dRev = .75 * M, jt = Math.max(1.4, .05 * M), chf = .07 * M;
  const yTopCss = -VH * 1.3, baseTopCss = B.F0 + VH * (phone ? .035 : .04), beamH = 1.3 * M;
  const inner = fw - 2 * pierW, nb = Math.max(2, 2 * Math.round(inner / (6 * M))), bw = inner / nb;
  const gP = new GB(), gC = new GB(), gL = new GB(), gM = new GB(), gV = new GB(), gK = new GB();
  const zb = zf - dRev, s2 = Math.SQRT1_2, T2 = 2 * M;
  const aoR = v => lerp(.4, 1, Math.min(1, Math.max(0, (v[2] - zb) / dRev)));
  const aoCol = (v, nr) => nr[2] > .9 ? 1 : lerp(.5, 1, Math.min(1, Math.max(0, (v[2] - zf) / -zf)));
  const floors = [], wins = [], rr = mulberry(4111);
  const yBeamTop = Y(baseTopCss - beamH), yRoof = Y(yTopCss);
  gC.cbox(0, Y(baseTopCss), -rev - .4 * M, fw, yBeamTop, 0, chf * 1.4, 2.1 * M, 1, 'yYZ', 'yY');
  const colX = []; for (let b = 2; b < nb; b += 2) colX.push(pierW + b * bw);
  for (const x of colX) gC.cbox(x - colW / 2, yBeamTop, zf - .3 * M, x + colW / 2, yRoof, 0, chf * 1.3, 2.2 * M, aoCol, 'xXZ', 'xX');
  gC.cbox(0, gY, -2 * M, pierW, yRoof, 0, chf * 1.3, 2.2 * M, aoCol, 'XZ', 'xX');
  gC.cbox(fw - pierW, gY, -2 * M, fw, yRoof, 0, chf * 1.3, 2.2 * M, aoCol, 'xZ', 'xX');
  gK.box(pierW, yBeamTop, zb - .3 * M, fw - pierW, yRoof, zb - .3 * M + 1, M, 1, 'Z');
  const lines = [pierW, ...colX, fw - pierW], groups = [];
  for (let k = 0; k < lines.length - 1; k++) groups.push([lines[k] + (k ? colW / 2 : 0), lines[k + 1] - (k < lines.length - 2 ? colW / 2 : 0)]);
  const unitEdge = (b, sd) => pierW + b * bw + sd * (b === 0 || b === nb ? jt : b % 2 === 0 ? colW / 2 + jt : jt / 2);
  const GLOW = [[1, .8, .58], [.78, .88, 1], [1, .78, .52], [1, .66, .36], [.7, .8, .92], [.92, .74, .5], [1, .72, .46], [.5, .62, 1]];
  const unit = (xa, xb, ya, yb, glow, louvre) => {
    gP.tint = .84 + rr() * .24;
    const c = chf, z = zf, zc = zf - c, zs = zf - .3 * M;
    const ox0 = xa + .24 * M, ox1 = xb - .24 * M, oy0 = ya + .95 * M, oy1 = yb - .34 * M, ix0 = ox0 + .2 * M, ix1 = ox1 - .2 * M, iy0 = oy0 + .14 * M, iy1 = oy1 - .24 * M;
    const fx0 = xa + c, fx1 = xb - c, fy0 = ya + c, fy1 = yb - c, F = [0, 0, 1];
    gP.face([[fx0, fy0, z], [fx1, fy0, z], [fx1, oy0, z], [fx0, oy0, z]], F, T2, 1);
    gP.face([[fx0, oy1, z], [fx1, oy1, z], [fx1, fy1, z], [fx0, fy1, z]], F, T2, 1);
    gP.face([[fx0, oy0, z], [ox0, oy0, z], [ox0, oy1, z], [fx0, oy1, z]], F, T2, 1);
    gP.face([[ox1, oy0, z], [fx1, oy0, z], [fx1, oy1, z], [ox1, oy1, z]], F, T2, 1);
    gP.face([[fx0, fy0, z], [xa, ya, zc], [xa, yb, zc], [fx0, fy1, z]], [-s2, 0, s2], T2, .9);
    gP.face([[fx1, fy0, z], [xb, ya, zc], [xb, yb, zc], [fx1, fy1, z]], [s2, 0, s2], T2, .9);
    gP.face([[fx0, fy1, z], [xa, yb, zc], [xb, yb, zc], [fx1, fy1, z]], [0, s2, s2], T2, .95);
    gP.face([[fx0, fy0, z], [xa, ya, zc], [xb, ya, zc], [fx1, fy0, z]], [0, -s2, s2], T2, .8);
    gP.face([[xa, ya, zs], [xa, ya, zc], [xa, yb, zc], [xa, yb, zs]], [-1, 0, 0], T2, .4);
    gP.face([[xb, ya, zs], [xb, ya, zc], [xb, yb, zc], [xb, yb, zs]], [1, 0, 0], T2, .4);
    gP.face([[xa, yb, zs], [xa, yb, zc], [xb, yb, zc], [xb, yb, zs]], [0, 1, 0], T2, .45);
    const gf = k => glow ? v => { const t = Math.min(1, Math.max(0, (z - v[2]) / dRev)), w = k * (.12 + .88 * t * t); return [glow[0] * w, glow[1] * w, glow[2] * w]; } : null;
    gP.face([[ox0, oy0, z], [ox0, oy1, z], [ix0, iy1, zb], [ix0, iy0, zb]], [1, 0, 0], T2, aoR, gf(.6));
    gP.face([[ox1, oy0, z], [ox1, oy1, z], [ix1, iy1, zb], [ix1, iy0, zb]], [-1, 0, 0], T2, aoR, gf(.6));
    gP.face([[ox0, oy1, z], [ox1, oy1, z], [ix1, iy1, zb], [ix0, iy1, zb]], [0, -1, 0], T2, aoR, gf(.28));
    gP.face([[ox0, oy0, z], [ox1, oy0, z], [ix1, iy0, zb], [ix0, iy0, zb]], [0, 1, 0], T2, aoR, gf(1));
    gP.tint = 1;
    if (louvre) {
      const n = Math.max(4, Math.round((iy1 - iy0) / (.2 * M))), st = (iy1 - iy0) / n;
      for (let k = 0; k < n; k++) { const y = iy0 + (k + 1) * st; gV.face([[ix0, y, zb], [ix1, y, zb], [ix1, y - st * 1.05, zb + .13 * M], [ix0, y - st * 1.05, zb + .13 * M]], [0, .6, .8], M, 1); }
      gK.box(ix0, iy0, zb - .25 * M, ix1, iy1, zb - .25 * M + 1, M, 1, 'Z');
    } else {
      const mw = .065 * M, md = .1 * M, xm = (ix0 + ix1) / 2, yt = lerp(iy0, iy1, .78);
      gM.box(ix0, iy0, zb - 1, ix0 + mw, iy1, zb + md, M, 1, 'XZ'); gM.box(ix1 - mw, iy0, zb - 1, ix1, iy1, zb + md, M, 1, 'xZ');
      gM.box(ix0, iy1 - mw, zb - 1, ix1, iy1, zb + md, M, 1, 'yZ'); gM.box(ix0, iy0, zb - 1, ix1, iy0 + mw, zb + md, M, 1, 'YZ');
      gM.box(xm - mw / 2, iy0, zb - 1, xm + mw / 2, iy1, zb + md, M, 1, 'xXZ'); gM.box(ix0, yt - mw / 2, zb - 1, ix1, yt + mw / 2, zb + md, M, 1, 'yYZ');
    }
    return { ox0, ox1, oy0, ix0, ix1, iy0, iy1 };
  };
  let fy = baseTopCss - beamH, fl = 0;
  while (fy - fh > yTopCss + 2.6 * M) {
    const mech = fl % 11 === 6, ya = Y(fy) + jt / 2, yb = Y(fy - fh) - jt / 2;
    const fLit = rr() < .25 ? .55 : rr() < .5 ? .05 : .2, f = { y0: fy - fh, y1: fy, ledge: fy + .06 * M, sills: [], mech }, belowLit = [];
    for (let b = 0; b < nb; b++) {
      const lit = !mech && rr() < fLit, kind = lit ? (rr() < .45 ? 0 : rr() < .5 ? 2 : [1, 3, 4, 5, 6, 7][Math.floor(rr() * 6)]) : 0, I = lit ? .8 + rr() * 1.8 : 0;
      const gw = lit ? GLOW[kind].map(c => c * I * 1.1) : null; belowLit[b] = gw;
      const o = unit(unitEdge(b, 1), unitEdge(b + 1, -1), ya, yb, gw, mech);
      f.sills.push([o.ox0, o.ox1, -o.oy0]);
      if (!mech) wins.push({ x: (o.ix0 + o.ix1) / 2, y: (o.iy0 + o.iy1) / 2, w: o.ix1 - o.ix0, h: o.iy1 - o.iy0, kind, I, dark: .3 + rr() * .7 });
    }
    for (let b = 0; b < nb; b++) {
      const l0 = pierW + b * bw + (b > 0 && b % 2 === 0 ? colW / 2 : 0), l1 = pierW + (b + 1) * bw - (b + 1 < nb && (b + 1) % 2 === 0 ? colW / 2 : 0), w = belowLit[b];
      gL.tint = .9 + rr() * .12; gL.glow = w ? (v, nr) => nr[1] > .3 ? w.map(c => c * .25) : null : null;
      gL.cbox(l0, ya - .06 * M, zf - .05 * M, l1, ya + .22 * M, zf + .2 * M, .05 * M, 1.8 * M, 1, 'yYZ', 'yY'); gL.glow = null;
    }
    floors.push(f); fy -= fh; fl++;
  }
  {
    const yC = Y(fy); gL.tint = 1;
    gC.cbox(-.15 * M, yC, -1.4 * M, fw + .15 * M, yRoof - .35 * M, .3 * M, chf * 1.6, 2.2 * M, 1, 'xXyZ', 'xXyY');
    gL.cbox(-.3 * M, yRoof - .35 * M, -1.6 * M, fw + .3 * M, yRoof, .45 * M, .05 * M, 1.8 * M, 1, 'xXyYZ', 'yY');
    gC.cbox(fw * .1, yRoof - .3 * M, -17 * M, fw * .5, yRoof + 4.4 * M, -5 * M, chf, 2.2 * M, 1, 'xXYZ', 'xXY');
    gC.cbox(fw * .58, yRoof - .3 * M, -14 * M, fw * .9, yRoof + 3 * M, -4.5 * M, chf, 2.2 * M, 1, 'xXYZ', 'xXY');
    for (let k = 0; k < 10; k++) { const y = yRoof + .6 * M + k * .22 * M; gV.face([[fw * .62, y, -4.5 * M + 2], [fw * .86, y, -4.5 * M + 2], [fw * .86, y - .2 * M, -4.3 * M], [fw * .62, y - .2 * M, -4.3 * M]], [0, .6, .8], M, 1); }
    gK.box(fw * .2, yRoof + 4.4 * M, -12 * M, fw * .2 + 3.2 * M, yRoof + 9 * M, -9 * M, M, 1, 'xXZ');
  }
  const bandZ = -.6 * M;
  { const yb0 = Y(B.canopyTop), yb1 = Y(baseTopCss), n = Math.max(1, Math.round((yb1 - yb0) / (1.6 * M))), ph = (yb1 - yb0) / n;
    gK.box(pierW, yb0, bandZ - .3 * M, fw - pierW, yb1, bandZ - .3 * M + 1, M, 1, 'Z');
    for (let k = 0; k < n; k++) for (let b = 0; b < nb; b++) { gP.tint = .86 + rr() * .2; gP.cbox(pierW + b * bw + jt / 2, yb0 + k * ph + jt / 2, bandZ - .3 * M, pierW + (b + 1) * bw - jt / 2, yb0 + (k + 1) * ph - jt / 2, bandZ, chf, T2, 1, 'xXyYZ', 'xXyY'); }
    gP.tint = 1; }
  const mk = (g, mat) => { const m = new THREE.Mesh(g.geo(), mat); m.castShadow = m.receiveShadow = true; return add(m); };
  mk(gP, M_PCAST); mk(gC, M_BOARD); mk(gL, M_BUSH); mk(gM, M_MULL); mk(gV, M_LOUV); mk(gK, M_BACK);
  if (STAIN.u.value) STAIN.u.value.dispose();
  STAIN.u.value = bakeStain(fw, yTopCss, B.groundY, floors, groups, colX, colW); STAIN.r.value.set(0, gY, fw, Y(yTopCss) - gY);
  {
    const geo = new THREE.PlaneGeometry(1, 1), im = new THREE.InstancedMesh(geo, M_GLASS, wins.length), a = new Float32Array(wins.length * 4), m4 = new THREE.Matrix4();
    wins.forEach((w, i) => { m4.makeScale(w.w, w.h, 1).setPosition(w.x, w.y, zb - .5); im.setMatrixAt(i, m4); a.set([w.kind, w.I, w.dark, 0], i * 4); });
    geo.setAttribute('aWin', new THREE.InstancedBufferAttribute(a, 4)); im.frustumCulled = false; im.receiveShadow = true; add(im);
  }
  const shadowMat = o => new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: TEX_SOFT, transparent: true, opacity: o, depthWrite: false, depthTest: false });
  for (const b of BB.boards) {
    const pad = 26, m = new THREE.Mesh(new THREE.PlaneGeometry(b.w + pad * 2.4, b.h + pad * 2.4), shadowMat(.8));
    m.position.set(b.x + b.w / 2 + 4, Y(b.y + b.h / 2 + 14), 1); m.renderOrder = 3; own(m);
  }
  { const t = BB.TOP, m = new THREE.Mesh(new THREE.PlaneGeometry(t.w + 90, t.h + 90), shadowMat(.85));
    m.position.set(t.x + t.w / 2 + 4, Y(t.y + t.h / 2 + 18), 1); m.renderOrder = 3; own(m); }
  {
    const t = BB.TOP, tx = new THREE.CanvasTexture(BB.TOP.cv); tx.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(t.w, t.h), new THREE.MeshBasicMaterial({ map: tx, color: new THREE.Color(1, 1, 1).multiplyScalar(3.2) }));
    m.position.set(t.x + t.w / 2, Y(t.y + t.h / 2), 1); own(m); G.topTex = tx; G.topKey = '';
    L.top.width = t.w * 1.15; L.top.height = t.h * 1.25; L.top.position.set(t.x + t.w / 2, Y(t.y + t.h / 2), 1.6 * M); L.top.lookAt(t.x + t.w / 2, Y(t.y + t.h / 2), -10);
  }

  const K = BB.TK && BB.TK.rect ? BB.TK.rect : { x: fw * .3, y: B.F0 + VH * .1, w: fw * .4, h: VH * .1 };
  {
    const m = .3 * M; add(own(boxMesh(K.x - m, Y(K.y + K.h + m), bandZ, K.x + K.w + m, Y(K.y - m), -.5, M_DARKMETAL)));
    for (const sx of [.2, .8]) add(own(boxMesh(K.x + K.w * sx - .12 * M, Y(K.y + K.h + m + .9 * M), bandZ, K.x + K.w * sx + .12 * M, Y(K.y + K.h + m), -.2 * M, M_POLE)));
    const tx = new THREE.CanvasTexture(BB.TK.cv); tx.colorSpace = THREE.SRGBColorSpace; G.tkTex = tx; G.tkCol = null;
    const e = new THREE.Mesh(new THREE.PlaneGeometry(K.w, K.h), new THREE.MeshBasicMaterial({ map: tx, color: new THREE.Color(1, 1, 1).multiplyScalar(3) }));
    e.position.set(K.x + K.w / 2, Y(K.y + K.h / 2), .5); own(e);
    for (const l of L.sign) { l.width = K.w * 1.25; l.height = K.h * 1.6; l.position.set(K.x + K.w / 2, Y(K.y + K.h / 2), 1.1 * M); l.lookAt(K.x + K.w / 2, Y(K.y + K.h / 2), -10); }
  }
  const cz = 3.2 * M;
  {
    const cf = new GB(), cs = new GB(), rb = new GB(), cy0 = Y(B.canopyBot), cy1 = Y(B.canopyTop), cx1 = fw + .6 * M;
    cf.cbox(0, cy0, -.6 * M, cx1, cy1, cz, .07 * M, 2 * M, 1, 'XYZ', 'Xy'); cs.box(0, cy0, -.6 * M, cx1, cy1, cz, 2.4 * M, 1, 'y');
    const rd = .17 * M, rw = .035 * M;
    for (let x = 1.85 * M; x < cx1 - .4 * M; x += 1.9 * M) rb.box(x - rw, cy0 - rd, -.6 * M, x + rw, cy0, cz - .1 * M, M, .8, 'xXy');
    for (const z of [.2 * M, 1.6 * M, 3.0 * M]) rb.box(0, cy0 - rd, z - rw, cx1 - .1 * M, cy0, z + rw, M, .8, 'yzZ');
    const ms = mesh => { mesh.castShadow = true; mesh.receiveShadow = true; return add(mesh); };
    ms(new THREE.Mesh(cf.geo(), M_CANOPY)); ms(new THREE.Mesh(cs.geo(), M_SOFFIT)); ms(new THREE.Mesh(rb.geo(), M_CANOPY));
    const steel = new THREE.MeshStandardMaterial({ color: 0x8a8378, roughness: .3, metalness: .7 });
    own(boxMesh(-.0, Y(B.canopyTop + .18 * M), cz - .02 * M, cx1, cy1, cz + .06 * M, steel));
    own(boxMesh(0, cy0, cz - .03 * M, cx1, cy0 + .07 * M, cz + .04 * M, steel));
    for (const fx of [.04, .11, .89, .96]) {
      const a = new THREE.Vector3(fw * fx, cy1, cz - .25 * M), b = new THREE.Vector3(fw * fx, cy1 + 3.4 * M, -.6 * M), l = a.distanceTo(b);
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(.035 * M, .035 * M, l, 8), M_GALV); rod.position.copy(a).lerp(b, .5); rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); rod.castShadow = true; add(rod);
      own(boxMesh(fw * fx - .12 * M, b.y - .2 * M, -.62 * M, fw * fx + .12 * M, b.y + .2 * M, -.5 * M, M_DARKMETAL));
    }
    {
      const fy0 = B.canopyTop + .18 * M, fhh = B.canopyBot - fy0, fwid = fw + .6 * M, S = 2, c = mkC(Math.ceil(fwid * S), Math.ceil(fhh * S)), o = c.getContext('2d');
      const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
      const draw = () => {
        o.clearRect(0, 0, c.width, c.height);
        let cap = fhh * S * (phone ? .5 : .46); const str = 'RIPHERE · RIPHERE.COM', fit = fw * S * (phone ? .9 : .6);
        const set = () => { o.font = `800 ${cap.toFixed(1)}px Archivo, "Arial Narrow", sans-serif`; o.letterSpacing = (cap * (phone ? .08 : .16)).toFixed(1) + 'px'; };
        set(); const w0 = o.measureText(str).width; if (w0 > fit) { cap *= fit / w0; set(); }
        const x = fw * S * (phone ? .5 : .585) - o.measureText(str).width / 2, y = c.height / 2;
        o.textBaseline = 'middle'; o.textAlign = 'left';
        o.fillStyle = 'rgba(0,0,0,.65)'; o.fillText(str, x + S, y + 2 * S);
        const g = o.createLinearGradient(0, y - cap * .5, 0, y + cap * .5); g.addColorStop(0, '#f4f1ea'); g.addColorStop(.55, '#e9e6df'); g.addColorStop(1, '#a8a49c');
        o.fillStyle = g; o.fillText(str, x, y);
        tx.needsUpdate = true;
      };
      draw(); try { document.fonts.load('800 40px Archivo').then(draw, () => {}); } catch {}
      const m = new THREE.Mesh(new THREE.PlaneGeometry(fwid, fhh), new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false, color: new THREE.Color(1, 1, 1).multiplyScalar(1.35) }));
      m.position.set(fwid / 2, Y(fy0 + fhh / 2), cz + .09 * M); own(m);
    }
    const dl = []; for (let x = .9 * M; x < fw; x += 1.9 * M) for (const z of [.9 * M, 2.3 * M]) dl.push([x, z]);
    const im = new THREE.InstancedMesh(new THREE.CircleGeometry(.13 * M, 12), emis(0xffe2b8, 7), dl.length), m4 = new THREE.Matrix4(), rx = new THREE.Matrix4().makeRotationX(Math.PI / 2);
    dl.forEach(([x, z], i) => { m4.copy(rx).setPosition(x, Y(B.canopyBot) - .5, z); im.setMatrixAt(i, m4); }); add(im);
  }
  {
    const lt = B.canopyBot, lh = B.groundY - lt, gz = -1.5 * M, depth = 13 * M, x0 = pierW, x1 = fw - pierW, wl = x1 - x0;
    const tr = new THREE.MeshStandardMaterial({ ...T_PANEL, color: 0x8a7c68, roughness: .7, envMapIntensity: .3 });
    add(own(boxMesh(x0, gY, gz - depth, x1, gY + 2, gz, new THREE.MeshStandardMaterial({ color: 0x5d5952, roughness: .22, metalness: 0, envMapIntensity: 1 }))));
    add(own(boxMesh(x0, Y(lt), gz - depth, x1, Y(lt) + 2, gz, new THREE.MeshStandardMaterial({ color: 0x55524d, roughness: .9 }))));
    const ig = new GB(); ig.box(x0, gY, gz - depth - 2, x1, Y(lt), gz - depth, 2.4 * M, 1, 'Z'); ig.box(x0 - 2, gY, gz - depth, x0, Y(lt), gz, 2.4 * M, .8, 'X'); ig.box(x1, gY, gz - depth, x1 + 2, Y(lt), gz, 2.4 * M, .8, 'x');
    add(new THREE.Mesh(ig.geo(), tr));
    const wash = new THREE.Mesh(new THREE.PlaneGeometry(wl, lh), new THREE.MeshBasicMaterial({ map: (() => { const c = mkC(8, 128), o = c.getContext('2d'), g = o.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, 'rgba(255,214,160,.45)'); g.addColorStop(.5, 'rgba(255,200,140,.1)'); g.addColorStop(1, 'rgba(255,200,140,.02)'); o.fillStyle = g; o.fillRect(0, 0, 8, 128); return canvasTex(c); })(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    wash.position.set((x0 + x1) / 2, (gY + Y(lt)) / 2, gz - depth + 1); own(wash);
    const mz = Y(B.groundY - 4.4 * M);
    add(own(boxMesh(x0, mz, gz - depth, x1, mz + .45 * M, gz - depth * .45, new THREE.MeshStandardMaterial({ color: 0x3a3732, roughness: .6 }))));
    add(own(boxMesh(x0, mz - .06 * M, gz - depth * .45 - .05 * M, x1, mz, gz - depth * .45, emis(0xffd9a8, 2.2))));
    const pan = boxMesh((x0 + x1) / 2 - wl * .18, gY + 1.2 * M, gz - depth * .45 - .3 * M, (x0 + x1) / 2 + wl * .18, gY + 3.6 * M, gz - depth * .45 - .2 * M, emis(0xffc98a, .9)); own(pan);
    add(own(boxMesh((x0 + x1) / 2 - wl * .14, gY, gz - depth * .3, (x0 + x1) / 2 + wl * .14, gY + 1.1 * M, gz - depth * .22, new THREE.MeshStandardMaterial({ color: 0x1a1714, roughness: .35, metalness: .2 }))));
    add(own(boxMesh((x0 + x1) / 2 - wl * .14, gY + 1.1 * M, gz - depth * .22, (x0 + x1) / 2 + wl * .14, gY + 1.14 * M, gz - depth * .22 + 3, emis(0xffd2a0, 3))));
    for (let k = 0; k < 4; k++) { const ex = x0 + wl * (.1 + k * .08); add(own(boxMesh(ex, gY, gz - depth + 2, ex + 1.3 * M, gY + 2.6 * M, gz - depth + 6, new THREE.MeshStandardMaterial({ color: 0x6b4c28, roughness: .3, metalness: .85, envMapIntensity: 1.4 })))); }
    const dl = []; for (let x = x0 + 1.5 * M; x < x1; x += 2.6 * M) for (let z = gz - 1.5 * M; z > gz - depth; z -= 2.6 * M) dl.push([x, z]);
    const im = new THREE.InstancedMesh(new THREE.CircleGeometry(.12 * M, 12), emis(0xfff0d8, 5), dl.length), m4 = new THREE.Matrix4(), rx = new THREE.Matrix4().makeRotationX(Math.PI / 2);
    dl.forEach(([x, z], i) => { m4.copy(rx).setPosition(x, Y(lt) - 1, z); im.setMatrixAt(i, m4); }); add(im);
    L.lobbyIn.width = wl; L.lobbyIn.height = depth; L.lobbyIn.position.set((x0 + x1) / 2, Y(lt) - 4, gz - depth / 2); L.lobbyIn.lookAt((x0 + x1) / 2, gY - 100, gz - depth / 2);
    for (const l of L.spill) { l.width = wl * .9; l.height = lh * .8; l.position.set((x0 + x1) / 2, (gY + Y(lt)) / 2, gz + 4); l.lookAt((x0 + x1) / 2, (gY + Y(lt)) / 2 - lh * .1, 1e4); }
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(wl, lh), new THREE.MeshStandardMaterial({ color: 0x20262a, roughness: .04, metalness: 0, transparent: true, opacity: .16, envMapIntensity: 1.6, depthWrite: false }));
    glass.position.set((x0 + x1) / 2, (gY + Y(lt)) / 2, gz); own(glass);
    const mg = new GB(), mt = .09 * M;
    for (let x = x0; x <= x1 + 1; x += wl / Math.max(4, Math.round(wl / (1.55 * M)))) mg.box(x - mt, gY, gz - mt, x + mt, Y(lt), gz + mt, M, 1);
    for (const hy of [2.9 * M, lh - .4 * M]) mg.box(x0, gY + hy - mt, gz - mt, x1, gY + hy + mt, gz + mt, M, 1);
    add(own(new THREE.Mesh(mg.geo(), new THREE.MeshStandardMaterial({ color: 0x2a2117, roughness: .35, metalness: .8, envMapIntensity: 1 }))));
    const cg = new GB(), pg = new GB(), cwid = .85 * M, ph = .45 * M;
    for (let b = 1; b < nb; b++) { const x = pierW + b * bw; cg.cbox(x - cwid / 2, gY + ph, -cwid, x + cwid / 2, Y(lt), 0, .08 * M, 2 * M, (v, nr) => nr[2] > .9 ? .95 : .72, 'xXZ', 'xX'); pg.cbox(x - cwid / 2 - .06 * M, gY, -cwid - .06 * M, x + cwid / 2 + .06 * M, gY + ph, .06 * M, .03 * M, M, 1, 'xXYZ', 'xXY'); }
    pg.cbox(x0, gY, gz - .12 * M, x1, gY + .28 * M, gz + .14 * M, .03 * M, M, 1, 'YZ', 'Y');
    const granite = new THREE.MeshStandardMaterial({ ...T_BUSH, color: 0x2a2826, roughness: .32, envMapIntensity: 1.1 });
    { const mp = facadeMat(T_BOARD, 0xffffff, 1, 1.3); mp.color.setRGB(.62, .7, .86); const m = new THREE.Mesh(cg.geo(), mp); m.castShadow = m.receiveShadow = true; add(own(m)); }
    { const rx = pierW + Math.min(nb - 1, nb / 2 + 1) * bw, rr = 1.15 * M, dh = 2.5 * M, rg = new THREE.Group();
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, dh, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x20262a, roughness: .05, transparent: true, opacity: .22, envMapIntensity: 1.8, depthWrite: false, side: THREE.DoubleSide }));
      drum.position.set(0, dh / 2, 0); rg.add(drum);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(rr + .06 * M, rr + .06 * M, .32 * M, 32), M_MULL); cap.position.y = dh + .16 * M; rg.add(cap);
      const sill = new THREE.Mesh(new THREE.CylinderGeometry(rr + .04 * M, rr + .04 * M, .04 * M, 32), M_MULL); sill.position.y = .02 * M; rg.add(sill);
      for (let k = 0; k < 4; k++) { const w = new THREE.Mesh(new THREE.BoxGeometry(rr * .98, dh * .96, .04 * M), M_MULL); w.position.set(Math.cos(k * Math.PI / 2 + .5) * rr * .49, dh / 2, -Math.sin(k * Math.PI / 2 + .5) * rr * .49); w.rotation.y = k * Math.PI / 2 + .5; rg.add(w); }
      for (const sx of [-1, 1]) { const st = new THREE.Mesh(new THREE.BoxGeometry(.08 * M, dh + .3 * M, .08 * M), M_MULL); st.position.set(sx * rr * .99, (dh + .3 * M) / 2, 0); rg.add(st); }
      rg.position.set(rx, gY, gz); add(own(rg)); }
    for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.15 * M, 1.75 * M), new THREE.MeshBasicMaterial({ map: personTex(40 + i, 0), transparent: true, color: 0x3a3632, depthWrite: false })); p.position.set(x0 + wl * (.3 + i * .22), gY + .875 * M, gz - depth * (.35 + .2 * (i % 2))); own(p); }
  }

  const S = 4.6 * M, sw = 14 * M, A0 = fw + 4.6 * M, A1 = A0 + 22 * M, stopX = A0 - 3.4 * M;
  Object.assign(G, { S, sw, A0, A1 });
  for (const l of L.up) { l.position.set(fw * .5, gY + 2.5 * M, 9 * M); l.intensity = 0; }
  for (const l of L.moon) { l.position.set(-60 * M, gY + 200 * M, 120 * M); l.target.position.set(fw * .5, gY + 60 * M, 0); }
  {
    const d = new THREE.Vector3(-.68, .5, .53).normalize(), mu = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), d).normalize(), mv = new THREE.Vector3().crossVectors(d, mu);
    const half = Math.max(fw, VH) * .62 + 6 * M, sc = L.moon[0].shadow.camera; Object.assign(G, { moonDir: d, mu, mv, shHalf: half });
    sc.left = sc.bottom = -half; sc.right = sc.top = half; sc.near = 10; sc.far = 9000; sc.updateProjectionMatrix();
  }
  const lampX = phone ? W * .2 : fw * .37, lampZ = S - .6 * M, lampH = 9.8 * M, armL = 3.4 * M;
  for (const l of L.lamp) { l.position.set(lampX - armL, gY + lampH - .3 * M, lampZ); l.target.position.set(lampX - armL - .3 * M, gY, lampZ + .5 * M); l.intensity = 2400 * M * M; }
  { const sh = L.lamp[1].shadow.camera; sh.near = 1 * M; sh.far = 20 * M; sh.updateProjectionMatrix(); }

  const gb = grpB, ownB = o => own(o, gb);
  {
    const span = [-900 * M, 1700 * M, -3200 * M, D * 1.02];
    const g = new THREE.PlaneGeometry(span[1] - span[0], span[3] - span[2]); g.rotateX(-Math.PI / 2);
    const uv = g.attributes.uv, P = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (P.getX(i) + (span[0] + span[1]) / 2) / (4 * M), (P.getZ(i) + (span[2] + span[3]) / 2) / (4 * M));
    const m = new THREE.Mesh(g, M_ROAD); m.position.set((span[0] + span[1]) / 2, gY - .15 * M, (span[2] + span[3]) / 2); m.receiveShadow = true; gb.add(m);
    const pg = new GB(), T = 2.2 * M, c = .15 * M;
    pg.box(-200 * M, gY - c, 0, A0 - .2 * M, gY, S, T, 1, 'YX');
    pg.box(pierW, gY - c, -1.5 * M - .2 * M, fw - pierW, gY, 0, T, 1, 'Y');
    pg.box(-200 * M, gY - c, S + sw, A0 + 60 * M, gY, D * 1.02, T, 1, 'Yz');
    const per = 88 * M, blk0 = 60 * M;
    for (let k = 0; k < 26; k++) { const z1 = k === 0 ? 0 : -(blk0 + (k - 1) * per + 18 * M), z0 = -(blk0 + k * per); pg.box(fw, gY - c, z0, A0 - .2 * M, gY, z1, T, 1, k ? 'YXZ' : 'YX'); pg.box(A1 + .2 * M, gY - c, z0, A1 + 4.6 * M, gY, z1 + (k === 0 ? S : 0), T, 1, 'YxZ'); }
    pg.box(A0 + 60 * M, gY - c, S + sw, A1 + 120 * M, gY, D * 1.02, T, 1, 'Y');
    const pm = new THREE.Mesh(pg.geo(), M_PAVE); pm.receiveShadow = true; ownB(pm);
    const kg = new GB(); kg.box(-200 * M, gY - c - 1, S - .25 * M, A0 - .2 * M, gY + 1, S, M, 1, 'YZ'); ownB(new THREE.Mesh(kg.geo(), M_CURB));
    const pt = new GB();
    for (let k = 0; k < 9; k++) { const z0 = S + .6 * M + k * 1.45 * M; pt.box(A0 - 3 * M, gY - .148 * M, z0, A0 - .4 * M, gY - .145 * M, z0 + .7 * M, M, 1, 'Y'); }
    pt.box(stopX - .3 * M, gY - .148 * M, S + .4 * M, stopX, gY - .145 * M, S + sw - .4 * M, M, 1, 'Y');
    for (let ln = 1; ln < 5; ln++) { const x = A0 + ln * 4.4 * M; for (let z = S; z > -2200 * M; z -= 12 * M) pt.box(x - .08 * M, gY - .148 * M, z - 3 * M, x + .08 * M, gY - .145 * M, z, M, 1, 'Y'); }
    for (let x = -200 * M; x < A0 - 4 * M; x += 12 * M) pt.box(x, gY - .148 * M, S + 7 * M - .08 * M, x + 3 * M, gY - .145 * M, S + 7 * M + .08 * M, M, 1, 'Y');
    const ptm = new THREE.Mesh(pt.geo(), M_PAINT); ptm.receiveShadow = true; ownB(ptm);
  }
  if (!phone || true) {
    const list = [], tanks = [], r = mulberry(2026), per = 88 * M, blk0 = 60 * M, hTower = Y(yTopCss) - gY;
    const push = (x0, x1, z0, z1, h, style, tint, floorH = 3.6, bayW = 3, lit = .14, y0 = 0) => list.push({ x0, x1, z0, z1, h, y0, style, tint, floorH, bayW, lit });
    const tintR = () => { const v = .38 + r() * .2; return [v * 1.04, v, v * .93]; };
    const bld = (x0, x1, z0, z1, h, st, tint, fh, bw, lit, face, near) => {
      const k = r(); let base = [x0, x1, z0, z1, h], top = base;
      if (h > 70 * M && k < .4) {
        const ph = Math.min(h * .4, (9 + r() * 14) * M); push(x0, x1, z0, z1, ph, st, tint, fh, bw, lit); base = [x0, x1, z0, z1, ph];
        const ix = (x1 - x0) * (.12 + r() * .14), iz = (z1 - z0) * (.1 + r() * .14); top = [x0 + ix, x1 - ix, z0 + iz, z1 - iz, h];
        push(top[0], top[1], top[2], top[3], h, (st + 1) % 4, tint, fh, bw, lit, ph);
      } else if (h > 45 * M && k < .78) {
        let c = [x0, x1, z0, z1], y = 0; const n = r() < .4 ? 3 : 2;
        for (let t = 0; t < n; t++) { const ht = t === n - 1 ? h : y + (h - y) * (.5 + r() * .2); push(c[0], c[1], c[2], c[3], ht, st, tint, fh, bw, lit, y); if (!t) base = [...c, ht]; top = [...c, ht]; y = ht;
          const ix = (c[1] - c[0]) * (.07 + r() * .09), iz = (c[3] - c[2]) * (.07 + r() * .09); c = [c[0] + ix, c[1] - ix, c[2] + iz, c[3] - iz]; }
      } else push(x0, x1, z0, z1, h, st, tint, fh, bw, lit);
      const [tx0, tx1, tz0, tz1, th] = top, tw = tx1 - tx0, td = tz1 - tz0, q = r();
      if (th > 150 * M && q < .45) {
        const ix = tw * .18, iz = td * .18, ch = (7 + r() * 7) * M; push(tx0 + ix, tx1 - ix, tz0 + iz, tz1 - iz, th + ch, 5, tint, th / M, bw, 0, th);
        push((tx0 + tx1) / 2 - .4 * M, (tx0 + tx1) / 2 + .4 * M, (tz0 + tz1) / 2 - .4 * M, (tz0 + tz1) / 2 + .4 * M, th + ch + (10 + r() * 14) * M, 4, tint, 3, 3, 0, th + ch);
      } else {
        for (let i = 0, n = 1 + Math.floor(r() * 3); i < n; i++) { const bw2 = tw * (.18 + r() * .25), bd = td * (.18 + r() * .3), bx = tx0 + r() * (tw - bw2), bz = tz0 + r() * (td - bd); push(bx, bx + bw2, bz, bz + bd, th + (2.5 + r() * 4) * M, 4, tint, 3, 3, 0, th); }
        if (th < 120 * M && q > .5) { const tr = (1.8 + r() * 1.4) * M, cx = tx0 + tr + r() * Math.max(1, tw - 2 * tr), cz = tz0 + tr + r() * Math.max(1, td - 2 * tr), leg = (2.2 + r() * 1.5) * M;
          tanks.push({ x: cx, z: cz, r: tr, y0: th + leg, h: (3.6 + r() * 1.6) * M }); push(cx - tr * .75, cx + tr * .75, cz - tr * .75, cz + tr * .75, th + leg, 6, [.2, .18, .16], 3, 3, 0, th); }
      }
      if (near && face) {
        const [bx0, bx1, bz0, bz1, bh] = base, fx = face > 0 ? bx1 : bx0, out = face * .38 * M, step = Math.max(2 * bw, 5.2) * M;
        for (let z = bz1 - step * .5; z > bz0 + .5 * M; z -= step) push(Math.min(fx, fx + out), Math.max(fx, fx + out), z - .26 * M, z + .26 * M, bh, 4, tint, fh, bw, 0);
        for (let y = fh * M * 1.5; y < bh - .5 * M; y += fh * M) push(Math.min(fx, fx + out * .7), Math.max(fx, fx + out * .7), bz0, bz1, y + .2 * M, 4, tint, fh, bw, 0, y);
      }
    };
    push(fw - 2, fw, -30 * M, 0, hTower, 0, [.5, .48, .45], 3.7, 3, .16);
    push(fw - 26 * M, fw, -60 * M, -30 * M, 92 * M, 3, tintR());
    for (let k = 1; k < 26; k++) {
      const zA = -(blk0 + (k - 1) * per + 18 * M), zB = -(blk0 + k * per);
      let z = zA; while (z > zB + 8 * M) { const len = Math.min(z - zB, (18 + r() * 30) * M), h = (22 + Math.pow(r(), 1.6) * 150) * M; bld(fw - 30 * M, fw, z - len, z, h, Math.floor(r() * 4), tintR(), 3.4 + r() * .6, 2.6 + r() * 1.4, .08 + r() * .14, 1, k <= 3); z -= len; }
    }
    for (let k = 0; k < 26; k++) {
      const zA = k === 0 ? S + sw + 2 * M : -(blk0 + (k - 1) * per + 18 * M), zB = k === 0 ? -blk0 : -(blk0 + k * per);
      for (let row = 0; row < 6; row++) {
        const xa = A1 + 4.6 * M + row * 44 * M; let z = zA;
        while (z > zB + 8 * M) { const len = Math.min(z - zB, (20 + r() * 34) * M), h = (row ? 30 : 20) * M + Math.pow(r(), 1.8) * (row ? 210 : 140) * M; bld(xa, xa + (34 + r() * 8) * M, z - len, z, h, Math.floor(r() * 4), tintR(), 3.4 + r() * .6, 2.6 + r() * 1.4, .07 + r() * .14, row ? 0 : -1, !row && k <= 3); z -= len; }
      }
    }
    for (let i = 0; i < 70; i++) { const x = (-300 + r() * 1700) * M, z = -(2350 + r() * 600) * M, w = (30 + r() * 50) * M; bld(x, x + w, z - w, z, (80 + r() * 260) * M, Math.floor(r() * 4), tintR(), 3.6, 3, .1, 0, false); }
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), M_BLD, list.length), aB = new Float32Array(list.length * 4), aC = new Float32Array(list.length * 4), m4 = new THREE.Matrix4();
    list.forEach((b, i) => { const y0 = b.y0 || -.16 * M;  m4.makeScale(b.x1 - b.x0, b.h - y0, b.z1 - b.z0).setPosition((b.x0 + b.x1) / 2, gY + (b.h + y0) / 2, (b.z0 + b.z1) / 2); im.setMatrixAt(i, m4); aB.set([i * 1.37 % 97, b.floorH, b.bayW, b.lit], i * 4); aC.set([...b.tint, b.style], i * 4); });
    im.geometry.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 4)); im.geometry.setAttribute('aC', new THREE.InstancedBufferAttribute(aC, 4)); im.frustumCulled = false;
    ownB(im);
    {
      const tg = new THREE.LatheGeometry([[0, 0], [1, 0], [1, .04], [.97, .06], [.97, .5], [1, .52], [.97, .54], [.97, .82], [1.04, .84], [.08, 1.08], [0, 1.1]].map(([x, y]) => new THREE.Vector2(x, y)), 14);
      const ti = new THREE.InstancedMesh(tg, M_BLD, Math.max(1, tanks.length)), tB = new Float32Array(tanks.length * 4 + 4), tC = new Float32Array(tanks.length * 4 + 4);
      tanks.forEach((t, i) => { m4.makeScale(t.r, t.h, t.r).setPosition(t.x, gY + t.y0, t.z); ti.setMatrixAt(i, m4); tB.set([i, 3, 3, 0], i * 4); tC.set([.3, .24, .19, 6], i * 4); });
      ti.count = tanks.length; tg.setAttribute('aB', new THREE.InstancedBufferAttribute(tB, 4)); tg.setAttribute('aC', new THREE.InstancedBufferAttribute(tC, 4)); ti.frustumCulled = false; ownB(ti);
    }
    G.cityN = list.length + tanks.length;
    M_BLD.uniforms.uM.value = M; M_BLD.uniforms.uGround.value = gY; M_BLD.uniforms.uFogD.value = fogD;
    const tall = list.filter(b => b.h > 140 * M).slice(0, 14), bg = new THREE.BufferGeometry(), bp = [];
    tall.forEach(b => bp.push((b.x0 + b.x1) / 2, gY + b.h + 2 * M, (b.z0 + b.z1) / 2));
    bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3));
    const bm = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'uniform float uT; varying float vA; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; vA = step(.5, fract(uT + position.x * .0013)); gl_PointSize = 5.; }',
      fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vec3(3., .25, .1) * vA * smoothstep(.5, .1, d), 1.); }' });
    const pts = new THREE.Points(bg, bm); pts.frustumCulled = false; ownB(pts); live.push(t => bm.uniforms.uT.value = t);
  }
  {
    const sk = new THREE.Mesh(new THREE.SphereGeometry(3300 * M, 32, 16), M_SKY); sk.renderOrder = -10; sk.frustumCulled = false; gb.add(sk); G.sky = sk;
  }

  {
    const per = 88 * M, blk0 = 60 * M, r = mulberry(77), list = [], cross = [];
    const avStops = []; for (let k = 1; k <= NSTOP; k++) avStops.push({ s: blk0 + (k - 1) * per - 2 * M, q: (25 + r() * 70) * M / M, ph: k * 1.1 + r() * 2 });
    const tailY = gY + .85 * M, headY = gY + .65 * M;
    for (let ln = 0; ln < 5; ln++) {
      const lx = A0 + (ln + .5) * 4.4 * M, inb = ln < 2;
      for (let k = 0; k < 3; k++) {
        const off = (k === 0 ? -.75 : k === 1 ? .75 : (r() - .5) * 1.2) * M, seed = ln * 3 + k + 1, pts = [];
        for (let z = S + sw * .6; z > -2300 * M; z -= Math.max(1.5 * M, Math.abs(z) * .02)) { const sM = -z / M; pts.push([lx + off + Math.sin(sM * .004 + seed) * .15 * M, inb ? headY : tailY, z, inb ? z : -z, sm01((S + sw * .55 - z) / (10 * M))]); }
        (inb ? cross : list).push({ pts, seed, white: inb, w: k === 2 ? .06 : .09, gain: (k === 2 ? .45 : 1) * (inb ? .5 : 1) });
      }
    }
    for (let k = 1; k < 26; k++) {
      const zc = -(blk0 + (k - 1) * per + 9 * M);
      for (const [dz, white] of [[-3.5, false], [3.5, true], [-1.2, false]]) { const pts = []; for (let x = fw - 60 * M; x < A1 + 140 * M; x += 3 * M) pts.push([x, white ? headY : tailY, zc + dz * M, white ? -x : x]); cross.push({ pts, seed: k * 7 + dz, white, w: .12, gain: white ? .35 : .5 }); }
    }
    const mA = streakMaterial(avStops), mC = streakMaterial([]);
    for (const m of [mA, mC]) { m.uniforms.uM.value = M; m.uniforms.uFogD.value = fogD; }
    mA.uniforms.uGain.value = 4.2; mC.uniforms.uGain.value = .8;
    for (const m of [mA, mC]) Object.entries({ uWid: 1, uSw: .35, uMin: 1.4, uGlow: .2, uBB: .9, uGap: .45, uFar: .5 }).forEach(([k, v]) => m.uniforms[k].value = v);
    const ms = [new THREE.Mesh(ribbonGeo(list), mA), new THREE.Mesh(ribbonGeo(cross), mC)];
    ms.forEach(m => { m.frustumCulled = false; m.renderOrder = 5; ownB(m); });
    G.streakMats = [mA, mC];
  }

  {
    const cyl = (r0, r1, h, mat) => new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, 14), mat);
    const shadowed = o => { o.traverse(c => { if (c.isMesh) c.castShadow = true; }); return o; };
    const lamp = new THREE.Group(); const pole = cyl(.1 * M, .16 * M, lampH, M_GALV); pole.position.set(lampX, gY + lampH / 2, lampZ); lamp.add(pole);
    const curve = new THREE.CubicBezierCurve3(new THREE.Vector3(lampX, gY + lampH - .9 * M, lampZ), new THREE.Vector3(lampX, gY + lampH + .2 * M, lampZ), new THREE.Vector3(lampX - armL * .5, gY + lampH + .25 * M, lampZ), new THREE.Vector3(lampX - armL, gY + lampH - .05 * M, lampZ));
    lamp.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 32, .065 * M, 12), M_GALV));
    const head = new THREE.Mesh(new THREE.SphereGeometry(.45 * M, 32, 10, 0, Math.PI * 2, 0, Math.PI / 2), M_POLE); head.material = M_GALV; head.scale.set(1.5, .42, .8); head.position.set(lampX - armL - .2 * M, gY + lampH - .1 * M, lampZ); lamp.add(head);
    const lens = new THREE.Mesh(new THREE.SphereGeometry(.38 * M, 32, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), emis(0xffa250, 14)); lens.scale.set(1.45, .32, .75); lens.position.copy(head.position); lamp.add(lens);
    shadowed(lamp); lens.castShadow = false; ownB(lamp);
    const sx = fw + 1.2 * M, sz = S - .5 * M, sgH = 5.6 * M, sig = new THREE.Group();
    const sp1 = cyl(.12 * M, .15 * M, sgH + .6 * M, M_POLE); sp1.position.set(sx, gY + (sgH + .6 * M) / 2, sz); sig.add(sp1);
    const arm = cyl(.07 * M, .09 * M, 7.5 * M, M_POLE); arm.rotation.z = Math.PI / 2; arm.position.set(sx + 3.75 * M, gY + sgH, sz); sig.add(arm);
    G.sigLamps = [];
    for (const hx of [sx + 3.4 * M, sx + 6.6 * M, sx + .0]) {
      const hy = hx === sx ? gY + 3.2 * M : gY + sgH - .7 * M, hz = hx === sx ? sz + .25 * M : sz;
      sig.add(boxMesh(hx - .22 * M, hy - .55 * M, hz - .2 * M, hx + .22 * M, hy + .55 * M, hz + .18 * M, M_DARKMETAL));
      const set = ['r', 'y', 'g'].map((c, j) => { const m = new THREE.Mesh(new THREE.CircleGeometry(.12 * M, 16), new THREE.MeshBasicMaterial({ color: 0x000000 })); m.position.set(hx, hy + (1 - j) * .34 * M, hz + .19 * M); sig.add(m);
        const visor = new THREE.Mesh(new THREE.CylinderGeometry(.15 * M, .15 * M, .2 * M, 12, 1, true, Math.PI * .1, Math.PI * 1.1), M_DARKMETAL); visor.rotation.x = Math.PI / 2; visor.position.set(hx, hy + (1 - j) * .34 * M + .02 * M, hz + .3 * M); sig.add(visor); return m; });
      G.sigLamps.push(set);
    }
    const ped = boxMesh(sx - .2 * M, gY + 2.4 * M, sz - .15 * M - .6 * M, sx + .2 * M, gY + 2.85 * M, sz - .15 * M - .25 * M, M_DARKMETAL); sig.add(ped);
    const hand = new THREE.Mesh(new THREE.PlaneGeometry(.26 * M, .3 * M), emis(0xff7a2a, 3)); hand.position.set(sx, gY + 2.62 * M, sz - .4 * M + .01 * M); hand.rotation.y = 0; sig.add(hand);
    const nt = new THREE.Mesh(new THREE.PlaneGeometry(.7 * M, .9 * M), new THREE.MeshStandardMaterial({ map: signTex(['NO', 'TURNS'], 128, 160), roughness: .6 })); nt.position.set(sx - .02 * M, gY + 4.1 * M, sz + .16 * M); sig.add(nt);
    shadowed(sig); ownB(sig);
    const tx = phone ? W * .82 : fw * .3, tz = S - .35 * M, tw = new THREE.Group();
    const tp = cyl(.04 * M, .04 * M, 3.3 * M, M_POLE); tp.position.set(tx, gY + 1.65 * M, tz); tw.add(tp);
    const ts = new THREE.Mesh(new THREE.PlaneGeometry(.62 * M, .95 * M), new THREE.MeshStandardMaterial({ map: signTex(['TOW', 'AWAY', 'ZONE'], 128, 196), roughness: .55, envMapIntensity: .5 })); ts.position.set(tx, gY + 2.75 * M, tz + .05 * M); tw.add(ts);
    shadowed(tw); ownB(tw);
    const pz = S + sw + 1.6 * M, px0 = phone ? -1 * M : 2 * M, pw = phone ? 7 * M : 9 * M;
    const pl = new GB(); pl.box(px0, gY, pz, px0 + pw, gY + .85 * M, pz + 1.8 * M, 1.6 * M, 1); ownB(new THREE.Mesh(pl.geo(), M_CURB));
    const hgG = new THREE.IcosahedronGeometry(.55 * M, 3), hp = hgG.attributes.position;
    for (let i = 0; i < hp.count; i++) { const x = hp.getX(i), y = hp.getY(i), z = hp.getZ(i), k = 1 + .09 * Math.sin(x / M * 11 + 1) * Math.sin(y / M * 13 + 2) * Math.sin(z / M * 9 + 3) + .05 * Math.sin((x + z) / M * 23); hp.setXYZ(i, x * k, y * k, z * k); }
    const hg = new THREE.InstancedMesh(hgG, new THREE.MeshStandardMaterial({ color: 0x1f2a1a, roughness: .95 }), 26); const hr = mulberry(9), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    for (let i = 0; i < 26; i++) { e.set(hr() * 3, hr() * 3, hr() * 3); q.setFromEuler(e); const s = .8 + hr() * .6, x = px0 + .4 * M + hr() * (pw - .8 * M), y = gY + 1.05 * M + hr() * .35 * M, z = pz + .4 * M + hr() * 1 * M, o = .5 * s * M; m4.compose(new THREE.Vector3(Math.min(Math.max(x, px0 + o), px0 + pw - o), y, Math.min(Math.max(z, pz + o), pz + 1.8 * M - o)), q,  new THREE.Vector3(s, s * .8, s)); hg.setMatrixAt(i, m4); }
    hg.castShadow = true; ownB(hg);
    const cab = new THREE.Group(), cx1 = stopX - .3 * M, cx0 = cx1 - 4.9 * M, cz1 = S + 9.3 * M, cl = 1.9 * M;
    const yel = new THREE.MeshStandardMaterial({ color: 0xb8901f, roughness: .28, metalness: .4, envMapIntensity: 1.3 }), dg = new THREE.MeshStandardMaterial({ color: 0x07080a, roughness: .06, metalness: .2, envMapIntensity: 1.5 });
    const chrome = new THREE.MeshStandardMaterial({ color: 0xb9b6b0, roughness: .18, metalness: 1, envMapIntensity: 1.6 });
    const ext = (sh, depth, mat, z0, bev = .06, seg = 3) => { const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: bev * M, bevelSize: bev * .85 * M, bevelSegments: seg, curveSegments: 10 }); const m = new THREE.Mesh(g, mat); m.position.z = z0; cab.add(m); return m; };
    const P = (x, y) => new THREE.Vector2(cx0 + x * M, gY + y * M);
    {
      const sh = new THREE.Shape(); sh.moveTo(cx0 + .05 * M, gY + .36 * M);
      sh.lineTo(cx0 + .5 * M, gY + .36 * M); sh.absarc(cx0 + .95 * M, gY + .34 * M, .44 * M, Math.PI, 0, true);
      sh.lineTo(cx0 + 3.41 * M, gY + .36 * M); sh.absarc(cx0 + 3.85 * M, gY + .34 * M, .44 * M, Math.PI, 0, true);
      sh.lineTo(cx0 + 4.82 * M, gY + .36 * M); sh.quadraticCurveTo(cx0 + 4.96 * M, gY + .4 * M, cx0 + 4.95 * M, gY + .62 * M);
      sh.quadraticCurveTo(cx0 + 4.93 * M, gY + .84 * M, cx0 + 4.6 * M, gY + .88 * M); sh.lineTo(cx0 + 3.6 * M, gY + .98 * M);
      sh.lineTo(cx0 + .45 * M, gY + 1.0 * M); sh.quadraticCurveTo(cx0 - .04 * M, gY + .98 * M, cx0 - .04 * M, gY + .7 * M);
      sh.quadraticCurveTo(cx0 - .03 * M, gY + .4 * M, cx0 + .05 * M, gY + .36 * M);
      ext(sh, cl - .16 * M, yel, cz1 - cl / 2 + .08 * M, .08, 4);
    }
    {
      const g = new THREE.Shape([P(.82, .99), P(3.58, .99), P(3.02, 1.43), P(1.32, 1.45)]); ext(g, cl - .46 * M, dg, cz1 - cl / 2 + .23 * M, .05, 2);
      const b = new THREE.Shape([P(2.18, .99), P(2.36, .99), P(2.33, 1.44), P(2.17, 1.44)]); ext(b, cl - .4 * M, yel, cz1 - cl / 2 + .2 * M, .03, 1);
      const r = new THREE.Shape([P(1.28, 1.41), P(3.06, 1.41), P(3.0, 1.47), P(1.34, 1.5)]); ext(r, cl - .42 * M, yel, cz1 - cl / 2 + .21 * M, .06, 3);
    }
    {
      const t = new THREE.Shape([P(1.82, 1.52), P(2.62, 1.52), P(2.56, 1.74), P(1.88, 1.74)]); ext(t, .5 * M, emis(0xffe3b0, .9), cz1 - .25 * M, .02, 1);
      cab.add(boxMesh(cx0 + 1.9 * M, gY + 1.48 * M, cz1 - .2 * M, cx0 + 2.54 * M, gY + 1.53 * M, cz1 + .2 * M, M_DARKMETAL));
    }
    for (const [x0b, x1b] of [[-.1, .35], [4.62, 5.02]]) {
      const sh = new THREE.Shape([P(x0b, .38), P(x1b, .38), P(x1b, .52), P(x0b, .52)]); ext(sh, cl - .1 * M, chrome, cz1 - cl / 2 + .05 * M, .04, 2); }
    for (const sz of [-1, 1]) cab.add(boxMesh(cx0 + 3.38 * M, gY + 1.0 * M, cz1 + sz * (cl / 2 + .02 * M) - (sz > 0 ? 0 : .12 * M), cx0 + 3.58 * M, gY + 1.12 * M, cz1 + sz * (cl / 2 + .02 * M) + (sz > 0 ? .12 * M : 0), yel));
    const tyreG = new THREE.CylinderGeometry(.33 * M, .33 * M, .22 * M, 28), hubG = new THREE.CylinderGeometry(.17 * M, .17 * M, .23 * M, 20);
    for (const wx of [cx0 + .95 * M, cx1 - 1.05 * M]) for (const wz of [cz1 - cl / 2 + .12 * M, cz1 + cl / 2 - .12 * M]) {
      const w = new THREE.Mesh(tyreG, M_TYRE); w.rotation.x = Math.PI / 2; w.position.set(wx, gY + .33 * M, wz); cab.add(w);
      const h = new THREE.Mesh(hubG, chrome); h.rotation.x = Math.PI / 2; h.position.copy(w.position); cab.add(h); }
    const brake = emis(0xff2a12, 16), headL = emis(0xfff0d0, 9);
    for (const dz of [-.65, .65]) { cab.add(boxMesh(cx0 - .03 * M, gY + .75 * M, cz1 + dz * M - .14 * M, cx0 + .02 * M, gY + .95 * M, cz1 + dz * M + .14 * M, brake)); cab.add(boxMesh(cx1 - .02 * M, gY + .6 * M, cz1 + dz * M - .14 * M, cx1 + .03 * M, gY + .78 * M, cz1 + dz * M + .14 * M, headL)); }
    cab.add(boxMesh(cx0 + .1 * M, gY + .8 * M, cz1 + cl / 2, cx0 + .5 * M, gY + .92 * M, cz1 + cl / 2 + .02 * M, brake));
    cab.position.y = -.15 * M; shadowed(cab); ownB(cab);
    L.cab.position.set(cx0 - .5 * M, gY + .65 * M, cz1); L.cab.intensity = 12 * M * M;
    const pr = mulberry(31), PP = phone ? 6 : 11;
    for (let i = 0; i < PP; i++) {
      const smear = pr() < .6 ? 6 + pr() * 14 : 0, h = (1.62 + pr() * .25) * M, p = new THREE.Mesh(new THREE.PlaneGeometry(h * .66, h), new THREE.MeshStandardMaterial({ map: personTex(i + 3, smear), transparent: true, depthWrite: false, roughness: .9, color: 0xb0aaa2, opacity: smear ? .8 : .95 }));
      const x = phone ? W * (.12 + pr() * .76) : lerp(fw * .08, fw * .92, (i + pr() * .7) / PP), z = (.6 + pr() * 3.4) * M;
      p.position.set(x, gY + h / 2, z); p.renderOrder = 6; ownB(p);
    }
    const refl = (x, z, len, w, hex, k) => { len = len || D * .92 - z; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, len), new THREE.MeshBasicMaterial({ map: TEX_STREAK, color: new THREE.Color(hex).multiplyScalar(k), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.position.set(x, gY - .14 * M, z + len / 2); ownB(m); return m; };
    refl(lampX - armL - .2 * M, S + .3 * M, 0, .9 * M, 0xffa250, .3);
    refl(fw * .5, S + .2 * M, 0, fw * .5, 0xffd0a0, .05);
    refl(K.x + K.w / 2, S + .2 * M, 0, K.w * .5, 0xffa64a, .06);
    refl(cx0 - .3 * M, cz1 - .5 * M, 0, 1.2 * M, 0xff2a12, .5);
    G.sigRefl = refl(sx + 3.4 * M, S + .5 * M, 9 * M, .4 * M, 0xff2a12, .5);
  }

  G.topKey = ''; G.tkCol = null;
  for (const l of L.sign) l.intensity = 0;
}

const proj = new THREE.Matrix4(), _mv = new THREE.Vector3(), _cv = new THREE.Vector3(); let MOON_I = 2.0, CITY_I = 1.6;
function setCam(cam, ex, eyCss) {
  const n = G.D * .03, f = 3600 * G.M, k = n / G.D, camY = BB.camY, W = G.W, VH = G.VH;
  cam.projectionMatrix.makePerspective((0 - ex) * k, (W - ex) * k, (eyCss - camY) * k, (eyCss - camY - VH) * k, n, f);
  cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
  cam.position.set(ex, -eyCss, G.D); cam.quaternion.identity(); cam.updateMatrixWorld(true);
}
let sized = '', built = '', t0 = performance.now();
function compileAll() {
  envMake();
  try { R.setRenderTarget(composer.renderTarget1); R.compile(sceneH, camH); R.compile(sceneB, camB); R.setRenderTarget(null); if (texOK) for (const t of SHARED_TEX) R.initTexture(t); L.lamp[1].shadow.needsUpdate = true; } catch {}
}
const WARM_MS = 3000; let warm = null;
const warmOpen = now => { if (now - t0 >= WARM_MS || BB.canvas.classList.contains('in')) return false; try { return getComputedStyle(BB.canvas).opacity === '0'; } catch { return false; } };
const unsent = t => t.version > 0 && R.properties.get(t).__version !== t.version;
const gl = R.getContext(), FENCE = R.capabilities.isWebGL2 && typeof gl.fenceSync === 'function';
const fence = () => { if (!FENCE) return null; const f = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0); gl.flush(); return f; };
const POST_Q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
function compileList() {
  const ms = []; R.setRenderTarget(composer.renderTarget1);
  ms.push(...R.compile(sceneH, camH), ...R.compile(sceneB, camB));
  for (const m of [bloom.materialHighPassFilter, ...bloom.separableBlurMaterials, bloom.compositeMaterial, bloom.blendMaterial]) { POST_Q.material = m; ms.push(...R.compile(POST_Q, camH)); }
  R.setRenderTarget(null); POST_Q.material = gradePass.material; ms.push(...R.compile(POST_Q, camH));
  return [...new Set(ms.map(m => R.properties.get(m).currentProgram).filter(Boolean))];
}
function warmStart() { warm = { stage: 0, fence: null, progs: [] }; }
function warmStep() {
  const w = warm;
  try {
    if (w.fence) { if (gl.getSyncParameter(w.fence, gl.SYNC_STATUS) !== gl.SIGNALED) return true; gl.deleteSync(w.fence); w.fence = null; }
    if (w.stage === 0) { w.stage = 1; if (!sceneH.environment) { envKick(); w.fence = fence(); return true; } }
    if (w.stage === 1) { envMake(); w.progs = compileList(); L.lamp[1].shadow.needsUpdate = true; w.stage = 2; w.fence = fence(); return true; }
    const s = performance.now();
    if (w.stage === 2) {
      const p = w.progs; while (p.length) { if (!p[0].isReady()) return true; p.shift().getUniforms(); if (performance.now() - s > 4) return true; }
      w.stage = 3;
    }
    if (w.stage === 3) {
      for (const t of SHARED_TEX) if (unsent(t)) { R.initTexture(t); if (performance.now() - s > 4) return true; }
      w.stage = 4; w.fence = fence(); return true;
    }
  } catch { warm = null; compileAll(); }
  return false;
}
function frame(now, dt) {
  const W = BB.W, VH = BB.VH; if (!W || !VH || !BB.TOP.cv) return;
  const sk = W + 'x' + VH + '@' + PR();
  if (sk !== sized) { sized = sk; R.setPixelRatio(PR()); R.setSize(W, VH, false); composer.setPixelRatio(PR()); composer.setSize(W, VH); gradePass.uniforms.uAsp.value = W / VH; }
  const tk = BB.TK && BB.TK.rect ? BB.TK.rect : null;
  const bk = [W, VH, BB.facadeW, BB.WH, BB.BASE.n, tk ? [tk.x, tk.y, tk.w, tk.h].join(',') : '', BB.boards.map(b => [b.x, b.y, b.w, b.h].join(',')).join(';'), [BB.TOP.x, BB.TOP.y, BB.TOP.w, BB.TOP.h].join(',')].join('|');
  if (bk !== built) { built = bk; rebuild(); G.compiled = false; G.rebuilds = (G.rebuilds || 0) + 1; }
  const t = (now - t0) / 1000, camY = BB.camY;
  const u = sm01((camY - (G.F0 - 1.4 * VH)) / (1.4 * VH)), hEnd = (BB.BASE.groundY - G.eyeH - G.F0) / VH;
  const eyCss = camY + VH * lerp(.5, hEnd, u);
  setCam(camH, G.heroX, eyCss); setCam(camB, G.bgX, eyCss);
  if (G.sky) G.sky.position.copy(camB.position);
  if (G.moonDir) { const mo = L.moon[0], d = G.moonDir, tx = 2 * G.shHalf / 2048, p = _mv.set(G.fw * .5, -(camY + VH * .5), -G.M);
    const pu = Math.round(p.dot(G.mu) / tx) * tx, pv = Math.round(p.dot(G.mv) / tx) * tx, pd = p.dot(d);
    p.copy(G.mu).multiplyScalar(pu).addScaledVector(G.mv, pv).addScaledVector(d, pd);
    mo.target.position.copy(p); mo.position.copy(p).addScaledVector(d, 4500); mo.intensity = MOON_I;
    L.city.target.position.copy(p); L.city.position.copy(p).add(_cv.set(.35, -.5, .8)); L.city.intensity = CITY_I; }
  const nearBase = sm01((camY - (G.F0 - 1.6 * VH)) / (.8 * VH));
  L.top.intensity = 22 * (BB.TOP.lit || 0);
  const tkOn = BB.TK && BB.TK.lastCol != null ? 1 : 0; for (const l of L.sign) l.intensity = 7 * tkOn;
  L.lobbyIn.intensity = 1.6; for (const l of L.spill) l.intensity = .55 * nearBase;
  for (const l of L.up) l.intensity = 120 * G.M * G.M * nearBase;
  for (const l of L.lamp) l.intensity = 700 * G.M * G.M * (.15 + .85 * nearBase);
  L.lamp[1].shadow.autoUpdate = nearBase > 0;
  if (G.topTex && BB.TS.key !== G.topKey) { G.topKey = BB.TS.key; G.topTex.needsUpdate = true; }
  if (G.tkTex && BB.TK.lastCol !== G.tkCol) { G.tkCol = BB.TK.lastCol; G.tkTex.needsUpdate = true; }
  if (G.streakMats) { for (const m of G.streakMats) { m.uniforms.uTime.value = t; m.uniforms.uPxK.value = G.D; } }
  if (G.sigLamps) {
    const ph = ((t + 1.1 * 1 + 0) / 16) % 1, red = ph >= .55, yel = ph >= .47 && ph < .55;
    for (const set of G.sigLamps) { set[0].material.color.setRGB(red ? 9 : .04, red ? .5 : .01, red ? .2 : .01); set[1].material.color.setRGB(yel ? 7 : .03, yel ? 3.2 : .02, 0); set[2].material.color.setRGB(0, !red && !yel ? 5 : .02, !red && !yel ? 3 : .02); }
    G.sigRefl.material.color.setRGB(red ? .3 : 0, red ? .02 : .12, red ? .01 : .08);
  }
  for (const f of live) f(t);
  if (!G.compiled) {
    G.compiled = true; if (warmOpen(now)) warmStart(); else { warm = null; compileAll(); } }
  if (warm) { if (warmOpen(now) && warmStep()) return; warm = null; envMake(); }
  composer.render(dt);
  if (!BB.canvas.classList.contains('in') && (texOK || now - t0 > 4000)) { if (G.texDrawn) BB.canvas.classList.add('in'); else G.texDrawn = 1; }
}
window.SCENE3D = { frame, R, sceneH, sceneB, L, G, set moonI(v) { MOON_I = v; }, set cityI(v) { CITY_I = v; } };
