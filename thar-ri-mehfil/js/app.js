document.addEventListener('DOMContentLoaded', () => {

  // ── Fire Embers ──────────────────────────────────────────────
  const canvas = document.getElementById('fireflies-canvas');
  let isMusicPlaying = false;

  if (canvas) {
    const ctx = canvas.getContext('2d');
    let W, H;

    function resize() {
      W = canvas.width  = canvas.parentElement.clientWidth  || window.innerWidth;
      H = canvas.height = canvas.parentElement.clientHeight || window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const embers = [];

    class Ember {
      constructor() { this.reset(); }

      reset() {
        this.x = W * 0.48 + (Math.random() - 0.5) * W * 0.35;
        this.y = H * 0.78 + Math.random() * H * 0.15;
        this.r = Math.random() * 2.2 + 0.8;
        this.a = Math.random() * 0.7 + 0.3;
        this.vy = Math.random() * 1.2 + 0.5 + (isMusicPlaying ? 0.3 : 0);
        this.vx = (Math.random() - 0.5) * 0.5;
        this.sw = Math.random() * Math.PI * 2;
        this.ss = Math.random() * 0.03 + 0.01;
      }

      update() {
        this.y -= this.vy;
        this.sw += this.ss;
        this.x += Math.sin(this.sw) * 0.5 + this.vx;
        this.a -= 0.0035;
        if (this.a <= 0 || this.y < H * 0.05) this.reset();
      }

      draw() {
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 3);
        g.addColorStop(0,   `rgba(255,180,40,${this.a})`);
        g.addColorStop(0.5, `rgba(225,75,20,${this.a * 0.5})`);
        g.addColorStop(1,   'rgba(180,30,10,0)');
        ctx.beginPath();
        ctx.fillStyle = g;
        ctx.arc(this.x, this.y, this.r * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function initEmbers(n) {
      embers.length = 0;
      for (let i = 0; i < n; i++) embers.push(new Ember());
    }
    initEmbers(35);

    (function loop() {
      ctx.clearRect(0, 0, W, H);
      embers.forEach(e => { e.update(); e.draw(); });
      requestAnimationFrame(loop);
    })();

    window._setEmberGlow = (playing) => {
      isMusicPlaying = playing;
      initEmbers(playing ? 55 : 35);
    };
  }

  // ── Quote Rotation ───────────────────────────────────────────
  const quoteEl = document.getElementById('hero-quote');
  let qi = 0;

  if (quoteEl && typeof quotes !== 'undefined' && quotes.length) {
    quoteEl.textContent = `"${quotes[0]}"`;
    setTimeout(() => quoteEl.classList.add('visible'), 300);
    qi = 1;

    setInterval(() => {
      quoteEl.classList.remove('visible');
      setTimeout(() => {
        quoteEl.textContent = `"${quotes[qi]}"`;
        quoteEl.classList.add('visible');
        qi = (qi + 1) % quotes.length;
      }, 1200);
    }, 7000);
  }

  // ── CTA "धुन चालू करो" ──────────────────────────────────────
  const btnStart = document.getElementById('btn-start-music');
  if (btnStart) {
    btnStart.addEventListener('click', () => {
      if (window.PlayerAPI) window.PlayerAPI.startPlaylist();
    });
  }

  // ── Player Controls ──────────────────────────────────────────
  const pTitle      = document.getElementById('player-title');
  const pArtist     = document.getElementById('player-artist');
  const pThumb      = document.getElementById('player-thumb');
  const btnPlayPause= document.getElementById('btn-play-pause');
  const btnPrev     = document.getElementById('btn-prev');
  const btnNext     = document.getElementById('btn-next');
  const equalizer   = document.getElementById('equalizer');
  const errorMsg    = document.getElementById('yt-error');

  if (window.PlayerAPI) {
    window.PlayerAPI.setCallbacks(
      // onStateChange
      (state, playing) => {
        // Play/Pause button icon
        if (btnPlayPause) {
          btnPlayPause.innerHTML = playing
            ? '<span>⏸</span>'
            : '<span class="play-icon">▶</span>';
        }

        // Equalizer bars
        if (equalizer) {
          equalizer.classList.toggle('playing', playing);
        }

        // Fire glow
        if (window._setEmberGlow) window._setEmberGlow(playing);
        document.body.classList.toggle('music-playing', playing);

        // Buffering indicator
        if (state === 3 /* BUFFERING */) {
          document.body.classList.add('buffering');
        } else {
          document.body.classList.remove('buffering');
        }
      },

      // onTrackChange — metadata comes live from YouTube
      (info) => {
        if (pTitle)  pTitle.textContent  = info.title;
        if (pArtist) pArtist.textContent = info.artist;

        // Dynamic thumbnail from YouTube
        if (pThumb && info.thumbnail) {
          pThumb.style.backgroundImage = `url(${info.thumbnail})`;
          pThumb.classList.add('has-thumb');
        }

        // Hide error if it was showing
        if (errorMsg) errorMsg.hidden = true;
      }
    );
  }

  if (btnPlayPause) {
    btnPlayPause.addEventListener('click', () => {
      if (window.PlayerAPI) window.PlayerAPI.togglePlay();
    });
  }
  if (btnPrev) btnPrev.addEventListener('click', () => { if (window.PlayerAPI) window.PlayerAPI.playPrev(); });
  if (btnNext) btnNext.addEventListener('click', () => { if (window.PlayerAPI) window.PlayerAPI.playNext(); });

  // ── YouTube link button ──────────────────────────────────────
  const btnYT = document.getElementById('btn-open-yt');
  if (btnYT) {
    btnYT.addEventListener('click', () => {
      window.open(
        `https://music.youtube.com/playlist?list=${typeof YOUTUBE_PLAYLIST_ID !== 'undefined' ? YOUTUBE_PLAYLIST_ID : 'PLSDY6YLTAlrc'}`,
        '_blank'
      );
    });
  }
});
