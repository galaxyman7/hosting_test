import { state } from "./state.js";

export function initBoard() {
  const svg = document.getElementById("hexSvg");
  svg.innerHTML = "";

  const size = 20, cx = 200, cy = 200;

  for (let q=-4; q<=4; q++) for (let r=-4; r<=4; r++) {
    if (Math.abs(q+r) > 4) continue;

    const x = cx + size*1.5*q;
    const y = cy + size*(Math.sqrt(3)/2*q + Math.sqrt(3)*r);

    [...Array(6)].forEach((_, i) => {
      const a = Math.PI/3*i;
      const b = Math.PI/3*(i+1);

      const p1 = { x:x+size*Math.cos(a), y:y+size*Math.sin(a) };
      const p2 = { x:x+size*Math.cos(b), y:y+size*Math.sin(b) };

      const id = [p1.x,p1.y,p2.x,p2.y].map(n=>Math.round(n)).sort().join("_");
      if (document.getElementById(id)) return;

      const line = document.createElementNS(svg.namespaceURI,"line");
      line.id = id;
      line.setAttribute("x1",p1.x);
      line.setAttribute("y1",p1.y);
      line.setAttribute("x2",p2.x);
      line.setAttribute("y2",p2.y);
      line.classList.add("edge");

      const hit = line.cloneNode();
      hit.classList.add("edge-hitbox");
      hit.onclick = () => state.isHost && toggleEdge(id, true);

      svg.append(line, hit);
    });
  }
}

export function toggleEdge(id, broadcast) {
  const el = document.getElementById(id);
  state.activeEdges.has(id)
    ? (state.activeEdges.delete(id), el.classList.remove("active"))
    : (state.activeEdges.add(id), el.classList.add("active"));
}
