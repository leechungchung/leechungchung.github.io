(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  /* ---------- theme ---------- */
  try { const t = localStorage.getItem('theme'); if (t) root.dataset.theme = t; } catch (e) {}
  document.getElementById('theme').addEventListener('click', () => {
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
  });

  /* ---------- nav shadow ---------- */
  const nav = document.querySelector('.nav');
  const hero = document.getElementById('hero');
  new IntersectionObserver(([e]) => nav.classList.toggle('solid', !e.isIntersecting), { rootMargin: '-80px 0px 0px 0px' }).observe(hero);

  /* ---------- hero marker wipe ---------- */
  requestAnimationFrame(() => document.querySelectorAll('.mk').forEach(el => el.classList.add('in')));

  /* ---------- reveal ---------- */
  const io = new IntersectionObserver((es) => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
  document.querySelectorAll('.rv').forEach(el => io.observe(el));

  /* ---------- count up ---------- */
  const fmt = (n, ko) => ko ? n.toLocaleString('ko-KR') : String(n);
  const cio = new IntersectionObserver((es) => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      const el = e.target, target = +el.dataset.count, ko = el.dataset.fmt === 'ko' || target >= 1000;
      if (reduce) { el.textContent = fmt(target, ko); return; }
      const t0 = performance.now(), dur = 1300;
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur), k = 1 - Math.pow(1 - p, 4);
        el.textContent = fmt(Math.round(target * k), ko);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(el => cio.observe(el));

  /* ---------- sticky stack guard: only stick when the card fits the viewport ---------- */
  const guard = () => {
    const wraps = [...document.querySelectorAll('.case-wrap')];
    const cards = wraps.map(w => w.querySelector('.case'));
    cards.forEach(c => c.style.minHeight = '');
    const max = Math.max(...cards.map(c => c.offsetHeight));
    const fits = max <= innerHeight - 130 && innerWidth > 640;
    wraps.forEach(w => w.classList.toggle('static', !fits));
    if (fits) cards.forEach(c => c.style.minHeight = max + 'px');
  };
  guard(); addEventListener('resize', guard, { passive: true }); addEventListener('load', guard);

  /* ---------- team carousel ---------- */
  const rail = document.getElementById('rail');
  const slides = [...rail.querySelectorAll('.slide')];
  const dots = document.getElementById('dots');
  slides.forEach((s, i) => { const d = document.createElement('i'); if (i === 0) d.classList.add('on'); d.addEventListener('click', () => go(i)); dots.appendChild(d); });
  const dotEls = [...dots.children];
  let idx = 0;
  const go = (i) => {
    idx = Math.max(0, Math.min(slides.length - 1, i));
    if (rail.classList.contains('open')) { slides[idx].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); return; }
    rail.scrollTo({ left: slides[idx].offsetLeft - rail.offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
  };
  document.getElementById('prev').addEventListener('click', () => go(idx - 1));
  document.getElementById('next').addEventListener('click', () => go(idx + 1));
  const sio = new IntersectionObserver((es) => {
    es.forEach(e => { if (e.isIntersecting && e.intersectionRatio > 0.55) { idx = slides.indexOf(e.target); dotEls.forEach((d, i) => d.classList.toggle('on', i === idx)); } });
  }, { root: rail, threshold: [0.55] });
  slides.forEach(s => sio.observe(s));
  const expand = document.getElementById('expand');
  expand.addEventListener('click', () => {
    const open = rail.classList.toggle('open');
    expand.textContent = open ? '넘겨보기' : '펼쳐보기';
    document.getElementById('prev').style.visibility = open ? 'hidden' : '';
    document.getElementById('next').style.visibility = open ? 'hidden' : '';
    dots.style.visibility = open ? 'hidden' : '';
    if (!open) go(idx);
  });
  // deep link to a slide (#adams etc.)
  if (location.hash && slides.some(s => '#' + s.id === location.hash)) {
    const i = slides.findIndex(s => '#' + s.id === location.hash);
    setTimeout(() => { go(i); }, 300);
  }
  // keyboard
  rail.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') go(idx + 1); if (e.key === 'ArrowLeft') go(idx - 1); });
  rail.tabIndex = 0;

  /* ---------- copy email ---------- */
  const copy = document.getElementById('copy');
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(copy.dataset.v); copy.textContent = '복사됨'; copy.classList.add('done'); }
    catch (e) { copy.textContent = copy.dataset.v; }
    setTimeout(() => { copy.textContent = '이메일 복사'; copy.classList.remove('done'); }, 1600);
  });
})();
