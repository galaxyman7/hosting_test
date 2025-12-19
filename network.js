const App = window.App;
const { els } = App;

/* ===== UI helpers ===== */
function updateHostStatus(){
  els.hostStatus.textContent = `Players: ${App.peers.size}/${App.MAX_PLAYERS}`;
}

/* ===== Host ===== */
function startHost(){
  App.isHost = true;
  els.setup.classList.add('hidden');
  els.hostPanel.classList.remove('hidden');
  els.game.classList.remove('hidden');
  els.chatPanel.classList.remove('hidden');
  window.initBoard();
  updateHostStatus();
}

async function generateOffer(){
  if(App.peers.size >= App.MAX_PLAYERS){
    alert("Max players reached");
    return;
  }

  const peerId = ++App.peerCounter;
  App.pendingPeerId = peerId;

  const pc = new RTCPeerConnection({
    iceServers:[{urls:"stun:stun.l.google.com:19302"}]
  });

  const dc = pc.createDataChannel("data");
  App.peers.set(peerId, { pc, dc });
  setupDataChannel(peerId, dc);

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  // More reliable SDP export: on null candidate OR icegathering complete
  pc.onicecandidate = e=>{
    if(!e.candidate){
      els.hostOffer.value = btoa(pc.localDescription.sdp);
    }
  };
  pc.onicegatheringstatechange = ()=>{
    if(pc.iceGatheringState === 'complete'){
      els.hostOffer.value = btoa(pc.localDescription.sdp);
    }
  };

  updateHostStatus();
}

async function finalizePlayer(){
  if(!App.pendingPeerId){
    alert("Generate an offer first");
    return;
  }

  const peer = App.peers.get(App.pendingPeerId);
  if(!peer) return;

  const answerSdpB64 = els.hostAnswer.value.trim();
  if(!answerSdpB64){ alert("Paste player answer"); return; }

  const answerSdp = atob(answerSdpB64);
  await peer.pc.setRemoteDescription({ type:'answer', sdp:answerSdp });

  els.hostAnswer.value = "";
  App.pendingPeerId = null;
}

/* ===== Player ===== */
function startPlayer(){
  els.setup.classList.add('hidden');
  els.playerPanel.classList.remove('hidden');
  els.game.classList.remove('hidden');
  els.chatPanel.classList.remove('hidden');
  window.initBoard();

  App.playerPC = new RTCPeerConnection({
    iceServers:[{urls:"stun:stun.l.google.com:19302"}]
  });

  App.playerPC.ondatachannel = e=>{
    App.playerDC = e.channel;
    setupDataChannel("host", App.playerDC);
  };
}

async function createAnswer(){
  const offerB64 = els.playerOffer.value.trim();
  if(!offerB64){ alert("Paste host offer"); return; }

  const sdp = atob(offerB64);
  await App.playerPC.setRemoteDescription({ type:'offer', sdp });

  const ans = await App.playerPC.createAnswer();
  await App.playerPC.setLocalDescription(ans);

  App.playerPC.onicecandidate = e=>{
    if(!e.candidate){
      els.playerAnswer.value = btoa(App.playerPC.localDescription.sdp);
    }
  };
  App.playerPC.onicegatheringstatechange = ()=>{
    if(App.playerPC.iceGatheringState === 'complete'){
      els.playerAnswer.value = btoa(App.playerPC.localDescription.sdp);
    }
  };
}

/* ===== Data channel ===== */
function setupDataChannel(peerId, dc){
  dc.onopen = ()=>{
    if(App.isHost){
      dc.send(JSON.stringify({
        type:'sync',
        edges:[...App.activeEdges]
      }));
      window.logChat("System","Player connected");
    }
  };

  dc.onmessage = e=>{
    let msg;
    try { msg = JSON.parse(e.data); } catch { return; }

    if(msg.type === 'edge'){
      window.toggleEdge(msg.id, false);
      if(App.isHost) broadcast({ type:'edge', id:msg.id }, peerId);
    }

    if(msg.type === 'sync'){
      (msg.edges || []).forEach(id=>window.toggleEdge(id,false));
    }

    if(msg.type === 'chat'){
      window.logChat(msg.from, msg.text);
      if(App.isHost) broadcast(msg, peerId);
    }
  };
}

function broadcast(data, except=null){
  App.peers.forEach((p,id)=>{
    if(id === except) return;
    if(p.dc.readyState === "open"){
      p.dc.send(JSON.stringify(data));
    }
  });
}

/* ===== Expose to window for inline handlers ===== */
window.startHost = startHost;
window.generateOffer = generateOffer;
window.finalizePlayer = finalizePlayer;

window.startPlayer = startPlayer;
window.createAnswer = createAnswer;

window.broadcast = broadcast;
