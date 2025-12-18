/**
 * SVG hex board with axial coordinates and edge picking for walls.
 */
import { Logic } from './logic.js';
import { State } from './state.js';

export function setupBoard(bus, state, svg) {
  const cfg = { size: 28, margin: 8 }; // hex radius in px; tuned for mobile
  let currentTeam = null;
  bus.on('team:set', ({ team }) => { currentTeam = team; redraw(); });

  // Screen transforms
  function hexToPixel(q, r) {
    const s = cfg.size;
    const x = s * (Math.sqrt(3) * q + Math.sqrt(3)/2 * r);
    const y = s * (3/2 * r);
    return { x, y };
  }

  function clear() { while (svg.firstChild) svg.removeChild(svg.firstChild); }

  function drawTiles(view) {
    const g = svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'g'));
    g.setAttribute('data-layer', 'tiles');

    for (const t of view.tiles) {
      const { x, y } = hexToPixel(t.q, t.r);
      const pts = hexPolygon(x, y, cfg.size);
      const path = polyPath(pts);
      const hexEl = create('path', { d: path, class: 'hex' });
      g.appendChild(hexEl);

      // Tile hotspot for clicks
      const hotspot = create('polygon', {
        points: pts.map(p => `${p.x},${p.y}`).join(' '),
        class: 'tile-hotspot',
        'data-q': t.q,
        'data-r': t.r
      });
      hotspot.addEventListener('click', () => bus.emit('board:tileClick', { q: t.q, r: t.r }));
      g.appendChild(hotspot);
    }
  }

  function drawWalls(view) {
    const g = svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'g'));
    g.setAttribute('data-layer', 'walls');

    // Edge hotspots when GM is in wall mode
    let wallMode = false;
    bus.on('ui:wallMode', ({ active }) => { wallMode = active; redraw(); });

    const radius = view.board.radius;
    for (const t of view.tiles) {
      const neighbors = hexNeighbors(t);
      const { x, y } = hexToPixel(t.q, t.r);
      const corners = hexCorners(x, y, cfg.size);

      for (let i = 0; i < 6; i++) {
        const a = corners[i];
        const b = corners[(i + 1) % 6];

        const n = neighbors[i]; // neighbor axial
        const edgeKey = n ? State.edgeKey(t, n) : State.edgeKey(t, { q: t.q, r: t.r, edge: i }); // boundary edges keyed uniquely
        const isWall = !!view.walls[edgeKey];

        // Wall segment
        if (isWall) {
          const line = create('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'wall' });
          g.appendChild(line);
        }

        // Edge hotspot for GM wall mode
        if (currentTeam === 'GM' && wallMode) {
          const hit = create('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'edge-hotspot' });
          hit.addEventListener('click', () => {
            const value = !isWall;
            state.emitPatch({ type: 'wall:set', payload: { edgeKey, value } });
          });
          g.appendChild(hit);
        }
      }
    }
  }

  function drawCharacters(view) {
    const g = svg.appendChild(create('g', { 'data-layer': 'chars' }));
    for (const c of Object.values(view.characters)) {
      const { x, y } = hexToPixel(c.q, c.r);
      const icon = create('use', { href: '../img/meeple.svg#root' }); // fallback if id is rootless
      const wrap = create('g', { transform: `translate(${x - 16}, ${y - 24})` });
      wrap.classList.add('meeple');
      wrap.style.color = c.color || (c.team === 'GM' ? '#c8553d' : '#3d9a66');

      // Fallback render using path if <use> fails
      const path = create('path', {
        d: 'M32 10c6 0 10 4 10 10s-4 10-10 10-10-4-10-10 4-10 10-10zm0 22c14 0 24 12 24 20H8c0-8 10-20 24-20z',
        transform: 'translate(-16,-24)',
        fill: 'currentColor'
      });
      wrap.appendChild(path);

      // Interaction
      wrap.addEventListener('click', (ev) => {
        bus.emit('ui:characterSelect', { id: c.id });
        ev.stopPropagation();
      });

      g.appendChild(wrap);
    }
  }

  function drawNotes(view) {
    if (currentTeam !== 'GM') return;
    const g = svg.appendChild(create('g', { 'data-layer': 'notes' }));
    for (const n of Object.values(view.notes)) {
      const { x, y } = hexToPixel(n.q, n.r);
      const circle = create('circle', { cx: x, cy: y, r: 8, class: 'note-icon' });
      circle.addEventListener('click', () => bus.emit('ui:noteSelect', { id: n.id }));
      g.appendChild(circle);
    }
  }

  function drawTraps(view) {
    const g = svg.appendChild(create('g', { 'data-layer': 'traps' }));
    for (const t of Object.values(view.traps)) {
      const { x, y } = hexToPixel(t.q, t.r);
      const poly = create('polygon', {
        points: trapPoints(x, y, 10),
        class: 'trap-icon'
      });
      poly.style.fill = t.color || (t.team === 'GM' ? '#c8553d' : '#3d9a66');
      poly.addEventListener('click', () => bus.emit('ui:trapSelect', { id: t.id }));
      g.appendChild(poly);
    }
  }

  function redraw() {
    const view = state.visibleView(currentTeam || 'Players');
    // Fit SVG viewBox to content
    const size = cfg.size;
    const tiles = view.tiles;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const t of tiles) {
      const { x, y } = hexToPixel(t.q, t.r);
      minX = Math.min(minX, x - size * Math.sqrt(3)/2);
      maxX = Math.max(maxX, x + size * Math.sqrt(3)/2);
      minY = Math.min(minY, y - size);
      maxY = Math.max(maxY, y + size);
    }
    svg.setAttribute('viewBox', `${minX-12} ${minY-12} ${maxX-minX+24} ${maxY-minY+24}`);

    clear();
    drawTiles(view);
    drawWalls(view);
    drawTraps(view);
    drawCharacters(view);
    drawNotes(view);
  }

  // React to patches
  bus.on('state:patch', redraw);
  bus.on('visibility:refresh', redraw);

  // Tile click actions based on UI mode
  bus.on('board:tileClick', ({ q, r }) => bus.emit('ui:tileClicked', { q, r }));

  // Helpers: hex polygon/corners
  function hexCorners(cx, cy, s) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 180 * (60 * i - 30); // pointy-top
      pts.push({ x: cx + s * Math.cos(angle), y: cy + s * Math.sin(angle) });
    }
    return pts;
  }
  function hexPolygon(cx, cy, s) { return hexCorners(cx, cy, s); }
  function polyPath(pts) {
    const d = ['M', pts[0].x, pts[0].y];
    for (let i = 1; i < pts.length; i++) d.push('L', pts[i].x, pts[i].y);
    d.push('Z');
    return d.join(' ');
  }
  function trapPoints(cx, cy, r) {
    const pts = [];
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 * i) / 5;
      pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
    }
    return pts.join(' ');
  }
  function create(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  return { redraw, hexToPixel };
}