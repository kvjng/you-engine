import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Equipment } from '../scripts/components/equipment.js'

describe('Equipment', () => {
  let equipment

  beforeEach(() => {
    equipment = new Equipment()
  })

  describe('initialization', () => {
    it('should have three empty slots', () => {
      expect(equipment.getSlot('weapon')).toBeNull()
      expect(equipment.getSlot('armor')).toBeNull()
      expect(equipment.getSlot('accessory')).toBeNull()
    })

    it('should return null for unknown slot', () => {
      expect(equipment.getSlot('unknown')).toBeNull()
    })
  })

  describe('equip', () => {
    it('should equip item to correct slot', () => {
      const weapon = { id: 'sword_wood', slot: 'weapon', stats: { attack: 5 } }
      const result = equipment.equip(weapon)

      expect(result.success).toBe(true)
      expect(result.unequipped).toBeNull()
      expect(equipment.getSlot('weapon')).toEqual(weapon)
    })

    it('should return unequipped item when replacing', () => {
      const sword1 = { id: 'sword_wood', slot: 'weapon', stats: { attack: 5 } }
      const sword2 = { id: 'sword_iron', slot: 'weapon', stats: { attack: 10 } }

      equipment.equip(sword1)
      const result = equipment.equip(sword2)

      expect(result.success).toBe(true)
      expect(result.unequipped).toEqual(sword1)
      expect(equipment.getSlot('weapon')).toEqual(sword2)
    })

    it('should fail for invalid slot', () => {
      const item = { id: 'item', slot: 'invalid', stats: {} }
      const result = equipment.equip(item)

      expect(result.success).toBe(false)
      expect(result.unequipped).toBeNull()
    })

    it('should emit equipped event', () => {
      const onEquipped = vi.fn()
      equipment.event.on('equipped', onEquipped)

      const weapon = { id: 'sword', slot: 'weapon', stats: { attack: 5 } }
      equipment.equip(weapon)

      expect(onEquipped).toHaveBeenCalledWith('weapon', weapon, null)
    })

    it('should emit equipped event with previous item', () => {
      const sword1 = { id: 'sword1', slot: 'weapon', stats: { attack: 5 } }
      const sword2 = { id: 'sword2', slot: 'weapon', stats: { attack: 10 } }

      equipment.equip(sword1)

      const onEquipped = vi.fn()
      equipment.event.on('equipped', onEquipped)

      equipment.equip(sword2)

      expect(onEquipped).toHaveBeenCalledWith('weapon', sword2, sword1)
    })
  })

  describe('unequip', () => {
    it('should unequip item', () => {
      const weapon = { id: 'sword_wood', slot: 'weapon', stats: { attack: 5 } }
      equipment.equip(weapon)

      const unequipped = equipment.unequip('weapon')

      expect(unequipped).toEqual(weapon)
      expect(equipment.getSlot('weapon')).toBeNull()
    })

    it('should return null when slot is empty', () => {
      const unequipped = equipment.unequip('weapon')
      expect(unequipped).toBeNull()
    })

    it('should return null for invalid slot', () => {
      const unequipped = equipment.unequip('invalid')
      expect(unequipped).toBeNull()
    })

    it('should emit unequipped event', () => {
      const weapon = { id: 'sword', slot: 'weapon', stats: { attack: 5 } }
      equipment.equip(weapon)

      const onUnequipped = vi.fn()
      equipment.event.on('unequipped', onUnequipped)

      equipment.unequip('weapon')

      expect(onUnequipped).toHaveBeenCalledWith('weapon', weapon)
    })

    it('should not emit event when slot is empty', () => {
      const onUnequipped = vi.fn()
      equipment.event.on('unequipped', onUnequipped)

      equipment.unequip('weapon')

      expect(onUnequipped).not.toHaveBeenCalled()
    })
  })

  describe('getTotalBonus', () => {
    it('should return empty bonus when nothing equipped', () => {
      const bonus = equipment.getTotalBonus()
      expect(bonus).toEqual({})
    })

    it('should calculate single item bonus', () => {
      const weapon = { id: 'sword', slot: 'weapon', stats: { attack: 10 } }
      equipment.equip(weapon)

      const bonus = equipment.getTotalBonus()
      expect(bonus.attack).toBe(10)
    })

    it('should sum bonuses from all equipped items', () => {
      const weapon = { id: 'sword', slot: 'weapon', stats: { attack: 10 } }
      const armor = { id: 'armor', slot: 'armor', stats: { defense: 5 } }
      const accessory = { id: 'ring', slot: 'accessory', stats: { maxHpBonus: 20 } }

      equipment.equip(weapon)
      equipment.equip(armor)
      equipment.equip(accessory)

      const bonus = equipment.getTotalBonus()
      expect(bonus.attack).toBe(10)
      expect(bonus.defense).toBe(5)
      expect(bonus.maxHpBonus).toBe(20)
    })

    it('should sum same stat from multiple items', () => {
      const weapon = { id: 'sword', slot: 'weapon', stats: { attack: 10, defense: 2 } }
      const armor = { id: 'armor', slot: 'armor', stats: { defense: 5, attack: 3 } }

      equipment.equip(weapon)
      equipment.equip(armor)

      const bonus = equipment.getTotalBonus()
      expect(bonus.attack).toBe(13)
      expect(bonus.defense).toBe(7)
    })

    it('should handle items without stats', () => {
      const weapon = { id: 'sword', slot: 'weapon' }
      equipment.equip(weapon)

      const bonus = equipment.getTotalBonus()
      expect(bonus).toEqual({})
    })
  })

  describe('getEquippedItems', () => {
    it('should return copy of slots', () => {
      const weapon = { id: 'sword', slot: 'weapon', stats: { attack: 10 } }
      equipment.equip(weapon)

      const items = equipment.getEquippedItems()
      items.weapon = null

      expect(equipment.getSlot('weapon')).toEqual(weapon)
    })

    it('should return all slot states', () => {
      const weapon = { id: 'sword', slot: 'weapon', stats: {} }
      equipment.equip(weapon)

      const items = equipment.getEquippedItems()
      expect(items).toEqual({
        weapon: weapon,
        armor: null,
        accessory: null
      })
    })
  })

  describe('isSlotEmpty', () => {
    it('should return true for empty slot', () => {
      expect(equipment.isSlotEmpty('weapon')).toBe(true)
    })

    it('should return false for equipped slot', () => {
      const weapon = { id: 'sword', slot: 'weapon', stats: {} }
      equipment.equip(weapon)

      expect(equipment.isSlotEmpty('weapon')).toBe(false)
    })
  })
})
