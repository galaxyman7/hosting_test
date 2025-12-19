const { els } = window.App;

// Clipboard copy helper
function copyText(id, btn){
  const el = document.getElementById(id);
  if(!el) return;
  // Note: Clipboard API requires HTTPS or localhost
  navigator.clipboard.writeText(el.value || "")
    .then(()=>{
      const t = btn.innerText;
      btn.innerText = "✔ Copied";
      setTimeout(()=>btn.innerText=t, 1000);
    })
    .catch(()=>{
      // Fallback select+copy if needed
      el.select();
      document.execCommand('copy');
      const t = btn.innerText;
      btn.innerText = "✔ Copied";
      setTimeout(()=>btn.innerText=t, 1000);
    });
}

// Chat log helper
function logChat(sender, text){
  const d = document.createElement('div');
  d.textContent = sender + ": " + text;
  els.chat.appendChild(d);
  els.chat.scrollTop = els.chat.scrollHeight;
}

// Expose for inline handlers
window.copyText = copyText;
window.logChat = logChat;
