document.addEventListener("DOMContentLoaded", () => {
  
  // --- Ensure Fullscreen Background Video Autoplay ---
  const bgVideo = document.querySelector(".bg-video");
  if (bgVideo) {
    bgVideo.muted = true;
    bgVideo.play().catch(err => console.log("Autoplay handled by browser policy:", err));
  }

  // --- Subtle Background Dust/Ember Particles ---
  const canvas = document.getElementById("dust-canvas");
  let isMusicPlaying = false;

  if (canvas) {
    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const count = 30;

    class DustParticle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = height + Math.random() * 50;
        this.radius = Math.random() * 1.8 + 0.6;
        this.alpha = Math.random() * 0.5 + 0.2;
        this.vy = Math.random() * 0.8 + 0.3 + (isMusicPlaying ? 0.3 : 0);
        this.vx = (Math.random() - 0.5) * 0.4;
        this.sway = Math.random() * Math.PI * 2;
      }

      update() {
        this.y -= this.vy;
        this.sway += 0.02;
        this.x += Math.sin(this.sway) * 0.4 + this.vx;
        this.alpha -= 0.002;

        if (this.alpha <= 0 || this.y < 0) {
          this.reset();
        }
      }

      draw() {
        ctx.beginPath();
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2);
        g.addColorStop(0, `rgba(245, 226, 196, ${this.alpha})`);
        g.addColorStop(1, `rgba(200, 75, 49, 0)`);
        ctx.fillStyle = g;
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < count; i++) {
      particles.push(new DustParticle());
    }

    function animateDust() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      requestAnimationFrame(animateDust);
    }
    animateDust();

    window.setWarmGlowState = (playing) => {
      isMusicPlaying = playing;
    };
  }

  // --- Rotating Rajasthani Quotes ---
  const quoteEl = document.getElementById("hero-quote");
  let quoteIndex = 0;

  if (quoteEl && typeof quotes !== "undefined" && quotes.length > 0) {
    quoteEl.textContent = `"${quotes[0]}"`;
    setTimeout(() => quoteEl.classList.add("visible"), 300);
    quoteIndex = 1;

    setInterval(() => {
      quoteEl.classList.remove("visible");
      setTimeout(() => {
        quoteEl.textContent = `"${quotes[quoteIndex]}"`;
        quoteEl.classList.add("visible");
        quoteIndex = (quoteIndex + 1) % quotes.length;
      }, 1200);
    }, 7000);
  }

  // --- CTA & Music Mode Toggle ---
  const btnStartMusic = document.getElementById("btn-start-music");
  const playerBar = document.getElementById("mini-player");

  if (btnStartMusic) {
    btnStartMusic.addEventListener("click", () => {
      if (window.PlayerAPI) {
        window.PlayerAPI.startPlaylist();
      }
      document.body.classList.add("journey-started");
    });
  }

  // --- Journey Modal ("सफ़र के बारे में") ---
  const btnAbout = document.getElementById("btn-about");
  const modalAbout = document.getElementById("modal-about");
  const btnCloseModal = document.getElementById("btn-close-modal");

  function openModal() {
    if (modalAbout) modalAbout.classList.add("open");
  }

  function closeModal() {
    if (modalAbout) modalAbout.classList.remove("open");
  }

  if (btnAbout) btnAbout.addEventListener("click", openModal);
  if (btnCloseModal) btnCloseModal.addEventListener("click", closeModal);

  if (modalAbout) {
    modalAbout.addEventListener("click", (e) => {
      if (e.target === modalAbout) closeModal();
    });
  }

  // --- Player UI Synchronization ---
  const pTitle = document.getElementById("player-title");
  const pArtist = document.getElementById("player-artist");
  const pThumb = document.getElementById("player-thumb");
  const btnPlayPause = document.getElementById("btn-play-pause");
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");
  const equalizer = document.getElementById("equalizer");
  const ytErrorMsg = document.getElementById("yt-error");

  if (window.PlayerAPI) {
    window.PlayerAPI.setCallbacks(
      // 1. onStateChange
      (state, isPlaying) => {
        if (btnPlayPause) {
          btnPlayPause.innerHTML = isPlaying
            ? '<span>⏸</span>'
            : '<span class="play-icon">▶</span>';
          btnPlayPause.setAttribute("aria-label", isPlaying ? "Pause music" : "Play music");
        }

        if (equalizer) {
          if (isPlaying) equalizer.classList.add("playing");
          else equalizer.classList.remove("playing");
        }

        document.body.classList.toggle("music-playing", isPlaying);
        if (window.setWarmGlowState) window.setWarmGlowState(isPlaying);

        if (state === 3 /* BUFFERING */) {
          document.body.classList.add("buffering");
        } else {
          document.body.classList.remove("buffering");
        }
      },

      // 2. onTrackChange
      (info) => {
        if (pTitle) pTitle.textContent = info.title;
        if (pArtist) pArtist.textContent = info.artist || "मारवाड़ी लोकधुन";

        if (pThumb && info.thumbnail) {
          pThumb.style.backgroundImage = `url(${info.thumbnail})`;
          pThumb.classList.add("has-thumb");
        }

        if (ytErrorMsg) ytErrorMsg.hidden = true;
      }
    );
  }

  if (btnPlayPause) {
    btnPlayPause.addEventListener("click", () => {
      if (window.PlayerAPI) window.PlayerAPI.togglePlay();
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener("click", () => {
      if (window.PlayerAPI) window.PlayerAPI.playPrev();
    });
  }

  if (btnNext) {
    btnNext.addEventListener("click", () => {
      if (window.PlayerAPI) window.PlayerAPI.playNext();
    });
  }

  const btnMute = document.getElementById("btn-mute");
  if (btnMute) {
    btnMute.addEventListener("click", () => {
      if (window.PlayerAPI) {
        const muted = window.PlayerAPI.toggleMute();
        btnMute.textContent = muted ? "🔇" : "🔊";
        btnMute.title = muted ? "आवाज़ चालू करें" : "आवाज़ बंद करें";
      }
    });
  }

  // --- Auto-Unmute on First User Interaction Anywhere on Page ---
  const handleFirstInteraction = () => {
    if (window.PlayerAPI && window.PlayerAPI.isMuted()) {
      window.PlayerAPI.unmute();
      if (btnMute) {
        btnMute.textContent = "🔊";
        btnMute.title = "आवाज़ बंद करें";
      }
    }
    // Remove listeners after first interaction
    document.removeEventListener("pointerdown", handleFirstInteraction);
    document.removeEventListener("keydown", handleFirstInteraction);
  };

  document.addEventListener("pointerdown", handleFirstInteraction);
  document.addEventListener("keydown", handleFirstInteraction);
});
