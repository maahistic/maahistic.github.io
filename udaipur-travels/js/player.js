// Single Source of Truth for YouTube Playlist
const YOUTUBE_PLAYLIST_ID = "PLSDY6YLTAlrc";

let ytPlayer = null;
let isPlayerReady = false;
let isPlaying = false;
let playerState = -1;

let onStateChangeCallback = null;
let onTrackChangeCallback = null;

// 1. Load YouTube IFrame API Script
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 2. YouTube API Ready Callback
function onYouTubeIframeAPIReady() {
  ytPlayer = new YT.Player('youtube-player-container', {
    height: '200',
    width: '200',
    playerVars: {
      'playsinline': 1,
      'controls': 0,
      'disablekb': 1,
      'rel': 0,
      'autoplay': 1,
      'mute': 1,
      'listType': 'playlist',
      'list': YOUTUBE_PLAYLIST_ID
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange,
      'onError': onPlayerError
    }
  });
}

function onPlayerReady(event) {
  isPlayerReady = true;
  console.log("Udaipur Travels YouTube Player Ready. Playlist ID:", YOUTUBE_PLAYLIST_ID);
  // Auto-start: the playlist begins muted via playerVars autoplay+mute
  document.body.classList.add("journey-started");
  
  if (window.hasUserInteracted) {
    PlayerAPI.unmute();
  }
}

let lastReportedVideoId = "";

function onPlayerStateChange(event) {
  playerState = event.data;
  
  if (playerState === YT.PlayerState.PLAYING) {
    isPlaying = true;
  } else if (playerState === YT.PlayerState.PAUSED || playerState === YT.PlayerState.ENDED) {
    isPlaying = false;
  }
  
  if (onStateChangeCallback) {
    onStateChangeCallback(playerState, isPlaying);
  }
  
  if (playerState === YT.PlayerState.PLAYING || playerState === YT.PlayerState.BUFFERING) {
    syncTrackMetadata();
  }
}

function syncTrackMetadata() {
  if (!ytPlayer || typeof ytPlayer.getVideoData !== 'function') return;
  
  const data = ytPlayer.getVideoData() || {};
  const videoId = data.video_id || "";
  
  if (videoId && videoId === lastReportedVideoId) return;
  lastReportedVideoId = videoId;
  
  const currentInfo = {
    title: data.title && data.title.length > 0 ? data.title : "उदयपुर लोकधुन",
    artist: data.author && data.author.length > 0 ? data.author : "मारवाड़ी संगीत",
    videoId: videoId,
    thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : ""
  };
  
  if (onTrackChangeCallback) {
    onTrackChangeCallback(currentInfo);
  }
}

function onPlayerError(event) {
  console.warn("YouTube Player Error:", event.data);
  setTimeout(() => {
    if (ytPlayer && typeof ytPlayer.nextVideo === 'function') {
      ytPlayer.nextVideo();
    }
  }, 1500);
}

// Global PlayerAPI Object
const PlayerAPI = {
  setCallbacks: (onState, onTrack) => {
    onStateChangeCallback = onState;
    onTrackChangeCallback = onTrack;
  },
  
  startPlaylist: () => {
    if (!isPlayerReady || !ytPlayer) return;
    ytPlayer.playVideoAt(0);
  },
  
  togglePlay: () => {
    if (!isPlayerReady || !ytPlayer) return;
    if (isPlaying) {
      ytPlayer.pauseVideo();
    } else {
      if (playerState === -1 || playerState === YT.PlayerState.CUED) {
        ytPlayer.playVideoAt(0);
      } else {
        ytPlayer.playVideo();
      }
    }
  },
  
  playNext: () => {
    if (!isPlayerReady || !ytPlayer) return;
    ytPlayer.nextVideo();
  },
  
  playPrev: () => {
    if (!isPlayerReady || !ytPlayer) return;
    ytPlayer.previousVideo();
  },

  toggleMute: () => {
    if (!isPlayerReady || !ytPlayer) return false;
    if (ytPlayer.isMuted()) {
      ytPlayer.unMute();
      ytPlayer.setVolume(100);
      return false;
    } else {
      ytPlayer.mute();
      return true;
    }
  },

  unmute: () => {
    if (!isPlayerReady || !ytPlayer) return;
    try {
      ytPlayer.unMute();
      ytPlayer.setVolume(100);
      if (typeof ytPlayer.getPlayerState === 'function' && ytPlayer.getPlayerState() !== YT.PlayerState.PLAYING) {
        ytPlayer.playVideo();
      }
    } catch (e) {
      console.warn("Unmute failed:", e);
    }
  },

  isMuted: () => {
    if (!isPlayerReady || !ytPlayer) return false;
    return ytPlayer.isMuted();
  }
};

window.PlayerAPI = PlayerAPI;
