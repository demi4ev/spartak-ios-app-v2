(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const A = 'assets/';
  // masks are inlined so they also work when the page is opened via file://
  const RUB_MASK = `url('data:image/svg+xml,%3Csvg%20preserveAspectRatio%3D%22none%22%20overflow%3D%22visible%22%20style%3D%22display%3A%20block%3B%22%20width%3D%2250.5981%22%20height%3D%2268%22%20viewBox%3D%220%200%2050.5981%2068%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%3Cg%20id%3D%22clip0_10403_3649%22%3E%0A%3Cpath%20id%3D%22Vector%22%20d%3D%22M50.5981%200H0V68H50.5981V0Z%22%20fill%3D%22black%22%2F%3E%0A%3C%2Fg%3E%0A%3C%2Fsvg%3E')`;
  const CSKA_MASK = `url('data:image/svg+xml,%3Csvg%20preserveAspectRatio%3D%22none%22%20overflow%3D%22visible%22%20style%3D%22display%3A%20block%3B%22%20width%3D%2217.4238%22%20height%3D%2224%22%20viewBox%3D%220%200%2017.4238%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%3Cg%20id%3D%22clip0_10403_3679%22%3E%0A%3Cpath%20id%3D%22Vector%22%20d%3D%22M17.4238%200H0V24H17.4238V0Z%22%20fill%3D%22black%22%2F%3E%0A%3C%2Fg%3E%0A%3C%2Fsvg%3E')`;
  const phone = $('#phone');
  const hbar = $('#hbar');

  /* ================= logos ================= */
  const part = (src, inset) => `<span class="logo-part" style="inset:${inset}"><img src="${A}${src}" alt=""></span>`;
  const LOGOS = {
    spartak: () => '<i>' + [
      ['logo-v1.svg', '0 51.89% 85.62% 37.52%'], ['logo-v2.svg', '0 23.14% 85.62% 66.26%'],
      ['logo-v3.svg', '0 37.52% 85.62% 51.89%'], ['logo-v4.svg', '0 66.26% 85.62% 23.14%'],
      ['logo-v5.svg', '17.6% 0 0 0'], ['logo-v6.svg', '22.75% 6.25% 5.15% 6.25%'],
    ].map(([s, i]) => part(s, i)).join('') + '</i>',
    'spartak-m': () => [
      ['m-logo-1.svg', '14.78% 51.9% 75.13% 37.51%'], ['m-logo-2.svg', '14.78% 23.15% 75.13% 66.26%'],
      ['m-logo-3.svg', '14.78% 37.51% 75.13% 51.9%'], ['m-logo-4.svg', '14.78% 66.26% 75.13% 23.15%'],
      ['m-logo-5.svg', '27.11% 0 15.14% 0'], ['m-logo-6.svg', '30.72% 6.24% 18.75% 6.26%'],
    ].map(([s, i]) => part(s, i)).join(''),
    kra: () => `<img class="fill" src="${A}club-kra.svg" alt="">`,
    bal: () => `<img class="fill" src="${A}club-bal.svg" alt="">`,
    rod: () => `<span class="logo-part" style="inset:0 16.5% 0 15.97%"><img src="${A}rod.svg" alt=""></span>`,
    rubin: () => [
      ['rub-1.svg', '.41% 13.21% .44% 13.21%', '-0.279px -0.279px', true],
      ['rub-2.svg', '.41% 13.21% .44% 13.21%', '-0.279px -0.279px'],
      ['rub-3.svg', '4.27% 16.73% 84.18% 16.47%', '-2.502px -2.903px'],
      ['rub-4.svg', '18.92% 16.72% 3.84% 16.48%', '-2.503px -12.866px'],
      ['rub-5.svg', '18.83% 34.21% 76.5% 33.96%', '-14.393px -12.805px'],
      ['rub-6.svg', '24.98% 23.03% 10.86% 22.78%', '-6.793px -16.989px'],
      ['rub-7.svg', '80.02% 43.83% 15.69% 43.58%', '-20.936px -54.411px'],
      ['rub-8.svg', '27.92% 30.3% 22.67% 29.26%', '-11.197px -18.984px'],
    ].map(([s, i, m, pad]) => `<span class="rub-part" style="inset:${i};-webkit-mask-image:${RUB_MASK};mask-image:${RUB_MASK};-webkit-mask-position:${m};mask-position:${m}">${pad ? `<span class="rub-in"><img src="${A}${s}" alt=""></span>` : `<img src="${A}${s}" alt="">`}</span>`).join(''),
  };
  const fillLogos = (root = document) => $$('[data-logo]', root).forEach(el => { if (!el.childElementCount) el.innerHTML = LOGOS[el.dataset.logo](); });

  /* ================= decks: stacked cards that loop like a folder ================= */
  const num = (el, v) => parseFloat(getComputedStyle(el).getPropertyValue(v));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  function createDeck(el, { onChange, axes = 'x', outX = 'translate(-112%, -3%) rotate(-11deg)', outY = 'translateY(-118%) rotate(2deg)', onExit } = {}) {
    const cards = $$('.dcard', el);
    const n = cards.length;
    let order = cards.map((_, i) => i);
    let busy = false;
    const OUTS = { x: outX, y: outY };
    const back = () => `translateY(${num(el, '--y2')}px) scale(${num(el, '--s2')})`;
    const layout = () => {
      order.forEach((ci, pos) => { cards[ci].dataset.pos = Math.min(pos, 2); });
      onChange && onChange(order[0]);
    };
    layout();

    function next(dir = 'x') {
      if (busy || n < 2) return; busy = true;
      const f = cards[order[0]];
      const startT = f.style.transform || 'none';
      f.classList.add('flying'); f.style.transition = ''; f.style.transform = ''; f.style.zIndex = 4;
      order.push(order.shift()); layout();
      const anim = f.animate([
        { transform: startT, offset: 0, easing: 'cubic-bezier(.3,.7,.25,1)' },
        { transform: OUTS[dir], offset: .4, easing: 'cubic-bezier(.5,0,.25,1)' },
        { transform: back(), offset: 1 },
      ], { duration: 1050 });
      setTimeout(() => { f.style.zIndex = ''; }, 420);
      anim.onfinish = anim.oncancel = () => { f.classList.remove('flying'); f.style.zIndex = ''; busy = false; };
    }
    function prev(dir = 'x') {
      if (busy || n < 2) return; busy = true;
      const b = cards[order[n - 1]];
      b.classList.add('flying'); b.style.zIndex = 0;
      const f = cards[order[0]]; f.style.transition = ''; f.style.transform = '';
      order.unshift(order.pop()); layout();
      const anim = b.animate([
        { transform: back(), offset: 0, easing: 'cubic-bezier(.5,0,.25,1)' },
        { transform: OUTS[dir], offset: .45, easing: 'cubic-bezier(.2,.7,.2,1)' },
        { transform: 'none', offset: 1 },
      ], { duration: 1000 });
      setTimeout(() => { b.style.zIndex = 4; }, 440);
      anim.onfinish = anim.oncancel = () => { b.classList.remove('flying'); b.style.zIndex = ''; busy = false; };
    }

    // swipe: horizontal always loops; vertical (hero) walks 1 → 3 and then leaves the banner
    const horiz = axes.includes('x'), vert = axes.includes('y');
    let sx, sy, dx = 0, dy = 0, t0, mode = null, id = null;
    el.addEventListener('pointerdown', e => {
      if (busy || !e.target.closest('.dcard[data-pos="0"]')) return;
      sx = e.clientX; sy = e.clientY; dx = dy = 0; t0 = performance.now(); mode = null; id = e.pointerId;
    });
    window.addEventListener('pointermove', e => {
      if (id !== e.pointerId) return;
      const ddx = e.clientX - sx, ddy = e.clientY - sy;
      if (!mode) {
        if (horiz && Math.abs(ddx) > 6 && Math.abs(ddx) >= Math.abs(ddy)) mode = 'x';
        else if (vert && Math.abs(ddy) > 6 && Math.abs(ddy) > Math.abs(ddx)) mode = 'y';
        else if (!vert && Math.abs(ddy) > 6) { id = null; return; }
        else return;
        try { el.setPointerCapture?.(e.pointerId); } catch (_) {} el.classList.add('is-dragging');
      }
      dx = ddx; dy = ddy;
      const f = cards[order[0]];
      f.style.transition = 'none';
      if (mode === 'x') f.style.transform = `translateX(${dx}px) rotate(${dx * .03}deg)`;
      else f.style.transform = `translateY(${dy}px) scale(${1 - Math.min(Math.abs(dy), 300) / 3000})`;
      el.style.setProperty('--k', Math.min(Math.abs(mode === 'x' ? dx : dy) / 220, 1).toFixed(3));
    });
    const end = e => {
      if (id !== e.pointerId) return;
      id = null;
      if (!mode) return;
      dragMoved = true; setTimeout(() => { dragMoved = false; }, 0);
      const f = cards[order[0]];
      const d = mode === 'x' ? dx : dy;
      const v = d / Math.max(performance.now() - t0, 1);
      el.classList.remove('is-dragging'); el.style.setProperty('--k', 0);
      const settle = () => { f.style.transition = ''; f.style.transform = ''; };
      if (mode === 'x') {
        if (d < -80 || v < -.5) next('x'); else if (d > 80 || v > .5) prev('x'); else settle();
      } else {
        if (d < -70 || v < -.5) { if (order[0] === n - 1) { settle(); onExit && onExit(); } else next('y'); }
        else if (d > 70 || v > .5) { if (order[0] > 0) prev('y'); else settle(); }
        else settle();
      }
      mode = null;
      el.dispatchEvent(new CustomEvent('deck-user'));
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);

    return { el, cards, next, prev, get index() { return order[0]; } };
  }

  /* ================= ambient backdrop (Apple Sports-like) =================
     A red-black glow behind every screen, fixed to the viewport. Like Ambilight it takes on the colours
     of what is in the middle of the screen — the current hero slide, the front ticket's stadium, or a
     section palette — always pulled towards the club red and darkened, and eased over about a second. */
  const ambient = (() => {
    const el = $('#ambient');
    const RED = [200, 16, 46];
    const tone = (c, k, v) => { const m = c.map((x, i) => x * (1 - k) + RED[i] * k), mx = Math.max(...m, 1); return m.map(x => x / mx * v); };
    const PAL = {
      def: [[170, 16, 40], [72, 10, 22], [38, 14, 24]],
      table: [[176, 18, 40], [70, 10, 22], [36, 18, 30]],
      abon: [[214, 20, 48], [118, 8, 24], [60, 6, 16]],
      teams: [[188, 16, 42], [92, 8, 22], [46, 10, 18]],
      media: [[156, 4, 18], [104, 0, 12], [50, 4, 12]],
      merch: [[148, 24, 44], [62, 16, 26], [34, 24, 36]],
      all: [[124, 16, 32], [54, 10, 20], [30, 20, 30]],
    };
    // average colours of a picture's top / middle / bottom thirds (alpha-weighted)
    const cache = new WeakMap();
    const cv = document.createElement('canvas'); cv.width = cv.height = 24;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    function sample(img) {
      if (!img) return null;
      if (cache.has(img)) return cache.get(img);
      if (!img.complete || !img.naturalWidth) { img.addEventListener('load', refresh, { once: true }); return null; }
      let out = null;
      try {
        cx.clearRect(0, 0, 24, 24); cx.drawImage(img, 0, 0, 24, 24);
        const d = cx.getImageData(0, 0, 24, 24).data;
        out = [0, 1, 2].map(b => {
          const s = [0, 0, 0, 0];
          for (let i = b * 8 * 24 * 4; i < (b + 1) * 8 * 24 * 4; i += 4) { const a = d[i + 3] / 255; s[0] += d[i] * a; s[1] += d[i + 1] * a; s[2] += d[i + 2] * a; s[3] += a; }
          return s[3] > 1 ? s.slice(0, 3).map(v => v / s[3]) : RED;
        });
      } catch (_) { out = null; } // a file:// page taints the canvas → the red palette is used instead
      cache.set(img, out);
      return out;
    }
    const fromImg = img => { const s = sample(img); return s ? [tone(s[0], .5, 190), tone(s[1], .42, 100), tone(s[2], .36, 62)] : PAL.def; };
    function target() {
      const sc = $('.screen.is-active .scroller');
      if (!sc) return PAL.def;
      const pr = phone.getBoundingClientRect(), y = pr.top + pr.height * .42;
      let node = null, best = Infinity;
      $$('[data-amb]', sc).forEach(s => {
        const r = s.getBoundingClientRect(), d = r.top <= y && r.bottom >= y ? -1 : Math.min(Math.abs(r.top - y), Math.abs(r.bottom - y));
        if (d < best) { best = d; node = s; }
      });
      if (!node) return PAL.def;
      const key = node.dataset.amb;
      if (key === 'hero') return fromImg($('.dcard[data-pos="0"] .s-media img', node));
      if (key === 'match') return fromImg($('.tk[data-pos="0"] .tk__photo img', node));
      return PAL[key] || PAL.def;
    }
    const cur = PAL.def.map(c => c.slice());
    let tgt = PAL.def, raf = 0, last = 0, pend = 0;
    const paint = () => cur.forEach((c, i) => el.style.setProperty(`--a${i + 1}`, `rgb(${c.map(Math.round).join(' ')})`));
    function step(now) {
      const k = 1 - Math.exp(-Math.min(now - last, 64) / 650);
      last = now;
      let moving = false;
      cur.forEach((c, i) => c.forEach((v, j) => { const d = tgt[i][j] - v; if (Math.abs(d) > .4) moving = true; c[j] = v + d * k; }));
      paint();
      raf = moving ? requestAnimationFrame(step) : 0;
    }
    function refresh() {
      if (pend) return;
      pend = requestAnimationFrame(() => {
        pend = 0; tgt = target();
        if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); }
      });
    }
    paint();
    return { refresh };
  })();

  /* ---------- hero ---------- */
  const SLIDES = [
    { photo: 'slide-1-v2.webp', act: ['play', 'icon-play.svg', 24, 'Смотреть видео'], date: '16 сентября 22:11', cat: 'Пресс-конференции', title: 'Карседо: «Играем первым номером»', cap: 'Карседо: «Играем первым номером»', desc: 'Пресс-конференция главного тренера красно-белых Хуана Карлоса Карседо после домашней победы.' },
    { bg: 'slide-2-bg.webp', photo: 'slide-2.webp', crop: 'height:138.18%;left:-80.5%;top:0;width:261%', act: ['buy-jersey', 'icon-bag.svg', 20, 'Купить'], date: '13 сентября 16:27', cat: 'Мерч', title: 'Новая ретро-джерси', cap: 'Новая ретро-джерси', desc: 'Ретро-форма уже в продаже. Количество ограничено · 6 990 ₽.' },
    { bg: 'slide-3-bg.webp', photo: 'slide-3.webp', act: ['read', 'icon-arrow-r.svg', 20, 'Читать'], date: '9 сентября 8:49', cat: 'Новости', title: 'Лучшие игроки месяца', mid: true, cap: 'Лучшие игроки месяца', desc: 'Игроки нашей команды в числе лучших игроков лиги в сентябре.' },
  ];
  // The soft edges are blurred copies of the slide's own picture under gradient masks (not a masked
  // backdrop-filter: Chrome drops that mask in several compositing cases and draws a hard edge).
  // The picture is a full-screen-tall layer pinned to the card's bottom edge, so while the card collapses
  // from full screen to the inset stack the photo slides inside it (and keeps a slower parallax after).
  // The bottom copies live inside .s-media; the top copy sits at the card's top edge and is shifted by the
  // same amount, so all copies share the Ken Burns zoom (.s-kb) and stay pixel-aligned.
  const SOFT = ['s-soft--bot1', 's-soft--bot2'];
  const slideMedia = sl => `${sl.bg ? `<img class="s-bg" src="${A}${sl.bg}" alt="">` : ''}<img class="s-photo ${sl.fill ? 's-photo--fill' : ''} ${sl.crop ? 's-photo--crop' : ''} ${sl.mid ? 's-photo--mid' : ''} ${sl.top ? 's-photo--top' : ''}" src="${A}${sl.photo}" alt="">`;
  const deckEl = $('#deck');
  deckEl.innerHTML = SLIDES.map((sl, i) => `
    <article class="dcard slide" data-pos="${i}">
      <div class="s-media"><div class="s-kb">${slideMedia(sl)}${SOFT.map(c => `<div class="s-soft ${c}"><div class="s-soft__in">${slideMedia(sl)}</div></div>`).join('')}</div></div>
      <div class="s-softtop"><div class="s-softtop__pos"><div class="s-kb"><div class="s-soft__in">${slideMedia(sl)}</div></div></div></div>
      <div class="s-shade-top"></div><div class="s-shade-bot"></div>
      <div class="s-head"><p class="t-meta">${sl.date} &nbsp;·&nbsp; ${sl.cat}</p><h2>${sl.title}</h2></div>
      <div class="s-foot"><button class="s-act tap ${sl.act[0] === 'play' ? 's-act--video' : ''}" data-action="${sl.act[0]}" aria-label="${sl.act[3]}"><img src="${A}${sl.act[1]}" width="${sl.act[2]}" height="${sl.act[2]}" alt=""></button><p class="s-desc">${sl.desc}</p></div>
      <div class="s-back"><p><b>${sl.cap}</b><span>·</span><span>${sl.date}</span></p></div>
    </article>`).join('');
  // diamond pagination (Figma slider-pagination): three elongated diamonds, the current one red
  const setDpag = (el, i) => $$('i', el).forEach((d, k) => d.classList.toggle('on', k === i));
  const heroDpag = $('#hero-dpag');
  const restartKenBurns = el => $$('.s-kb', el).forEach(m => { m.style.animation = 'none'; m.offsetWidth; m.style.animation = ''; });
  let heroReady = false;
  const heroDeck = createDeck(deckEl, { axes: 'xy', onExit: () => $('#home-scroller').scrollTo({ top: 640, behavior: 'smooth' }), onChange: i => {
    setDpag(heroDpag, i);
    ambient.refresh();
    if (heroReady) restartKenBurns(heroDeck.cards[i]);
  } });
  heroReady = true;
  const cards = heroDeck.cards;

  let autoT;
  const heroVisible = { v: true };
  const schedule = () => { clearTimeout(autoT); autoT = setTimeout(() => { if (canAuto()) heroDeck.next('x'); schedule(); }, 6500); };
  const canAuto = () => heroVisible.v && !menuOpen && !storyOpen && currentTab === 'home' && !document.hidden && $('#home-scroller').scrollTop < 30;
  deckEl.addEventListener('deck-user', schedule);

  /* ---------- matches: tickets (Figma 4088:3996) ----------
     The main ticket sits in the middle, the next and the previous ones peek out from behind it on the
     right and on the left (photo only, dimmed, trimmed top and bottom). When the block scrolls into view
     the side tickets fan out from behind the main one; a swipe (or a tap on a side ticket) swaps them:
     the side ticket comes to the front, the front one steps aside, the third passes behind to the other side. */
  const MATCHES = [
    { id: 'rub', l: ['spartak-m', 'Спартак'], r: ['rubin', 'Рубин'], photo: 'stadium-rub.webp', comp: 'Тур 11 · Альфа-Банк Российская Премьер-Лига', time: '18:30', date: '18 октября, 18:30 · Лукойл Арена', odds: ['1.56', '4.00', '5.60'], btn: 'Купить билет от 1 500 ₽' },
    { id: 'kra', l: ['kra', 'Краснодар'], r: ['spartak-m', 'Спартак'], photo: 'stadium-kra.webp', comp: 'Тур 12 · Альфа-Банк Российская Премьер-Лига', time: '20:30', date: '22 октября, 20:30 · Ozon Арена', odds: ['2.02', '3.00', '2.40'] },
    { id: 'bal', l: ['bal', 'Балтика'], r: ['spartak-m', 'Спартак'], photo: 'stadium-bal.webp', comp: 'Тур 13 · Альфа-Банк Российская Премьер-Лига', time: '18:30', date: '28 октября, 18:30 · Ростех Арена', odds: ['2.82', '3.20', '2.40'] },
  ];
  // ticket outline with the side notches and the perforation, used as a mask (inlined for file://)
  const TK_D = 'M306 0C323.673 0 338 14.327 338 32V190C328.059 190 320 198.059 320 208C320 217.941 328.059 226 338 226V272C338 289.673 323.673 304 306 304H32C14.327 304 0 289.673 0 272V226C9.941 226 18 217.941 18 208C18 198.059 9.941 190 0 190V32C0 14.327 14.327 0 32 0Z'
    + Array.from({ length: 25 }, (_, k) => `M${(20.469 + k * 12.125).toFixed(3)} 207h6.062v2h-6.062z`).join('');
  document.documentElement.style.setProperty('--tk-mask', `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="338" height="304" viewBox="0 0 338 304"><path fill-rule="evenodd" d="${TK_D}"/></svg>`)}")`);
  const tkTeam = ([logo, name]) => `<div class="team"><div class="team__logo"><span class="logo-m" data-logo="${logo}"></span></div><p class="team__name">${name}</p></div>`;
  const matchCard = (m, i) => `
    <article class="tk" data-pos="${i}" data-m="${m.id}">
      <div class="tk__photo"><img src="${A}${m.photo}" alt=""></div>
      <div class="tk__in">
        <p class="t-meta">${m.comp}</p>
        <div class="match__teams">
          ${tkTeam(m.l)}
          <div class="match__mid">
            <p class="match__time">${m.time}</p>
            <button class="cal-btn tap" data-action="calendar" data-m="${m.id}" aria-label="Добавить в календарь">
              <img src="${A}icon-calendar.svg" width="20" height="20" alt="">
              <svg class="cal-check" viewBox="0 0 20 20" width="20" height="20"><path d="M4.5 10.5l3.5 3.5 7.5-8" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
          ${tkTeam(m.r)}
        </div>
        <div class="odds">
          <img src="${A}winline-small.svg" width="75" height="18" alt="Winline">
          <div class="odds__list">${['П1', '×', 'П2'].map((l, k) => `<button class="odd tap" data-action="odd"><span>${l}</span><b>${m.odds[k]}</b></button>`).join('')}</div>
        </div>
        <div class="match__foot">
          <p class="t-meta">${m.date}</p>
          ${m.btn ? `<button class="btn-red tap" data-action="buy">${m.btn}</button>` : ''}
        </div>
      </div>
      <div class="tk__back"><img src="${A}${m.photo}" alt=""></div>
    </article>`;

  function createTickets(el, onChange) {
    const cards = $$('.tk', el), n = cards.length;
    let order = cards.map((_, i) => i), busy = false;
    // pos 0 — front, 1 — peeks on the right (next), 2 — on the left (previous)
    const layout = () => { order.forEach((ci, pos) => { cards[ci].dataset.pos = pos; }); onChange(order[0]); };
    layout();
    function swap(dir) { // dir 1: the right ticket comes to the front, -1: the left one
      if (busy) return; busy = true;
      const front = cards[order[0]], incoming = cards[order[dir > 0 ? 1 : 2]], behind = cards[order[dir > 0 ? 2 : 1]];
      cards.forEach(c => { c.style.transition = ''; c.style.transform = ''; });
      incoming.style.zIndex = 4; front.style.zIndex = 3; behind.style.zIndex = 0;
      behind.classList.add('is-behind');
      order = dir > 0 ? [order[1], order[2], order[0]] : [order[2], order[0], order[1]];
      layout();
      setTimeout(() => { cards.forEach(c => { c.style.zIndex = ''; c.classList.remove('is-behind'); }); busy = false; }, 760);
    }
    // swipe the front ticket; the side ones lean in a little while it is dragged
    let sx, sy, dx = 0, t0, mode = null, id = null;
    el.addEventListener('pointerdown', e => {
      if (busy || !el.classList.contains('in')) return;
      sx = e.clientX; sy = e.clientY; dx = 0; t0 = performance.now(); mode = null; id = e.pointerId;
    });
    window.addEventListener('pointermove', e => {
      if (id !== e.pointerId) return;
      const ddx = e.clientX - sx, ddy = e.clientY - sy;
      if (!mode) {
        if (Math.abs(ddx) > 6 && Math.abs(ddx) >= Math.abs(ddy)) mode = 'x';
        else if (Math.abs(ddy) > 6) { id = null; return; }
        else return;
        el.classList.add('is-dragging');
      }
      dx = ddx;
      const f = cards[order[0]];
      f.style.transition = 'none';
      f.style.transform = `translateX(${dx}px) rotate(${dx * .02}deg)`;
      const k = Math.min(Math.abs(dx) / 200, 1), side = cards[order[dx < 0 ? 1 : 2]];
      side.style.transition = 'none';
      side.style.transform = `translateX(${(dx < 0 ? 168 : -168) * (1 - k * .25)}px)`;
      cards[order[dx < 0 ? 2 : 1]].style.transform = '';
    });
    const end = e => {
      if (id !== e.pointerId) return;
      id = null;
      if (!mode) return;
      mode = null;
      dragMoved = true; setTimeout(() => { dragMoved = false; }, 0);
      el.classList.remove('is-dragging');
      const v = dx / Math.max(performance.now() - t0, 1);
      if (dx < -70 || v < -.5) swap(1);
      else if (dx > 70 || v > .5) swap(-1);
      else cards.forEach(c => { c.style.transition = ''; c.style.transform = ''; });
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    // a tap on a peeking side ticket brings it to the front
    el.addEventListener('click', e => {
      const c = e.target.closest('.tk');
      if (!c || dragMoved || c.dataset.pos === '0') return;
      e.stopPropagation(); e.preventDefault();
      swap(c.dataset.pos === '1' ? 1 : -1);
    }, true);
    return { el, cards, next: () => swap(1), prev: () => swap(-1), get index() { return order[0]; } };
  }
  function initMatchSection(sec) {
    const el = $('.tix', sec), pag = $('.dpag--match', sec);
    el.innerHTML = MATCHES.map(matchCard).join('');
    fillLogos(el);
    sec._deck = createTickets(el, i => { setDpag(pag, i); ambient.refresh(); });
  }

  /* ================= stories ================= */
  const STORIES = [
    { t: 'Матч', img: 'story-1.webp', fresh: true },
    { t: 'Интервью', img: 'story-2.webp', fresh: true },
    { t: 'ЖФК', img: 'story-3.webp' },
    { t: 'Мерч', img: 'story-4.webp', crop: 'height:160%;left:-83.43%;top:-37.5%;width:266.87%' },
    { t: 'Академия', img: 'story-5.webp', crop: 'height:100%;left:-92.92%;top:0;width:185.85%' },
  ];
  const storiesEl = $('#stories');
  storiesEl.innerHTML = STORIES.map((s, i) => `
    <button class="st rv ${s.fresh ? 'is-new' : ''}" data-story="${i}" style="--d:${i}">
      <span class="st__ring"><span class="st__img"><img src="${A}${s.img}" alt="" ${s.crop ? `style="${s.crop}"` : 'class="cover"'}></span></span>
      <span class="st__t">${s.t}</span>
    </button>`).join('');

  const story = $('#story'), storyBars = $('#story-bars'), storyImg = $('#story-img');
  let storyOpen = false, storyIdx = 0, storyT, storyStart, storyLeft;
  const STORY_MS = 5000;
  storyBars.innerHTML = STORIES.map(() => '<i><b></b></i>').join('');

  function showStory(i) {
    if (i < 0) i = 0;
    if (i >= STORIES.length) return closeStory();
    storyIdx = i;
    const s = STORIES[i];
    storyImg.classList.remove('go');
    storyImg.style.backgroundImage = `url(${A}${s.img})`;
    storyImg.offsetWidth; storyImg.classList.add('go');
    $('#story-name').textContent = s.t;
    $('#story-ava').style.backgroundImage = `url(${A}${s.img})`;
    $$('i', storyBars).forEach((b, k) => {
      b.className = k < i ? 'done' : '';
      const bar = b.firstChild; bar.style.animation = 'none'; bar.offsetWidth; bar.style.animation = '';
      if (k === i) { b.style.setProperty('--dur', STORY_MS + 'ms'); b.className = 'run'; }
    });
    const btn = $(`.st[data-story="${i}"]`, storiesEl);
    btn && btn.classList.remove('is-new');
    clearTimeout(storyT); storyStart = performance.now(); storyLeft = STORY_MS;
    storyT = setTimeout(() => showStory(storyIdx + 1), STORY_MS);
  }
  function openStory(i, fromEl) {
    const pr = phone.getBoundingClientRect(), r = fromEl.getBoundingClientRect();
    story.style.setProperty('--ox', `${r.left + r.width / 2 - pr.left}px`);
    story.style.setProperty('--oy', `${r.top + 39 - pr.top}px`);
    story.classList.remove('is-closing');
    story.offsetWidth;
    story.classList.add('is-open');
    story.setAttribute('aria-hidden', 'false');
    storyOpen = true;
    showStory(i);
  }
  function closeStory() {
    clearTimeout(storyT);
    const btn = $(`.st[data-story="${storyIdx}"]`, storiesEl);
    if (btn) {
      const pr = phone.getBoundingClientRect(), r = btn.getBoundingClientRect();
      story.style.setProperty('--ox', `${r.left + r.width / 2 - pr.left}px`);
      story.style.setProperty('--oy', `${r.top + 39 - pr.top}px`);
    }
    story.classList.remove('is-open', 'is-paused');
    story.classList.add('is-closing');
    story.setAttribute('aria-hidden', 'true');
    storyOpen = false;
    setTimeout(() => story.classList.remove('is-closing'), 520);
  }
  // hold to pause, swipe down to close
  (() => {
    let sy, sx, held, moved;
    story.addEventListener('pointerdown', e => {
      if (e.target.closest('.glass-x')) return;
      sy = e.clientY; sx = e.clientX; moved = false;
      held = setTimeout(() => {
        story.classList.add('is-paused');
        clearTimeout(storyT); storyLeft -= performance.now() - storyStart;
      }, 180);
    });
    story.addEventListener('pointermove', e => {
      if (sy == null) return;
      const dy = e.clientY - sy;
      if (dy > 10) { moved = true; story.style.transform = `translateY(${dy * .6}px) scale(${1 - dy / 2000})`; story.style.borderRadius = `${Math.min(dy / 2, 56)}px`; }
    });
    story.addEventListener('pointerup', e => {
      clearTimeout(held);
      const dy = e.clientY - sy; sy = null;
      story.style.transform = ''; story.style.borderRadius = '';
      if (moved && dy > 110) return closeStory();
      if (story.classList.contains('is-paused')) {
        story.classList.remove('is-paused');
        storyStart = performance.now();
        storyT = setTimeout(() => showStory(storyIdx + 1), Math.max(storyLeft, 0));
        return;
      }
      if (moved) return;
      const nav = e.target.closest('[data-story-nav]');
      if (nav) showStory(storyIdx + +nav.dataset.storyNav);
    });
  })();

  /* ================= teams: one open card at a time, the block pins while scrolling walks through them ================= */
  const TEAMS = [
    ['Основной состав', 'РПЛ · Кубок России'], ['ЖФК «Спартак»', 'Женская суперлига'],
    ['Спартак-2', 'Молодёжное первенство'], ['Академия', 'Юношеские первенства'],
  ];
  $('#tcards').innerHTML = TEAMS.map(([t, s], i) => `
    <button class="tc" data-team="${i}">
      <span class="tc__open"><img class="tc__tex" src="${A}team_tex.webp" alt=""><i class="tc__mul"></i><img class="tc__ph" src="${A}team${i + 1}.webp" alt=""></span>
      <span class="tc__band tc__band--1"><i></i></span><span class="tc__band tc__band--2"><i></i></span>
      <span class="tc__nm"><b>${t}</b><span>${s}</span></span>
      <img class="tc__go" src="${A}team_arrow.svg" width="24" height="24" alt="">
      <i class="tc__ln"></i>
    </button>`).join('');
  // Main squad is open by default. While the block is pinned (sticky, centred on screen) the scroll walks
  // through the four teams — the next one opens, the previous one closes; a tap opens any card directly.
  const teamsPin = $('#teams-pin'), teamsStick = $('#teams-stick'), tcs = $$('#tcards .tc');
  const TEAM_STEP = 230; // scroll distance per team while pinned
  let teamIdx = -1, teamScrollIdx = -1, teamPinTop = 120;
  function setTeam(i) {
    if (i === teamIdx) return;
    teamIdx = i;
    tcs.forEach((c, k) => c.classList.toggle('open', k === i));
  }
  function layoutTeams() {
    const H = phone.clientHeight, h = teamsStick.offsetHeight;
    teamPinTop = Math.max(Math.round((H - h) / 2) - 10, 112);
    teamsStick.style.top = teamPinTop + 'px';
    teamsPin.style.height = (h + TEAM_STEP * (tcs.length - 1)) + 'px';
  }
  function teamsOnScroll(y) {
    const p = (y + teamPinTop - teamsPin.offsetTop) / TEAM_STEP;
    const i = Math.max(0, Math.min(tcs.length - 1, Math.floor(p + .35)));
    if (i !== teamScrollIdx) { teamScrollIdx = i; setTeam(i); }
  }
  setTeam(0);
  tcs.forEach((c, k) => c.addEventListener('click', () => { if (!dragMoved) setTeam(k); }));

  /* ================= slogan: kinetic type that stretches with the scroll ================= */
  // The scroll speed sets a stretch amount that eases in and drains away at a constant rate (no springs, so
  // the motion reads smooth and almost linear). Each line follows it with a little lag and is stretched
  // vertically / squeezed horizontally, so the words pull like rubber in the direction of the scroll.
  // Scrolling down dims the text, scrolling up brings it back to full strength.
  const slogan = (() => {
    const t = $('#slogan-t'), lines = $$('.sl-line', t);
    let target = 0, vals = lines.map(() => 0), op = 1, opT = 1, raf = 0, lastY = 0, lastT = 0;
    function frame() {
      // linear drain of the target towards zero
      target = Math.abs(target) < .008 ? 0 : target - Math.sign(target) * .008;
      let moving = target !== 0;
      lines.forEach((l, k) => {
        vals[k] += (target - vals[k]) * (.075 - k * .015);
        if (Math.abs(target - vals[k]) > .001 || Math.abs(vals[k]) > .001) moving = true;
        const s = vals[k], a = Math.abs(s);
        l.style.transformOrigin = s > 0 ? '50% 100%' : '50% 0%';
        l.style.transform = `translate3d(0, ${(-s * 4 * (k + 1)).toFixed(2)}px, 0) scale(${(1 - a * .03).toFixed(4)}, ${(1 + a * .16).toFixed(4)})`;
        l.style.letterSpacing = `${(a * .012).toFixed(4)}em`;
      });
      op += (opT - op) * .045;
      if (Math.abs(opT - op) > .004) moving = true;
      t.style.opacity = op.toFixed(3);
      raf = moving ? requestAnimationFrame(frame) : 0;
    }
    return {
      onScroll(y) {
        const now = performance.now(), dt = Math.max(now - lastT, 8), v = (y - lastY) / dt;
        lastY = y; lastT = now;
        if (dt > 200) return;
        const want = clamp(v * .45, -1, 1);
        if (Math.abs(want) > Math.abs(target)) target += (want - target) * .35;
        opT = v > .05 ? .72 : v < -.05 ? 1 : opT;
        if (!raf) raf = requestAnimationFrame(frame);
      },
    };
  })();

  /* ================= stories pinned to the top (Telegram-style) ================= */
  const stpin = $('#stpin');
  $('#stpin-stack').innerHTML = STORIES.slice(0, 3).map((s, i) => `<span class="${s.fresh ? 'is-new' : ''}" style="--i:${i};background-image:url(${A}${s.img})"></span>`).join('');
  let stpinOn = false;
  function updateStpin(sc) {
    const on = sc.id === 'home-scroller' && sc.closest('.screen.is-active') && storiesEl.getBoundingClientRect().bottom - phone.getBoundingClientRect().top < 104;
    if (on === stpinOn) return;
    stpinOn = on;
    stpin.classList.toggle('is-on', on);
  }
  stpin.addEventListener('click', () => { const i = Math.max(0, STORIES.findIndex(s => s.fresh)); openStory(i, stpin); });

  /* ================= table ================= */
  const CLUBS = {
    kra: '<img src="assets/club-kra.svg" style="inset:0;width:100%;height:100%" alt="">',
    spa: '<img src="assets/club-spa.svg" style="inset:14.78% 0 15.14% 0;width:100%;height:70.08%" alt="">',
    dyn: '<img src="assets/club-dyn.svg" style="inset:0;width:100%;height:100%" alt="">',
    cska: `<span style="position:absolute;inset:0 13.72% .01% 13.7%;-webkit-mask:${CSKA_MASK} 0 0/17.424px 24px no-repeat;mask:${CSKA_MASK} 0 0/17.424px 24px no-repeat"><img src="assets/club-cska.svg" style="inset:0;width:100%;height:100%" alt=""></span>`,
    zen: '<img src="assets/club-zen.svg" style="top:16.71%;left:.91%;width:98.18%;height:62.39%" alt="">',
  };
  const ROWS = [
    ['kra', 'Краснодар', 9, 6, 3, 0, 21], ['spa', 'Спартак-Москва', 9, 6, 1, 2, 19, true],
    ['dyn', 'Динамо-Москва', 9, 6, 1, 2, 19], ['cska', 'ЦСКА', 9, 5, 4, 0, 19], ['zen', 'Зенит', 9, 6, 0, 3, 18],
  ];
  $('[data-rows]').innerHTML = ROWS.map(([c, n, g, w, d, l, p, us], i) => `
    <div class="tbl__row ${us ? 'is-us' : ''}" style="--r:${i}">
      <span class="c-pos">${i + 1}</span>
      <span class="c-club"><span class="club-ico">${CLUBS[c]}</span>${n}</span>
      <span>${g}</span><span>${w}</span><span>${d}</span><span>${l}</span><span class="c-pts" data-count="${p}">${p}</span>
    </div>`).join('');
  $$('.tbl[data-tbl="1"]').forEach(t => t.classList.add('is-hidden'));

  /* ================= tab screens assembled from home blocks ================= */
  $$('[data-slot]').forEach(slot => {
    const src = $(`.screen[data-screen="home"] [data-block="${slot.dataset.slot}"]`);
    const c = src.cloneNode(true);
    $$('.vpag', c).forEach(v => v.remove());
    slot.replaceWith(c);
  });
  $$('.sec-match').forEach(initMatchSection);
  fillLogos();

  /* ================= reveal on scroll ================= */
  const observers = new Map();
  function watchReveals(scroller) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { root: scroller, threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('.rv, .trophies, .sec-abon, .tbl__rows', scroller).filter(el => !el.closest('#stories')).forEach(el => io.observe(el));
    observers.set(scroller, io);
    // tickets fan out from behind the main one when the block is well on screen; they gather back once it
    // is out of view below, so the entrance replays on the way down
    const tio = new IntersectionObserver(entries => entries.forEach(en => {
      const t = en.target;
      if (en.isIntersecting && !t.classList.contains('in')) {
        t.classList.add('in', 'is-entering');
        clearTimeout(t._entT); t._entT = setTimeout(() => t.classList.remove('is-entering'), 1300);
      } else if (!en.isIntersecting && en.boundingClientRect.top > en.rootBounds.bottom) t.classList.remove('in');
    }), { root: scroller, threshold: .45 });
    $$('.tix', scroller).forEach(el => tio.observe(el));
  }

  /* ================= scroll: tab bar minimise, edge, parallax ================= */
  const tabbar = $('#tabbar'), edge = $('#edge-top');

  // cards: full-bleed while they enter, then settle to the 8px insets with growing corner radius
  function updatePops(sc) {
    const pr = phone.getBoundingClientRect(), H = pr.height;
    $$('.pop', sc).forEach(el => {
      const top = el.getBoundingClientRect().top - pr.top;
      const e = easeOut(clamp((H - top - 30) / 340));
      el.style.setProperty('--sc', (1 + .0415 * (1 - e)).toFixed(4));
      el.style.setProperty('--rad', (12 + 20 * e).toFixed(1) + 'px');
    });
  }

  // season ticket (Figma Frame 73): two cards, scroll-driven via GSAP ScrollTrigger on the app scroller.
  // Both cards move together for the whole range — no holds, no one-waits-for-the-other: one scroll
  // progress value (lightly smoothed by scrub) drives both along a single smooth Catmull-Rom path through
  // the Figma poses (below → facing us → tilted → isometric on the panel). Parallax comes from path
  // length only: the white card starts further away, so it always travels a bit faster than the red one.
  // Scroll stops → they stop; scroll back → they reverse together. They ride fully over the block above,
  // overlapping its bottom edge only slightly.
  const ABON_END = 190;  // panel top (px from the screen top) where the cards land
  const pose = (x, y, rotation, scale, rx, ry) => ({ x, y, rotation, scale, rx, ry });
  const PATH = {
    r: [pose(0, 340, 6, .92, -34, 0), pose(0, 60, 0, 1, 0, 0), pose(-38.74, 28.09, -8.59, .8153, 16, -4), pose(-41.13, 83.41, -23.4, .6024, 34, -8)],
    w: [pose(10, 560, 12, .9, -40, 0), pose(0, 60, 0, 1, 0, 0), pose(-50.36, 3.15, -8.59, .8153, 16, -4), pose(-74.05, 29.52, -23.4, .6024, 34, -8)],
  };
  const spline = (k, t) => {
    const n = k.length - 1, u = Math.min(Math.max(t, 0) * n, n - 1e-6), i = Math.floor(u), f = u - i, o = {};
    const P = j => k[Math.max(0, Math.min(n, j))];
    for (const key in k[0]) {
      const p0 = P(i - 1)[key], p1 = P(i)[key], p2 = P(i + 1)[key], p3 = P(i + 2)[key];
      o[key] = .5 * (2 * p1 + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f);
    }
    return o;
  };
  // light: a specular sheen slides across the face as the card turns; the shadow is long and soft while
  // the card is lifted and tightens as it lands on the panel
  const place = (el, p, t) => {
    const lift = 1 - t;
    el.style.setProperty('--sx', `${(-20 + t * 140 + p.rotation * -1.2).toFixed(1)}%`);
    el.style.filter = `drop-shadow(0 ${(6 + lift * 34).toFixed(1)}px ${(12 + lift * 34).toFixed(1)}px rgba(0,0,0,${(.26 + lift * .16).toFixed(3)}))`;
    el.style.transform = `perspective(900px) translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0) rotateX(${p.rx.toFixed(2)}deg) rotateY(${p.ry.toFixed(2)}deg) rotate(${p.rotation.toFixed(3)}deg) scale(${p.scale.toFixed(4)})`;
  };
  const abonTl = new Map();
  function clipAbon() {} // no clipping: the cards always ride fully on top
  function initAbon(sc) {
    $$('.sec-abon', sc).forEach(sec => {
      if (abonTl.has(sec)) return;
      const red = $('.ac--r', sec), white = $('.ac--w', sec);
      const render = t => { place(red, spline(PATH.r, t), t); place(white, spline(PATH.w, t), t); };
      if (!window.gsap || !window.ScrollTrigger) { render(1); abonTl.set(sec, null); return; } // offline: final pose
      gsap.registerPlugin(ScrollTrigger);
      const state = { t: 0 };
      const tw = gsap.to(state, { t: 1, ease: 'none', onUpdate: () => render(state.t),
        scrollTrigger: { trigger: $('.abon-pin', sec), scroller: sc, start: 'top bottom', end: `top ${ABON_END}px`, scrub: .65 } });
      sc.addEventListener('scroll', () => clipAbon(sec), { passive: true });
      render(state.t);
      abonTl.set(sec, tw);
    });
  }
  function updateAbon(sc) { if (!abonTl.size) initAbon(sc); } // ScrollTrigger follows the scroller itself

  // hero: 0 → the first card edge to edge from the very top, 1 → the inset stack (Figma Frame 53).
  // The card height is picked from the screen height so the two cards behind it and the pagination stay
  // above the tab bar on the first screen (687.5px ×.96 = the 660px Figma card on a 874px screen).
  // The photo is a screen-tall layer inside the card and moves slower than the card (parallax).
  const heroEl = $('.hero'), storyBtns = $$('.st', storiesEl);
  let heroH = 874, storiesOn = null;
  function setHero(y) {
    const hp = easeOut(clamp(y / 220));
    heroEl.style.setProperty('--hp', hp.toFixed(4));
    heroEl.style.setProperty('--par', `${clamp(y * .12, 0, 56).toFixed(2)}px`);
    heroVisible.v = y < 600;
    // the stories come up as soon as the page moves
    const on = hp > .2;
    if (on !== storiesOn) { storiesOn = on; storyBtns.forEach(b => b.classList.toggle('in', on)); }
  }
  const measureHero = () => {
    heroH = phone.clientHeight;
    heroEl.style.setProperty('--H', `${heroH}px`);
    heroEl.style.setProperty('--ch', `${clamp(heroH - 210, 480, 687.5).toFixed(1)}px`);
    setHero($('#home-scroller').scrollTop);
  };
  measureHero();
  window.addEventListener('resize', measureHero);

  // header: at the top the bare glyphs sit right on the full-screen hero (Figma 4057:11751); after a short
  // scroll the pinned iOS 27 glass platters materialise under them with a liquid squash while the glyphs
  // re-settle a beat later; on the way back up the platters shrink and dissolve. Other tabs always show them.
  const hbtns = $$('.hbtn', hbar);
  let hdrOn = null;
  function setHeader(sc) {
    const y = Math.max(sc.scrollTop, 0);
    const on = sc.id === 'home-scroller' ? y > (hdrOn ? 60 : 90) : true;
    if (on === hdrOn) return;
    const first = hdrOn === null;
    hdrOn = on;
    hbar.classList.toggle('is-on', on);
    if (first) return;
    hbtns.forEach((b, i) => {
      const img = $$('img', b);
      b = $('.hbtn__glass', b);
      b._a && b._a.cancel(); img.forEach(m => m._a && m._a.cancel());
      if (on) {
        b._a = b.animate([
          { opacity: 0, transform: 'translateY(-6px) scale(.45)', filter: 'blur(10px)' },
          { opacity: 1, transform: 'translateY(0) scale(1.08, .93)', filter: 'blur(0px)', offset: .42 },
          { transform: 'scale(.97, 1.03)', offset: .68 },
          { transform: 'scale(1.01, .995)', offset: .84 },
          { opacity: 1, transform: 'none', filter: 'blur(0px)' },
        ], { duration: 680, delay: i * 55, easing: 'cubic-bezier(.22,.8,.3,1)', fill: 'backwards' });
        img.forEach((m, k) => { m._a = m.animate([
          { transform: 'none' }, { transform: 'scale(.82)', offset: .35 }, { transform: 'none' },
        ], { duration: 420, delay: 60 + i * 55 + k * 40, easing: 'cubic-bezier(.2,.9,.3,1.2)' }); });
      } else {
        b._a = b.animate([
          { opacity: 1, transform: 'none', filter: 'blur(0px)' },
          { opacity: 0, transform: 'translateY(-4px) scale(.7)', filter: 'blur(8px)' },
        ], { duration: 300, easing: 'cubic-bezier(.4,0,.8,.6)' });
      }
    });
  }

  const scrollState = new WeakMap();
  function onScroll(sc) {
    const y = sc.scrollTop;
    const st = scrollState.get(sc) || { last: y, acc: 0 };
    const dy = y - st.last;
    st.acc = Math.sign(dy) === Math.sign(st.acc) ? st.acc + dy : dy;
    st.last = y;
    scrollState.set(sc, st);
    if (y < 40) setMin(false);
    else if (st.acc > 14) setMin(true);
    else if (st.acc < -14) setMin(false);
    if (sc.closest('.screen.is-active')) {
      edge.classList.toggle('is-on', y > (sc.id === 'home-scroller' ? 60 : 8));
      setHeader(sc);
    }
    if (sc.id === 'home-scroller') { setHero(y); teamsOnScroll(y); slogan.onScroll(y); }
    if (sc.closest('.screen.is-active')) { updatePops(sc); updateAbon(sc); ambient.refresh(); updateStpin(sc); }
  }
  let isMin = false;
  function setMin(v) {
    if (v === isMin) return;
    isMin = v;
    tabbar.classList.toggle('is-min', v);
    trackPill();
  }
  $$('.scroller:not(.menu__scroller)').forEach(sc => {
    let raf;
    sc.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => onScroll(sc)); }, { passive: true });
  });

  /* ================= tab bar ================= */
  const pill = $('#tabs-pill');
  const tabs = $$('.tab');
  let currentTab = 'home';
  function placePill() {
    const t = $('.tab.is-on');
    pill.style.width = `${t.offsetWidth + 4}px`;
    pill.style.transform = `translateX(${t.offsetLeft - 2}px)`;
  }
  function trackPill() {
    const t0 = performance.now();
    pill.style.transition = 'height .55s cubic-bezier(.32,.72,0,1)';
    const loop = () => { placePill(); if (performance.now() - t0 < 600) requestAnimationFrame(loop); else pill.style.transition = ''; };
    loop();
  }
  function selectTab(name) {
    const btn = $(`.tab[data-tab="${name}"]`);
    if (name === currentTab) {
      const sc = $(`.screen[data-screen="${name}"] .scroller`);
      sc.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (menuOpen) closeMenu();
    tabs.forEach(t => t.classList.toggle('is-on', t === btn));
    btn.classList.remove('bounce'); btn.offsetWidth; btn.classList.add('bounce');
    placePill();
    $$('.screen').forEach(s => s.classList.toggle('is-active', s.dataset.screen === name));
    currentTab = name;
    const sc = $(`.screen[data-screen="${name}"] .scroller`);
    if (!observers.has(sc)) watchReveals(sc);
    setMin(false);
    edge.classList.toggle('is-on', sc.scrollTop > (name === 'home' ? 60 : 8));
    setHeader(sc);
    updateStpin(sc);
    setTimeout(() => { ambient.refresh(); updatePops(sc); initAbon(sc); window.ScrollTrigger && ScrollTrigger.refresh(); }, 60);
  }
  placePill();
  window.addEventListener('resize', placePill);

  /* ================= menu: iOS-style sheet ================= */
  const menu = $('#menu'), sheet = $('#sheet'), mScroller = $('.menu__scroller');
  let menuOpen = false;
  $$('.mi', menu).forEach((el, i) => el.style.setProperty('--i', i));
  function openMenu() {
    menuOpen = true;
    mScroller.scrollTop = 0;
    menu.classList.add('is-open');
    phone.classList.add('menu-open');
    menu.setAttribute('aria-hidden', 'false');
  }
  function closeMenu() {
    menuOpen = false;
    menu.classList.remove('is-open');
    phone.classList.remove('menu-open');
    menu.setAttribute('aria-hidden', 'true');
  }
  // drag the sheet down to dismiss; the app behind scales back up in step
  (() => {
    let y0 = null, dy = 0, on = false, t0 = 0;
    sheet.addEventListener('pointerdown', e => {
      if (e.target.closest('.glass-x, .promo__x') || !menuOpen) return;
      y0 = e.clientY; dy = 0; on = false; t0 = performance.now();
    });
    window.addEventListener('pointermove', e => {
      if (y0 == null) return;
      const d = e.clientY - y0;
      if (!on) {
        const fromBar = e.target.closest?.('.sheet__bar');
        if (d > 8 && (mScroller.scrollTop <= 0 || fromBar)) { on = true; phone.classList.add('dragging'); sheet.style.transition = 'none'; }
        else return;
      }
      dy = Math.max(0, d);
      sheet.style.transform = `translateY(${dy}px)`;
      phone.style.setProperty('--p', Math.max(0, 1 - dy / 520).toFixed(3));
    });
    const end = () => {
      if (y0 == null) return;
      y0 = null;
      if (!on) return;
      on = false;
      dragMoved = true; setTimeout(() => { dragMoved = false; }, 0);
      const v = dy / Math.max(performance.now() - t0, 1);
      phone.classList.remove('dragging');
      sheet.style.transition = ''; sheet.style.transform = '';
      phone.style.removeProperty('--p');
      if (dy > 150 || v > .8) closeMenu();
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  })();

  /* ================= dynamic island toasts ================= */
  const island = $('#island');
  let islandT;
  function islandToast(text, icon = 'check') {
    $('#island-txt').textContent = text;
    $('#island-ico').innerHTML = icon === 'check'
      ? '<svg viewBox="0 0 20 20" width="16" height="16"><path d="M4.5 10.5l3.5 3.5 7.5-8" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : `<img src="${A}${icon}" width="18" height="18" alt="">`;
    island.classList.remove('il-x');
    island.classList.add('is-open');
    clearTimeout(islandT);
    islandT = setTimeout(() => island.classList.remove('is-open'), 2400);
  }

  /* ================= cart bar: slides up from the bottom, holds the seats with a countdown ================= */
  const app = $('#app'), cart = $('#cart'), cartTimer = $('#cart-timer'), cartBadge = $('#cart-badge');
  let cartOpen = false, cartLeft = 0, cartT;
  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  function openCart() {
    if (cartOpen) { cartBadge.classList.remove('bump'); cartBadge.offsetWidth; cartBadge.classList.add('bump'); return; }
    cartOpen = true; cartLeft = 15 * 60 - 1;
    cartTimer.textContent = fmt(cartLeft);
    app.classList.add('has-cart'); cart.setAttribute('aria-hidden', 'false');
    nudgeScroll(84);
    clearInterval(cartT);
    cartT = setInterval(() => { cartLeft--; cartTimer.textContent = fmt(Math.max(cartLeft, 0)); if (cartLeft <= 0) closeCart(); }, 1000);
  }
  function closeCart() {
    cartOpen = false; clearInterval(cartT);
    app.classList.remove('has-cart'); cart.setAttribute('aria-hidden', 'true');
    nudgeScroll(-84);
  }
  // move the active scroller in step with the content layer's bottom edge (same iOS curve), so the
  // content looks pushed up by the cart / dropped back when it closes
  const iosCurve = t => { // cubic-bezier(.32,.72,0,1)
    let u = t;
    for (let i = 0; i < 8; i++) { const x = 3 * (1 - u) * (1 - u) * u * .32 + 3 * (1 - u) * u * u * 0 + u * u * u - t; const dx = 3 * (1 - u) * (1 - u) * .32 + 6 * (1 - u) * u * (0 - .32) + 3 * u * u * (1 - 0); u = Math.min(1, Math.max(0, u - x / (dx || 1))); }
    return 3 * (1 - u) * (1 - u) * u * .72 + 3 * (1 - u) * u * u + u * u * u;
  };
  // The target is absolute (y0 + d·curve), so sub-pixel steps are not lost to scrollTop rounding and the
  // content keeps pace with the rising bottom edge all the way. Any touch / wheel by the user cancels it,
  // so the nudge never fights a real scroll.
  let nudgeRaf = 0;
  function nudgeScroll(d) {
    const sc = $('.screen.is-active .scroller');
    if (!sc) return;
    cancelAnimationFrame(nudgeRaf);
    const y0 = sc.scrollTop, t0 = performance.now();
    if (d < 0 && y0 <= 0) return;
    const stop = () => { cancelAnimationFrame(nudgeRaf); sc.removeEventListener('wheel', stop); sc.removeEventListener('touchstart', stop); sc.removeEventListener('pointerdown', stop); };
    sc.addEventListener('wheel', stop, { passive: true }); sc.addEventListener('touchstart', stop, { passive: true }); sc.addEventListener('pointerdown', stop);
    const step = now => {
      const t = Math.min((now - t0) / 780, 1);
      sc.scrollTop = Math.max(0, y0 + d * iosCurve(t));
      if (t < 1) nudgeRaf = requestAnimationFrame(step); else stop();
    };
    nudgeRaf = requestAnimationFrame(step);
  }
  // drag the bar down to dismiss it; the content layer and the tab bar follow the finger
  (() => {
    const screens = $('.screens');
    let y0 = null, dy = 0;
    cart.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; y0 = e.clientY; dy = 0; cart.setPointerCapture?.(e.pointerId); app.classList.add('cart-drag'); });
    cart.addEventListener('pointermove', e => {
      if (y0 == null) return;
      dy = Math.min(84, Math.max(0, e.clientY - y0));
      screens.style.bottom = `${84 - dy}px`; tabbar.style.transform = `translateY(${-84 + dy}px)`;
    });
    const end = () => {
      if (y0 == null) return;
      y0 = null; app.classList.remove('cart-drag'); screens.style.bottom = ''; tabbar.style.transform = '';
      if (dy > 36) closeCart();
    };
    cart.addEventListener('pointerup', end); cart.addEventListener('pointercancel', end);
  })();

  /* ================= delegated actions ================= */
  let dragMoved = false;
  document.addEventListener('click', e => {
    if (dragMoved) { dragMoved = false; e.preventDefault(); e.stopPropagation(); return; }
    const tab = e.target.closest('.tab');
    if (tab) return selectTab(tab.dataset.tab);

    const st = e.target.closest('.st');
    if (st) return openStory(+st.dataset.story, st);

    const seg = e.target.closest('.seg__btn');
    if (seg) {
      const box = seg.closest('[data-seg]'), i = seg.dataset.segI;
      box.dataset.i = i;
      $$('.seg__btn', box).forEach(b => b.classList.toggle('is-on', b === seg));
      const wrap = box.parentElement.querySelector('.tbl-wrap');
      $$('.tbl', wrap).forEach(t => t.classList.toggle('is-hidden', t.dataset.tbl !== i));
      if (i === '0') { const rows = $('.tbl__rows', wrap); rows.classList.remove('in'); rows.offsetWidth; rows.classList.add('in'); }
      return;
    }

    const go = e.target.closest('[data-go]');
    if (go) { closeMenu(); return setTimeout(() => selectTab(go.dataset.go), 250); }

    const act = e.target.closest('[data-action]');
    if (!act) return;
    switch (act.dataset.action) {
      case 'open-menu': return openMenu();
      case 'close-menu': return closeMenu();
      case 'close-story': return closeStory();
      case 'close-promo': return $('#promo').classList.add('is-gone');
      case 'calendar': {
        const on = !act.classList.contains('is-on');
        $$(`.cal-btn[data-m="${act.dataset.m}"]`).forEach(b => b.classList.toggle('is-on', on));
        islandToast(on ? 'Матч добавлен в календарь' : 'Убрано из календаря');
        return;
      }
      case 'odd': {
        const list = act.parentElement, was = act.classList.contains('is-on');
        $$('.odd', list).forEach(o => o.classList.remove('is-on'));
        if (!was) act.classList.add('is-on');
        return;
      }
      case 'buy': {
        act.classList.remove('shine'); act.offsetWidth; act.classList.add('shine');
        islandToast('Места добавлены в корзину');
        openCart();
        return;
      }
      case 'checkout': return islandToast('Переходим к оплате');
      case 'play': return islandToast('Пресс-конференция · 12:48', 'icon-play.svg');
      case 'buy-jersey': return islandToast('Ретро-джерси добавлена в корзину');
      case 'read': return islandToast('Открываем статью');
      case 'add': { act.classList.remove('pop-in'); act.offsetWidth; act.classList.add('pop-in'); return islandToast('Товар добавлен в корзину'); }
      case 'cart-info': return islandToast('В корзине 3 позиции');
    }
  }, true);

  /* ================= mouse drag-to-scroll with inertia (desktop) ================= */
  function dragScroll(el, axis) {
    let start, startScroll, last, lastT, vel = 0, raf, active = false, moved = false;
    const prop = axis === 'x' ? 'scrollLeft' : 'scrollTop';
    const coord = e => axis === 'x' ? e.clientX : e.clientY;
    el.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      if (axis === 'y' && e.target.closest('.hscroll, .deck, .merch, .tix')) return;
      cancelAnimationFrame(raf);
      active = true; moved = false;
      start = last = coord(e); startScroll = el[prop]; lastT = performance.now(); vel = 0;
    });
    window.addEventListener('pointermove', e => {
      if (!active) return;
      const c = coord(e), d = c - start;
      if (!moved && Math.abs(d) < 5) return;
      moved = true;
      el[prop] = startScroll - d;
      const now = performance.now();
      vel = (c - last) / Math.max(now - lastT, 1);
      last = c; lastT = now;
    });
    window.addEventListener('pointerup', () => {
      if (!active) return;
      active = false;
      if (!moved) return;
      dragMoved = true; setTimeout(() => { dragMoved = false; }, 0);
      let v = vel * 16;
      const step = () => {
        v *= 0.95;
        el[prop] -= v;
        if (Math.abs(v) > .4) raf = requestAnimationFrame(step);
      };
      step();
    });
  }
  $$('.scroller').forEach(sc => dragScroll(sc, 'y'));
  $$('.hscroll').forEach(sc => dragScroll(sc, 'x'));

  /* ================= cursor parallax: cards tilt a few degrees, as if they were 3D ================= */
  (() => {
    let cur = null;
    const MAX = 3;
    const reset = el => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); };
    phone.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch' || e.buttons) { if (cur) { reset(cur); cur = null; } return; }
      const el = e.target.closest?.('.pop');
      if (cur && cur !== el) reset(cur);
      cur = el;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      el.style.setProperty('--ry', (x * MAX * 2).toFixed(2) + 'deg');
      el.style.setProperty('--rx', (-y * MAX * 2).toFixed(2) + 'deg');
    });
    phone.addEventListener('pointerleave', () => { if (cur) { reset(cur); cur = null; } });
  })();


  /* ================= merch: pages of two that snap (Figma 4043:5641) ================= */
  // Native scroll-snap does the paging on touch (one page per swipe, scroll-snap-stop); with a mouse the row
  // is dragged and released onto the nearest page in the drag direction.
  $$('[data-merch]').forEach(row => {
    const page = () => { const c = $$('.prod', row); return c.length > 1 ? c[1].offsetLeft - c[0].offsetLeft : row.clientWidth; };
    let x0 = null, s0 = 0, moved = false;
    row.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.button !== 0) return; x0 = e.clientX; s0 = row.scrollLeft; moved = false; row.classList.add('is-drag'); });
    window.addEventListener('pointermove', e => {
      if (x0 == null) return;
      const d = e.clientX - x0;
      if (Math.abs(d) > 5) moved = true;
      row.scrollLeft = s0 - d;
    });
    window.addEventListener('pointerup', e => {
      if (x0 == null) return;
      const d = e.clientX - x0; x0 = null;
      row.classList.remove('is-drag');
      if (!moved) return;
      dragMoved = true; setTimeout(() => { dragMoved = false; }, 0);
      const P = page(), cur = Math.round(s0 / P), to = Math.abs(d) > 40 ? cur + (d < 0 ? 1 : -1) : cur;
      row.scrollTo({ left: Math.max(0, to) * P, behavior: 'smooth' });
    });
  });

  /* ================= sponsors: partners scroll by three, with a pause ================= */
  (() => {
    const row = $('#sponsors-row');
    if (!row) return;
    const items = $$('img', row), PER = 3, n = items.length;
    items.slice(0, PER).forEach(img => row.appendChild(img.cloneNode(true))); // seamless loop
    let page = 0;
    const step = () => (items[PER].offsetLeft - items[0].offsetLeft);
    setInterval(() => {
      if (document.hidden) return;
      page++;
      row.style.transition = 'transform 1.1s cubic-bezier(.65,0,.35,1)';
      row.style.transform = `translateX(${-page * step()}px)`;
      if (page * PER >= n) setTimeout(() => { page = 0; row.style.transition = 'none'; row.style.transform = 'translateX(0)'; }, 1150);
    }, 3200);
  })();

  /* ================= Live Activity (Apple Sports-like): lock screen + in-app Dynamic Island ================= */
  // One running match feeds two surfaces:
  //  • L — the lock screen: wallpaper, big clock and the Live Activity card;
  //  • I — inside the app, over all content: the Dynamic Island turns into the compact activity (crest + score
  //    on both sides of the camera); a tap expands it into the large card, it folds back by itself.
  // The minute ticks, the bar fills and after a moment a goal lands — the score flips and the island
  // opens to show it. Unlocking the phone hands the activity over to the island, as on iOS.
  let lockOn = false;
  const live = (() => {
    const lock = $('#lock'), la = $('#la'), isl = $('#island'), il = $('#il');
    fillLogos(lock); fillLogos(il);
    let min = 63, home = 1, away = 0, tick = null, goalT = null, scored = false, appOn = false, foldT = null;
    const all = k => $$(`[data-live="${k}"]`);
    const paint = () => {
      $('#la-min').textContent = `${min}′`;
      $('#la-bar').style.transform = `scaleX(${Math.min(min / 90, 1).toFixed(3)})`;
      all('min').forEach(e => { e.textContent = `${min}′`; });
      all('bar').forEach(e => { e.style.transform = `scaleX(${Math.min(min / 90, 1).toFixed(3)})`; });
    };
    const now = () => { const d = new Date(); $('#lock-time').textContent = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
      const t = d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }); $('#lock-date').textContent = t[0].toUpperCase() + t.slice(1); };
    const running = () => lockOn || appOn;
    function start() {
      paint();
      if (!tick) tick = setInterval(() => { if (min < 90) { min++; paint(); } }, 2400);
      if (!scored && !goalT) goalT = setTimeout(goal, lockOn ? 4200 : 5200);
    }
    function stopIfIdle() { if (running()) return; clearInterval(tick); tick = null; clearTimeout(goalT); goalT = null; }
    function goal() {
      goalT = null; scored = true; home++;
      const ev = `<b>⚽ ${min}′</b> Угальде · дубль!`;
      [$('#la-h'), ...all('h')].forEach(el => { el.classList.remove('flip'); el.offsetWidth; el.classList.add('flip'); setTimeout(() => { el.textContent = home; }, 220); });
      $('#la-ev').innerHTML = ev; all('ev').forEach(e => { e.innerHTML = ev; });
      la.classList.remove('goal'); la.offsetWidth; la.classList.add('goal');
      if (appOn) { expand(true); isl.classList.remove('il-goal'); isl.offsetWidth; isl.classList.add('il-goal'); }
    }
    // ---- in-app island ----
    function expand(auto) {
      clearTimeout(foldT);
      isl.classList.add('il-x');
      foldT = setTimeout(() => isl.classList.remove('il-x'), auto ? 4200 : 5200);
    }
    function appShow(expandFirst = true) {
      if (appOn) return;
      appOn = true; paint();
      isl.classList.remove('is-open');
      isl.classList.add('il-on'); il.setAttribute('aria-hidden', 'false');
      if (expandFirst) setTimeout(() => expand(true), 650);
      start();
    }
    function appHide() {
      if (!appOn) return;
      appOn = false; clearTimeout(foldT);
      isl.classList.remove('il-on', 'il-x', 'il-goal'); il.setAttribute('aria-hidden', 'true');
      stopIfIdle();
    }
    isl.addEventListener('click', () => { if (!appOn) return; isl.classList.contains('il-x') ? (clearTimeout(foldT), isl.classList.remove('il-x')) : expand(false); });
    // ---- lock screen ----
    function show() {
      if (lockOn) return;
      if (menuOpen) closeMenu();
      if (storyOpen) closeStory();
      lockOn = true; now();
      lock.classList.add('is-on'); lock.setAttribute('aria-hidden', 'false');
      phone.classList.add('locked');
      start();
    }
    function hide() {
      if (!lockOn) return;
      lockOn = false;
      lock.classList.remove('is-on'); lock.setAttribute('aria-hidden', 'true');
      phone.classList.remove('locked');
      setTimeout(() => appShow(false), 550); // the activity carries on in the island
    }
    // swipe up anywhere on the lock screen (or tap the bottom bar) unlocks
    let y0 = null;
    lock.addEventListener('pointerdown', e => { y0 = e.clientY; });
    lock.addEventListener('pointerup', e => { if (y0 != null && (y0 - e.clientY > 60 || e.target.closest('.lock__bottom, .lock__home'))) hide(); y0 = null; });
    return {
      show, hide, toggle: () => (lockOn ? hide() : show()),
      appShow, appHide, appToggle: () => (appOn ? appHide() : appShow()), expand,
      get appOn() { return appOn; },
      reset() { hide(); appHide(); },
    };
  })();

  /* ================= intro ================= */
  phone.classList.add('intro');
  const initScrollFx = () => { const sc = $('#home-scroller'); layoutTeams(); setHero(sc.scrollTop); setHeader(sc); updatePops(sc); updateAbon(sc); ambient.refresh(); };
  window.addEventListener('resize', layoutTeams);
  window.addEventListener('load', layoutTeams);
  requestAnimationFrame(initScrollFx);
  watchReveals($('#home-scroller'));
  const splash = $('#splash');
  setTimeout(() => {
    splash.classList.add('is-done');
    // stagger hero cards in, back to front
    [2, 1, 0].forEach((pos, k) => { cards.find(c => c.dataset.pos == pos).style.transitionDelay = `${k * 90}ms`; });
    requestAnimationFrame(() => {
      phone.classList.remove('intro');
      setTimeout(() => cards.forEach(c => { c.style.transitionDelay = ''; }), 1400);
      restartKenBurns(cards[heroDeck.index]);
    });
    schedule();
  }, 2300);

  document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (lockOn) live.hide(); else if (storyOpen) closeStory(); else if (menuOpen) closeMenu(); }
    if (storyOpen && e.key === 'ArrowRight') showStory(storyIdx + 1);
    if (storyOpen && e.key === 'ArrowLeft') showStory(storyIdx - 1);
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    // same keys as concept 1 (also in the Russian layout); D still toggles the demo too
    if (e.code === 'Space' || k === 'd' || k === 'в') { e.preventDefault(); demo.on ? demo.stop() : demo.start(); }
    else if (k === 'c' || k === 'с') { demo.stop(); cartOpen ? closeCart() : openCart(); }
    else if (k === 'm' || k === 'ь') { demo.stop(); menuOpen ? closeMenu() : openMenu(); }
    else if (k === 'l' || k === 'д') { demo.stop(); live.toggle(); }
    else if (k === 'i' || k === 'ш') { demo.stop(); live.appToggle(); }
    else if (k === 'h' || k === 'р') { toggleHeads(); }
    else if (k === 'r' || k === 'к') { demo.stop(); resetAll(); }
  });
  function resetAll() {
    live.reset();
    if (storyOpen) closeStory();
    if (menuOpen) closeMenu();
    closeCart();
    if (currentTab !== 'home') selectTab('home');
    $$('.scroller').forEach(sc => sc.scrollTo({ top: 0, behavior: 'smooth' }));
  }
  $('#bCart').addEventListener('click', () => { demo.stop(); cartOpen ? closeCart() : openCart(); });
  $('#bMenu').addEventListener('click', () => { demo.stop(); menuOpen ? closeMenu() : openMenu(); });
  $('#bLive').addEventListener('click', () => { demo.stop(); live.toggle(); });
  $('#bLiveApp').addEventListener('click', () => { demo.stop(); live.appToggle(); });
  // headline alignment: centered (default) or left-aligned below the hero (Figma 4191:1873); two separate HUD buttons
  function setHeads(left) {
    phone.classList.toggle('hl-left', left);
    [['#bHeadC', !left], ['#bHeadL', left]].forEach(([id, on]) => { const b = $(id); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  }
  const toggleHeads = () => setHeads(!phone.classList.contains('hl-left'));
  $('#bHeadC').addEventListener('click', () => setHeads(false));
  $('#bHeadL').addEventListener('click', () => setHeads(true));
  $('#bReset').addEventListener('click', () => { demo.stop(); resetAll(); });
  $('#hud').addEventListener('pointerup', () => setTimeout(() => document.activeElement && document.activeElement.blur(), 0));

  /* ================= demo mode — same style as concept 1: a virtual finger walks through the app =================
     The finger glides to a target, presses (dims + shrinks), releases; scrolls are finger drags with an
     ease-in-out curve; swipes are real synthetic pointer events, so every effect reacts exactly as to a person.
     Any real touch, the Демо/Стоп button, Space or D stops it. */
  const demo = (() => {
    const btn = $('#demo-btn');
    const finger = document.createElement('i'); finger.className = 'demo-finger'; phone.appendChild(finger);
    let run = 0, on = false;
    const STOP = Symbol('stop');
    const alive = id => { if (id !== run) throw STOP; };
    const wait = (ms, id) => new Promise((res, rej) => setTimeout(() => (id === run ? res() : rej(STOP)), ms));
    const bez = (() => { // cubic-bezier(.65,0,.35,1), as in concept 1
      const f = (t, a, b) => 3 * (1 - t) * (1 - t) * t * a + 3 * (1 - t) * t * t * b + t * t * t;
      return x => { let lo = 0, hi = 1, m; for (let i = 0; i < 24; i++) { m = (lo + hi) / 2; f(m, .65, .35) < x ? lo = m : hi = m; } return f((lo + hi) / 2, 0, 1); };
    })();
    const EASE_IO = 'cubic-bezier(.65,0,.35,1)';
    const rel = el => { const pr = phone.getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: r.left - pr.left, y: r.top - pr.top, w: r.width, h: r.height }; };
    const W = () => phone.clientWidth, H = () => phone.clientHeight;
    // ---- finger ----
    let fp = null;
    const fingerTo = (x, y, dur = 650) => {
      const cur = fp || { x: W() / 2, y: H() - 110 };
      finger.getAnimations().filter(a => a.id === 'mv').forEach(a => a.cancel());
      const an = finger.animate([{ transform: `translate(${cur.x}px,${cur.y}px)` }, { transform: `translate(${x}px,${y}px)` }], { duration: dur, easing: EASE_IO, fill: 'forwards' });
      an.id = 'mv'; fp = { x, y };
    };
    const fingerSet = (x, y) => { finger.getAnimations().filter(a => a.id === 'mv').forEach(a => a.cancel()); finger.style.transform = `translate(${x}px,${y}px)`; fp = { x, y }; };
    const show = v => { finger.style.opacity = v ? '1' : '0'; };
    const down = v => { finger.classList.toggle('down', v); finger.animate([{ scale: v ? 1 : .82 }, { scale: v ? .82 : 1 }], { duration: 140, fill: 'forwards', easing: 'cubic-bezier(.22,1,.36,1)' }); };
    const pe = (target, type, x, y) => target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerType: 'touch', pointerId: 7, isPrimary: true, clientX: x, clientY: y }));
    const client = (x, y) => { const pr = phone.getBoundingClientRect(); return [pr.left + x, pr.top + y]; };
    // ---- gestures ----
    async function tap(el, id, off = {}) {
      const r = rel(el), x = r.x + r.w / 2 + (off.x || 0), y = r.y + r.h / 2 + (off.y || 0);
      show(true); fingerTo(x, y, 700); await wait(760, id);
      down(true); await wait(150, id); down(false);
      el.click();
      await wait(220, id); show(false);
    }
    async function swipeX(el, id, dx = -170) {
      const r = rel(el), x = r.x + r.w / 2 + 60, y = r.y + r.h * .42;
      show(true); fingerTo(x, y, 600); await wait(650, id);
      const [cx, cy] = client(x, y);
      down(true); pe(el, 'pointerdown', cx, cy);
      for (let i = 1; i <= 16; i++) {
        const k = i / 16, nx = x + dx * (1 - Math.pow(1 - k, 2));
        pe(window, 'pointermove', client(nx, y)[0], cy); fingerSet(nx, y);
        await wait(16, id);
      }
      pe(window, 'pointerup', client(x + dx, y)[0], cy);
      down(false); await wait(260, id); show(false);
    }
    // scroll a scroller to `to` while the finger drags across the screen (up for forward, down for back)
    async function swipeScroll(sc, to, dur, id) {
      to = Math.max(0, Math.min(sc.scrollHeight - sc.clientHeight, to));
      const fwd = to > sc.scrollTop, x = W() / 2, y0 = fwd ? H() * .72 : H() * .36, y1 = fwd ? H() * .36 : H() * .72;
      show(true); fingerTo(x, y0, 450); await wait(480, id);
      down(true);
      const from = sc.scrollTop, t0 = performance.now();
      await new Promise((res, rej) => {
        const step = now => {
          if (id !== run) return rej(STOP);
          const k = Math.min(1, (now - t0) / dur);
          sc.scrollTop = from + (to - from) * bez(k);
          fingerSet(x, y0 + (y1 - y0) * (1 - Math.pow(1 - k, 2)));
          k < 1 ? requestAnimationFrame(step) : res();
        };
        requestAnimationFrame(step);
      });
      down(false); await wait(250, id); show(false);
    }
    const yOf = (sc, el, off = 0) => el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - off;

    async function tour(id) {
      const home = $('#home-scroller');
      resetAll(); await wait(900, id);
      home.scrollTop = 0; await wait(500, id);

      // hero: swipe through the stacked slides
      for (let i = 0; i < 2; i++) { await swipeX(heroDeck.cards[heroDeck.index], id); await wait(1100, id); }

      // a short scroll — the glass header buttons appear
      await swipeScroll(home, 180, 900, id); await wait(900, id);

      // stories: open, next, close
      await swipeScroll(home, yOf(home, $('#stories'), 330), 900, id); await wait(300, id);
      await tap($('.st', storiesEl), id); await wait(2200, id);
      await tap($('.story__nav i:last-child'), id, { y: -120 }); await wait(2000, id);
      await tap($('.story .glass-x'), id); await wait(800, id);

      // match: add to calendar, pick odds, swipe the stack, buy → cart rises from below
      const ms = $('.screen[data-screen="home"] .sec-match');
      const front = () => $('.tk[data-pos="0"]', ms);
      await swipeScroll(home, yOf(home, ms, 220), 1000, id); await wait(1300, id);
      await tap($('.cal-btn', front()), id); await wait(1300, id);
      await tap($$('.odd', front())[0], id); await wait(700, id);
      await swipeX(front(), id); await wait(1100, id);
      await swipeX(front(), id, 170); await wait(1100, id);
      await tap($('.btn-red', front()), id); await wait(2200, id);

      // table: switch competition and back
      const tb = $('.screen[data-screen="home"] [data-block="table"]');
      await swipeScroll(home, yOf(home, tb, 90), 1000, id); await wait(300, id);
      await tap($('.seg__btn[data-seg-i="1"]', tb), id); await wait(1200, id);
      await tap($('.seg__btn[data-seg-i="0"]', tb), id); await wait(1000, id);

      // season ticket: one slow drag through the 3D card sequence
      const ab = $('.screen[data-screen="home"] .sec-abon');
      await swipeScroll(home, yOf(home, $('.abon-pin', ab), ABON_END), 3400, id); await wait(1100, id);

      // teams: the block pins, the scroll walks through the cards → media → merch pages → to the end and back
      const tp = teamsPin.offsetTop - teamPinTop;
      await swipeScroll(home, tp, 1300, id); await wait(900, id);
      for (let k = 1; k < tcs.length; k++) { await swipeScroll(home, tp + TEAM_STEP * k, 800, id); await wait(700, id); }
      await swipeScroll(home, yOf(home, $('.sec-media'), 70), 1500, id); await wait(900, id);
      const merch = $('.screen[data-screen="home"] .merch');
      await swipeScroll(home, yOf(home, merch.closest('.sec'), 90), 1200, id); await wait(300, id);
      await new Promise(r => { merch.scrollTo({ left: 181, behavior: 'smooth' }); setTimeout(r, 1200); }); alive(id);
      merch.scrollTo({ left: 0, behavior: 'smooth' }); await wait(800, id);
      await swipeScroll(home, home.scrollHeight, 1400, id); await wait(700, id);
      await swipeScroll(home, 260, 2200, id); await wait(500, id);

      // live activity on the lock screen
      live.show(); await wait(6500, id); live.hide(); await wait(1800, id);
      await tap($('#island'), id); await wait(4200, id);
      live.appHide(); await wait(800, id);

      // menu sheet: open, scroll, close
      await tap($('#hbar [data-action="open-menu"]'), id); await wait(1300, id);
      await swipeScroll(mScroller, 520, 1500, id); await wait(500, id);
      await swipeScroll(mScroller, 0, 1000, id); await wait(300, id);
      await tap($('.sheet .glass-x'), id); await wait(900, id);

      // dismiss the cart and go back to the top
      if (cartOpen) { closeCart(); await wait(900, id); }
      await swipeScroll(home, 0, 1600, id); await wait(400, id);
      stop();
    }
    const setBtn = v => { if (!btn) return; btn.querySelector('span').textContent = v ? 'Стоп' : 'Демо'; btn.classList.toggle('on', v); btn.classList.toggle('primary', !v); };
    function start() {
      const id = ++run; on = true;
      phone.classList.add('demo'); setBtn(true);
      tour(id).catch(e => { if (e !== STOP) { console.error(e); stop(); } });
    }
    function stop() {
      if (!on) return;
      run++; on = false;
      phone.classList.remove('demo'); setBtn(false);
      show(false); finger.classList.remove('down');
    }
    btn && btn.addEventListener('click', () => (on ? stop() : start()));
    // any real touch hands control back to the user
    phone.addEventListener('pointerdown', e => { if (e.isTrusted && on) stop(); }, true);
    if (/[?&]demo\b/.test(location.search) && !document.documentElement.classList.contains('mobile')) setTimeout(start, 1800);
    return { start, stop, get on() { return on; } };
  })();
})();
