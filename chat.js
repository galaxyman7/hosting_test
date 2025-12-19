const { els } = window.App;

function sendChat(){
  const text = els.chatInput.value.trim();
  if(!text) return;

  window.logChat("Me", text);

  if(window.App.isHost){
    window.broadcast({ type:'chat', from:'Host', text });
  }else if(window.App.playerDC && window.App.playerDC.readyState === "open"){
    window.App.playerDC.send(JSON.stringify({ type:'chat', from:'Player', text }));
  }

  els.chatInput.value = "";
}

// Expose
window.sendChat = sendChat;
