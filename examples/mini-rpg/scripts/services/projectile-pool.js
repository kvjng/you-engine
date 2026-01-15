export class ProjectilePool {
  constructor({ maxSize = 100 } = {}) {
    this._maxSize = maxSize
    this._pool = []
    this._active = new Set()

    // Pre-allocate pool
    for (let i = 0; i < maxSize; i++) {
      this._pool.push(this._createProjectile())
    }
  }

  _createProjectile() {
    return {
      active: false,
      x: 0,
      y: 0,
      dirX: 0,
      dirY: 0,
      speed: 0,
      damage: 0,
      range: 0,
      distanceTraveled: 0,
      piercing: false,
      owner: 'player',
      size: 8,
      color: '#ffff00',
      trail: []
    }
  }

  get activeCount() {
    return this._active.size
  }

  acquire(config = {}) {
    // Find an inactive projectile
    let projectile = null
    for (const p of this._pool) {
      if (!p.active) {
        projectile = p
        break
      }
    }

    if (!projectile) {
      return null // Pool exhausted
    }

    // Initialize with config
    projectile.active = true
    projectile.x = config.x ?? 0
    projectile.y = config.y ?? 0
    projectile.dirX = config.dirX ?? 0
    projectile.dirY = config.dirY ?? 0
    projectile.speed = config.speed ?? 300
    projectile.damage = config.damage ?? 0
    projectile.range = config.range ?? 200
    projectile.distanceTraveled = 0
    projectile.piercing = config.piercing ?? false
    projectile.owner = config.owner ?? 'player'
    projectile.size = config.size ?? 8
    projectile.color = config.color ?? '#ffff00'
    projectile.trail = []

    this._active.add(projectile)
    return projectile
  }

  release(projectile) {
    projectile.active = false
    projectile.trail = []
    this._active.delete(projectile)
  }

  releaseAll() {
    for (const projectile of this._active) {
      projectile.active = false
      projectile.trail = []
    }
    this._active.clear()
  }

  getActiveProjectiles() {
    return Array.from(this._active)
  }
}
