'use strict';

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const body = document.body;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const DEFAULT_TITLE = 'उदयपुर ट्रैवल्स में पधारो';
  const DEFAULT_ARTIST = 'मारवाड़ी लोकधुन';

  const formatTime = seconds => {
    const s = Math.max(0, Math.floor(seconds || 0));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  // "म्हारो राजस्थान | Rajasthani Song | Singer" → "म्हारो राजस्थान"
  const cleanTitle = raw => {
    const text = String(raw || '').replace(/\((?:official|full|lyrical|lyrics|video|audio)[^)]*\)/gi, '');
    return text.split(/\s*[|｜]\s*/).map(part => part.trim()).filter(Boolean)[0] || String(raw || '').trim();
  };

  /* ========== Sound: unmute now, or as soon as the player is ready ========== */
  let wantsSound = false;
  const requestSound = () => {
    if (Player.ready) Player.unmute();
    else wantsSound = true;
  };
  Player.on('ready', () => {
    if (wantsSound) Player.unmute();
  });

  /* ========== Background video — portrait screens get the mobile file ========== */
  (function initScene() {
    const scene = $('.scene');
    const video = $('.scene-video');
    const start = () => {
      video.muted = true;
      video.play().catch(() => {});
    };
    video.addEventListener('playing', () => scene.classList.add('is-ready'));
    // after a missing mobile file the browser moves on to the desktop source; make sure it starts
    video.addEventListener('loadeddata', () => {
      if (!document.hidden) start();
    });
    start();
    // <source media> is only evaluated on load, so reload when the phone is rotated
    window.matchMedia('(orientation: portrait)').addEventListener('change', () => {
      scene.classList.remove('is-ready');
      video.load();
      start();
    });
    document.addEventListener('visibilitychange', () => (document.hidden ? video.pause() : start()));
    if (finePointer && !reducedMotion) {
      window.addEventListener('pointermove', e => {
        scene.style.setProperty('--px', `${(e.clientX / window.innerWidth - 0.5) * -16}px`);
        scene.style.setProperty('--py', `${(e.clientY / window.innerHeight - 0.5) * -10}px`);
      }, { passive: true });
    }
  })();

  /* ========== Embers rising from the desert ========== */
  (function initEmbers() {
    if (reducedMotion) return;
    const canvas = $('#embers');
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, raf = 0, energy = 0;
    const embers = [];
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const reset = (e, anywhere) => Object.assign(e, {
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 10,
      r: Math.random() * 1.7 + 0.5,
      vy: Math.random() * 0.45 + 0.2,
      sway: Math.random() * Math.PI * 2,
      life: 0,
      max: Math.random() * 700 + 450,
      rgb: Math.random() < 0.72 ? '243, 156, 51' : '255, 241, 194'
    });
    resize();
    const count = Math.round(Math.min(70, (w * h) / 21000));
    for (let i = 0; i < count; i++) embers.push(reset({}, true));
    window.addEventListener('resize', resize);

    function frame() {
      energy += ((body.classList.contains('is-playing') ? 1 : 0) - energy) * 0.02;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const e of embers) {
        e.life++;
        e.y -= e.vy * (1 + energy * 1.6);
        e.sway += 0.014;
        e.x += Math.sin(e.sway) * 0.35;
        const t = e.life / e.max;
        if (t >= 1 || e.y < -10) {
          reset(e);
          continue;
        }
        const alpha = Math.sin(Math.PI * t) * (0.4 + energy * 0.35);
        ctx.fillStyle = `rgba(${e.rgb}, ${alpha * 0.18})`;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${e.rgb}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    frame();
    document.addEventListener('visibilitychange', () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) frame();
    });
  })();

  /* ========== Hero: mandala, letter-by-letter title, rotating quotes ========== */
  (function buildMandala() {
    const ns = 'http://www.w3.org/2000/svg';
    [['.ring-a', 16, 60, 24], ['.ring-b', 10, 82, 18]].forEach(([sel, count, radius, size]) => {
      const ring = $(sel);
      for (let i = 0; i < count; i++) {
        const petal = document.createElementNS(ns, 'use');
        petal.setAttribute('href', '#i-petal');
        petal.setAttribute('width', size);
        petal.setAttribute('height', size);
        petal.setAttribute('x', 100 - size / 2);
        petal.setAttribute('y', 100 - radius - size / 2);
        petal.setAttribute('transform', `rotate(${(i * 360) / count} 100 100)`);
        ring.appendChild(petal);
      }
    });
  })();

  // split into aksharas so conjuncts like "ट्रै" never break apart
  function aksharas(text) {
    const graphemes = 'Segmenter' in Intl
      ? [...new Intl.Segmenter('hi', { granularity: 'grapheme' }).segment(text)].map(s => s.segment)
      : [...text];
    return graphemes.reduce((out, g) => {
      const prev = out[out.length - 1];
      if (prev && (prev.endsWith('\u094D') || /^[\u0900-\u0903\u093A-\u094F\u0951-\u0957\u0962\u0963]/.test(g))) {
        out[out.length - 1] = prev + g;
      } else {
        out.push(g);
      }
      return out;
    }, []);
  }

  const quoteEl = $('#hero-quote');
  const quoteList = typeof quotes !== 'undefined' ? quotes : [];
  let quoteIndex = 0;

  function nextQuote() {
    if (!quoteList.length) return;
    quoteEl.classList.add('is-out');
    setTimeout(() => {
      quoteEl.textContent = quoteList[quoteIndex];
      quoteIndex = (quoteIndex + 1) % quoteList.length;
      quoteEl.classList.remove('is-out');
    }, quoteEl.textContent ? 900 : 0);
  }

  let heroStarted = false;
  function startHero(delay) {
    if (heroStarted) return;
    heroStarted = true;
    const title = $('#hero-title');
    const text = title.textContent.trim();
    title.setAttribute('aria-label', text);
    const parts = aksharas(text);
    const stagger = 75;
    $('.hero-sub').style.setProperty('--start', `${delay + parts.length * stagger}ms`);
    body.classList.add('hero-on');
    if (reducedMotion) {
      title.classList.add('shine');
    } else {
      title.textContent = '';
      parts.forEach((part, i) => {
        const span = document.createElement('span');
        span.className = 'ch';
        span.setAttribute('aria-hidden', 'true');
        span.textContent = part === ' ' ? '\u00A0' : part;
        span.style.setProperty('--i', i);
        span.style.setProperty('--start', `${delay}ms`);
        title.appendChild(span);
      });
      setTimeout(() => {
        title.textContent = text;
        title.classList.add('shine');
      }, delay + parts.length * stagger + 1000);
    }
    quoteEl.classList.add('is-out');
    setTimeout(() => {
      nextQuote();
      setInterval(nextQuote, 7000);
    }, reducedMotion ? 0 : delay + parts.length * stagger + 900);
  }

  /* ========== Welcome doors — "पधारो म्हारे देस" ========== */
  const doors = $('#doors');
  (function initDoors() {
    const enter = $('#btn-enter');
    if (sessionStorage.getItem('ut-entered') || reducedMotion) {
      doors.hidden = true;
      startHero(250);
      return;
    }
    let autoOpen = 0;
    const open = withSound => {
      if (doors.classList.contains('open')) return;
      clearTimeout(autoOpen);
      if (withSound) requestSound();
      sessionStorage.setItem('ut-entered', '1');
      doors.classList.add('open');
      startHero(700);
      setTimeout(() => { doors.hidden = true; }, 1800);
    };
    enter.addEventListener('click', () => open(true));
    doors.addEventListener('click', e => {
      if (e.target.closest('.door')) open(true);
    });
    doors.openWithSound = () => open(true);
    enter.focus({ preventScroll: true });
    autoOpen = setTimeout(() => open(false), 5000);
  })();

  /* ========== Player dock ========== */
  const ui = {
    play: $('#btn-play'),
    prev: $('#btn-prev'),
    next: $('#btn-next'),
    mute: $('#btn-mute'),
    volume: $('#volume'),
    soundCta: $('#btn-sound-cta'),
    title: $('#now-title'),
    titleWrap: $('.now-title-wrap'),
    artist: $('#now-artist'),
    label: $('#vinyl-label'),
    road: $('#road'),
    track: $('.road-track'),
    current: $('#time-current'),
    total: $('#time-total'),
    toast: $('#yt-error')
  };

  let duration = 0;
  let dragging = false;
  let currentIndex = -1;
  let toastTimer = 0;

  function showToast(sticky) {
    ui.toast.hidden = false;
    clearTimeout(toastTimer);
    if (!sticky) toastTimer = setTimeout(() => { ui.toast.hidden = true; }, 6000);
  }

  function setProgress(ratio, seconds) {
    const p = Math.min(1, Math.max(0, ratio || 0));
    ui.road.style.setProperty('--p', p);
    ui.current.textContent = formatTime(seconds);
    ui.road.setAttribute('aria-valuenow', Math.round(p * 100));
    ui.road.setAttribute('aria-valuetext', `${formatTime(seconds)} / ${formatTime(duration)}`);
  }

  function fitTitle() {
    const wrap = ui.titleWrap;
    wrap.classList.remove('overflowing');
    const overflow = ui.title.scrollWidth - wrap.clientWidth;
    if (overflow > 4 && !reducedMotion) {
      wrap.style.setProperty('--shift', `${-(overflow + 18)}px`);
      wrap.style.setProperty('--dur', `${Math.max(6, overflow / 22)}s`);
      wrap.classList.add('overflowing');
    }
  }
  window.addEventListener('resize', fitTitle);

  // the first big-button press while the muted intro plays means "let me hear it"
  function playButton() {
    if (Player.playing && Player.isMuted()) requestSound();
    else Player.toggle();
  }

  function toggleMute() {
    if (Player.isMuted()) requestSound();
    else Player.mute();
  }

  ui.play.addEventListener('click', playButton);
  ui.prev.addEventListener('click', () => Player.prev());
  ui.next.addEventListener('click', () => Player.next());
  ui.mute.addEventListener('click', toggleMute);
  ui.soundCta.addEventListener('click', requestSound);
  ui.volume.addEventListener('input', () => {
    ui.volume.style.setProperty('--v', ui.volume.value);
    Player.setVolume(Number(ui.volume.value));
  });

  Player.on('state', ({ playing, buffering }) => {
    body.classList.toggle('is-playing', playing);
    body.classList.toggle('is-buffering', buffering);
    ui.play.setAttribute('aria-label', playing ? 'रोकें' : 'चालू करें');
  });

  Player.on('progress', ({ current, duration: total }) => {
    duration = total;
    ui.total.textContent = formatTime(total);
    if (!dragging) setProgress(total ? current / total : 0, current);
  });

  Player.on('volume', ({ volume, muted }) => {
    body.classList.toggle('is-muted', muted);
    ui.volume.value = muted ? 0 : volume;
    ui.volume.style.setProperty('--v', ui.volume.value);
    ui.mute.setAttribute('aria-label', muted ? 'आवाज़ चालू करें' : 'आवाज़ बंद करें');
    ui.soundCta.hidden = !muted;
  });

  Player.on('track', info => {
    const title = cleanTitle(info.title) || DEFAULT_TITLE;
    ui.title.textContent = title;
    ui.title.title = info.title || title;
    ui.artist.textContent = info.author || DEFAULT_ARTIST;
    ui.label.style.backgroundImage = `url(https://i.ytimg.com/vi/${info.id}/mqdefault.jpg)`;
    ui.label.classList.add('has-art');
    document.title = `${title} — उदयपुर ट्रैवल्स`;
    ui.toast.hidden = true;
    currentIndex = info.index;
    rememberTitle(info.id, info.title, info.author);
    markActive();
    requestAnimationFrame(fitTitle);
  });

  Player.on('error', () => showToast(false));
  Player.on('unavailable', () => {
    showToast(true);
    if (!trackIds.length) $('#queue-count').textContent = 'YouTube अभी उपलब्ध नहीं है';
  });

  // seeking: drag the bus along the road
  (function initRoad() {
    const ratioAt = clientX => {
      const r = ui.track.getBoundingClientRect();
      return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    };
    ui.road.addEventListener('pointerdown', e => {
      if (!duration) return;
      dragging = true;
      ui.road.classList.add('dragging');
      ui.road.setPointerCapture(e.pointerId);
      setProgress(ratioAt(e.clientX), ratioAt(e.clientX) * duration);
    });
    ui.road.addEventListener('pointermove', e => {
      if (dragging) setProgress(ratioAt(e.clientX), ratioAt(e.clientX) * duration);
    });
    const finish = e => {
      if (!dragging) return;
      dragging = false;
      ui.road.classList.remove('dragging');
      Player.seek(ratioAt(e.clientX) * duration);
    };
    ui.road.addEventListener('pointerup', finish);
    ui.road.addEventListener('pointercancel', () => {
      dragging = false;
      ui.road.classList.remove('dragging');
    });
  })();

  /* ========== Playlist drawer ========== */
  const queue = $('#queue');
  const list = $('#queue-list');
  const queueToggles = [$('#btn-queue'), $('#btn-queue-top')];
  let trackIds = [];
  let lastFocus = null;
  const titleCache = (() => {
    try { return JSON.parse(localStorage.getItem('ut-titles')) || {}; }
    catch { return {}; }
  })();

  function rememberTitle(id, title, author) {
    if (!id || !title) return;
    titleCache[id] = { t: title, a: author || '' };
    try { localStorage.setItem('ut-titles', JSON.stringify(titleCache)); }
    catch { /* storage full or disabled */ }
    const item = list.querySelector(`[data-id="${id}"]`);
    if (item) {
      $('.track-title', item).textContent = cleanTitle(title);
      $('.track-author', item).textContent = author || '';
    }
  }

  function markActive() {
    list.querySelectorAll('.track').forEach(el => {
      const active = Number(el.dataset.index) === currentIndex;
      el.classList.toggle('active', active);
      if (active) el.setAttribute('aria-current', 'true');
      else el.removeAttribute('aria-current');
    });
  }

  function renderQueue() {
    list.innerHTML = '';
    $('#queue-count').textContent = `${trackIds.length} धुनें · मारवाड़ और मेवाड़ से`;
    trackIds.forEach((id, i) => {
      const cached = titleCache[id];
      const li = document.createElement('li');
      li.innerHTML = `<button type="button" class="track" data-index="${i}" data-id="${id}" style="--i:${Math.min(i, 20)}">` +
        `<span class="track-no">${i + 1}</span>` +
        `<span class="mini-eq" aria-hidden="true"><i></i><i></i><i></i></span>` +
        `<img class="track-thumb" src="https://i.ytimg.com/vi/${id}/mqdefault.jpg" alt="" loading="lazy" width="72" height="41">` +
        `<span class="track-text"><span class="track-title"></span><span class="track-author"></span></span>` +
        `</button>`;
      $('.track-title', li).textContent = cached ? cleanTitle(cached.t) : `धुन ${i + 1}`;
      $('.track-author', li).textContent = cached ? cached.a : '';
      list.appendChild(li);
    });
    markActive();
  }

  async function fetchTitles() {
    const missing = trackIds.filter(id => !titleCache[id]);
    const worker = async () => {
      while (missing.length) {
        const id = missing.shift();
        try {
          const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`);
          if (res.ok) {
            const data = await res.json();
            rememberTitle(id, data.title, data.author_name);
          }
        } catch { /* title stays as "धुन n" */ }
      }
    };
    await Promise.all([worker(), worker(), worker()]);
  }

  Player.on('playlist', ids => {
    trackIds = ids;
    renderQueue();
    fetchTitles();
  });

  list.addEventListener('click', e => {
    const item = e.target.closest('.track');
    if (!item) return;
    requestSound();
    Player.playAt(Number(item.dataset.index));
  });

  function setQueue(open) {
    queue.classList.toggle('open', open);
    queue.setAttribute('aria-hidden', String(!open));
    queueToggles.forEach(b => b.setAttribute('aria-expanded', String(open)));
    if (open) {
      lastFocus = document.activeElement;
      setTimeout(() => {
        const target = list.querySelector('.track.active') || list.querySelector('.track') || $('[data-close-queue].ctl', queue);
        target.focus({ preventScroll: true });
        target.scrollIntoView({ block: 'center' });
      }, 60);
    } else if (lastFocus) {
      lastFocus.focus({ preventScroll: true });
    }
  }

  queueToggles.forEach(b => b.addEventListener('click', () => setQueue(!queue.classList.contains('open'))));
  queue.querySelectorAll('[data-close-queue]').forEach(el => el.addEventListener('click', () => setQueue(false)));

  /* ========== About dialog ========== */
  const about = $('#about');
  $('#btn-about').addEventListener('click', () => about.showModal());
  $('#btn-close-about').addEventListener('click', () => about.close());
  about.addEventListener('click', e => {
    if (e.target === about) about.close();
  });

  /* ========== Sound on first touch anywhere + keyboard shortcuts ========== */
  const firstTouch = e => {
    ['pointerdown', 'touchstart'].forEach(evt => document.removeEventListener(evt, firstTouch, true));
    // these controls decide about sound themselves
    if (e.target.closest('#btn-play, #btn-mute, #volume, #doors')) return;
    requestSound();
  };
  ['pointerdown', 'touchstart'].forEach(evt => document.addEventListener(evt, firstTouch, { capture: true, passive: true }));

  document.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest('input, textarea') || about.open) return;
    const key = e.key.toLowerCase();
    if (!doors.hidden && !doors.classList.contains('open')) {
      if (key === 'enter' || key === ' ') {
        e.preventDefault();
        doors.openWithSound();
      }
      return;
    }
    if (key === 'escape' && queue.classList.contains('open')) setQueue(false);
    else if ((key === ' ' || key === 'k') && !e.target.closest('button, a')) {
      e.preventDefault();
      playButton();
    } else if (key === 'n') Player.next();
    else if (key === 'p') Player.prev();
    else if (key === 'arrowright') Player.seekBy(10);
    else if (key === 'arrowleft') Player.seekBy(-10);
    else if (key === 'm') toggleMute();
    else if (key === 'l') setQueue(!queue.classList.contains('open'));
  });
})();
