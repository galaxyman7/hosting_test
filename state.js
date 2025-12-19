// Centralized state and DOM references
window.App = {
  MAX_PLAYERS: 8,
  isHost: false,
  peerCounter: 0,
  pendingPeerId: null,

  peers: new Map(),      // peerId -> { pc, dc }
  activeEdges: new Set(),
  playerPC: null,
  playerDC: null,

  // DOM refs (bound after DOM is ready; index.html loads scripts at end)
  els: {
    setup: document.getElementById('setup'),
    hostPanel: document.getElementById('hostPanel'),
    playerPanel: document.getElementById('playerPanel'),
    game: document.getElementById('game'),
    chatPanel: document.getElementById('chatPanel'),

    hostOffer: document.getElementById('hostOffer'),
    hostAnswer: document.getElementById('hostAnswer'),
    hostStatus: document.getElementById('hostStatus'),

    playerOffer: document.getElementById('playerOffer'),
    playerAnswer: document.getElementById('playerAnswer'),

    hexSvg: document.getElementById('hexSvg'),

    chat: document.getElementById('chat'),
    chatInput: document.getElementById('chatInput'),
  }
};
