(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;

  /* ---------- theme ---------- */
  const root = document.documentElement;
  try { const t = localStorage.getItem('theme'); if (t) root.dataset.theme = t; } catch (e) {}
  document.getElementById('theme').addEventListener('click', () => {
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
    field && field.recolor();
  });

  /* ---------- nav border ---------- */
  const nav = document.querySelector('.nav');
  const hero = document.getElementById('hero');
  new IntersectionObserver(([e]) => nav.classList.toggle('solid', !e.isIntersecting), { rootMargin: '-64px 0px 0px 0px', threshold: 0 }).observe(hero);

  /* ---------- reveal ---------- */
  const io = new IntersectionObserver((es) => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.rv').forEach(el => io.observe(el));

  /* ---------- count up ---------- */
  const fmt = (n, ko) => ko ? n.toLocaleString('ko-KR') : String(n);
  const cio = new IntersectionObserver((es) => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      const el = e.target, target = +el.dataset.count, ko = el.dataset.fmt === 'ko' || target >= 1000;
      if (reduce) { el.textContent = fmt(target, ko); return; }
      const t0 = performance.now(), dur = 1400;
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur), k = 1 - Math.pow(1 - p, 4);
        el.textContent = fmt(Math.round(target * k), ko);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(el => cio.observe(el));

  /* ---------- hero field (needles that turn toward the cursor) ---------- */
  let field = null;
  if (!reduce) {
    const cv = document.getElementById('field');
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, dpr = 1, pts = [], ink = '#131312', acc = '#e8431f';
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, live: false };
    const GAP = 30, LEN = 11;

    const recolor = () => {
      const cs = getComputedStyle(root);
      ink = cs.getPropertyValue('--ink').trim();
      acc = cs.getPropertyValue('--accent').trim();
    };
    const size = () => {
      const r = hero.getBoundingClientRect();
      W = r.width; H = r.height; dpr = Math.min(2, devicePixelRatio || 1);
      cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pts = [];
      const cols = Math.ceil(W / GAP) + 1, rows = Math.ceil(H / GAP) + 1;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        pts.push({ x: i * GAP + (j % 2 ? GAP / 2 : 0), y: j * GAP, a: Math.random() * Math.PI * 2, s: Math.random() * 1000 });
      }
      recolor();
    };
    const hex2rgb = (h) => {
      h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join('');
      const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    let t = 0;
    const draw = () => {
      t += 0.008;
      mouse.x += (mouse.tx - mouse.x) * 0.12; mouse.y += (mouse.ty - mouse.y) * 0.12;
      ctx.clearRect(0, 0, W, H);
      const [ir, ig, ib] = hex2rgb(ink), [ar, ag, ab] = hex2rgb(acc);
      const R = Math.min(W, H) * 0.42;
      ctx.lineWidth = 1.25; ctx.lineCap = 'round';
      for (const p of pts) {
        const dx = mouse.x - p.x, dy = mouse.y - p.y, d = Math.hypot(dx, dy);
        const idle = Math.sin(t + p.s * 0.01 + p.x * 0.004 + p.y * 0.006) * 0.9;
        let target = idle, k = 0;
        if (mouse.live && d < R) { k = 1 - d / R; k = k * k * (3 - 2 * k); target = Math.atan2(dy, dx) * k + idle * (1 - k); }
        let da = target - p.a; da = Math.atan2(Math.sin(da), Math.cos(da));
        p.a += da * 0.14;
        const alpha = 0.10 + k * 0.75;
        const r = Math.round(ir + (ar - ir) * k * k), g = Math.round(ig + (ag - ig) * k * k), b = Math.round(ib + (ab - ib) * k * k);
        const len = LEN * (0.7 + k * 0.9);
        const cx = p.x, cy = p.y, ox = Math.cos(p.a) * len / 2, oy = Math.sin(p.a) * len / 2;
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.beginPath(); ctx.moveTo(cx - ox, cy - oy); ctx.lineTo(cx + ox, cy + oy); ctx.stroke();
      }
      raf = requestAnimationFrame(draw);
    };
    let raf = 0, visible = true;
    const onMove = (e) => {
      const r = hero.getBoundingClientRect();
      mouse.tx = e.clientX - r.left; mouse.ty = e.clientY - r.top; mouse.live = true;
    };
    hero.addEventListener('pointermove', onMove, { passive: true });
    hero.addEventListener('pointerleave', () => { mouse.live = false; }, { passive: true });
    hero.addEventListener('touchmove', (e) => { const tt = e.touches[0]; if (tt) onMove(tt); }, { passive: true });
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(draw);
      if (!visible && raf) { cancelAnimationFrame(raf); raf = 0; }
    }).observe(hero);
    addEventListener('resize', size, { passive: true });
    size(); raf = requestAnimationFrame(draw);
    field = { recolor };
  }

  /* ---------- project list preview ---------- */
  const rows = [...document.querySelectorAll('.prow')];
  const pcard = document.getElementById('pcard'), pimg = document.getElementById('pimg');
  const preview = document.getElementById('preview');
  let cur = rows[0];
  const select = (row) => {
    if (row === cur) return;
    cur && cur.classList.remove('is-on');
    cur = row; row.classList.add('is-on');
    const src = row.dataset.img;
    pcard.classList.add('swap');
    setTimeout(() => { pimg.src = src; pimg.onload = () => pcard.classList.remove('swap'); }, 180);
  };
  rows.forEach(r => {
    r.addEventListener('pointerenter', () => select(r));
    r.addEventListener('focusin', () => select(r));
  });
  if (fine && !reduce) {
    const solo = document.getElementById('solo');
    solo.addEventListener('pointermove', (e) => {
      const r = preview.getBoundingClientRect();
      const nx = (e.clientX - (r.left + r.width / 2)) / innerWidth, ny = (e.clientY - (r.top + r.height / 2)) / innerHeight;
      pcard.style.setProperty('--ry', (nx * 10).toFixed(2) + 'deg');
      pcard.style.setProperty('--rx', (-ny * 10).toFixed(2) + 'deg');
    }, { passive: true });
    solo.addEventListener('pointerleave', () => { pcard.style.setProperty('--rx', '0deg'); pcard.style.setProperty('--ry', '0deg'); });
  }

  /* ---------- image pan on hover ---------- */
  if (fine && !reduce) {
    document.querySelectorAll('.pan').forEach(el => {
      const img = el.querySelector('img');
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
        img.style.setProperty('--px', (-nx * 4).toFixed(2) + '%');
        img.style.setProperty('--py', (-ny * 4).toFixed(2) + '%');
      }, { passive: true });
      el.addEventListener('pointerleave', () => { img.style.setProperty('--px', '0%'); img.style.setProperty('--py', '0%'); });
    });
  }

  /* ---------- magnetic buttons ---------- */
  if (fine && !reduce) {
    document.querySelectorAll('.mag').forEach(el => {
      let raf = 0, tx = 0, ty = 0, x = 0, y = 0;
      const tick = () => {
        x += (tx - x) * 0.18; y += (ty - y) * 0.18;
        el.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px)`;
        if (Math.abs(tx - x) > 0.1 || Math.abs(ty - y) > 0.1) raf = requestAnimationFrame(tick); else raf = 0;
      };
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect(), s = el.classList.contains('big-mail') ? 0.06 : 0.22;
        tx = (e.clientX - (r.left + r.width / 2)) * s; ty = (e.clientY - (r.top + r.height / 2)) * s;
        if (!raf) raf = requestAnimationFrame(tick);
      }, { passive: true });
      el.addEventListener('pointerleave', () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(tick); });
    });
  }

  /* ---------- equalizer (decorative, reacts to pointer) ---------- */
  const eq = document.getElementById('eq');
  const N = 28, bars = [];
  for (let i = 0; i < N; i++) { const b = document.createElement('i'); eq.appendChild(b); bars.push(b); }
  const base = (i) => 14 + 70 * Math.pow(i / (N - 1), 1.6);
  const setBars = (fx) => {
    bars.forEach((b, i) => {
      const dist = fx == null ? 99 : Math.abs(i / (N - 1) - fx);
      const boost = Math.max(0, 1 - dist * 4);
      b.style.setProperty('--h', Math.min(100, base(i) + boost * 40) + '%');
      b.classList.toggle('hot', boost > 0.15);
    });
  };
  setBars(null);
  if (!reduce) {
    eq.addEventListener('pointermove', (e) => { const r = eq.getBoundingClientRect(); setBars((e.clientX - r.left) / r.width); }, { passive: true });
    eq.addEventListener('pointerleave', () => setBars(null));
    let ph = 0, idle = 0;
    const wobble = () => {
      ph += 0.02;
      if (!eq.matches(':hover')) bars.forEach((b, i) => { b.style.setProperty('--h', (base(i) + Math.sin(ph + i * 0.35) * 4) + '%'); });
      idle = requestAnimationFrame(wobble);
    };
    new IntersectionObserver(([e]) => { if (e.isIntersecting) { if (!idle) idle = requestAnimationFrame(wobble); } else if (idle) { cancelAnimationFrame(idle); idle = 0; } }).observe(eq);
  }

  /* ---------- copy email ---------- */
  const copy = document.getElementById('copy');
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(copy.dataset.v); copy.textContent = '복사됨'; copy.classList.add('done'); }
    catch (e) { copy.textContent = copy.dataset.v; }
    setTimeout(() => { copy.textContent = '이메일 복사'; copy.classList.remove('done'); }, 1600);
  });
})();
