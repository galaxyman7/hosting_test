export function logChat(sender, text) {
  const chat = document.getElementById("chat");
  const div = document.createElement("div");
  div.textContent = `${sender}: ${text}`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}
