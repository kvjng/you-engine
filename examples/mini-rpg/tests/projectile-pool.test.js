import { describe, it, expect, beforeEach } from 'vitest'
import { ProjectilePool } from '../scripts/services/projectile-pool.js'

describe('ProjectilePool', () => {
  let pool

  beforeEach(() => {
    pool = new ProjectilePool({ maxSize: 10 })
  })

  describe('acquire', () => {
    it('should return a projectile object', () => {
      const projectile = pool.acquire()
      expect(projectile).toBeDefined()
      expect(projectile.active).toBe(true)
    })

    it('should initialize projectile with provided config', () => {
      const config = {
        x: 100,
        y: 200,
        dirX: 1,
        dirY: 0,
        speed: 300,
        damage: 10,
        range: 200,
        piercing: false,
        owner: 'player',
        size: 8,
        color: '#ffff00'
      }

      const projectile = pool.acquire(config)

      expect(projectile.x).toBe(100)
      expect(projectile.y).toBe(200)
      expect(projectile.dirX).toBe(1)
      expect(projectile.dirY).toBe(0)
      expect(projectile.speed).toBe(300)
      expect(projectile.damage).toBe(10)
      expect(projectile.range).toBe(200)
      expect(projectile.piercing).toBe(false)
      expect(projectile.owner).toBe('player')
      expect(projectile.size).toBe(8)
      expect(projectile.color).toBe('#ffff00')
      expect(projectile.distanceTraveled).toBe(0)
    })

    it('should track activeCount correctly', () => {
      expect(pool.activeCount).toBe(0)

      pool.acquire()
      expect(pool.activeCount).toBe(1)

      pool.acquire()
      expect(pool.activeCount).toBe(2)
    })

    it('should return null when pool is exhausted', () => {
      for (let i = 0; i < 10; i++) {
        pool.acquire()
      }

      const projectile = pool.acquire()
      expect(projectile).toBeNull()
    })
  })

  describe('release', () => {
    it('should deactivate projectile and return to pool', () => {
      const projectile = pool.acquire()
      expect(pool.activeCount).toBe(1)

      pool.release(projectile)
      expect(projectile.active).toBe(false)
      expect(pool.activeCount).toBe(0)
    })

    it('should allow reuse of released projectile', () => {
      const projectile1 = pool.acquire({ x: 100, y: 100 })
      pool.release(projectile1)

      const projectile2 = pool.acquire({ x: 200, y: 200 })
      expect(projectile2).toBe(projectile1) // Same object reused
      expect(projectile2.x).toBe(200)
      expect(projectile2.y).toBe(200)
    })
  })

  describe('getActiveProjectiles', () => {
    it('should return only active projectiles', () => {
      const p1 = pool.acquire()
      const p2 = pool.acquire()
      const p3 = pool.acquire()

      pool.release(p2)

      const active = pool.getActiveProjectiles()
      expect(active).toHaveLength(2)
      expect(active).toContain(p1)
      expect(active).toContain(p3)
      expect(active).not.toContain(p2)
    })
  })

  describe('releaseAll', () => {
    it('should release all active projectiles', () => {
      pool.acquire()
      pool.acquire()
      pool.acquire()

      expect(pool.activeCount).toBe(3)

      pool.releaseAll()
      expect(pool.activeCount).toBe(0)
    })
  })

  describe('trail history', () => {
    it('should initialize projectile with empty trail', () => {
      const projectile = pool.acquire()
      expect(projectile.trail).toEqual([])
    })

    it('should clear trail on release', () => {
      const projectile = pool.acquire()
      projectile.trail.push({ x: 0, y: 0 })
      projectile.trail.push({ x: 10, y: 10 })

      pool.release(projectile)
      expect(projectile.trail).toEqual([])
    })
  })
})
