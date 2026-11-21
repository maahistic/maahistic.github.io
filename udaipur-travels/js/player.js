'use strict';

// Single source of truth for the YouTube playlist
const YOUTUBE_PLAYLIST_ID = 'PLSDY6YLTAlrc';

/*
 * Thin wrapper around a hidden YouTube IFrame player.
 * Emits: ready, playlist(ids), state({playing, buffering}), track(info), progress({current, duration}),
 *        volume({volume, muted}), error(code), unavailable
 */
const Player = (() => {
  const listeners = {};
  const emit = (event, data) => (listeners[event] || []).forEach(fn => fn(data));
  let yt = null;
  let ready = false;
  let playing = false;
  let state = -1;
  let lastVideoId = '';
  let progressTimer = null;
  // tracked locally: YouTube's isMuted()/getVolume() lag behind mute()/unMute() calls
  let muted = true;
  let volume = 80;

  const api = document.createElement('script');
  api.src = 'https://www.youtube.com/iframe_api';
  api.onerror = () => emit('unavailable');
  document.head.appendChild(api);
  // the API never answering (blocked network, ad-blockers) is reported as unavailable too
  const readyTimeout = setTimeout(() => { if (!ready) emit('unavailable'); }, 15000);

  window.onYouTubeIframeAPIReady = () => {
    yt = new YT.Player('youtube-player-container', {
      height: '200',
      width: '200',
      playerVars: {
        playsinline: 1, controls: 0, disablekb: 1, rel: 0,
        autoplay: 1, mute: 1, listType: 'playlist', list: YOUTUBE_PLAYLIST_ID
      },
      events: { onReady, onStateChange, onError }
    });
  };

  function onReady() {
    ready = true;
    clearTimeout(readyTimeout);
    const saved = localStorage.getItem('ut-volume');
    volume = saved !== null && Number(saved) > 0 ? Number(saved) : yt.getVolume() || 80;
    yt.setVolume(volume);
    muted = yt.isMuted();
    emit('ready');
    emitVolume();
    // the playlist ids arrive a moment after the player is ready
    let tries = 0;
    const poll = setInterval(() => {
      const ids = yt.getPlaylist && yt.getPlaylist();
      if ((ids && ids.length) || ++tries > 30) {
        clearInterval(poll);
        if (ids && ids.length) emit('playlist', ids);
      }
    }, 500);
  }

  function onStateChange({ data }) {
    state = data;
    playing = data === YT.PlayerState.PLAYING;
    emit('state', { playing, buffering: data === YT.PlayerState.BUFFERING });
    if (data === YT.PlayerState.PLAYING || data === YT.PlayerState.BUFFERING) syncTrack();
    clearInterval(progressTimer);
    if (playing) progressTimer = setInterval(tick, 250);
    tick();
  }

  function tick() {
    if (!ready) return;
    emit('progress', { current: yt.getCurrentTime() || 0, duration: yt.getDuration() || 0 });
  }

  function syncTrack() {
    const data = (yt.getVideoData && yt.getVideoData()) || {};
    if (!data.video_id || data.video_id === lastVideoId) return;
    lastVideoId = data.video_id;
    emit('track', {
      id: data.video_id,
      title: data.title || '',
      author: data.author || '',
      index: yt.getPlaylistIndex ? yt.getPlaylistIndex() : -1
    });
  }

  function onError(event) {
    emit('error', event.data);
    setTimeout(() => ready && yt.nextVideo(), 1500);
  }

  function emitVolume() {
    emit('volume', { volume, muted });
  }

  const whenReady = fn => (...args) => (ready ? fn(...args) : undefined);

  return {
    on(event, fn) { (listeners[event] = listeners[event] || []).push(fn); },
    get ready() { return ready; },
    get playing() { return playing; },
    toggle: whenReady(() => {
      if (playing) yt.pauseVideo();
      else if (state === -1 || state === YT.PlayerState.CUED) yt.playVideoAt(0);
      else yt.playVideo();
    }),
    next: whenReady(() => yt.nextVideo()),
    prev: whenReady(() => (yt.getCurrentTime() > 4 ? yt.seekTo(0, true) : yt.previousVideo())),
    playAt: whenReady(index => yt.playVideoAt(index)),
    seek: whenReady(seconds => { yt.seekTo(Math.max(0, seconds), true); tick(); }),
    seekBy: whenReady(delta => { yt.seekTo(Math.max(0, yt.getCurrentTime() + delta), true); tick(); }),
    duration: () => (ready ? yt.getDuration() || 0 : 0),
    setVolume: whenReady(value => {
      if (value === 0) {
        yt.mute();
        muted = true;
      } else {
        volume = value;
        yt.setVolume(value);
        if (muted) yt.unMute();
        muted = false;
        localStorage.setItem('ut-volume', String(value));
      }
      emitVolume();
    }),
    isMuted: () => muted,
    mute: whenReady(() => { yt.mute(); muted = true; emitVolume(); }),
    unmute: whenReady(() => {
      yt.unMute();
      yt.setVolume(volume);
      muted = false;
      if (!playing) yt.playVideo();
      emitVolume();
    })
  };
})();

window.Player = Player;
