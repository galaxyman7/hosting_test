import { showHostUI, showPlayerUI } from "./ui.js";
import { generateOffer } from "./webrtc.js";
import { initBoard } from "./board.js";

hostBtn.onclick = () => { showHostUI(); initBoard(); };
playerBtn.onclick = () => { showPlayerUI(); initBoard(); };

generateOfferBtn.onclick = generateOffer;
