import { state } from "./state.js";
import { broadcast } from "./webrtc.js";

export function logChat(sender, text) {
  const chat = document.getElementById("chat");
  const div = document.createElement("div");
  div.textContent = `${sender}: ${text}`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

export function sendChat() {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();
  if (!text) return;

  logChat("Me", text);

  if (state.isHost) {
    broadcast({ type: "chat", from: "Host", text });
  } else if (state.playerDC?.readyState === "open") {
    state.playerDC.send(JSON.stringify({ type: "chat", from: "Player", text }));
  }

  input.value = "";
}
