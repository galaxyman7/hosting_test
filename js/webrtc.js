import { Msg } from './bus.js';

// pako from CDN in index.html, using window.pako

function compressSDP(desc) {
  const sdp = desc.sdp;
  const compressed = window.pako.deflate(sdp);
  return btoa(String.fromCharCode(...compressed))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decompressSDP(code, type) {
  code = code.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(code);
  const arr = Uint8Array.from(bin, c => c.charCodeAt(0));
  const sdp = window.pako.inflate(arr, { to: 'string' });
  return { type, sdp };
}
function waitForIceGathering(pc) {
  return new Promise(resolve => {
    if (pc.iceGatheringState === 'complete') return resolve();
    pc.addEventListener('icegatheringstatechange', () => {
      if (pc.iceGatheringState === 'complete') resolve();
    });
    setTimeout(resolve, 3000);
  });
}

export function setupRTC(bus, state) {
  const peers = new Map(); // id -> { pc, dc }
  let ui = null;
  let role = null; // 'GM' | 'Players'

  bus.on('team:set', ({ team }) => { role = team; });

  function addChatMessage(sender, text) {
    const el = ui?.chatEl;
    if (!el) return;
    const div = document.createElement('div');
    div.className = 'msg';
    div.innerHTML = `<span class="${sender === 'Me' ? 'me' : ''}">${sender}:</span> ${text}`;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
  }
  function broadcast(msgObj) {
    for (const { dc } of peers.values()) {
      if (dc && dc.readyState === 'open') {
        dc.send(JSON.stringify({ ...msgObj, team: role }));
      }
    }
  }
  bus.on('net:broadcast', (msgObj) => broadcast(msgObj));

  // When our local state changes, send patches
  bus.on('state:patch', ({ patch }) => broadcast(Msg.patch(patch)));
  bus.on('state:fullSync', () => broadcast(Msg.fullState(state.serialize())));

  function attachUI(elms) {
    ui = elms;

    ui.hostBtn.onclick = () => {
      ui.newOfferBtn.disabled = false;
    };
    ui.playerBtn.onclick = () => {
      ui.createAnswerBtn.disabled = false;
    };

    ui.sendBtn.onclick = () => {
      const text = ui.chatInput.value.trim();
      if (!text) return;
      addChatMessage('Me', text);
      broadcast(Msg.chat(text));
      ui.chatInput.value = '';
    };

    ui.newOfferBtn.onclick = async () => {
      const id = 'p' + Math.random().toString(36).slice(2, 8);
      const pc = new RTCPeerConnection({ iceServers: [] });
      const dc = pc.createDataChannel('game');
      dc.onopen = () => ui.sendBtn.disabled = false;
      dc.onmessage = ev => handleMessage(id, ev.data);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await waitForIceGathering(pc);
      const code = compressSDP(pc.localDescription);

      const card = document.createElement('div');
      card.className = 'peer-card';
      card.innerHTML = `
        <strong>Peer ${id}</strong><br>
        Offer code:<br>
        <textarea readonly>${code}</textarea><br>
        <button id="copyOffer_${id}">Copy Offer</button><br>
        Paste Answer:<br>
        <textarea id="answer_${id}"></textarea><br>
        <button id="accept_${id}">Accept Answer</button>
        <div id="status_${id}">Waiting…</div>
      `;
      card.querySelector(`#copyOffer_${id}`).onclick = () => {
        navigator.clipboard.writeText(code);
        alert('Offer copied!');
      };
      card.querySelector(`#accept_${id}`).onclick = async () => {
        const ansText = card.querySelector(`#answer_${id}`).value.trim();
        if (!ansText) return;
        const answerObj = decompressSDP(ansText, "answer");
        await pc.setRemoteDescription(answerObj);
        card.querySelector(`#status_${id}`).textContent = 'Connected!';
        // Send full state to newcomer
        dc.send(JSON.stringify(Msg.fullState(state.serialize())));
      };
      ui.hostPeers.appendChild(card);
      peers.set(id, { pc, dc });
    };

    ui.createAnswerBtn.onclick = async () => {
      const offerText = ui.offerInput.value.trim();
      if (!offerText) return alert('Paste host offer code first.');
      const offerObj = decompressSDP(offerText, "offer");
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.ondatachannel = ev => {
        const dc = ev.channel;
        peers.set('Host', { pc, dc });
        dc.onopen = () => {
          ui.playerStatus.textContent = 'Connected!';
          ui.sendBtn.disabled = false;
        };
        dc.onmessage = ev => handleMessage('Host', ev.data);
      };
      await pc.setRemoteDescription(offerObj);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await waitForIceGathering(pc);
      const code = compressSDP(pc.localDescription);
      ui.answerOutput.value = code;
      ui.copyAnswerBtn.disabled = false;
      ui.finalizeBtn.disabled = false;
      ui.copyAnswerBtn.onclick = () => {
        navigator.clipboard.writeText(code);
        alert('Answer copied!');
      };
    };
  }

  function handleMessage(peerId, raw) {
    const msg = JSON.parse(raw);
    switch (msg.kind) {
      case 'chat':
        // Show sender team
        addChatMessage(`${peerId} (${msg.team ?? '?'})`, msg.text);
        break;
      case 'patch':
        state.applyPatch(msg.patch);
        break;
      case 'fullState':
        state.replace(msg.state);
        break;
      case 'action':
        // Actions are processed through UI/logic as needed
        bus.emit('net:action', msg);
        break;
      default:
        console.warn('Unknown message', msg);
    }
  }

  return { attachUI, broadcast };
}