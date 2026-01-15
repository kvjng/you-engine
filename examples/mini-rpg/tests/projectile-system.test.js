import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProjectileSystem } from '../scripts/components/projectile-system.js'
import { ProjectilePool } from '../scripts/services/projectile-pool.js'

describe('ProjectileSystem', () => {
  let pool
  let system

  beforeEach(() => {
    pool = new ProjectilePool({ maxSize: 10 })
    system = new ProjectileSystem({ pool })
  })

  describe('fire', () => {
    it('should acquire projectile from pool and add to system', () => {
      const config = {
        x: 100,
        y: 100,
        dirX: 1,
        dirY: 0,
        speed: 300,
        damage: 10,
        range: 200
      }

      system.fire(config)

      expect(pool.activeCount).toBe(1)
      expect(system.getActiveProjectiles()).toHaveLength(1)
    })

    it('should handle multiple projectiles', () => {
      system.fire({ x: 0, y: 0, dirX: 1, dirY: 0 })
      system.fire({ x: 0, y: 0, dirX: 0, dirY: 1 })
      system.fire({ x: 0, y: 0, dirX: -1, dirY: 0 })

      expect(system.getActiveProjectiles()).toHaveLength(3)
    })
  })

  describe('update', () => {
    it('should move projectile based on direction and speed', () => {
      system.fire({
        x: 0,
        y: 0,
        dirX: 1,
        dirY: 0,
        speed: 100,
        range: 1000
      })

      system.update(0.5) // 0.5 seconds

      const projectiles = system.getActiveProjectiles()
      expect(projectiles[0].x).toBe(50) // 100 speed * 0.5 sec = 50
      expect(projectiles[0].y).toBe(0)
    })

    it('should track distance traveled', () => {
      system.fire({
        x: 0,
        y: 0,
        dirX: 1,
        dirY: 0,
        speed: 100,
        range: 1000
      })

      system.update(0.5)

      const projectiles = system.getActiveProjectiles()
      expect(projectiles[0].distanceTraveled).toBe(50)
    })

    it('should release projectile when range exceeded', () => {
      system.fire({
        x: 0,
        y: 0,
        dirX: 1,
        dirY: 0,
        speed: 100,
        range: 50
      })

      system.update(1) // Move 100 units, exceeds range of 50

      expect(system.getActiveProjectiles()).toHaveLength(0)
      expect(pool.activeCount).toBe(0)
    })

    it('should add position to trail history', () => {
      system.fire({
        x: 0,
        y: 0,
        dirX: 1,
        dirY: 0,
        speed: 100,
        range: 1000
      })

      system.update(0.1)
      system.update(0.1)

      const projectiles = system.getActiveProjectiles()
      expect(projectiles[0].trail.length).toBeGreaterThan(0)
    })

    it('should limit trail length', () => {
      system.fire({
        x: 0,
        y: 0,
        dirX: 1,
        dirY: 0,
        speed: 100,
        range: 10000
      })

      // Update many times to accumulate trail
      for (let i = 0; i < 50; i++) {
        system.update(0.016)
      }

      const projectiles = system.getActiveProjectiles()
      expect(projectiles[0].trail.length).toBeLessThanOrEqual(10)
    })
  })

  describe('checkCollisions', () => {
    it('should emit hit event when projectile collides with target', () => {
      const hitHandler = vi.fn()
      system.event.on('hit', hitHandler)

      system.fire({
        x: 100,
        y: 100,
        dirX: 1,
        dirY: 0,
        speed: 100,
        damage: 10,
        range: 200,
        owner: 'player'
      })

      const targets = [{
        position: [120, 100],
        radius: 20,
        alive: true
      }]

      system.checkCollisions(targets, 'player')

      expect(hitHandler).toHaveBeenCalledWith(expect.objectContaining({
        damage: 10
      }))
    })

    it('should release non-piercing projectile on hit', () => {
      system.fire({
        x: 100,
        y: 100,
        dirX: 1,
        dirY: 0,
        piercing: false,
        owner: 'player'
      })

      const targets = [{
        position: [110, 100],
        radius: 20,
        alive: true
      }]

      system.checkCollisions(targets, 'player')

      expect(system.getActiveProjectiles()).toHaveLength(0)
    })

    it('should not release piercing projectile on hit', () => {
      system.fire({
        x: 100,
        y: 100,
        dirX: 1,
        dirY: 0,
        piercing: true,
        owner: 'player'
      })

      const targets = [{
        position: [110, 100],
        radius: 20,
        alive: true
      }]

      system.checkCollisions(targets, 'player')

      expect(system.getActiveProjectiles()).toHaveLength(1)
    })

    it('should not collide with projectiles from same owner type', () => {
      const hitHandler = vi.fn()
      system.event.on('hit', hitHandler)

      system.fire({
        x: 100,
        y: 100,
        dirX: 1,
        dirY: 0,
        owner: 'player'
      })

      const targets = [{
        position: [110, 100],
        radius: 20,
        alive: true
      }]

      // Check collisions filtering by enemy owner - should not hit
      system.checkCollisions(targets, 'enemy')

      expect(hitHandler).not.toHaveBeenCalled()
    })

    it('should not hit dead targets', () => {
      const hitHandler = vi.fn()
      system.event.on('hit', hitHandler)

      system.fire({
        x: 100,
        y: 100,
        dirX: 1,
        dirY: 0,
        owner: 'player'
      })

      const targets = [{
        position: [110, 100],
        radius: 20,
        alive: false
      }]

      system.checkCollisions(targets, 'player')

      expect(hitHandler).not.toHaveBeenCalled()
    })
  })

  describe('getActiveProjectiles', () => {
    it('should return shallow copy of active projectiles', () => {
      system.fire({ x: 0, y: 0, dirX: 1, dirY: 0 })

      const result1 = system.getActiveProjectiles()
      const result2 = system.getActiveProjectiles()

      expect(result1).not.toBe(result2)
      expect(result1).toEqual(result2)
    })
  })
})
