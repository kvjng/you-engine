import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FieldItemBehavior } from '../scripts/components/field-item-behavior.js'

describe('FieldItemBehavior', () => {
  let behavior

  beforeEach(() => {
    behavior = new FieldItemBehavior({
      lifetime: 30,
      magnetRange: 50,
      magnetSpeed: 200,
      pickupRange: 20
    })
    // Mock object
    behavior.object = {
      position: [100, 100]
    }
  })

  describe('initialization', () => {
    it('should initialize with provided values', () => {
      expect(behavior.lifetime).toBe(30)
      expect(behavior.remainingTime).toBe(30)
      expect(behavior.magnetRange).toBe(50)
      expect(behavior.magnetSpeed).toBe(200)
      expect(behavior.pickupRange).toBe(20)
    })

    it('should initialize with default values', () => {
      const defaultBehavior = new FieldItemBehavior()
      expect(defaultBehavior.lifetime).toBe(30)
      expect(defaultBehavior.magnetRange).toBe(50)
      expect(defaultBehavior.magnetSpeed).toBe(200)
      expect(defaultBehavior.pickupRange).toBe(20)
    })
  })

  describe('lifetime', () => {
    it('should decrease remaining time over time', () => {
      behavior.didUpdate(1)
      expect(behavior.remainingTime).toBe(29)
    })

    it('should emit expired event when lifetime ends', () => {
      const onExpire = vi.fn()
      behavior.event.on('expired', onExpire)

      behavior.didUpdate(30)

      expect(onExpire).toHaveBeenCalled()
    })

    it('should emit expired when remaining time goes below zero', () => {
      const onExpire = vi.fn()
      behavior.event.on('expired', onExpire)

      behavior.didUpdate(35)

      expect(onExpire).toHaveBeenCalled()
    })
  })

  describe('magnet behavior', () => {
    it('should move toward target when in magnet range', () => {
      const target = { position: [140, 100] } // 40 units away on X axis (within magnet range 50, outside pickup range 20)
      behavior.setTarget(target)

      const initialX = behavior.object.position[0]
      behavior.didUpdate(0.1)

      expect(behavior.object.position[0]).toBeGreaterThan(initialX)
    })

    it('should not move when target is outside magnet range', () => {
      const target = { position: [200, 200] } // far away
      behavior.setTarget(target)

      const initialX = behavior.object.position[0]
      const initialY = behavior.object.position[1]
      behavior.didUpdate(0.1)

      expect(behavior.object.position[0]).toBe(initialX)
      expect(behavior.object.position[1]).toBe(initialY)
    })

    it('should not move when no target is set', () => {
      const initialX = behavior.object.position[0]
      const initialY = behavior.object.position[1]
      behavior.didUpdate(0.1)

      expect(behavior.object.position[0]).toBe(initialX)
      expect(behavior.object.position[1]).toBe(initialY)
    })

    it('should move at correct speed', () => {
      // Target is exactly 50 units away (at magnet range edge)
      const target = { position: [150, 100] }
      behavior.setTarget(target)

      behavior.didUpdate(0.1)

      // Should move 200 * 0.1 = 20 units toward target (only X direction)
      expect(behavior.object.position[0]).toBeCloseTo(120, 1)
      expect(behavior.object.position[1]).toBe(100)
    })
  })

  describe('pickup behavior', () => {
    it('should emit pickup event when in pickup range', () => {
      const onPickup = vi.fn()
      behavior.event.on('pickup', onPickup)

      const target = { position: [110, 100] } // 10 units away, within pickupRange (20)
      behavior.setTarget(target)
      behavior.didUpdate(0.1)

      expect(onPickup).toHaveBeenCalled()
    })

    it('should not emit pickup when outside pickup range', () => {
      const onPickup = vi.fn()
      behavior.event.on('pickup', onPickup)

      const target = { position: [130, 100] } // 30 units away, outside pickupRange (20)
      behavior.setTarget(target)
      behavior.didUpdate(0.1)

      expect(onPickup).not.toHaveBeenCalled()
    })

    it('should stop updating after pickup', () => {
      const onPickup = vi.fn()
      behavior.event.on('pickup', onPickup)

      const target = { position: [110, 100] }
      behavior.setTarget(target)

      behavior.didUpdate(0.1) // Should trigger pickup
      const timeAfterPickup = behavior.remainingTime

      behavior.didUpdate(1) // Should not decrease time

      expect(behavior.remainingTime).toBe(timeAfterPickup)
      expect(onPickup).toHaveBeenCalledTimes(1)
    })

    it('should emit pickup at exact pickup range boundary', () => {
      const onPickup = vi.fn()
      behavior.event.on('pickup', onPickup)

      const target = { position: [120, 100] } // exactly 20 units away
      behavior.setTarget(target)
      behavior.didUpdate(0.1)

      expect(onPickup).toHaveBeenCalled()
    })
  })

  describe('setTarget', () => {
    it('should set target', () => {
      const target = { position: [150, 150] }
      behavior.setTarget(target)

      expect(behavior._target).toBe(target)
    })

    it('should allow changing target', () => {
      const target1 = { position: [150, 150] }
      const target2 = { position: [200, 200] }

      behavior.setTarget(target1)
      behavior.setTarget(target2)

      expect(behavior._target).toBe(target2)
    })
  })

  describe('diagonal movement', () => {
    it('should move diagonally toward target', () => {
      // Target is 30 units away diagonally (within magnet range of 50)
      const target = { position: [130, 130] } // ~42.4 units away
      behavior.setTarget(target)

      const initialX = behavior.object.position[0]
      const initialY = behavior.object.position[1]

      behavior.didUpdate(0.1)

      // Both X and Y should increase
      expect(behavior.object.position[0]).toBeGreaterThan(initialX)
      expect(behavior.object.position[1]).toBeGreaterThan(initialY)
    })
  })
})
