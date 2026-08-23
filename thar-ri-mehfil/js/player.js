// Single source of truth — YouTube Playlist ID
const YOUTUBE_PLAYLIST_ID = 'PLSDY6YLTAlrc';

let ytPlayer = null;
let isPlayerReady = false;
let isPlaying = false;
let playerState = -1;

let onStateChangeCallback = null;
let onTrackChangeCallback = null;

// Load YouTube IFrame API
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// YouTube API Ready
function onYouTubeIframeAPIReady() {
  ytPlayer = new YT.Player('youtube-player-container', {
    height: '200',
    width: '200',
    playerVars: {
      playsinline: 1,
      controls: 0,
      disablekb: 1,
      rel: 0,
      listType: 'playlist',
      list: YOUTUBE_PLAYLIST_ID
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
      onError: onPlayerError
    }
  });
}

function onPlayerReady() {
  isPlayerReady = true;
}

// Track the last video_id we reported so we only fire onTrackChange once per song
let lastReportedVideoId = '';

function onPlayerStateChange(event) {
  playerState = event.data;

  if (playerState === YT.PlayerState.PLAYING) {
    isPlaying = true;
  } else if (playerState === YT.PlayerState.PAUSED ||
             playerState === YT.PlayerState.ENDED) {
    isPlaying = false;
  }

  // Always forward state
  if (onStateChangeCallback) {
    onStateChangeCallback(playerState, isPlaying);
  }

  // Sync metadata when a new video starts playing or buffering
  if (playerState === YT.PlayerState.PLAYING ||
      playerState === YT.PlayerState.BUFFERING) {
    syncTrackMetadata();
  }
}

function syncTrackMetadata() {
  if (!ytPlayer || typeof ytPlayer.getVideoData !== 'function') return;

  const data = ytPlayer.getVideoData() || {};
  const videoId = data.video_id || '';

  // Only fire callback when the video actually changes
  if (videoId && videoId === lastReportedVideoId) return;
  lastReportedVideoId = videoId;

  const info = {
    title: data.title || 'मारवाड़ी लोकधुन',
    artist: data.author || '',
    videoId: videoId,
    thumbnail: videoId
      ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
      : ''
  };

  if (onTrackChangeCallback) {
    onTrackChangeCallback(info);
  }
}

function onPlayerError(event) {
  console.warn('YouTube Player Error:', event.data);
  // Skip to next track on error
  setTimeout(() => {
    if (ytPlayer && typeof ytPlayer.nextVideo === 'function') {
      ytPlayer.nextVideo();
    }
  }, 1500);
}

// Public API
const PlayerAPI = {
  setCallbacks(onState, onTrack) {
    onStateChangeCallback = onState;
    onTrackChangeCallback = onTrack;
  },

  startPlaylist() {
    if (!isPlayerReady || !ytPlayer) return;
    ytPlayer.playVideoAt(0);
  },

  togglePlay() {
    if (!isPlayerReady || !ytPlayer) return;
    if (isPlaying) {
      ytPlayer.pauseVideo();
    } else if (playerState === -1 || playerState === YT.PlayerState.CUED) {
      ytPlayer.playVideoAt(0);
    } else {
      ytPlayer.playVideo();
    }
  },

  playNext() {
    if (!isPlayerReady || !ytPlayer) return;
    ytPlayer.nextVideo();
  },

  playPrev() {
    if (!isPlayerReady || !ytPlayer) return;
    ytPlayer.previousVideo();
  }
};

window.PlayerAPI = PlayerAPI;
