/**
 * Canonical state with immutable ops + visibility filtering per team.
 * Coordinates: axial (q, r). Hex edges stored as key "q,r|q2,r2" with lower sort first.
 */
export class State {
  constructor(bus) {
    this.bus = bus;
    this.state = {
      board: { radius: 4 },    // default; can be shape config in future
      tiles: [],               // generated from radius
      walls: {},               // edgeKey -> true
      characters: {},          // id -> { id, team, q, r, color, stealth }
      traps: {},               // id -> { id, team, q, r, color }
      notes: {},               // id -> { id, q, r, text, chance } (GM-owned)
      alertLevel: 0,
      seq: 0,                  // increasing sequence for patches
    };
  }

  initializeBoard({ radius = 4 }) {
    const tiles = [];
    for (let q = -radius; q <= radius; q++) {
      const r1 = Math.max(-radius, -q - radius);
      const r2 = Math.min(radius, -q + radius);
      for (let r = r1; r <= r2; r++) tiles.push({ q, r });
    }
    this.state.board = { radius };
    this.state.tiles = tiles;
    this.emitPatch({ type: 'board:init', payload: { radius, tiles } });
  }

  /** Emit a patch and apply locally */
  emitPatch(patch) {
    this.state.seq++;
    const p = { ...patch, seq: this.state.seq };
    this.applyPatch(p);
    this.bus.emit('state:patch', { patch: p });
  }

  /** Apply a patch from local or remote */
  applyPatch(patch) {
    const s = this.state;
    switch (patch.type) {
      case 'board:init':
        s.board = { radius: patch.payload.radius };
        s.tiles = patch.payload.tiles;
        break;
      case 'wall:set':
        s.walls[patch.payload.edgeKey] = patch.payload.value;
        break;
      case 'character:add':
        s.characters[patch.payload.id] = patch.payload.char;
        break;
      case 'character:move':
        {
          const c = s.characters[patch.payload.id];
          if (!c) break;
          c.q = patch.payload.q;
          c.r = patch.payload.r;
        }
        break;
      case 'character:set':
        {
          const c = s.characters[patch.payload.id];
          if (!c) break;
          Object.assign(c, patch.payload.updates);
        }
        break;
      case 'trap:add':
        s.traps[patch.payload.id] = patch.payload.trap;
        break;
      case 'trap:update':
        {
          const t = s.traps[patch.payload.id];
          if (!t) break;
          Object.assign(t, patch.payload.updates);
        }
        break;
      case 'note:add':
        s.notes[patch.payload.id] = patch.payload.note;
        break;
      case 'note:update':
        {
          const n = s.notes[patch.payload.id];
          if (!n) break;
          Object.assign(n, patch.payload.updates);
        }
        break;
      case 'alert:set':
        s.alertLevel = patch.payload.value;
        this.bus.emit('alert:updated', { alertLevel: s.alertLevel });
        break;
      default:
        console.warn('Unknown patch type', patch);
    }
  }

  replace(newState) {
    this.state = newState;
    this.bus.emit('state:fullSync');
    this.bus.emit('alert:updated', { alertLevel: this.state.alertLevel });
  }

  serialize() {
    return JSON.parse(JSON.stringify(this.state));
  }

  /** Visibility filter for rendering on a given team */
  visibleView(team) {
    const s = this.state;
    const chars = {};
    for (const [id, c] of Object.entries(s.characters)) {
      // Show if same team or not in stealth
      if (c.team === team || !c.stealth) chars[id] = c;
    }
    const traps = {};
    for (const [id, t] of Object.entries(s.traps)) {
      if (t.team === team) traps[id] = t;
    }
    const notes = {};
    // GM sees notes always; Players never see notes unless revealed by UI
    if (team === 'GM') Object.assign(notes, s.notes);

    return {
      board: s.board,
      tiles: s.tiles,
      walls: s.walls,
      characters: chars,
      traps,
      notes,
      alertLevel: s.alertLevel,
    };
  }

  // Helpers
  static edgeKey(a, b) {
    const ka = `${a.q},${a.r}`;
    const kb = `${b.q},${b.r}`;
    return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
  }
}