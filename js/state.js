export const state = {
  MAX_PLAYERS: 8,
  isHost: false,
  peerCounter: 0,
  pendingPeerId: null,
  peers: new Map(),
  activeEdges: new Set(),
  playerPC: null,
  playerDC: null
};
