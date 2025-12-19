# Hex Board Multiplayer

## Overview
This project is a peer-to-peer multiplayer hex board game using WebRTC data channels.
The code is split to minimize cross-file dependency and AI context requirements.

---

## File Responsibilities

### index.html
**Inputs:** User clicks, text pastes  
**Outputs:** DOM structure  
Defines layout and loads JS modules.

---

### css/styles.css
**Inputs:** DOM classes  
**Outputs:** Visual appearance  
No logic. Safe to modify freely.

---

### js/state.js
**Inputs:** None  
**Outputs:** Shared state object  
Single source of truth for game state.

---

### js/ui.js
**Inputs:** User intent (host/player)  
**Outputs:** DOM visibility changes  
Controls panels and status text.

---

### js/webrtc.js
**Inputs:** Offers / Answers / Messages  
**Outputs:** Peer connections, data messages  
Handles all networking logic.

---

### js/board.js
**Inputs:** User clicks (host only)  
**Outputs:** SVG board updates  
Manages hex grid and edge toggling.

---

### js/chat.js
**Inputs:** Chat messages  
**Outputs:** Chat DOM updates  
No networking logic.

---

### js/main.js
**Inputs:** Startup events  
**Outputs:** App initialization  
Wires everything together.

---

## Design Guarantees
- No file needs to know more than its responsibility
- Game rules are isolated from transport
- Future AIs can modify one file safely
