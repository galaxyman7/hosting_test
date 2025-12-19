import { showHostUI, showPlayerUI, updateHostStatus } from "./ui.js";
import { generateOffer } from "./webrtc.js";
import { initBoard } from "./board.js";
import { sendChat } from "./chat.js";

document.addEventListener("DOMContentLoaded", () => {

  /* ---------- HOST / PLAYER SETUP ---------- */

  document.getElementById("hostBtn").onclick = () => {
    showHostUI();
    initBoard();
    updateHostStatus();
  };

  document.getElementById("playerBtn").onclick = () => {
    showPlayerUI();
    initBoard();
  };

  /* ---------- HOST CONTROLS ---------- */

  document.getElementById("generateOffer").onclick = generateOffer;

  /* ---------- CHAT ---------- */

  document.getElementById("sendChat").onclick = sendChat;

});
