'use strict';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const CAREER_START = new Date('2018-10-01');
const CV_URL = 'assets/resources/CV_Mahendranath.pdf';
const EMAIL = 'mtech.chauhan@gmail.com';

function yearsSince(date) {
  const now = new Date();
  return Math.floor(((now.getFullYear() - date.getFullYear()) * 12 + now.getMonth() - date.getMonth()) / 12);
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ========== TOAST ========== */
const toast = (() => {
  const el = $('.toast');
  let timer;
  return message => {
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => el.classList.remove('show'), 2200);
  };
})();

function scrollToId(id) {
  const target = document.getElementById(id);
  if (target) target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
}

function downloadCv() {
  const a = document.createElement('a');
  a.href = CV_URL;
  a.download = '';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function copyEmail() {
  try {
    await navigator.clipboard.writeText(EMAIL);
    toast(`✓ copied ${EMAIL}`);
    return true;
  } catch {
    window.location.href = `mailto:${EMAIL}`;
    return false;
  }
}

/* ========== THEME ========== */
const theme = (() => {
  const root = document.documentElement;
  const btn = $('[data-theme-toggle]');
  const listeners = [];
  const sync = () => {
    const icon = btn.querySelector('i');
    icon.className = root.dataset.theme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
    $('meta[name="theme-color"]').content = root.dataset.theme === 'light' ? '#f6f7f9' : '#07090d';
  };
  const toggle = () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('portfolio-theme', `${root.dataset.theme}-theme`);
    sync();
    listeners.forEach(fn => fn());
  };
  btn.addEventListener('click', toggle);
  sync();
  return { toggle, onChange: fn => listeners.push(fn) };
})();

/* ========== STATIC DATA: durations, year, clock, render time ========== */
(function initMeta() {
  const duration = (from, to) => {
    const start = new Date(from);
    const end = to ? new Date(to) : new Date();
    const months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
    const y = Math.floor(months / 12);
    const m = months % 12;
    return [y && `${y} yr${y > 1 ? 's' : ''}`, m && `${m} mo`].filter(Boolean).join(' ');
  };
  $('#mphasis-duration').textContent = `April 2024 – Present · ${duration('2024-04-01')}`;
  $('#worldline-duration').textContent = `October 2021 – April 2024 · ${duration('2021-10-01', '2024-04-01')}`;
  $('#footer-year').textContent = new Date().getFullYear();

  const clock = $('#local-time');
  const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
  const tick = () => { clock.textContent = fmt.format(new Date()); };
  tick();
  setInterval(tick, 15000);

  window.addEventListener('load', () => {
    const nav = performance.getEntriesByType('navigation')[0];
    $('#render-time').textContent = Math.round(nav ? nav.domContentLoadedEventEnd : performance.now());
  });
})();

/* ========== TYPING ROLES ========== */
(function initTyping() {
  const el = $('#typed-text');
  const roles = [
    'Java Full Stack Module Lead',
    'Spring Boot microservices',
    'Apache Camel integration',
    'Hazelcast distributed caching',
    'Angular micro-frontends',
    'SAFe Agile team lead'
  ];
  if (reducedMotion) { el.textContent = roles[0]; return; }
  let role = 0, chars = 0, deleting = false;
  (function tick() {
    const text = roles[role];
    chars += deleting ? -1 : 1;
    el.textContent = text.slice(0, chars);
    let delay = deleting ? 28 : 55 + Math.random() * 50;
    if (!deleting && chars === text.length) { deleting = true; delay = 1900; }
    else if (deleting && chars === 0) { deleting = false; role = (role + 1) % roles.length; delay = 350; }
    setTimeout(tick, delay);
  })();
})();

/* ========== TEXT SCRAMBLE ========== */
function scramble(el) {
  const finalText = el.dataset.text || (el.dataset.text = el.textContent);
  if (reducedMotion) return;
  const glyphs = '!<>-_\\/[]{}=+*^?#01';
  const frames = 26;
  let frame = 0;
  const reveal = [...finalText].map((_, i) => Math.floor((i / finalText.length) * frames * 0.7 + Math.random() * frames * 0.3));
  (function step() {
    el.textContent = [...finalText].map((ch, i) => {
      if (ch === ' ' || frame >= reveal[i]) return ch;
      return glyphs[Math.floor(Math.random() * glyphs.length)];
    }).join('');
    if (++frame <= frames) requestAnimationFrame(step);
    else el.textContent = finalText;
  })();
}

/* ========== COUNTERS ========== */
function countUp(el) {
  const target = el.dataset.countYears ? yearsSince(new Date(el.dataset.countYears)) : Number(el.dataset.count);
  if (reducedMotion) { el.textContent = target; return; }
  const start = performance.now();
  const dur = 1400;
  (function step(now) {
    const p = clamp((now - start) / dur, 0, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 4)));
    if (p < 1) requestAnimationFrame(step);
  })(start);
}

