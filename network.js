const MAX_PLAYERS = 8;
let isHost = false;
let peerCounter = 0;
let pendingPeerId = null;

const peers = new Map(); // peerId -> { pc, dc }
let playerPC = null;
let playerDC = null;

/* HOST */
function startHost(){
  isHost = true;
  setup.classList.add('hidden');
  hostPanel.classList.remove('hidden');
  game.classList.remove('hidden');
  chatPanel.classList.remove('hidden');
  initBoard();
  updateHostStatus();
}

async function generateOffer(){
  if(peers.size >= MAX_PLAYERS){ alert("Max players reached"); return; }
  const peerId = ++peerCounter; pendingPeerId = peerId;

  const pc = new RTCPeerConnection({ iceServers:[{urls:"stun:stun.l.google.com:19302"}] });
  const dc = pc.createDataChannel("data");
  peers.set(peerId, { pc, dc });
  setupDataChannel(peerId, dc);

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  pc.onicecandidate = e=>{
    if(!e.candidate){ hostOffer.value = btoa(pc.localDescription.sdp); }
  };

  updateHostStatus();
}

async function finalizePlayer(){
  if(!pendingPeerId){ alert("Generate an offer first"); return; }
  const peer = peers.get(pendingPeerId); if(!peer) return;

  const answerSdp = atob(hostAnswer.value.trim());
  await peer.pc.setRemoteDescription({ type:'answer', sdp:answerSdp });

  hostAnswer.value = ""; pendingPeerId = null
