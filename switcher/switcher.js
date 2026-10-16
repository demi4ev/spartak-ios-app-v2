/* Concept switcher — shared by both prototypes, which otherwise stay untouched.
   Usage: <script src=".../switcher/switcher.js" data-current="1|2" data-c1="url" data-c2="url"></script>
   A glass pill (styled after concept 1's HUD) in the top-left corner; keys 1 / 2 switch too.
   Switching fades the page out and navigates; the next page fades in. ?mobile / ?desktop are kept. */
(() => {
  const me = document.currentScript;
  const cur = me.dataset.current;
  const url = { 1: me.dataset.c1, 2: me.dataset.c2 };

  const css = `
  .csw{position:fixed;right:18px;bottom:18px;z-index:2147483000;display:flex;gap:4px;padding:5px;border-radius:999px;
    background:rgba(40,40,46,.62);backdrop-filter:blur(22px) saturate(1.6);-webkit-backdrop-filter:blur(22px) saturate(1.6);
    box-shadow:0 0 0 .5px rgba(255,255,255,.14) inset,0 10px 30px rgba(0,0,0,.45);
    font:500 13px/1 'TT Norms Pro','Golos Text',-apple-system,'SF Pro Text','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;user-select:none;
    transition:translate .8s cubic-bezier(.2,.9,.25,1.06)}
  .csw button{position:relative;height:32px;padding:0 14px;border:0;border-radius:999px;background:none;color:rgba(255,255,255,.72);
    font:inherit;cursor:pointer;white-space:nowrap;transition:color .25s,background-color .25s,transform .35s cubic-bezier(.2,.9,.25,1.12)}
  .csw button:hover{color:#fff;background:rgba(255,255,255,.1)}
  .csw button:active{transform:scale(.94)}
  .csw button[aria-current="true"]{background:#c8102e;color:#fff;cursor:default}
  .csw-fade{position:fixed;inset:0;z-index:2147483001;background:#09090b;pointer-events:none;opacity:1;transition:opacity .45s cubic-bezier(.22,.9,.3,1)}
  .csw-fade.out{opacity:0}
  /* bare-app (phone) mode: a compact pill bottom-right, just above the tab bar; it rides up with the cart */
  html.mobile .csw,body.mobile .csw{right:12px;bottom:calc(var(--csw-tab,92px) * var(--csw-s,1));padding:3px;gap:2px;background:rgba(30,30,36,.7)}
  html.mobile .csw button,body.mobile .csw button{height:28px;min-width:32px;padding:0 10px;font-size:12px}
  html.mobile .csw .csw-l,body.mobile .csw .csw-l{display:none}
  html.mobile .csw.up,body.mobile .csw.up{translate:0 calc(var(--csw-lift,84px) * var(--csw-s,1) * -1)}`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const go = n => {
    if (String(n) === cur || !url[n]) return;
    const q = new URLSearchParams(location.search), keep = new URLSearchParams();
    ['mobile', 'desktop'].forEach(k => { if (q.has(k)) keep.set(k, ''); });
    const target = url[n] + (keep.toString() ? '?' + keep.toString().replace(/=(&|$)/g, '$1') : '');
    fade.classList.remove('out');
    setTimeout(() => { location.href = target; }, 380);
  };

  const bar = document.createElement('div');
  bar.className = 'csw';
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Концепция');
  bar.innerHTML = [1, 2].map(n => `<button type="button" data-c="${n}" aria-current="${String(n) === cur}" aria-label="Концепция ${n}" title="Клавиша ${n}"><span class="csw-l">Концепция </span>${n}</button>`).join('');
  bar.addEventListener('click', e => { const b = e.target.closest('button'); if (b) go(b.dataset.c); });
  // keep presses on the switcher from reaching the prototypes' own pointer handlers
  ['pointerdown', 'mousedown', 'touchstart'].forEach(t => bar.addEventListener(t, e => e.stopPropagation()));

  const fade = document.createElement('div');
  fade.className = 'csw-fade';

  // optional: data-lift-el / data-lift-when name the element + state in which the bar moves up (open cart)
  const watchLift = () => {
    const el = me.dataset.liftEl && document.querySelector(me.dataset.liftEl);
    if (!el) return;
    const sync = () => bar.classList.toggle('up', el.matches(me.dataset.liftWhen));
    new MutationObserver(sync).observe(el, { attributes: true, attributeFilter: ['class'] });
    sync();
  };
  // concept 1 scales its 402px screen to the window on phones; follow that scale
  const scale = () => document.documentElement.style.setProperty('--csw-s', String(Math.min(innerWidth / +me.dataset.scale, 1.2)));
  const mount = () => {
    document.body.append(bar, fade);
    if (me.dataset.scale && document.body.classList.contains('mobile')) { scale(); addEventListener('resize', scale); }
    watchLift();
    requestAnimationFrame(() => requestAnimationFrame(() => fade.classList.add('out')));
  };
  document.body ? mount() : addEventListener('DOMContentLoaded', mount);
  addEventListener('pageshow', e => { if (e.persisted) fade.classList.add('out'); }); // back/forward cache

  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey || /input|textarea/i.test(e.target.tagName)) return;
    if (e.key === '1' || e.key === '2') go(e.key);
  });
})();
