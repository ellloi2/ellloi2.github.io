// js/ai.js
// ES module SimpleAI for browser use

export class SimpleAI {
  constructor(character, aggressiveness = 0.6) {
    this.ch = character;
    this.aggressiveness = Math.max(0, Math.min(1, aggressiveness));
    this.state = 'idle';
    this.stateTimer = 0;
  }

  decide(player, platforms) {
    const dx = player.x - this.ch.x;
    const dist = Math.abs(dx);

    this.stateTimer -= 0.016;
    if (this.stateTimer <= 0) {
      const r = Math.random();
      if (r < this.aggressiveness) this.state = 'approach';
      else if (r < 0.85) this.state = 'retreat';
      else this.state = 'idle';
      this.stateTimer = 0.3 + Math.random() * 0.9;
    }

    let move = 0, jump = false, attack = false;
    if (this.state === 'approach') {
      move = dx > 0 ? 1 : (dx < 0 ? -1 : 0);
      if (dist < 180 && Math.random() < 0.02 && this.ch.onGround) jump = true;
    } else if (this.state === 'retreat') {
      move = dx > 0 ? -1 : 1;
    } else {
      move = 0;
    }

    if (dist < 120 && this.ch.attackCooldown <= 0 && Math.random() < (0.035 + this.aggressiveness * 0.05)) {
      attack = true;
    }

    return { move, jump, attack };
  }

  apply(action) {
    this.ch.applyInput(action.move, action.jump, action.attack);
  }
}
