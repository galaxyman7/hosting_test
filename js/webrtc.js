import { state } from "./state.js";
import { toggleEdge } from "./board.js";
import { logChat } from "./chat.js";
import { updateHostStatus } from "./ui.js";

export async function generateOffer() {
  if (state.peers.size >= state.MAX_PLAYERS) return alert("Max players");

  const peerId = ++state.peerCounter;
  state.pendingPeerId = peerId;

  const pc = new RTCPeerConnection({ iceServers:[{urls:"stun:stun.l.google.com:19302"}] });
  const dc = pc.createDataChannel("data");

  state.peers.set(peerId, { pc, dc });
  setupDataChannel(peerId, dc);

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  pc.onicecandidate = e => {
    if (!e.candidate) {
      hostOffer.value = btoa(pc.localDescription.sdp);
    }
  };

  updateHostStatus();
}

export function setupDataChannel(peerId, dc) {
  dc.onmessage = e => {
    const msg = JSON.parse(e.data);
    if (msg.type === "edge") toggleEdge(msg.id, false);
    if (msg.type === "chat") logChat(msg.from, msg.text);
  };
}
export function broadcast(data, except = null) {
  state.peers.forEach((p, id) => {
    if (id === except) return;
    if (p.dc.readyState === "open") {
      p.dc.send(JSON.stringify(data));
    }
  });
}


