/* Спартак · iOS · интерактивный прототип для презентации
   Вся логика анимаций: пружины (spring), корзина и меню под главным блоком, карусели, демо-сценарий. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const wait = ms => new Promise(r => setTimeout(r, ms));
const root = document.documentElement;

/* ───────────── пружины (iOS-подобные кривые через linear()) ───────────── */
function spring(zeta, cycles, n = 56) {
  const wd = 2 * Math.PI * cycles, w0 = wd / Math.sqrt(1 - zeta * zeta);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + (zeta * w0 / wd) * Math.sin(wd * t));
    pts.push(+x.toFixed(4));
  }
  pts[n] = 1;
  return 'linear(' + pts.join(',') + ')';
}
const supportsLinear = window.CSS && CSS.supports && CSS.supports('transition-timing-function', 'linear(0,1)');
const SPRING = supportsLinear ? spring(.55, 1.15) : 'cubic-bezier(.2,.9,.25,1.12)';
const SPRING_SOFT = supportsLinear ? spring(.78, .95) : 'cubic-bezier(.22,.9,.3,1)';
const SPRING_POP = supportsLinear ? spring(.38, 1.5) : 'cubic-bezier(.2,1.6,.3,1)';
root.style.setProperty('--spring', SPRING);
root.style.setProperty('--spring-soft', SPRING_SOFT);
const EASE_OUT = 'cubic-bezier(.16,.84,.24,1)';
const EASE_IO = 'cubic-bezier(.65,0,.35,1)';

const screen = $('#screen'), devwrap = $('#devwrap'), main = $('#main');
const scroller = $('#scroller'), mscroll = $('#mscroll'), menu = $('#menu');
let S = 1;

/* ───────────── режим: десктоп (100%, с рамкой и панелью) или мобилка (только приложение) ───────────── */
const q = new URLSearchParams(location.search);
const MOBILE = q.has('mobile') || (!q.has('desktop') && matchMedia('(pointer: coarse)').matches && Math.min(screen.width || innerWidth, innerWidth) < 760);
if (MOBILE) document.body.classList.add('mobile');
let H = 874;
function fit() {
  if (MOBILE) {
    S = innerWidth / 402; H = Math.round(innerHeight / S);
    devwrap.style.transform = `scale(${S})`;
  } else { S = 1; H = 874; devwrap.style.transform = 'none'; }
  root.style.setProperty('--h', H + 'px');
}
addEventListener('resize', fit); addEventListener('orientationchange', () => setTimeout(fit, 250)); fit();

/* ───────────── логотипы (составные векторы из Figma) ───────────── */
function logoHTML(files, insets) {
  return files.map((f, i) => `<i style="inset:${insets[i]}"><img src="assets/${f}.svg" alt=""></i>`).join('');
}
$('#logoMain').innerHTML = `<div class="dia">${logoHTML(
  ['logo_v0', 'logo_v1', 'logo_v2', 'logo_v3', 'logo_v4', 'logo_v5'],
  ['0 51.89% 85.62% 37.52%', '0 23.14% 85.62% 66.26%', '0 37.52% 85.62% 51.89%', '0 66.26% 85.62% 23.14%', '17.6% 0 0 0', '22.75% 6.25% 5.15% 6.25%'])}</div>`;
$('#logoMenu').innerHTML = $('#logoMain').innerHTML;
const LOGO_SP = logoHTML(
  ['m_sp0', 'm_sp1', 'm_sp2', 'm_sp3', 'm_sp4', 'm_sp5'],
  ['14.78% 51.9% 75.13% 37.51%', '14.78% 23.15% 75.13% 66.26%', '14.78% 37.51% 75.13% 51.9%', '14.78% 66.26% 75.13% 23.15%', '27.11% 0 15.14% 0', '30.72% 6.24% 18.75% 6.26%']);
const IMG = (src, st = 'inset:0') => `<img src="assets/${src}.svg" style="position:absolute;${st};width:auto;height:auto;max-width:none" alt="">`;
const LOGO_RUB = [
  ['m_rub1', '0.41% 13.21% 0.44% 13.21%', 1], ['m_rub1', '0.41% 13.21% 0.44% 13.21%'], ['m_rub2', '4.27% 16.73% 84.18% 16.47%'],
  ['m_rub3', '18.92% 16.72% 3.84% 16.48%'], ['m_rub4', '18.83% 34.21% 76.5% 33.96%'], ['m_rub5', '24.98% 23.03% 10.86% 22.78%'],
  ['m_rub6', '80.02% 43.83% 15.69% 43.58%'], ['m_rub7', '27.92% 30.3% 22.67% 29.26%']
].map(a => `<div style="position:absolute;inset:${a[1]}">${a[2]
  ? '<div style="position:absolute;inset:-0.39% -0.52% -0.42% -0.52%"><img src="assets/m_rub0.svg" style="position:absolute;inset:0;width:100%;height:100%;max-width:none" alt=""></div>'
  : `<img src="assets/${a[0]}.svg" style="position:absolute;inset:0;width:100%;height:100%;max-width:none" alt="">`}</div>`).join('');
const LOGO_KRS = '<img src="assets/club_krs.svg" style="position:absolute;inset:0;width:100%;height:100%;max-width:none" alt="">';
const LOGO_ROD = '<div style="position:absolute;inset:0 16.5% 0 15.97%"><img src="assets/club_rod.svg" style="position:absolute;inset:0;width:100%;height:100%;max-width:none" alt=""></div>';

