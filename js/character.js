// js/character.js
// ES module Character class for browser use

export class Character {
  constructor({ id=0, name='Char', color='#fff', speed=240, jump=360, attack=18, weight=100, x=0, facing=1 } = {}) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.speed = speed;
    this.jumpStrength = jump;
    this.attackPower = attack;
    this.weight = weight;

    // runtime state
    this.x = x;
    this.y = 220;
    this.vx = 0;
    this.vy = 0;
    this.w = 48;
    this.h = 64;
    this.facing = facing;
    this.onGround = false;
    this.health = 0;
    this.alive = true;

    this.attackTimer = 0;
    this.attackCooldown = 0;
  }

  applyInput(move, jump, attack) {
    // move: -1, 0, 1
    this.vx += move * this.speed * 0.016;
    if (move !== 0) this.facing = Math.sign(move);

    if (jump && this.onGround) {
      this.vy = -this.jumpStrength;
      this.onGround = false;
    }

    if (attack && this.attackCooldown <= 0) {
      this.attackTimer = 0.18;
      this.attackCooldown = 0.45;
    }
  }

  update(dt, gravity = 1200) {
    this.vy += gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.995;
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
  }

  resolvePlatforms(platforms) {
    this.onGround = false;
    for (const p of platforms) {
      if (this.x + this.w > p.x && this.x < p.x + p.w) {
        if (this.vy >= 0 && (this.y + this.h) <= p.y + 12 && (this.y + this.h + this.vy * 0.016) >= p.y) {
          this.y = p.y - this.h;
          this.vy = 0;
          this.onGround = true;
        }
      }
    }
  }

  attackHitbox() {
    if (this.attackTimer > 0) {
      const rangeW = 60;
      const ax = this.facing > 0 ? this.x + this.w : this.x - rangeW;
      const ay = this.y + this.h * 0.35;
      return { x: ax, y: ay, w: rangeW, h: 36 };
    }
    return null;
  }

  takeHit(power, dir) {
    this.health = Math.min(999, this.health + power);
    const kb = (power * (1 + this.health / 100)) * (160 / this.weight);
    this.vx += dir * (kb * 0.6);
    this.vy -= Math.abs(kb) * 0.45;
  }

  isOffstage(W, H) {
    return (this.x < -200) || (this.x > W + 200) || (this.y > H + 200);
  }
}
