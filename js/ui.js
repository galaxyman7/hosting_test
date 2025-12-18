import { Logic } from './logic.js';
import { Msg } from './bus.js';

export function setupUI(bus, state, boardAPI) {
  let currentTeam = 'Players';
  let selectedCharId = null;
  let wallMode = false;
  let checkPlayersMode = false;
  let placingTrap = false;

  bus.on('team:set', ({ team }) => { currentTeam = team; bus.emit('visibility:refresh', { team }); });

  // GM controls
  const toggleWallBtn = document.getElementById('toggleWallModeBtn');
  toggleWallBtn.onclick = () => {
    wallMode = !wallMode;
    toggleWallBtn.textContent = `Wall mode: ${wallMode ? 'On' : 'Off'}`;
    bus.emit('ui:wallMode', { active: wallMode });
  };

  const alertRange = document.getElementById('alertRange');
  alertRange.oninput = () => {
    state.emitPatch({ type: 'alert:set', payload: { value: parseInt(alertRange.value, 10) } });
  };

  const checkPlayersBtn = document.getElementById('checkPlayersBtn');
  checkPlayersBtn.onclick = () => {
    if (currentTeam !== 'GM') return;
    checkPlayersMode = true;
    checkPlayersBtn.textContent = 'Click a tile to check…';
    setTimeout(() => { if (checkPlayersMode) { checkPlayersMode = false; checkPlayersBtn.textContent = 'Check for players'; } }, 7000);
  };

  const saveBtn = document.getElementById('saveBtn');
  saveBtn.onclick = () => {
    const blob = new Blob([JSON.stringify(state.serialize(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = 'session.json';
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadFile = document.getElementById('loadFile');
  loadFile.onchange = async () => {
    const file = loadFile.files?.[0];
    if (!file) return;
    const text = await file.text();
    const obj = JSON.parse(text);
    state.replace(obj);
    bus.emit('state:loaded', {});
  };

  const addNoteBtn = document.getElementById('addNoteBtn');
  addNoteBtn.onclick = () => {
    if (currentTeam !== 'GM') return;
    bus.on('ui:tileClicked', onNotePlaceOnce);
    addNoteBtn.textContent = 'Tap hex to place note…';
    setTimeout(() => { addNoteBtn.textContent = 'Add note'; bus.on('ui:tileClicked', () => {}); }, 6000);
  };
  function onNotePlaceOnce({ q, r }) {
    const id = 'N' + Math.random().toString(36).slice(2, 8);
    state.emitPatch({ type: 'note:add', payload: { id, note: { id, q, r, text: 'New Note', chance: 25 } } });
    addNoteBtn.textContent = 'Add note';
  }

  // Player controls
  const addCharBtn = document.getElementById('addCharacterBtn');
  addCharBtn.onclick = () => {
    bus.on('ui:tileClicked', onPlaceCharOnce);
    addCharBtn.textContent = 'Tap hex to place character…';
    setTimeout(() => { addCharBtn.textContent = 'Add character'; bus.on('ui:tileClicked', () => {}); }, 6000);
  };
  function onPlaceCharOnce({ q, r }) {
    if (!Logic.canEnterTile(state.state, currentTeam, q, r)) return alert('Max 3 characters per tile (same team).');
    const id = 'C' + Math.random().toString(36).slice(2, 8);
    state.emitPatch({ type: 'character:add', payload: { id, char: { id, team: currentTeam, q, r, color: null, stealth: false } } });
    addCharBtn.textContent = 'Add character';
  }

  const toggleStealthBtn = document.getElementById('toggleStealthBtn');
  const changeColorBtn = document.getElementById('changeColorBtn');

  bus.on('ui:characterSelect', ({ id }) => {
    selectedCharId = id;
    const c = state.state.characters[id];
    const canEdit = c && c.team === currentTeam;
    toggleStealthBtn.disabled = !canEdit;
    changeColorBtn.disabled = !canEdit;
  });

  toggleStealthBtn.onclick = () => {
    const c = state.state.characters[selectedCharId];
    if (!c || c.team !== currentTeam) return;
    state.emitPatch({ type: 'character:set', payload: { id: c.id, updates: { stealth: !c.stealth } } });
    bus.emit('visibility:refresh', { team: currentTeam });
  };

  changeColorBtn.onclick = () => {
    const c = state.state.characters[selectedCharId];
    if (!c || c.team !== currentTeam) return;
    const color = prompt('Enter color (CSS):', c.color || '');
    if (color) state.emitPatch({ type: 'character:set', payload: { id: c.id, updates: { color } } });
  };

  // Move character by tapping a tile when selected
  bus.on('ui:tileClicked', ({ q, r }) => {
    if (selectedCharId) {
      const c = state.state.characters[selectedCharId];
      if (!c || c.team !== currentTeam) return;
      if (!Logic.canEnterTile(state.state, currentTeam, q, r)) return alert('Max 3 characters per tile (same team).');

      // Trap check: entering enemy trap
      const hitTrap = Logic.trapCheck(state.state, currentTeam, q, r);
      if (hitTrap) alert('You hit a trap!');

      // Note reveal (Players entering)
      if (currentTeam === 'Players') {
        for (const n of Object.values(state.state.notes)) {
          if (n.q === q && n.r === r) {
            if (Logic.rollNoteReveal(n)) {
              showNoteDialog(n.text);
            }
          }
        }
      }

      state.emitPatch({ type: 'character:move', payload: { id: c.id, q, r } });
    }

    // GM check-for-players mode
    if (checkPlayersMode && currentTeam === 'GM') {
      const { outcome } = Logic.checkForPlayers(state.state, q, r);
      alert(outcome);
      checkPlayersMode = false;
      document.getElementById('checkPlayersBtn').textContent = 'Check for players';
    }
  });

  // Traps
  const placeTrapBtn = document.getElementById('placeTrapBtn');
  placeTrapBtn.onclick = () => {
    placingTrap = true;
    placeTrapBtn.textContent = 'Tap hex to place trap…';
    bus.on('ui:tileClicked', onPlaceTrapOnce);
    setTimeout(() => { placingTrap = false; placeTrapBtn.textContent = 'Place trap'; }, 6000);
  };
  function onPlaceTrapOnce({ q, r }) {
    if (!placingTrap) return;
    const id = 'T' + Math.random().toString(36).slice(2, 8);
    state.emitPatch({ type: 'trap:add', payload: { id, trap: { id, team: currentTeam, q, r, color: currentTeam === 'GM' ? '#c8553d' : '#3d9a66' } } });
    placingTrap = false;
    placeTrapBtn.textContent = 'Place trap';
  }

  bus.on('ui:trapSelect', ({ id }) => {
    const t = state.state.traps[id];
    if (!t || t.team !== currentTeam) return;
    const color = prompt('Trap color (CSS):', t.color || '');
    if (color) state.emitPatch({ type: 'trap:update', payload: { id, updates: { color } } });
  });

  // Player "check for traps": click target tile to query enemy trap
  const checkTrapsBtn = document.getElementById('checkTrapsBtn');
  checkTrapsBtn.onclick = () => {
    if (currentTeam !== 'Players' && currentTeam !== 'GM') return;
    checkTrapsBtn.textContent = 'Tap hex to check…';
    const off = bus.on('ui:tileClicked', ({ q, r }) => {
      const enemy = Object.values(state.state.traps).find(t => t.team !== currentTeam && t.q === q && t.r === r);
      alert(enemy ? 'Enemy trap detected.' : 'No enemy trap here.');
      checkTrapsBtn.textContent = 'Check for traps';
      off();
    });
  };

  // Note editing
  bus.on('ui:noteSelect', ({ id }) => {
    const n = state.state.notes[id];
    if (!n) return;
    const txt = prompt('Edit note text:', n.text || '');
    if (txt !== null) state.emitPatch({ type: 'note:update', payload: { id, updates: { text: txt } } });
    const chanceStr = prompt('Reveal chance (0-100):', String(n.chance ?? 25));
    const chance = parseInt(chanceStr, 10);
    if (!Number.isNaN(chance)) state.emitPatch({ type: 'note:update', payload: { id, updates: { chance: Math.max(0, Math.min(100, chance)) } } });
    // Move note by tapping a hex
    const move = confirm('Move this note to a different hex?');
    if (move) {
      const off = bus.on('ui:tileClicked', ({ q, r }) => {
        state.emitPatch({ type: 'note:update', payload: { id, updates: { q, r } } });
        off();
      });
      alert('Tap a hex to move the note');
    }
  });

  // Chat
  const sendBtn = document.getElementById('sendBtn');
  const chatInput = document.getElementById('chatInput');
  sendBtn.onclick = () => {
    const text = chatInput.value.trim();
    if (!text) return;
    bus.emit('net:broadcast', Msg.chat(text));
    chatInput.value = '';
  };

  function showNoteDialog(text) {
    const tmpl = document.getElementById('noteDialogTmpl');
    const dlg = tmpl.content.firstElementChild.cloneNode(true);
    dlg.querySelector('.note-content').textContent = text;
    document.body.appendChild(dlg);
    dlg.showModal();
    dlg.querySelector('.closeNoteBtn').onclick = () => { dlg.close(); dlg.remove(); };
  }
}