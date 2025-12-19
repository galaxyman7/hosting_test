function sendChat(){
  const text = chatInput.value.trim();
  if(!text) return;

  logChat("Me", text);

  if(isHost){
    broadcast({ type:'chat', from:'Host', text });
  }else if(playerDC && playerDC.readyState === "open"){
    playerDC.send(JSON.stringify({ type:'chat', from:'Player', text }));
  }

  chatInput.value = "";
}