/* ========== REVEAL ON SCROLL ========== */
(function initReveal() {
  ['.gitlog', '.arch', '.projects', '.about-grid'].forEach(group => {
    $$(`${group} > .reveal`).forEach((el, i) => el.style.setProperty('--d', `${i * 90}ms`));
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      observer.unobserve(el);
      if (el.matches('.reveal')) el.classList.add('revealed');
      if (el.matches('[data-scramble]')) scramble(el);
      if (el.matches('[data-count], [data-count-years]')) countUp(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  $$('.reveal, [data-scramble], [data-count], [data-count-years]').forEach(el => observer.observe(el));
})();

/* ========== NAV, SCROLL PROGRESS, SPY, GIT RAIL ========== */
(function initScroll() {
  const nav = $('.nav');
  const bar = $('.scroll-progress span');
  const toTop = $('.to-top');
  const rail = $('.gitlog-wrap');
  const fill = $('.gitlog-fill');
  const links = $$('.nav-links a');
  const hamburger = $('.hamburger');
  const menu = $('.nav-links');
  let lastY = window.scrollY;
  let ticking = false;

  function update() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav.classList.toggle('scrolled', y > 20);
    if (y <= 300 || y < lastY - 4 || menu.classList.contains('open')) nav.classList.remove('hidden');
    else if (y > lastY + 4) nav.classList.add('hidden');
    toTop.classList.toggle('visible', y > 700);
    const r = rail.getBoundingClientRect();
    fill.style.setProperty('--progress', clamp((window.innerHeight * 0.65 - r.top) / r.height, 0, 1));
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();

  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' }));

  const setMenu = open => {
    menu.classList.toggle('open', open);
    nav.classList.toggle('menu-open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  hamburger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  links.forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  const spy = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  $$('main section[id]').forEach(s => spy.observe(s));
})();

/* ========== POINTER EFFECTS: glow, spotlight, magnetic, tilt ========== */
(function initPointer() {
  if (!finePointer) return;
  const glow = $('.cursor-glow');
  window.addEventListener('pointermove', e => {
    glow.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
  }, { passive: true });

  $$('.spotlight').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  if (reducedMotion) return;

  $$('.magnetic').forEach(btn => {
    btn.addEventListener('pointermove', e => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * 0.18}px, ${y * 0.3}px)`;
    });
    btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
  });

  $$('.tilt').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      const depth = card.classList.contains('featured') ? 2.5 : 6;
      card.style.transform = `perspective(1000px) rotateX(${-py * depth}deg) rotateY(${px * depth}deg) translateY(-4px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
})();

/* ========== ARCHITECTURE TRACE ========== */
(function initArchTrace() {
  const arch = $('.arch');
  const layers = $$('.layer', arch);
  let idx = 0, timer = null, hovering = false;
  const step = () => {
    if (hovering) return;
    layers.forEach((l, i) => l.classList.toggle('active', i === idx));
    idx = (idx + 1) % layers.length;
  };
  layers.forEach(layer => {
    layer.addEventListener('pointerenter', () => {
      hovering = true;
      layers.forEach(l => l.classList.toggle('active', l === layer));
    });
    layer.addEventListener('pointerleave', () => { hovering = false; layer.classList.remove('active'); });
  });
  if (reducedMotion) return;
  new IntersectionObserver(([entry]) => {
    clearInterval(timer);
    if (entry.isIntersecting) timer = setInterval(step, 1100);
    else layers.forEach(l => l.classList.remove('active'));
  }, { threshold: 0.25 }).observe(arch);
})();

/* ========== NUMPY MATRIX VISUAL ========== */
(function initMatrix() {
  const grid = $('.matrix');
  const cols = 8, rows = 5;
  const cells = Array.from({ length: cols * rows }, () => grid.appendChild(document.createElement('i')));
  if (reducedMotion) return;
  const patterns = [
    (r, c, t) => c === t % cols,
    (r, c, t) => r === t % rows,
    (r, c, t) => (r + c) % 4 === t % 4,
    (r, c, t) => r === c % rows && t % 2 === 0,
    (r, c, t) => (r * c + t) % 5 === 0
  ];
  let t = 0, timer = null;
  const step = () => {
    const pattern = patterns[Math.floor(t / 8) % patterns.length];
    cells.forEach((cell, i) => cell.classList.toggle('on', pattern(Math.floor(i / cols), i % cols, t)));
    t++;
  };
  new IntersectionObserver(([entry]) => {
    clearInterval(timer);
    if (entry.isIntersecting) timer = setInterval(step, 420);
  }).observe(grid);
})();

/* ========== COPY EMAIL ========== */
(function initCopy() {
  const btn = $('[data-copy]');
  const state = $('.copy-state', btn);
  btn.addEventListener('click', async () => {
    if (!(await copyEmail())) return;
    btn.classList.add('copied');
    state.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> copied';
    setTimeout(() => {
      btn.classList.remove('copied');
      state.innerHTML = '<i class="far fa-copy" aria-hidden="true"></i> copy';
    }, 2000);
  });
})();

/* =====================================================================
   HERO: live microservice topology
   ===================================================================== */
(function initTopology() {
  const canvas = $('.topology');
  const ctx = canvas.getContext('2d');
  const hero = $('.hero');
  const SERVICES = [
    { id: 'client', label: 'angular-ui', x: 0.05, y: 0.2 },
    { id: 'gateway', label: 'api-gateway', x: 0.2, y: 0.09 },
    { id: 'auth', label: 'auth-svc', x: 0.38, y: 0.05 },
    { id: 'notice', label: 'notice-svc', x: 0.58, y: 0.08 },
    { id: 'payment', label: 'payment-svc', x: 0.79, y: 0.06 },
    { id: 'kafka', label: 'kafka', x: 0.95, y: 0.3 },
    { id: 'camel', label: 'camel-routes', x: 0.97, y: 0.68 },
    { id: 'hazel', label: 'hazelcast', x: 0.82, y: 0.93 },
    { id: 'ledger', label: 'ledger-svc', x: 0.58, y: 0.95 },
    { id: 'db', label: 'sql-db', x: 0.36, y: 0.93 },
    { id: 'mq', label: 'ibm-mq', x: 0.16, y: 0.88 },
    { id: 'config', label: 'config-svc', x: 0.03, y: 0.6 }
  ];
  const LINKS = [
    ['client', 'gateway'], ['gateway', 'auth'], ['gateway', 'notice'], ['gateway', 'payment'],
    ['notice', 'kafka'], ['payment', 'kafka'], ['kafka', 'camel'], ['camel', 'hazel'],
    ['camel', 'ledger'], ['notice', 'hazel'], ['ledger', 'db'], ['auth', 'db'],
    ['ledger', 'mq'], ['mq', 'config'], ['config', 'client'], ['payment', 'hazel'], ['db', 'mq']
  ];

  let w = 0, h = 0, dpr = 1, nodes = [], edges = [], packets = [], mesh = [], zones = [];
  let colors = {};
  let running = false, raf = 0, last = 0, spawnClock = 0;
  const mouse = { x: -9999, y: -9999 };

  const readColors = () => {
    const css = getComputedStyle(document.documentElement);
    colors = {
      accent: css.getPropertyValue('--accent-rgb').trim(),
      blue: css.getPropertyValue('--blue-rgb').trim(),
      light: document.documentElement.dataset.theme === 'light'
    };
  };

  function layout() {
    const r = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const padX = Math.max(40, w * 0.03), padTop = 90, padBottom = 50;
    // keep the graph around the copy and terminal, never on top of them
    zones = $$('.hero-copy, .terminal').map(el => {
      const z = el.getBoundingClientRect();
      return { x: z.left - r.left - 28, y: z.top - r.top - 22, w: z.width + 56, h: z.height + 44 };
    });
    ctx.font = '500 11px "JetBrains Mono", ui-monospace, monospace';
    // on narrow screens the content fills the hero, so only the ambient mesh is drawn
    nodes = w < 760 ? [] : SERVICES.map((s, i) => {
      const n = { ...s, bx: padX + s.x * (w - padX * 2), by: padTop + s.y * (h - padTop - padBottom), phase: i * 1.7, heat: 0 };
      placeOutsideZones(n, padX, padTop);
      n.labelLeft = !labelFits(n, false) && labelFits(n, true);
      n.showLabel = n.labelLeft || labelFits(n, false);
      return n;
    });
    const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
    edges = nodes.length ? LINKS.map(([a, b]) => ({ a: byId[a], b: byId[b], heat: 0 })) : [];
    const count = Math.round(clamp((w * h) / 26000, 18, 60));
    mesh = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.12
    }));
    packets = [];
  }

  const inZone = (x, y) => zones.some(z => x > z.x && x < z.x + z.w && y > z.y && y < z.y + z.h);

  function placeOutsideZones(n, padX, padTop) {
    for (let pass = 0; pass < 3; pass++) {
      const z = zones.find(z => n.bx > z.x && n.bx < z.x + z.w && n.by > z.y && n.by < z.y + z.h);
      if (!z) return;
      const options = [
        { x: z.x - 4, y: n.by }, { x: z.x + z.w + 4, y: n.by },
        { x: n.bx, y: z.y - 4 }, { x: n.bx, y: z.y + z.h + 4 }
      ].filter(o => o.x > padX * 0.5 && o.x < w - padX * 0.5 && o.y > padTop * 0.8 && o.y < h - 20);
      if (!options.length) return;
      const best = options.reduce((a, o) => (Math.hypot(o.x - n.bx, o.y - n.by) < Math.hypot(a.x - n.bx, a.y - n.by) ? o : a));
      n.bx = best.x; n.by = best.y;
    }
  }

  function labelFits(n, left) {
    const width = ctx.measureText(n.label).width + 14;
    const x0 = left ? n.bx - width : n.bx;
    const x1 = left ? n.bx : n.bx + width;
    return x0 > 0 && x1 < w && !zones.some(z => x1 > z.x && x0 < z.x + z.w && n.by > z.y && n.by < z.y + z.h);
  }

  function spawn(edge, reverse = Math.random() < 0.35) {
    packets.push({ edge, t: 0, reverse, speed: 0.25 + Math.random() * 0.35, kind: Math.random() < 0.7 ? 'accent' : 'blue' });
  }

  function burst(x, y) {
    if (!nodes.length) return;
    let nearest = nodes[0], best = Infinity;
    nodes.forEach(n => {
      const d = Math.hypot(n.x - x, n.y - y);
      if (d < best) { best = d; nearest = n; }
    });
    nearest.heat = 1;
    edges.filter(e => e.a === nearest || e.b === nearest).forEach(e => spawn(e, e.b === nearest));
  }

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const time = now / 1000;
    ctx.clearRect(0, 0, w, h);
    const a = colors.accent, b = colors.blue;
    const base = colors.light ? 0.5 : 1;

    // ambient mesh
    mesh.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
    });
    for (let i = 0; i < mesh.length; i++) {
      const p = mesh[i];
      for (let j = i + 1; j < mesh.length; j++) {
        const q = mesh[j];
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < 130) {
          ctx.strokeStyle = `rgba(${b}, ${(1 - d / 130) * 0.08 * base})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
      const md = inZone(mouse.x, mouse.y) ? Infinity : Math.hypot(p.x - mouse.x, p.y - mouse.y);
      ctx.fillStyle = `rgba(${b}, ${(md < 160 ? 0.6 : 0.22) * base})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2); ctx.fill();
      if (md < 160) {
        ctx.strokeStyle = `rgba(${a}, ${(1 - md / 160) * 0.35 * base})`;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
    }

    // service nodes drift + mouse attraction
    nodes.forEach(n => {
      const dx = mouse.x - n.bx, dy = mouse.y - n.by;
      const d = Math.hypot(dx, dy);
      const pull = d < 220 ? (1 - d / 220) * 18 : 0;
      n.x = n.bx + Math.sin(time * 0.6 + n.phase) * 6 + (d ? (dx / d) * pull : 0);
      n.y = n.by + Math.cos(time * 0.5 + n.phase) * 5 + (d ? (dy / d) * pull : 0);
      n.near = d < 220;
      n.heat = Math.max(0, n.heat - dt * 0.9);
    });

    // edges
    edges.forEach(e => {
      e.heat = Math.max(0, e.heat - dt * 0.8);
      const hot = Math.max(e.heat, e.a.near || e.b.near ? 0.5 : 0);
      ctx.strokeStyle = `rgba(${a}, ${(0.1 + hot * 0.35) * base})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.lineDashOffset = -time * 14;
      ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y); ctx.stroke();
    });
    ctx.setLineDash([]);

    // packets
    spawnClock += dt;
    if (edges.length && spawnClock > 0.28 && packets.length < 40) {
      spawnClock = 0;
      spawn(edges[Math.floor(Math.random() * edges.length)]);
    }
    packets = packets.filter(p => {
      p.t += p.speed * dt;
      const from = p.reverse ? p.edge.b : p.edge.a;
      const to = p.reverse ? p.edge.a : p.edge.b;
      if (p.t >= 1) {
        to.heat = Math.min(1, to.heat + 0.5);
        p.edge.heat = Math.min(1, p.edge.heat + 0.4);
        return false;
      }
      const tail = Math.max(0, p.t - 0.08);
      const x = from.x + (to.x - from.x) * p.t, y = from.y + (to.y - from.y) * p.t;
      const tx = from.x + (to.x - from.x) * tail, ty = from.y + (to.y - from.y) * tail;
      const rgb = p.kind === 'accent' ? a : b;
      const grad = ctx.createLinearGradient(tx, ty, x, y);
      grad.addColorStop(0, `rgba(${rgb}, 0)`);
      grad.addColorStop(1, `rgba(${rgb}, ${0.9 * base + 0.1})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = `rgba(${rgb}, 1)`;
      ctx.shadowColor = `rgba(${rgb}, 0.9)`;
      ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      return true;
    });

    // fade lines and packets that pass behind the copy and terminal
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 40;
    zones.forEach(z => ctx.fillRect(z.x + 20, z.y + 16, z.w - 40, z.h - 32));
    ctx.restore();

    // nodes + labels
    ctx.font = '500 11px "JetBrains Mono", ui-monospace, monospace';
    ctx.textBaseline = 'middle';
    nodes.forEach(n => {
      const glow = Math.max(n.heat, n.near ? 0.7 : 0);
      ctx.fillStyle = colors.light ? 'rgba(246, 247, 249, 0.9)' : 'rgba(7, 9, 13, 0.9)';
      ctx.strokeStyle = `rgba(${a}, ${(0.35 + glow * 0.65) * base + 0.1})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(n.x, n.y, 6 + glow * 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = `rgba(${a}, ${0.5 + glow * 0.5})`;
      ctx.beginPath(); ctx.arc(n.x, n.y, 2.2, 0, Math.PI * 2); ctx.fill();
      if (glow > 0.05) {
        ctx.strokeStyle = `rgba(${a}, ${glow * 0.3})`;
        ctx.beginPath(); ctx.arc(n.x, n.y, 12 + (1 - n.heat) * 10, 0, Math.PI * 2); ctx.stroke();
      }
      const right = !n.labelLeft;
      ctx.textAlign = right ? 'left' : 'right';
      ctx.fillStyle = colors.light ? `rgba(51, 65, 85, ${0.45 + glow * 0.5})` : `rgba(180, 191, 204, ${0.35 + glow * 0.6})`;
      if (n.showLabel) ctx.fillText(n.label, n.x + (right ? 14 : -14), n.y);
    });

    if (running) raf = requestAnimationFrame(frame);
  }

  const start = () => {
    if (running || reducedMotion) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  readColors();
  layout();
  document.fonts.ready.then(() => { layout(); if (reducedMotion) frame(performance.now()); });
  if (reducedMotion) frame(performance.now());

  theme.onChange(() => { readColors(); if (reducedMotion) frame(performance.now()); });
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { layout(); if (reducedMotion) frame(performance.now()); }, 150);
  });
  hero.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
  hero.addEventListener('click', e => {
    if (e.target.closest('a, button, input, .terminal')) return;
    const r = canvas.getBoundingClientRect();
    burst(e.clientX - r.left, e.clientY - r.top);
  });

  new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop())).observe(hero);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
})();

/* =====================================================================
   HERO: terminal (boot log + interactive shell)
   ===================================================================== */
(function initTerminal() {
  const body = $('.term-body');
  const out = $('.term-output');
  const form = $('.term-input');
  const input = $('#term-cmd');
  const history = [];
  let historyIdx = 0;
  const years = yearsSince(CAREER_START);
  const sleep = ms => new Promise(r => setTimeout(r, reducedMotion ? 0 : ms));
  const stamp = () => `<span class="t-dim">${new Date().toTimeString().slice(0, 8)}</span>`;
  const scrollDown = () => { body.scrollTop = body.scrollHeight; };

  function print(html = '', cls = '') {
    const line = document.createElement('div');
    line.className = `line ${cls}`.trim();
    line.innerHTML = html;
    out.appendChild(line);
    scrollDown();
    return line;
  }

  async function typeCommand(cmd) {
    const line = print('<span class="t-ok">→</span> <span class="t-acc">~</span> ');
    const span = document.createElement('span');
    span.className = 't-b';
    line.appendChild(span);
    for (const ch of cmd) {
      span.textContent += ch;
      await sleep(28 + Math.random() * 40);
    }
    await sleep(260);
  }

  const SECTIONS = ['about', 'experience', 'stack', 'projects', 'credentials', 'contact'];
  const FILES = { 'about.md': 'about', 'experience.log': 'experience', 'stack.yml': 'skills', 'projects/': 'projects', 'contact.txt': 'contact' };

  const COMMANDS = {
    help: {
      desc: 'list available commands',
      run: () => {
        print('<span class="t-b">available commands</span>');
        Object.entries(COMMANDS).forEach(([name, c]) => {
          if (!c.hidden) print(`  <span class="t-key">${name.padEnd(11)}</span><span class="t-dim">${c.desc}</span>`);
        });
        print('<span class="t-dim">tip: ↑/↓ history · tab to complete · Ctrl+K anywhere</span>');
      }
    },
    whoami: {
      desc: 'who is running this service',
      run: () => print(`<span class="t-b">Mahendranath Jogi</span> — Java Full Stack Module Lead @ Mphasis · ${years}+ yrs`)
    },
    about: {
      desc: 'short summary',
      run: () => {
        print('Module Lead building <span class="t-ok">Spring Boot</span> microservices, <span class="t-ok">Apache Camel</span>');
        print('middleware and <span class="t-ok">Angular</span> micro-frontends for a top global custodian bank.');
        print('<span class="t-dim">→ scrolling to #about</span>');
        scrollToId('about');
      }
    },
    skills: {
      desc: 'print the tech stack',
      run: () => {
        const stack = {
          backend: ['Java 21', 'Spring Boot', 'Apache Camel', 'JPA'],
          data: ['Hazelcast', 'Kafka', 'ActiveMQ', 'IBM MQ'],
          frontend: ['Angular', 'TypeScript'],
          platform: ['Docker', 'AWS', 'AKS', 'GitLab CI'],
          quality: ['JUnit 5', 'mutation tests', 'SonarQube']
        };
        print('<span class="t-dim">stack:</span>');
        Object.entries(stack).forEach(([k, v]) => print(`  <span class="t-key">${k}:</span> <span class="t-str">[${v.join(', ')}]</span>`));
      }
    },
    experience: {
      desc: 'git log --oneline --career',
      run: () => {
        [
          ['a7f3c21', 'HEAD -> main', 'Module Lead @ Mphasis (2024 – now)'],
          ['5e19b08', '', 'Consultant @ Worldline (2021 – 2024)'],
          ['c40d9e2', '', 'System Engineer @ Infosys (2018 – 2021)'],
          ['8b2a6f4', '', 'Advisor @ Tech Mahindra (2017 – 2018)'],
          ['0f1e3a9', '', 'Grammar Faculty (2015 – 2017)']
        ].forEach(([hash, ref, msg]) => print(`<span class="t-warn">${hash}</span> ${ref ? `<span class="t-info">(${ref})</span> ` : ''}${msg}`));
      }
    },
    projects: {
      desc: 'list side projects',
      run: () => {
        [
          ['batch-room', 'batchroom/index.html', 'realtime memory wall · Firebase'],
          ['ds-explorer', 'tutorials/datascience/index.html', 'interactive data-science course'],
          ['numpy-labs', 'tutorials/numpy/index.html', '7 visual NumPy labs'],
          ['udaipur-travels', 'udaipur-travels/index.html', 'Rajasthani music & travel']
        ].forEach(([name, href, desc]) => print(`  <a href="${href}" target="_blank" rel="noopener noreferrer">${name}</a> <span class="t-dim">— ${desc}</span>`));
      }
    },
    contact: {
      desc: 'how to reach me',
      run: () => {
        print(`  <span class="t-key">email</span>    <a href="mailto:${EMAIL}">${EMAIL}</a>`);
        print('  <span class="t-key">linkedin</span> <a href="https://www.linkedin.com/in/maahistic" target="_blank" rel="noopener noreferrer">in/maahistic</a>');
        print('  <span class="t-key">github</span>   <a href="https://github.com/maahistic" target="_blank" rel="noopener noreferrer">@maahistic</a>');
      }
    },
    cv: { desc: 'download my CV', run: () => { print('<span class="t-ok">✓</span> downloading CV_Mahendranath.pdf …'); downloadCv(); } },
    email: { desc: 'copy email to clipboard', run: async () => print((await copyEmail()) ? `<span class="t-ok">✓</span> copied ${EMAIL}` : 'opening mail client …') },
    goto: {
      desc: 'goto <section> — scroll the page',
      run: ([target]) => {
        if (!SECTIONS.includes(target)) return print(`<span class="t-dim">usage: goto ${SECTIONS.join('|')}</span>`);
        print(`<span class="t-dim">→ #${target}</span>`);
        scrollToId(target);
      }
    },
    theme: { desc: 'toggle light / dark', run: () => { theme.toggle(); print(`<span class="t-ok">✓</span> theme → ${document.documentElement.dataset.theme}`); } },
    ls: { desc: 'list files', run: () => print(Object.keys(FILES).map(f => (f.endsWith('/') ? `<span class="t-info">${f}</span>` : f)).join('  ')) },
    cat: {
      desc: 'cat <file>',
      run: ([file]) => (FILES[file] ? COMMANDS[FILES[file]].run([]) : print(`cat: ${escapeHtml(file || '')}: No such file or directory`, 't-err'))
    },
    date: { desc: 'current time in Pune', run: () => print(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' }) + ' IST') },
    history: { desc: 'command history', run: () => history.forEach((h, i) => print(`  <span class="t-dim">${String(i + 1).padStart(3)}</span>  ${escapeHtml(h)}`)) },
    clear: { desc: 'clear the screen', run: () => { out.innerHTML = ''; } },
    sudo: { hidden: true, run: () => print('<span class="t-warn">guest is not in the sudoers file.</span> This incident will be reported to /dev/null.') },
    exit: { hidden: true, run: () => print('<span class="t-dim">there is no escape. try </span><span class="t-key">contact</span>') },
    hire: { hidden: true, run: () => COMMANDS.contact.run([]) }
  };

  async function execute(raw) {
    const cmdline = raw.trim();
    print(`<span class="t-ok">→</span> <span class="t-acc">~</span> <span class="t-b">${escapeHtml(cmdline)}</span>`);
    if (!cmdline) return;
    history.push(cmdline);
    historyIdx = history.length;
    const [name, ...args] = cmdline.split(/\s+/);
    const cmd = COMMANDS[name.toLowerCase()];
    if (cmd) await cmd.run(args);
    else print(`zsh: command not found: ${escapeHtml(name)} <span class="t-dim">— try 'help'</span>`, 't-err');
    if (typeof gtag === 'function') gtag('event', 'terminal_command', { command: cmd ? name : 'unknown' });
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const value = input.value;
    input.value = '';
    execute(value);
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp' && history.length) {
      e.preventDefault();
      historyIdx = Math.max(0, historyIdx - 1);
      input.value = history[historyIdx];
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      historyIdx = Math.min(history.length, historyIdx + 1);
      input.value = history[historyIdx] || '';
    } else if (e.key === 'Tab') {
      const match = Object.keys(COMMANDS).find(c => !COMMANDS[c].hidden && c.startsWith(input.value) && input.value);
      if (match) { e.preventDefault(); input.value = `${match} `; }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      out.innerHTML = '';
    }
  });
  body.addEventListener('click', e => {
    if (!e.target.closest('a') && !window.getSelection().toString()) input.focus({ preventScroll: true });
  });

  async function boot() {
    form.hidden = true;
    await sleep(700);
    await typeCommand('./mvnw spring-boot:run -Dprofile=engineer');
    print('<span class="t-ok"> :: Spring Boot ::</span> <span class="t-dim">(v3.3.2)</span>');
    const logs = [
      ['INFO', 'Starting <span class="t-b">EngineerApplication</span> on Java 21'],
      ['INFO', 'Active profiles: <span class="t-str">module-lead, full-stack</span>'],
      ['INFO', 'Hazelcast cluster formed <span class="t-dim">(members: 3)</span>'],
      ['INFO', 'Kafka consumer subscribed <span class="t-dim">[ideas]</span>'],
      ['INFO', 'Camel routes started <span class="t-dim">(6/6)</span>'],
      ['INFO', 'Angular micro-frontends mounted'],
      ['INFO', `Started EngineerApplication <span class="t-dim">uptime=</span><span class="t-num">${years}y</span>`]
    ];
    for (const [level, msg] of logs) {
      await sleep(170 + Math.random() * 180);
      print(`${stamp()} <span class="t-ok">${level}</span> ${msg}`);
    }
    await sleep(500);
    await typeCommand('curl -s /actuator/health');
    [
      '{',
      '  <span class="t-key">"status"</span>: <span class="t-str">"UP"</span>,',
      '  <span class="t-key">"role"</span>: <span class="t-str">"Module Lead"</span>,',
      `  <span class="t-key">"experienceYears"</span>: <span class="t-num">${years}</span>,`,
      '  <span class="t-key">"focus"</span>: [<span class="t-str">"microservices"</span>, <span class="t-str">"caching"</span>, <span class="t-str">"angular"</span>]',
      '}'
    ].forEach(l => print(l));
    print('');
    print('<span class="t-dim">interactive shell ready — type</span> <span class="t-key">help</span>');
    form.hidden = false;
    scrollDown();
  }
  boot();
})();

/* =====================================================================
   COMMAND PALETTE (Ctrl/⌘ + K)
   ===================================================================== */
(function initPalette() {
  const palette = $('.palette');
  const search = $('input', palette);
  const list = $('.palette-list', palette);
  let items = [], selected = 0, lastFocus = null;

  const open = url => window.open(url, '_blank', 'noopener');
  const ACTIONS = [
    { group: 'Navigate', label: 'Home', icon: 'fa-house', hint: '#top', run: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { group: 'Navigate', label: 'About', icon: 'fa-user', hint: '#about', run: () => scrollToId('about') },
    { group: 'Navigate', label: 'Experience', icon: 'fa-code-commit', hint: '#experience', run: () => scrollToId('experience') },
    { group: 'Navigate', label: 'Stack & architecture', icon: 'fa-layer-group', hint: '#stack', run: () => scrollToId('stack') },
    { group: 'Navigate', label: 'Projects', icon: 'fa-rocket', hint: '#projects', run: () => scrollToId('projects') },
    { group: 'Navigate', label: 'Education & certifications', icon: 'fa-award', hint: '#credentials', run: () => scrollToId('credentials') },
    { group: 'Navigate', label: 'Contact', icon: 'fa-envelope', hint: '#contact', run: () => scrollToId('contact') },
    { group: 'Actions', label: 'Download CV', icon: 'fa-download', hint: 'pdf', run: downloadCv },
    { group: 'Actions', label: 'Copy email address', icon: 'fa-copy', hint: EMAIL, run: copyEmail },
    { group: 'Actions', label: 'Toggle light / dark theme', icon: 'fa-circle-half-stroke', hint: 'theme', run: () => theme.toggle() },
    { group: 'Actions', label: 'Open terminal', icon: 'fa-terminal', hint: 'shell', run: () => { window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => $('#term-cmd').focus({ preventScroll: true }), 400); } },
    { group: 'Links', label: 'LinkedIn', icon: 'fa-brands fa-linkedin-in', hint: 'in/maahistic', run: () => open('https://www.linkedin.com/in/maahistic') },
    { group: 'Links', label: 'GitHub', icon: 'fa-brands fa-github', hint: '@maahistic', run: () => open('https://github.com/maahistic') },
    { group: 'Projects', label: 'Batch Room', icon: 'fa-users', hint: 'app', run: () => open('batchroom/index.html') },
    { group: 'Projects', label: 'Data Science Explorer', icon: 'fa-chart-column', hint: 'lab', run: () => { location.href = 'tutorials/datascience/index.html'; } },
    { group: 'Projects', label: 'NumPy Visual Explorer', icon: 'fa-table-cells', hint: 'lab', run: () => { location.href = 'tutorials/numpy/index.html'; } },
    { group: 'Projects', label: 'Udaipur Travels', icon: 'fa-music', hint: 'experience', run: () => open('udaipur-travels/index.html') }
  ];

  const fuzzy = (text, query) => {
    let i = 0;
    const t = text.toLowerCase();
    for (const ch of query.toLowerCase()) {
      i = t.indexOf(ch, i);
      if (i === -1) return false;
      i++;
    }
    return true;
  };

  function render() {
    const q = search.value.trim();
    items = ACTIONS.filter(a => !q || fuzzy(`${a.label} ${a.group} ${a.hint}`, q));
    selected = clamp(selected, 0, Math.max(0, items.length - 1));
    list.innerHTML = '';
    if (!items.length) {
      list.innerHTML = '<li class="palette-empty">No results. Try "cv", "theme" or "projects".</li>';
      return;
    }
    let group = '';
    items.forEach((item, i) => {
      if (item.group !== group) {
        group = item.group;
        const g = document.createElement('li');
        g.className = 'palette-group';
        g.setAttribute('role', 'presentation');
        g.textContent = group;
        list.appendChild(g);
      }
      const li = document.createElement('li');
      li.className = 'palette-item';
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(i === selected));
      const iconClass = item.icon.startsWith('fa-brands') ? item.icon : `fas ${item.icon}`;
      li.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i><span>${item.label}</span><span class="hint">${item.hint}</span>`;
      li.addEventListener('pointermove', () => { if (selected !== i) { selected = i; highlight(); } });
      li.addEventListener('click', () => choose(i));
      list.appendChild(li);
    });
  }

  function highlight() {
    $$('.palette-item', list).forEach((el, i) => {
      el.setAttribute('aria-selected', String(i === selected));
      if (i === selected) el.scrollIntoView({ block: 'nearest' });
    });
  }

  function show() {
    lastFocus = document.activeElement;
    palette.hidden = false;
    search.value = '';
    selected = 0;
    render();
    search.focus();
    document.body.style.overflow = 'hidden';
  }
  function hide() {
    palette.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  function choose(i) {
    const item = items[i];
    if (!item) return;
    hide();
    item.run();
  }

  search.addEventListener('input', () => { selected = 0; render(); });
  search.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); selected = (selected + 1) % items.length; highlight(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); selected = (selected - 1 + items.length) % items.length; highlight(); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(selected); }
    else if (e.key === 'Tab') e.preventDefault();
  });
  $$('[data-open-palette]').forEach(b => b.addEventListener('click', show));
  $('[data-close-palette]', palette).addEventListener('click', hide);

  document.addEventListener('keydown', e => {
    const typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      palette.hidden ? show() : hide();
    } else if (e.key === '/' && !typing && palette.hidden) {
      e.preventDefault();
      show();
    } else if (e.key === 'Escape' && !palette.hidden) {
      hide();
    }
  });
})();

console.log(
  '%c<mj/> %cHey, fellow engineer 👋 The source is plain HTML/CSS/JS — have a look around. Try the terminal or Ctrl+K.',
  'color:#34d399;font-weight:700;font-family:monospace;font-size:14px',
  'color:#8b949e;font-family:monospace'
);
