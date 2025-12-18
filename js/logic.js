/**
 * Game logic: movement constraints, detection odds, traps, notes reveal.
 */
export const Logic = {
  /** Up to 3 characters of the same team per tile. */
  canEnterTile(state, team, q, r) {
    let count = 0;
    for (const c of Object.values(state.characters)) {
      if (c.team === team && c.q === q && c.r === r) count++;
    }
    return count < 3;
  },

  /** GM "check for players" result per rules. Includes stealth players. */
  checkForPlayers(state, q, r) {
    const alert = state.alertLevel;
    const numPlayers = Object.values(state.characters)
      .filter(c => c.team === 'Players' && c.q === q && c.r === r).length;

    if (alert === 0 && numPlayers > 0) return { outcome: 'alert level too low' };
    if (numPlayers === 0 && alert >= 1) return { outcome: 'nothing found' };

    const roll = Math.random();
    if (numPlayers === 1) {
      if (alert === 1 || alert === 2) return { outcome: roll < 1/3 ? 'player found' : 'nothing found' };
      if (alert === 3 || alert === 4) return { outcome: roll < 2/3 ? 'player found' : 'nothing found' };
      if (alert === 5) return { outcome: 'player found' };
    }
    if (numPlayers === 2) {
      if (alert === 1 || alert === 2) return { outcome: roll < 2/3 ? 'player found' : 'nothing found' };
      if (alert >= 3) return { outcome: 'player found' };
    }
    if (numPlayers >= 3 && alert >= 1) return { outcome: 'player found' };

    // Fallback
    return { outcome: 'nothing found' };
  },

  /** Trap check when entering a tile */
  trapCheck(state, moverTeam, q, r) {
    const enemyTrap = Object.values(state.traps)
      .find(t => t.team !== moverTeam && t.q === q && t.r === r);
    return !!enemyTrap;
  },

  /** Note reveal chance for Players entering a hex */
  rollNoteReveal(note) {
    const chance = Math.max(0, Math.min(100, note.chance || 0));
    const roll = Math.random() * 100;
    return roll < chance;
  }
};