/* ───────────── ромбики-пагинация ───────────── */
function makeDiamonds(el, { n = 3, off, ring, onPick }) {
  let cur = 0;
  const draw = (pop) => {
    const order = [...Array(n).keys()].reverse().filter(i => i !== cur).concat(cur);
    el.innerHTML = `<svg viewBox="0 0 59.7746 16.6648">${order.map(i => {
      const cx = 13.8873 + 16 * i, cy = 8.3324;
      return `<polygon class="${i === cur && pop ? 'pop' : ''}" points="${cx},${cy - 6} ${cx + 10},${cy} ${cx},${cy + 6} ${cx - 10},${cy}" fill="${i === cur ? '#C8102E' : off}" stroke="${ring}" stroke-width="4" paint-order="stroke" stroke-linejoin="miter"/>`;
    }).join('')}</svg>`;
  };
  el.addEventListener('click', e => {
    e.stopPropagation();
    const r = el.querySelector('svg').getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * 59.7746;
    const i = Math.max(0, Math.min(n - 1, Math.round((x - 13.8873) / 16)));
    if (i !== cur) onPick(i);
  });
  draw(false);
  return { set(i) { if (i === cur) return; cur = i; draw(true); }, get: () => cur };
}

/* ───────────── HERO: слайдер ───────────── */
const hslides = $$('.hslide');
let hIdx = 0;
const hpag = makeDiamonds($('#hpag'), { off: '#52525D', ring: '#1C1A1C', onPick: i => heroGo(i) });
function heroGo(i) {
  i = (i + hslides.length) % hslides.length;
  if (i === hIdx) return;
  const dir = i > hIdx ? 1 : -1;
  const from = hslides[hIdx], to = hslides[i];
  hIdx = i; hpag.set(i);
  from.classList.remove('on'); to.classList.add('on');
  from.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${-dir * 40}px)` }], { duration: 800, easing: EASE_OUT });
  to.animate([{ transform: `translateX(${dir * 60}px) scale(1.04)` }, { transform: 'none' }], { duration: 1100, easing: SPRING_SOFT });
  $$('.htitle,.htxt', to).forEach((el, k) => el.animate([{ opacity: 0, transform: 'translateY(26px)' }, { opacity: 1, transform: 'none' }], { duration: 1000, delay: 120 + k * 120, easing: SPRING, fill: 'backwards' }));
}
swipeable($('.hero-clip'), { onSwipe: d => heroGo(hIdx + d) });

/* общий горизонтальный свайп (мышь и палец), вертикаль отдаём скроллу */
function swipeable(el, { onSwipe, onMove, onEnd, ignore }) {
  let sx = 0, sy = 0, t0 = 0, active = false, decided = false;
  el.addEventListener('pointerdown', e => {
    if (ignore && ignore(e)) return;
    active = true; decided = false; sx = e.clientX; sy = e.clientY; t0 = performance.now();
  });
  addEventListener('pointermove', e => {
    if (!active) return;
    const dx = (e.clientX - sx) / S, dy = (e.clientY - sy) / S;
    if (!decided) {
      if (Math.hypot(dx, dy) < 7) return;
      decided = true;
      if (Math.abs(dy) > Math.abs(dx)) { active = false; return; }
      dragMoved = true;
    }
    onMove && onMove(dx);
  });
  addEventListener('pointerup', e => {
    if (!active) return; active = false;
    if (!decided) return;
    const dx = (e.clientX - sx) / S, v = dx / Math.max(1, performance.now() - t0);
    const d = (dx < -60 || v < -.45) ? 1 : (dx > 60 || v > .45) ? -1 : 0;
    if (onEnd) onEnd(d, dx); else if (d) onSwipe(d);
  });
}

/* ───────────── турнирная таблица ───────────── */
const LG = {
  kra: '<div class="lg"><img src="assets/t_kra.svg" style="inset:0;width:100%;height:100%" alt=""></div>',
  spa: '<div class="lg"><img src="assets/t_spa.svg" style="inset:14.78% 0 15.14% 0;width:100%;height:70.08%" alt=""></div>',
  dyn: '<div class="lg"><img src="assets/t_dyn.svg" style="inset:0;width:100%;height:100%" alt=""></div>',
  cska: '<div class="lg"><div style="position:absolute;inset:0 13.72% .01% 13.7%"><img src="assets/t_cska.svg" style="inset:0;width:100%;height:100%" alt=""></div></div>',
  zen: '<div class="lg"><img src="assets/t_zen.svg" style="inset:16.71% .91% 20.9% .91%;width:98.18%;height:62.39%" alt=""></div>'
};
const TABLES = [
  [['kra', 'Краснодар', 9, 6, 3, 0, 21], ['spa', 'Спартак-Москва', 9, 6, 1, 2, 19, 1], ['dyn', 'Динамо-Москва', 9, 6, 1, 2, 19], ['cska', 'ЦСКА', 9, 5, 4, 0, 19], ['zen', 'Зенит', 9, 6, 0, 3, 18]],
  [['spa', 'Спартак-Москва', 4, 3, 1, 0, 10, 1], ['cska', 'ЦСКА', 4, 3, 0, 1, 9], ['zen', 'Зенит', 4, 2, 1, 1, 7], ['kra', 'Краснодар', 4, 2, 0, 2, 6], ['dyn', 'Динамо-Москва', 4, 1, 1, 2, 4]]
];
const rowsEl = $('#rows');
function renderTable(k, animate) {
  rowsEl.innerHTML = TABLES[k].map((r, i) => `
    <div class="r row${r[7] ? ' hl' : ''}" style="--i:${i}"><p class="n">${i + 1}</p>
      <div class="cl">${LG[r[0]]}<p>${r[1]}</p></div>
      <p class="c">${r[2]}</p><p class="c">${r[3]}</p><p class="c">${r[4]}</p><p class="c">${r[5]}</p><p class="c p" data-n="${r[6]}">${r[6]}</p></div>`).join('');
  if (animate) {
    const t = $('#tbl'); t.classList.remove('in'); void t.offsetWidth; t.classList.add('in');
    $$('.p[data-n]', rowsEl).forEach((el, i) => countUp(el, +el.dataset.n, 700 + i * 60));
  }
}
function countUp(el, to, dur) {
  const t0 = performance.now();
  const step = t => { const p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
renderTable(0, false);
const seg = $('#seg');
$$('button', seg).forEach(b => b.addEventListener('click', () => {
  const k = +b.dataset.t;
  if (seg.classList.contains('cup') === !!k) return;
  seg.classList.toggle('cup', !!k); renderTable(k, true);
}));

/* ───────────── команды клуба: раскрытие карточек ───────────── */
const tcs = $$('#tcards .tc');
/* блок фиксируется (sticky), свайп вниз раскрывает карточки по очереди; одновременно открыта одна */
const teamsPin = $('#teamsPin'), teamsStick = $('#teamsStick'), PIN_EXTRA = 900;
let PIN_TOP = 179, teamIdx = -1, teamScrollIdx = -2;
function layoutPin() {          // блок команд по центру экрана; следующие блоки видны ниже и стоят вместе с ним
  const secH = $('.teams-sec').offsetHeight + (teamIdx < 0 ? 82 : 0);
  PIN_TOP = Math.round((H - secH) / 2);
  root.style.setProperty('--pin-top', PIN_TOP + 'px');
  teamsPin.style.height = (teamsStick.offsetHeight + (teamIdx < 0 ? 82 : 0) + PIN_EXTRA) + 'px';
}
function setTeam(i) {
  if (i === teamIdx) return; teamIdx = i;
  tcs.forEach((c, k) => c.classList.toggle('open', k === i));
}
function teamsOnScroll(st) {
  const p = (st + PIN_TOP - teamsPin.offsetTop) / PIN_EXTRA;
  const i = p < 0 ? -1 : Math.min(3, Math.floor(p * 4));
  if (i !== teamScrollIdx) { teamScrollIdx = i; setTeam(i); }
}
layoutPin(); addEventListener('resize', layoutPin); addEventListener('load', layoutPin);
tcs.forEach((c, k) => c.addEventListener('click', () => { if (!dragMoved) setTeam(k); }));

/* ───────────── reveal при скролле ───────────── */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  const t = e.target;
  t.classList.add('in');
  if (t.id === 'tablesec') { $('#tbl').classList.add('in'); $$('.p[data-n]', rowsEl).forEach((el, i) => countUp(el, +el.dataset.n, 900 + i * 70)); }
  io.unobserve(t);
}), { root: scroller, threshold: .14 });
$$('.rv, .stories').forEach(el => io.observe(el));
requestAnimationFrame(() => setTimeout(() => { document.body.classList.add('ready'); setTimeout(() => document.body.classList.add('done'), 2200); }, 250));

/* ───────────── параллакс героя, glass-хедер ───────────── */
const ghead = $('#ghead'), scrim = $('#scrim');
const pxEls = $$('.hero .px'), titles = $$('.hero .htitle'), txts = $$('.hero .htxt');
let raf = 0, lastSt = 0;
const tabframe = $('.tabframe');
tabframe.addEventListener('click', () => tabframe.classList.remove('mini'));
function onScroll() {
  if (raf) return;
  raf = requestAnimationFrame(() => {
    raf = 0;
    const st = scroller.scrollTop;
    if (st < 760) {
      pxEls.forEach(el => el.style.transform = `translate3d(0,${st * .32}px,0)`);
      titles.forEach(el => el.style.transform = `translate3d(0,${st * .12}px,0)`);
      if (document.body.classList.contains('done')) {
        titles.forEach(el => el.style.opacity = Math.max(0, 1 - st / 420));
        txts.forEach(el => el.style.opacity = Math.max(0, 1 - st / 240));
      }
    }
    teamsOnScroll(st);
    const dy = st - lastSt;
    if (Math.abs(dy) > 4) { tabframe.classList.toggle('mini', dy > 0 && st > 140); lastSt = st; }
    ghead.classList.toggle('show', st > 200 && !menuOpen);
    scrim.classList.toggle('show', st > 560 && !menuOpen);
  });
}
scroller.addEventListener('scroll', onScroll, { passive: true });

/* ───────────── нажатия: общий press-эффект + ripple ───────────── */
const PRESS = '.pressable,.btn,.mi,.mrow,.tab,.pr,.ring,.help .in,.soc .b';
screen.addEventListener('pointerdown', e => {
  const t = e.target.closest(PRESS);
  if (!t) return;
  t.classList.add('pressed');
  const up = () => { t.classList.remove('pressed'); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  if (t.classList.contains('btn')) {
    const r = t.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2.2 / S;
    const rp = document.createElement('i'); rp.className = 'ripple';
    rp.style.cssText = `width:${d}px;height:${d}px;left:${(e.clientX - r.left) / S - d / 2}px;top:${(e.clientY - r.top) / S - d / 2}px`;
    if (t.classList.contains('go')) rp.style.background = 'rgba(255,255,255,.28)';
    t.appendChild(rp); setTimeout(() => rp.remove(), 750);
  }
  if (t.classList.contains('tab')) { t.classList.remove('bump'); void t.offsetWidth; t.classList.add('bump'); }
});

/* ───────────── drag-скролл мышью с инерцией + горизонтальные ленты ───────────── */
let dragMoved = false;
(() => {
  let st = null;
  screen.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('#cartlayer,.peek')) return;
    st = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, lt: performance.now(), axis: null, vx: 0, vy: 0, target: null, hs: e.target.closest('.hs') };
    dragMoved = false;
  });
  addEventListener('pointermove', e => {
    if (!st) return;
    const dx = e.clientX - st.x, dy = e.clientY - st.y;
    if (!st.axis) {
      if (Math.hypot(dx, dy) < 7) return;
      st.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      st.target = st.axis === 'x' ? st.hs : (menuOpen ? mscroll : scroller);
      if (!st.target) { st = null; return; }   // горизонталь вне лент — обрабатывают карусели
      dragMoved = true;
    }
    const now = performance.now(), dt = Math.max(1, now - st.lt);
    const mx = (e.clientX - st.lx) / S, my = (e.clientY - st.ly) / S;
    if (st.axis === 'x') { st.target.scrollLeft -= mx; st.vx = -mx / dt; } else { st.target.scrollTop -= my; st.vy = -my / dt; }
    st.lx = e.clientX; st.ly = e.clientY; st.lt = now;
  });
  addEventListener('pointerup', () => {
    if (!st) return;
    const s = st; st = null;
    if (!s.axis) return;
    let v = s.axis === 'x' ? s.vx : s.vy, last = performance.now();
    const tick = t => {
      const dt = t - last; last = t; v *= Math.pow(.94, dt / 16.7);
      if (Math.abs(v) < .02) return;
      if (s.axis === 'x') s.target.scrollLeft += v * dt; else s.target.scrollTop += v * dt;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  addEventListener('pointerdown', () => { dragMoved = false; }, true);
  addEventListener('click', e => { if (dragMoved) { e.stopPropagation(); e.preventDefault(); dragMoved = false; } }, true);
})();

/* ───────────── карусель абонемента (веером, по кругу) ───────────── */
const abo = $('#abo'), slides = $$('.slide', abo);
const aPag = makeDiamonds($('#dots'), { off: '#E3E3E3', ring: '#F4F4F4', onPick: i => aTo(i) });
let aIdx = 0, aDrag = 0, aDragging = false;
const STEP = 346, ROT_L = -2.88, ROT_R = 3.34;
function aOff(k) { return ((k - aIdx + 1 + 30) % 3) - 1; }
function aLayout(anim = true) {
  slides.forEach((s, i) => {
    const off = aOff(i);
    const x = off * STEP + aDrag, o = off + aDrag / STEP;
    const rot = o < 0 ? ROT_L * Math.min(1, -o) : ROT_R * Math.min(1, o);
    const prevOff = +(s.dataset.off ?? off);
    const jump = Math.abs(off - prevOff) > 1.5;
    s.style.transition = (anim && !jump && !aDragging) ? `transform .9s ${SPRING}` : 'none';
    s.style.transform = `translateX(${x}px) rotate(${rot}deg)`;
    s.style.zIndex = off === 0 ? 2 : 1;
    s.dataset.off = off;
  });
  aPag.set(aIdx);
}
aLayout(false);
function aGo(d) { aIdx = (aIdx + d + 3) % 3; aDrag = 0; aDragging = false; aLayout(true); }
function aTo(i) { if (i === aIdx) return; const d = ((i - aIdx + 3) % 3) === 1 ? 1 : -1; aGo(d); }
swipeable(abo, {
  onMove: dx => { aDragging = true; aDrag = dx; aLayout(false); },
  onEnd: d => { aDragging = false; if (d) aGo(d); else { aDrag = 0; aLayout(true); } }
});

/* ───────────── билеты: стопка карточек с пагинацией ───────────── */
const MATCHES = [
  { hd: 'Тур 11 · Альфа-Банк Российская Премьер-Лига', opp: 'Рубин', logo: LOGO_RUB, time: '18:30', odds: ['1.56', '4.00', '5.60'], foot: '18 октября, 18:30 · Лукойл Арена' },
  { hd: 'Тур 12 · Альфа-Банк Российская Премьер-Лига', opp: 'Крылья Советов', logo: LOGO_KRS, time: '16:30', odds: ['1.72', '3.80', '4.70'], foot: '25 октября, 16:30 · Лукойл Арена' },
  { hd: '1/8 финала · FONBET Кубок России', opp: 'Родина', logo: LOGO_ROD, time: '19:45', odds: ['1.38', '5.10', '7.90'], foot: '29 октября, 19:45 · Лукойл Арена' }
];
const tkFront = $('#tkFront'), tkNext = $('#tkNext');
let mIdx = 0, mBusy = false;
function ticketHTML(m) {
  return `<div class="shape"><img src="assets/ticket_shape.svg" alt=""></div>
  <div class="cc"><div class="hd"><p>${m.hd}</p></div>
    <div class="hm"><div style="display:flex;flex-direction:column;gap:16px;width:100%">
      <div class="teams">
        <div class="tcol"><div class="mlogo"><div class="in">${LOGO_SP}</div></div><p>Спартак</p></div>
        <div class="tmid"><p class="t-p2">${m.time}</p><div class="cal"><img src="assets/m_cal.svg" alt=""></div></div>
        <div class="tcol"><div class="mlogo"><div class="in">${m.logo}</div></div><p>${m.opp}</p></div>
      </div>
      <div class="odds"><div class="wl"><img src="assets/winline_chip.svg" alt=""></div>
        <div class="og"><div><span>П1</span><b>${m.odds[0]}</b></div><div><span>×</span><b>${m.odds[1]}</b></div><div><span>П2</span><b>${m.odds[2]}</b></div></div></div>
    </div>
    <div class="buy"><button class="btn btn-outline buybtn"><span>Купить билет от 1 500 ₽</span></button><p>${m.foot}</p></div></div></div>`;
}
const mpag = makeDiamonds($('#mpag'), { off: '#E3E3E3', ring: '#F4F4F4', onPick: i => ticketGo(i, i > mIdx ? -1 : 1) });
function renderTickets() { tkFront.innerHTML = ticketHTML(MATCHES[mIdx]); tkNext.innerHTML = ticketHTML(MATCHES[(mIdx + 1) % 3]); }
renderTickets();
// dir: -1 улетает влево, 1 — вправо
async function ticketGo(target, dir) {
  if (mBusy) return; mBusy = true;
  tkNext.innerHTML = ticketHTML(MATCHES[target]);
  const cur = getComputedStyle(tkFront).transform;
  tkFront.getAnimations().forEach(a => a.cancel());
  const out = tkFront.animate([{ transform: cur === 'none' ? 'none' : cur, opacity: 1 }, { transform: `translateX(${dir * 470}px) rotate(${dir * 16}deg)`, opacity: 0 }], { duration: 420, easing: EASE_OUT, fill: 'forwards' });
  tkNext.animate([{ transform: 'translateY(10px) scale(.955)' }, { transform: 'none' }], { duration: 900, easing: SPRING });
  $('#tkB1').animate([{ translate: '0 0' }, { translate: '0 6px' }, { translate: '0 0' }], { duration: 700, easing: EASE_IO });
  mIdx = target; mpag.set(target);
  await out.finished.catch(() => {});
  tkFront.innerHTML = ticketHTML(MATCHES[mIdx]);
  out.cancel(); tkFront.style.transform = ''; tkFront.style.opacity = '';
  tkNext.innerHTML = ticketHTML(MATCHES[(mIdx + 1) % 3]);
  mBusy = false;
}
swipeable(tkFront, {
  ignore: e => !!e.target.closest('.buybtn'),
  onMove: dx => {
    if (mBusy) return;
    const want = dx < 0 ? (mIdx + 1) % 3 : (mIdx + 2) % 3;
    if (tkNext.dataset.k != want) { tkNext.innerHTML = ticketHTML(MATCHES[want]); tkNext.dataset.k = want; }
    tkFront.style.transition = 'none'; tkFront.style.transform = `translateX(${dx}px) rotate(${dx * .05}deg)`;
  },
  onEnd: (d, dx) => {
    if (mBusy) return;
    delete tkNext.dataset.k;
    if (Math.abs(dx) > 70 || d) ticketGo(dx < 0 ? (mIdx + 1) % 3 : (mIdx + 2) % 3, dx < 0 ? -1 : 1);
    else { tkFront.style.transition = `transform .8s ${SPRING}`; tkFront.style.transform = ''; tkNext.innerHTML = ticketHTML(MATCHES[(mIdx + 1) % 3]); }
  }
});
$('#matchsec').addEventListener('click', e => { if (e.target.closest('#tkFront .buybtn')) openCart(); });

/* ───────────── главный блок: корзина и меню под ним ───────────── */
let cartOpen = false, menuOpen = false, cartBusy = false, timerId = 0, left = 14 * 60 + 59;
const tmr = $('#tmr'), bdg = $('#bdg'), flyer = $('#flyer'), cartbar = $('#cartbar');
const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
function startTimer() { clearInterval(timerId); left = 14 * 60 + 59; tmr.textContent = fmt(left); timerId = setInterval(() => { left = Math.max(0, left - 1); tmr.textContent = fmt(left); }, 1000); }
function rectIn(el) { const r = el.getBoundingClientRect(), s = screen.getBoundingClientRect(); return { x: (r.left - s.left) / S, y: (r.top - s.top) / S, w: r.width / S, h: r.height / S }; }

/* перевод главного блока в новое состояние с анимацией */
function setState(kind, opts = {}) {
  const from = getComputedStyle(main).transform;
  main.getAnimations().filter(a => a.id === 'mv').forEach(a => a.cancel());
  screen.classList.toggle('st-cart', cartOpen);
  screen.classList.toggle('st-menu', menuOpen);
  if (opts.instant) return;
  const to = getComputedStyle(main).transform;
  const f = from === 'none' ? 'matrix(1,0,0,1,0,0)' : from, t = to === 'none' ? 'matrix(1,0,0,1,0,0)' : to;
  let kf, dur, easing = 'linear';
  if (kind === 'menu-open') {        // блок поднимается (3D ближе к нам) и уходит вниз
    kf = [{ transform: f, easing: 'cubic-bezier(.3,.0,.2,1)' }, { transform: `${f} translateY(-26px) scale(1.045)`, offset: .26, easing: 'cubic-bezier(.45,0,.2,1)' }, { transform: t }];
    dur = 1150;
  } else if (kind === 'menu-close') {  // поднимается снизу, «зависает» выше уровнем и ложится на место
    kf = [{ transform: f, easing: 'cubic-bezier(.4,0,.2,1)' }, { transform: `${t} translateY(-18px) scale(1.04)`, offset: .62, easing: 'cubic-bezier(.3,0,.25,1)' }, { transform: t }];
    dur = 1100;
  } else { kf = [{ transform: f }, { transform: t }]; dur = 950; easing = SPRING_SOFT; }
  if (kind.startsWith('menu')) {
    main.classList.add('lift');
    setTimeout(() => main.classList.remove('lift'), dur * .62);
  }
  const a = main.animate(kf, { duration: dur, easing }); a.id = 'mv';
  return a;
}

async function openCart() {
  if (cartOpen || cartBusy) return;
  if (menuOpen) await closeMenu();
  cartBusy = true;
  const btn = $('#tkFront .buybtn'), r = rectIn(btn);
  const sx = r.x + r.w / 2 - 18, sy = r.y + r.h / 2 - 18, ex = 38 - 18, ey = H - 42 - 18;
  const fl = flyer.animate([
    { transform: `translate(${sx}px,${sy}px) scale(.3)`, opacity: 0, offset: 0 },
    { transform: `translate(${sx}px,${sy - 24}px) scale(1.15)`, opacity: 1, offset: .22 },
    { transform: `translate(${(sx + ex) / 2 + 40}px,${Math.min(sy, ey) - 80}px) scale(1)`, opacity: 1, offset: .55 },
    { transform: `translate(${ex}px,${ey}px) scale(.7)`, opacity: 1, offset: .93 },
    { transform: `translate(${ex}px,${ey}px) scale(.2)`, opacity: 0, offset: 1 }], { duration: 950, easing: 'cubic-bezier(.45,0,.3,1)' });
  btn.animate([{ boxShadow: '0 0 0 0 rgba(200,16,46,.45)' }, { boxShadow: '0 0 0 16px rgba(200,16,46,0)' }], { duration: 900, easing: EASE_OUT });
  await wait(160);
  cartOpen = true; setState('cart');           // весь блок съезжает вверх, под ним — корзина
  await fl.finished.catch(() => {});
  bdg.classList.remove('pop'); void bdg.offsetWidth; bdg.classList.add('pop');
  $('.ci').animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3) rotate(-8deg)' }, { transform: 'scale(1)' }], { duration: 650, easing: SPRING_POP });
  startTimer(); cartBusy = false;
}
function closeCart(instant) {
  if (!cartOpen) return;
  cartOpen = false; clearInterval(timerId);
  setState('cart', { instant });
}
$('#goBtn').addEventListener('click', () => { $('#goBtn').animate([{ transform: 'scale(1)' }, { transform: 'scale(.94)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }], { duration: 520, easing: EASE_OUT }); });
// свайп вниз по корзине опускает главный блок обратно
(() => {
  let sy = 0, active = false, dy = 0;
  cartbar.addEventListener('pointerdown', e => { if (e.target.closest('#goBtn') || !cartOpen) return; active = true; sy = e.clientY; dy = 0; });
  addEventListener('pointermove', e => { if (!active) return; dy = Math.max(0, (e.clientY - sy) / S); main.style.transition = 'none'; main.style.bottom = `${84 - Math.min(84, dy * .9)}px`; });
  addEventListener('pointerup', () => {
    if (!active) return; active = false;
    main.style.transition = ''; main.style.bottom = '';
    if (dy > 40) closeCart(); else setState('cart');
  });
})();

async function openMenu() {
  if (menuOpen) return;
  menuOpen = true;
  ghead.classList.remove('show'); scrim.classList.remove('show');
  mscroll.scrollTop = 0;
  menu.classList.remove('open'); void menu.offsetWidth; menu.classList.add('open');
  setState('menu-open');
  await wait(1000);
}
async function closeMenu(instant) {
  if (!menuOpen) return;
  menuOpen = false;
  setState('menu-close', { instant });
  if (!instant) await wait(1000);
  if (!menuOpen) menu.classList.remove('open');
  onScroll();
}
$('#openMenu').addEventListener('click', openMenu);
$('#openMenu2').addEventListener('click', openMenu);
$('#closeMenu').addEventListener('click', () => closeMenu());
$('#peek').addEventListener('click', () => closeMenu());

/* ───────────── демо-сценарий ───────────── */
const touch = $('#touch');
let demoOn = false, token = 0;
const alive = my => demoOn && my === token;
function touchTo(x, y, dur = 650) {
  const cur = touch._p || { x: 201, y: 760 };
  touch.getAnimations().filter(a => a.id === 'mv').forEach(a => a.cancel());
  const a = touch.animate([{ transform: `translate(${cur.x}px,${cur.y}px)` }, { transform: `translate(${x}px,${y}px)` }], { duration: dur, easing: EASE_IO, fill: 'forwards' }); a.id = 'mv';
  touch._p = { x, y };
}
function touchShow(v) { touch.style.transition = 'opacity .3s'; touch.style.opacity = v ? '1' : '0'; }
function touchDown(v) { touch.classList.toggle('down', v); touch.animate([{ scale: v ? 1 : .82 }, { scale: v ? .82 : 1 }], { duration: 140, fill: 'forwards', easing: EASE_OUT }); }
const fire = (el, type, x, y) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType: 'touch', clientX: x, clientY: y }));
async function tap(el, my, off = {}) {
  const r = rectIn(el), x = r.x + r.w / 2 + (off.x || 0), y = r.y + r.h / 2 + (off.y || 0);
  touchShow(true); touchTo(x, y, 700); await wait(760); if (!alive(my)) return;
  const sr = screen.getBoundingClientRect(), cx = sr.left + x * S, cy = sr.top + y * S;
  touchDown(true); fire(el, 'pointerdown', cx, cy); await wait(150);
  touchDown(false); fire(el, 'pointerup', cx, cy);
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: cx, clientY: cy }));
  await wait(220); touchShow(false);
}
async function swipeX(el, my, dx = -150) {     // горизонтальный свайп пальцем по элементу
  const r = rectIn(el), x = r.x + r.w / 2 + 60, y = r.y + r.h * .42;
  touchShow(true); touchTo(x, y, 600); await wait(650); if (!alive(my)) return;
  const sr = screen.getBoundingClientRect(), X = v => sr.left + v * S, Y = sr.top + y * S;
  touchDown(true); fire(el, 'pointerdown', X(x), Y);
  const steps = 14;
  for (let i = 1; i <= steps; i++) {
    const k = i / steps, nx = x + dx * (1 - Math.pow(1 - k, 2));
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: X(nx), clientY: Y, pointerType: 'touch' }));
    touch.getAnimations().filter(a => a.id === 'mv').forEach(a => a.cancel());
    touch.style.transform = `translate(${nx}px,${y}px)`; touch._p = { x: nx, y };
    await wait(16);
  }
  window.dispatchEvent(new PointerEvent('pointerup', { clientX: X(x + dx), clientY: Y, pointerType: 'touch' }));
  touchDown(false); dragMoved = false; await wait(260); touchShow(false);
}
function cubic(x1, y1, x2, y2) {
  const f = t => 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
  const g = t => 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
  return x => { let lo = 0, hi = 1, m; for (let i = 0; i < 24; i++) { m = (lo + hi) / 2; f(m) < x ? lo = m : hi = m; } return g((lo + hi) / 2); };
}
const bez = cubic(.65, 0, .35, 1);
function scrollAnim(el, to, dur) {
  const from = el.scrollTop, c = el.scrollHeight - el.clientHeight; to = Math.max(0, Math.min(c, to));
  return new Promise(res => { const t0 = performance.now(); const step = t => { const p = Math.min(1, (t - t0) / dur); el.scrollTop = from + (to - from) * bez(p); if (p < 1) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); });
}
async function swipeScroll(el, to, dur, my) {
  const up = to > el.scrollTop; const y0 = up ? 640 : 300, y1 = up ? 300 : 640;
  touchShow(true); touchTo(201, y0, 450); await wait(480); if (!alive(my)) return;
  touchDown(true);
  touch.getAnimations().filter(a => a.id === 'mv').forEach(a => a.cancel());
  const t0 = performance.now(); const p = scrollAnim(el, to, dur);
  const mv = t => { const k = Math.min(1, (t - t0) / dur); touch.style.transform = `translate(201px,${y0 + (y1 - y0) * (1 - Math.pow(1 - k, 2))}px)`; if (k < 1 && alive(my)) requestAnimationFrame(mv); };
  touch._p = { x: 201, y: y1 }; requestAnimationFrame(mv);
  await p; touchDown(false); touch.style.transform = `translate(201px,${y1}px)`;
  await wait(250); touchShow(false);
}
async function resetAll() {
  closeCart(true); await closeMenu(true); menu.classList.remove('open');
  main.getAnimations().forEach(a => a.cancel());
  scroller.scrollTop = 0; mscroll.scrollTop = 0; renderTable(0, false); seg.classList.remove('cup');
  tabframe.classList.remove('mini'); lastSt = 0;
  aIdx = 0; aLayout(false); teamIdx = -1; teamScrollIdx = -2; tcs.forEach(c => c.classList.remove('open'));
  mIdx = 0; renderTickets(); mpag.set(0);
  if (hIdx) { hslides[hIdx].classList.remove('on'); hslides[0].classList.add('on'); hIdx = 0; hpag.set(0); }
  touchShow(false); touch.getAnimations().forEach(a => a.cancel()); touch._p = null;
  $('#tbl').classList.add('in');
}
async function demo() {
  if (demoOn) { stopDemo(); return; }
  demoOn = true; const my = ++token; setDemoBtn(true);
  await resetAll(); await wait(500); if (!alive(my)) return;
  const matchsec = $('#matchsec'), table = $('#tablesec'), teams = $('#tcards').closest('section');
  const abosec = $('#abo').closest('section');
  await wait(900); if (!alive(my)) return;
  await tap($('#hpag'), my, { x: 0 }); if (!alive(my)) return;          // пагинация героя
  await wait(1500); await tap($('#hpag'), my, { x: -16 }); if (!alive(my)) return;
  await wait(1200);
  await swipeScroll(scroller, matchsec.offsetTop - 120, 1500, my); if (!alive(my)) return;
  await wait(400);
  await swipeX($('#tkFront'), my, -170); if (!alive(my)) return;       // листаем билеты
  await wait(1100); await tap($('#mpag'), my, { x: -16 }); if (!alive(my)) return;
  await wait(1100);
  await tap($('#tkFront .buybtn'), my); if (!alive(my)) return;        // корзина
  await wait(2300); if (!alive(my)) return;
  await swipeScroll(scroller, table.offsetTop - 110, 1500, my); if (!alive(my)) return;
  await wait(400); await tap($$('#seg button')[1], my); if (!alive(my)) return;
  await wait(1300); await tap($$('#seg button')[0], my); if (!alive(my)) return;
  await wait(600);
  await swipeScroll(scroller, teamsPin.offsetTop - PIN_TOP - 40, 1500, my); if (!alive(my)) return;
  await wait(300);                                                     // блок зафиксирован — карточки раскрываются свайпом
  for (let k = 1; k <= 4; k++) { await swipeScroll(scroller, teamsPin.offsetTop - PIN_TOP + PIN_EXTRA * k / 4 - 40, 900, my); if (!alive(my)) return; await wait(450); }
  await wait(400);
  await swipeScroll(scroller, teamsPin.offsetTop + PIN_EXTRA + abosec.offsetTop - 220, 1600, my); if (!alive(my)) return;
  await wait(300); await swipeX(abo, my, -160); if (!alive(my)) return;
  await wait(1100); await tap($('#dots'), my, { x: -16 }); if (!alive(my)) return;
  await wait(1100);
  await swipeScroll(scroller, scroller.scrollHeight, 2400, my); if (!alive(my)) return;
  await wait(700);
  await swipeScroll(scroller, 0, 2400, my); if (!alive(my)) return;
  await wait(400);
  await tap($('#openMenu'), my); if (!alive(my)) return;              // меню: блок уходит вниз, корзина прячется
  await wait(1600); if (!alive(my)) return;
  await swipeScroll(mscroll, mscroll.scrollHeight, 2300, my); if (!alive(my)) return;
  await wait(600); await swipeScroll(mscroll, 0, 1600, my); if (!alive(my)) return;
  await wait(400); await tap($('#closeMenu'), my); if (!alive(my)) return;
  await wait(1700); if (!alive(my)) return;
  // закрываем корзину свайпом вниз
  touchShow(true); touchTo(201, H - 42, 700); await wait(760); if (!alive(my)) return;
  touchDown(true); touch.getAnimations().filter(a => a.id === 'mv').forEach(a => a.cancel());
  touch.animate([{ transform: `translate(201px,${H - 42}px)` }, { transform: `translate(201px,${H + 26}px)` }], { duration: 380, easing: EASE_OUT, fill: 'forwards' });
  await wait(300); closeCart(); await wait(240); touchDown(false); touchShow(false);
  await wait(1200);
  demoOn = false; setDemoBtn(false);
}
function stopDemo() { demoOn = false; token++; setDemoBtn(false); touchShow(false); }
function setDemoBtn(on) { const b = $('#bDemo'); b.querySelector('span').textContent = on ? 'Стоп' : 'Демо'; b.classList.toggle('on', on); b.classList.toggle('primary', !on); }

/* ───────────── HUD и клавиши ───────────── */
$('#hud').addEventListener('pointerup', () => setTimeout(() => document.activeElement && document.activeElement.blur(), 0));
$('#bDemo').addEventListener('click', demo);
$('#bCart').addEventListener('click', () => { stopDemo(); cartOpen ? closeCart() : openCart(); });
$('#bMenu').addEventListener('click', () => { stopDemo(); menuOpen ? closeMenu() : openMenu(); });
$('#bReset').addEventListener('click', () => { stopDemo(); resetAll(); });
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (e.code === 'Space') { e.preventDefault(); demo(); }
  else if (k === 'c' || k === 'с') { stopDemo(); cartOpen ? closeCart() : openCart(); }
  else if (k === 'm' || k === 'ь') { stopDemo(); menuOpen ? closeMenu() : openMenu(); }
  else if (k === 'r' || k === 'к') { stopDemo(); resetAll(); }
  else if (k === 'arrowright') heroGo(hIdx + 1);
  else if (k === 'arrowleft') heroGo(hIdx - 1);
  else if (k === 'escape') { stopDemo(); if (menuOpen) closeMenu(); else if (cartOpen) closeCart(); }
});

window.__app = { openCart, closeCart, openMenu, closeMenu, demo, resetAll, heroGo, ticketGo };
})();
