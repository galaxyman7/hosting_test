// Shared utilities
function copyText(id, btn){
  navigator.clipboard.writeText(document.getElementById(id).value);
  const t = btn.innerText;
  btn.innerText = "✔ Copied";
  setTimeout(()=>btn.innerText=t, 1000);
}

function logChat(sender, text){
  const d = document.createElement('div');
  d.textContent = sender + ": " + text;
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
}
