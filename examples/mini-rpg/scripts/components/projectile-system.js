import { EventEmitter } from '../../../../you/utilities/event.js'

export class ProjectileSystem {
  constructor({ pool, maxTrailLength = 10 } = {}) {
    this._pool = pool
    this._maxTrailLength = maxTrailLength
    this.event = new EventEmitter(this)
  }

  fire(config) {
    const projectile = this._pool.acquire(config)
    return projectile
  }

  update(deltaTime) {
    const projectiles = this._pool.getActiveProjectiles()

    for (const p of projectiles) {
      // Add current position to trail before moving
      p.trail.push({ x: p.x, y: p.y })
      if (p.trail.length > this._maxTrailLength) {
        p.trail.shift()
      }

      // Move projectile
      const distance = p.speed * deltaTime
      p.x += p.dirX * distance
      p.y += p.dirY * distance
      p.distanceTraveled += distance

      // Check if range exceeded
      if (p.distanceTraveled >= p.range) {
        this._pool.release(p)
      }
    }
  }

  checkCollisions(targets, ownerFilter) {
    const projectiles = this._pool.getActiveProjectiles()
    const toRelease = []

    for (const p of projectiles) {
      // Only check projectiles matching owner filter
      if (p.owner !== ownerFilter) continue

      for (const target of targets) {
        // Check if target is alive
        const stats = target.findComponent('Stats')
        if (stats && !stats.alive) continue

        // Circle collision check
        const dx = target.position[0] - p.x
        const dy = target.position[1] - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const collisionDist = (target.radius || 16) + p.size / 2

        if (dist <= collisionDist) {
          // Emit hit event
          this.event.emit('hit', {
            projectile: p,
            target,
            damage: p.damage
          })

          // Non-piercing projectiles are released on hit
          if (!p.piercing) {
            toRelease.push(p)
          }

          break // Only hit one target per projectile per frame
        }
      }
    }

    // Release hit projectiles
    for (const p of toRelease) {
      this._pool.release(p)
    }
  }

  getActiveProjectiles() {
    return [...this._pool.getActiveProjectiles()]
  }
}
