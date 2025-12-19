# Hex Board – Up to 8 Players

Browser-based multiplayer Hex Board (up to 8 players) using WebRTC data channels and manual copy/paste signaling. Features: shared edge toggling on a hex grid and a simple chat.

## Files

- **index.html** — UI markup and script loading.
- **style.css** — Visual styles.
- **state.js** — Shared global namespace `window.App`:
  - State: `isHost`, `peerCounter`, `pendingPeerId`, `peers`, `activeEdges`, `playerPC`, `playerDC`, `MAX_PLAYERS`.
  - DOM refs under `App.els`: `setup`, `hostPanel`, `playerPanel`, `game`, `chatPanel`, `hostOffer`, `hostAnswer`, `hostStatus`, `playerOffer`, `playerAnswer`, `hexSvg`, `chat`, `chatInput`.
- **util.js** — Utilities:
  - `copyText(id, btn)` -> clipboard copy feedback; outputs UI change and copied text.
  - `logChat(sender, text)` -> appends a line to chat UI.
- **board.js** — Board drawing and edge control:
  - `initBoard()` -> renders hex grid into `#hexSvg`.
  - `toggleEdge(id, broadcastIt)` -> toggles CSS class and updates `App.activeEdges`, optionally broadcasts `{type:'edge', id}`.
- **chat.js** — Chat send handler:
  - `sendChat()` -> reads `#chatInput`, logs locally, sends via host broadcast or player datachannel.
- **network.js** — Host/Player setup, signaling, channels:
  - Host: `startHost()`, `generateOffer()`, `finalizePlayer()`.
  - Player: `startPlayer()`, `createAnswer()`.
  - Channels: `setupDataChannel(peerId, dc)`, `broadcast(data, except?)`.
  - Messages:
    - `edge`: `{ type:'edge', id }`
    - `sync`: `{ type:'sync', edges:[...] }`
    - `chat`: `{ type:'chat', from, text }`

All UI-triggered functions are exported on `window`:
`startHost`, `generateOffer`, `finalizePlayer`, `startPlayer`, `createAnswer`, `sendChat`, `copyText`.

## Flow

1. Host starts, generates offer (base64 SDP after ICE gathering), copies to Player.
2. Player pastes offer, creates answer, copies back to Host.
3. Data channel opens; Host sends a `sync` of active edges.
4. Host clicks edges to toggle; broadcasts `edge` to all players.
5. Chat messages are relayed via channel; Host rebroadcasts.

## Inputs/Outputs

- **Host offer/answer textareas** — Base64-encoded SDP strings; copied/pasted manually.
- **Board clicks (Host only)** — Input: click on edge hitbox; Output: edge active toggle + broadcast.
- **Chat input** — Input: text; Output: appended to chat and sent over data channel.

## Notes

- Clipboard copy requires HTTPS or localhost. Fallback via `execCommand('copy')` is included.
- ICE SDP export is robust via both `onicecandidate(null)` and `icegatheringstatechange='complete'`.
- No external deps; pure DOM + WebRTC.
