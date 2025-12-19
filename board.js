const activeEdges = new Set();

function initBoard(){
  const svg = hexSvg;
  svg.innerHTML = "";
  const size=20, cx=200, cy=200;

  for(let q=-4;q<=4;q++)for(let r=-4;r<=4;r++){
    if(Math.abs(q+r)>4) continue;

    const x=cx+size*1.5*q;
    const y=cy+size*(Math.sqrt(3)/2*q+Math.sqrt(3)*r);
    const pts=[...Array(6)].map((_,i)=>{
      const a=Math.PI/3*i;
      return {x:x+size*Math.cos(a),y:y+size*Math.sin(a)};
    });

    pts.forEach((p,i)=>{
      const p2=pts[(i+1)%6];
      const id=[p.x,p.y,p2.x,p2.y].map(n=>Math.round(n)).sort().join('_');
      if(document.getElementById(id)) return;

      const e=document.createElementNS(svg.namespaceURI,"line");
      e.id=id;
      e.setAttribute("x1",p.x); e.setAttribute("y1",p.y);
      e.setAttribute("x2",p2.x); e.setAttribute("y2",p2.y);
      e.setAttribute("class","edge");

      const h=document.createElementNS(svg.namespaceURI,"line");
      h.setAttribute("x1",p.x); h.setAttribute("y1",p.y);
      h.setAttribute("x2",p2.x); h.setAttribute("y2",p2.y);
      h.setAttribute("class","edge-hitbox");
      h.onclick=()=>{ if(!isHost) return; toggleEdge(id,true); };

      svg.appendChild(e); svg.appendChild(h);
    });
  }
}

function toggleEdge(id, broadcastIt){
  const el=document.getElementById(id);
  if(activeEdges.has(id)){
    activeEdges.delete(id);
    el.classList.remove('active');
  }else{
    activeEdges.add(id);
    el.classList.add('active');
  }
  if(broadcastIt) broadcast({ type:'edge', id });
}
