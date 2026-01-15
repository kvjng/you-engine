import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Stats } from '../scripts/components/stats.js'

describe('Stats with Equipment Bonus', () => {
  let stats

  beforeEach(() => {
    stats = new Stats({ maxHp: 100, attack: 10, defense: 5 })
  })

  describe('equipment bonus application', () => {
    it('should apply equipment bonus to attack', () => {
      stats.setEquipmentBonus({ attack: 5 })
      expect(stats.totalAttack).toBe(15)
    })

    it('should apply equipment bonus to defense', () => {
      stats.setEquipmentBonus({ defense: 3 })
      expect(stats.totalDefense).toBe(8)
    })

    it('should apply maxHpBonus', () => {
      stats.setEquipmentBonus({ maxHpBonus: 20 })
      expect(stats.totalMaxHp).toBe(120)
    })

    it('should apply speedBonus', () => {
      stats.setEquipmentBonus({ speedBonus: 0.1 })
      expect(stats.speedMultiplier).toBeCloseTo(1.1)
    })

    it('should apply multiple bonuses at once', () => {
      stats.setEquipmentBonus({
        attack: 5,
        defense: 3,
        maxHpBonus: 20,
        speedBonus: 0.15
      })

      expect(stats.totalAttack).toBe(15)
      expect(stats.totalDefense).toBe(8)
      expect(stats.totalMaxHp).toBe(120)
      expect(stats.speedMultiplier).toBeCloseTo(1.15)
    })
  })

  describe('bonus updates', () => {
    it('should update when bonus changes', () => {
      stats.setEquipmentBonus({ attack: 5 })
      expect(stats.totalAttack).toBe(15)

      stats.setEquipmentBonus({ attack: 10 })
      expect(stats.totalAttack).toBe(20)
    })

    it('should reset bonus when set to empty', () => {
      stats.setEquipmentBonus({ attack: 5 })
      stats.setEquipmentBonus({})

      expect(stats.totalAttack).toBe(10)
    })

    it('should emit bonusChanged event', () => {
      const onBonusChanged = vi.fn()
      stats.event.on('bonusChanged', onBonusChanged)

      const bonus = { attack: 5 }
      stats.setEquipmentBonus(bonus)

      expect(onBonusChanged).toHaveBeenCalledWith(bonus)
    })
  })

  describe('HP adjustment with maxHpBonus', () => {
    it('should clamp HP when maxHpBonus is removed', () => {
      stats.setEquipmentBonus({ maxHpBonus: 50 })
      stats.hp = 140 // above base maxHp

      stats.setEquipmentBonus({}) // remove bonus

      expect(stats.hp).toBe(100) // should be clamped to new max
    })

    it('should keep HP unchanged when still within new max', () => {
      stats.hp = 80
      stats.setEquipmentBonus({ maxHpBonus: 50 })
      stats.setEquipmentBonus({})

      expect(stats.hp).toBe(80)
    })

    it('should use totalMaxHp for heal calculation', () => {
      stats.hp = 50
      stats.setEquipmentBonus({ maxHpBonus: 50 })

      const healed = stats.heal(200)

      expect(stats.hp).toBe(150) // totalMaxHp
      expect(healed).toBe(100)
    })
  })

  describe('damage calculation with equipment', () => {
    it('should use totalDefense in takeDamage', () => {
      stats.setEquipmentBonus({ defense: 5 })

      const damage = stats.takeDamage(20)

      // 20 - (5 base + 5 bonus) = 10
      expect(damage).toBe(10)
      expect(stats.hp).toBe(90)
    })

    it('should deal minimum 1 damage', () => {
      stats.setEquipmentBonus({ defense: 100 })

      const damage = stats.takeDamage(20)

      expect(damage).toBe(1)
      expect(stats.hp).toBe(99)
    })
  })

  describe('backward compatibility', () => {
    it('should maintain maxHp getter', () => {
      stats.setEquipmentBonus({ maxHpBonus: 20 })
      expect(stats.maxHp).toBe(120)
    })

    it('should maintain attack getter returning base value', () => {
      stats.setEquipmentBonus({ attack: 5 })
      expect(stats.attack).toBe(10) // base only
      expect(stats.totalAttack).toBe(15) // with bonus
    })

    it('should maintain defense getter returning base value', () => {
      stats.setEquipmentBonus({ defense: 3 })
      expect(stats.defense).toBe(5) // base only
      expect(stats.totalDefense).toBe(8) // with bonus
    })
  })

  describe('default values', () => {
    it('should have default speedMultiplier of 1', () => {
      expect(stats.speedMultiplier).toBe(1)
    })

    it('should have totalAttack equal to baseAttack without bonus', () => {
      expect(stats.totalAttack).toBe(stats.baseAttack)
    })

    it('should have totalDefense equal to baseDefense without bonus', () => {
      expect(stats.totalDefense).toBe(stats.baseDefense)
    })

    it('should have totalMaxHp equal to baseMaxHp without bonus', () => {
      expect(stats.totalMaxHp).toBe(stats.baseMaxHp)
    })
  })

  describe('level up with equipment', () => {
    it('should restore HP to totalMaxHp on level up', () => {
      stats.setEquipmentBonus({ maxHpBonus: 50 })
      stats.hp = 50
      stats.addExp(100)

      // After level up: baseMaxHp = 110, totalMaxHp = 160
      expect(stats.hp).toBe(160)
    })

    it('should increase base stats on level up', () => {
      stats.setEquipmentBonus({ attack: 5, defense: 3 })
      stats.addExp(100)

      // Base increased: attack 12, defense 6
      // Total: attack 17, defense 9
      expect(stats.totalAttack).toBe(17)
      expect(stats.totalDefense).toBe(9)
    })
  })
})
