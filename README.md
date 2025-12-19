Hex Board – Up to 8 Players
This project implements a browser-based multiplayer Hex Board game supporting up to 8 players. It uses WebRTC peer-to-peer connections for communication, with manual copy/paste signaling. The game includes a shared interactive board and a chat system.



🔄 Program Flow
- Setup
- User chooses Host or Player.
- Panels are shown accordingly.
- Host
- Generates an SDP offer → copies to player.
- Pastes player’s answer → finalizes connection.
- Maintains a list of peers (Map).
- Player
- Pastes host’s offer → generates answer.
- Sends answer back to host.
- Board
- Rendered by board.js.
- Host clicks edges → toggles active state.
- Changes broadcast to all peers.
- Chat
- Messages sent via data channel.
- Host rebroadcasts to all peers.
- Displayed in chat panel.

📡 Data Channel Messages
- { type:'edge', id } → toggle edge
- { type:'sync', edges:[...] } → initial sync
- { type:'chat', from, text } → chat message

⚙️ Inputs & Outputs by Module
util.js
- Inputs: textarea/button IDs, chat text
- Outputs: clipboard copy, DOM chat log entries
board.js
- Inputs: SVG container, host clicks
- Outputs: rendered hex grid, toggled edge states, broadcasts edge events
chat.js
- Inputs: chat input field, data channel
- Outputs: sent/received chat messages, DOM updates
network.js
- Inputs: host/player actions, SDP strings
- Outputs: peer connections, synchronized board/chat state

✅ Notes
- Max players: 8
- Signaling: Manual copy/paste of SDP
- Dependencies: None (vanilla JS, WebRTC, DOM APIs)
- Integrity: All features (board, chat, host/player setup) preserved from original single-file version
