import { state } from "./state.js";

export function showHostUI() {
  state.isHost = true;
  hide("setup");
  show("hostPanel", "game", "chatPanel");
}

export function showPlayerUI() {
  hide("setup");
  show("playerPanel", "game", "chatPanel");
}

export function updateHostStatus() {
  document.getElementById("hostStatus").textContent =
    `Players: ${state.peers.size}/${state.MAX_PLAYERS}`;
}

function show(...ids) {
  ids.forEach(id => document.getElementById(id).classList.remove("hidden"));
}

function hide(...ids) {
  ids.forEach(id => document.getElementById(id).classList.add("hidden"));
}
