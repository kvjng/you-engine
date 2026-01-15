import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Inventory } from '../scripts/components/inventory.js'

describe('Inventory', () => {
  let inventory

  beforeEach(() => {
    inventory = new Inventory({ maxSlots: 10 })
  })

  describe('initialization', () => {
    it('should initialize with correct slot count', () => {
      expect(inventory.maxSlots).toBe(10)
      expect(inventory.usedSlots).toBe(0)
    })

    it('should initialize with default values', () => {
      const defaultInventory = new Inventory()
      expect(defaultInventory.maxSlots).toBe(10)
      expect(defaultInventory.maxCapacity).toBe(30)
    })

    it('should not be full when empty', () => {
      expect(inventory.isFull).toBe(false)
    })

    it('should return empty slots array', () => {
      expect(inventory.slots).toEqual([])
    })
  })

  describe('addItem - non-stackable', () => {
    it('should add non-stackable item', () => {
      const result = inventory.addItem('sword_wood', 1, { stackable: false })
      expect(result).toBe(true)
      expect(inventory.usedSlots).toBe(1)
    })

    it('should return false when inventory is full', () => {
      for (let i = 0; i < 10; i++) {
        inventory.addItem(`item${i}`, 1, { stackable: false })
      }
      const result = inventory.addItem('extra', 1, { stackable: false })
      expect(result).toBe(false)
      expect(inventory.usedSlots).toBe(10)
    })

    it('should emit itemAdded event', () => {
      const onItemAdded = vi.fn()
      inventory.event.on('itemAdded', onItemAdded)

      inventory.addItem('sword', 1, { stackable: false })

      expect(onItemAdded).toHaveBeenCalledWith('sword', 1)
    })
  })

  describe('addItem - stackable', () => {
    it('should add stackable items to same slot', () => {
      inventory.addItem('potion', 5, { stackable: true, maxStack: 99 })
      inventory.addItem('potion', 3, { stackable: true, maxStack: 99 })

      const slot = inventory.findItem('potion')
      expect(slot.count).toBe(8)
      expect(inventory.usedSlots).toBe(1)
    })

    it('should respect max stack', () => {
      inventory.addItem('potion', 99, { stackable: true, maxStack: 99 })
      inventory.addItem('potion', 10, { stackable: true, maxStack: 99 })

      expect(inventory.usedSlots).toBe(2)
      expect(inventory.getItemCount('potion')).toBe(109)
    })

    it('should fill existing stacks before creating new ones', () => {
      inventory.addItem('potion', 50, { stackable: true, maxStack: 99 })
      inventory.addItem('potion', 30, { stackable: true, maxStack: 99 })

      expect(inventory.usedSlots).toBe(1)
      expect(inventory.getSlotAt(0).count).toBe(80)
    })

    it('should emit itemAdded with actual added count', () => {
      const onItemAdded = vi.fn()
      inventory.event.on('itemAdded', onItemAdded)

      inventory.addItem('potion', 5, { stackable: true, maxStack: 99 })

      expect(onItemAdded).toHaveBeenCalledWith('potion', 5)
    })
  })

  describe('removeItem', () => {
    it('should remove item and return removed count', () => {
      inventory.addItem('potion', 5, { stackable: true, maxStack: 99 })
      const removed = inventory.removeItem('potion', 3)

      expect(removed).toBe(3)
      const slot = inventory.findItem('potion')
      expect(slot.count).toBe(2)
    })

    it('should remove slot when count reaches zero', () => {
      inventory.addItem('potion', 5, { stackable: true, maxStack: 99 })
      inventory.removeItem('potion', 5)

      expect(inventory.usedSlots).toBe(0)
      expect(inventory.findItem('potion')).toBeNull()
    })

    it('should return 0 when item not found', () => {
      const removed = inventory.removeItem('unknown', 1)
      expect(removed).toBe(0)
    })

    it('should emit itemRemoved event', () => {
      const onItemRemoved = vi.fn()
      inventory.event.on('itemRemoved', onItemRemoved)

      inventory.addItem('potion', 5, { stackable: true, maxStack: 99 })
      inventory.removeItem('potion', 3)

      expect(onItemRemoved).toHaveBeenCalledWith('potion', 3)
    })

    it('should only remove available amount', () => {
      inventory.addItem('potion', 5, { stackable: true, maxStack: 99 })
      const removed = inventory.removeItem('potion', 10)

      expect(removed).toBe(5)
      expect(inventory.usedSlots).toBe(0)
    })
  })

  describe('findItem', () => {
    it('should find existing item', () => {
      inventory.addItem('sword', 1, { stackable: false, name: 'Sword' })
      const slot = inventory.findItem('sword')

      expect(slot).not.toBeNull()
      expect(slot.itemId).toBe('sword')
    })

    it('should return null for unknown item', () => {
      expect(inventory.findItem('unknown')).toBeNull()
    })
  })

  describe('getItemCount', () => {
    it('should return total count across all slots', () => {
      inventory.addItem('potion', 99, { stackable: true, maxStack: 99 })
      inventory.addItem('potion', 50, { stackable: true, maxStack: 99 })

      expect(inventory.getItemCount('potion')).toBe(149)
    })

    it('should return 0 for unknown item', () => {
      expect(inventory.getItemCount('unknown')).toBe(0)
    })
  })

  describe('getSlotAt', () => {
    it('should return slot at index', () => {
      inventory.addItem('sword', 1, { stackable: false })
      inventory.addItem('shield', 1, { stackable: false })

      expect(inventory.getSlotAt(0).itemId).toBe('sword')
      expect(inventory.getSlotAt(1).itemId).toBe('shield')
    })

    it('should return null for invalid index', () => {
      expect(inventory.getSlotAt(99)).toBeNull()
    })
  })

  describe('expandSlots', () => {
    it('should expand max slots', () => {
      inventory.expandSlots(5)
      expect(inventory.maxSlots).toBe(15)
    })

    it('should not expand beyond max capacity', () => {
      inventory.expandSlots(100)
      expect(inventory.maxSlots).toBe(30)
    })

    it('should emit slotsExpanded event', () => {
      const onExpanded = vi.fn()
      inventory.event.on('slotsExpanded', onExpanded)

      inventory.expandSlots(5)

      expect(onExpanded).toHaveBeenCalledWith(15)
    })
  })

  describe('hasItem', () => {
    it('should return true for existing item', () => {
      inventory.addItem('sword', 1, { stackable: false })
      expect(inventory.hasItem('sword')).toBe(true)
    })

    it('should return false for non-existing item', () => {
      expect(inventory.hasItem('unknown')).toBe(false)
    })
  })

  describe('slots getter', () => {
    it('should return a copy of slots array', () => {
      inventory.addItem('sword', 1, { stackable: false })
      const slots = inventory.slots
      slots.push({ itemId: 'fake', count: 1 })

      expect(inventory.usedSlots).toBe(1)
    })
  })
})
