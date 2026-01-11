import { Component } from '../../../../you/component.js'
import { EventEmitter } from '../../../../you/utilities/event.js'

export class Stats extends Component {
  constructor({
    maxHp = 100,
    hp = null,
    attack = 10,
    defense = 5,
    level = 1,
    exp = 0
  } = {}) {
    super()
    this.baseMaxHp = maxHp
    this._hp = hp ?? maxHp
    this.baseAttack = attack
    this.baseDefense = defense
    this.level = level
    this.exp = exp
    this._equipmentBonus = {}
    this.event = new EventEmitter(this)
  }

  // 하위 호환성을 위한 getter
  get maxHp() { return this.totalMaxHp }
  get attack() { return this.baseAttack }
  get defense() { return this.baseDefense }

  get totalMaxHp() {
    return this.baseMaxHp + (this._equipmentBonus.maxHpBonus || 0)
  }

  get totalAttack() {
    return this.baseAttack + (this._equipmentBonus.attack || 0)
  }

  get totalDefense() {
    return this.baseDefense + (this._equipmentBonus.defense || 0)
  }

  get speedMultiplier() {
    return 1 + (this._equipmentBonus.speedBonus || 0)
  }

  get hp() { return this._hp }

  set hp(value) {
    const prev = this._hp
    this._hp = Math.max(0, Math.min(this.totalMaxHp, value))
    if (this._hp !== prev) {
      this.event.emit('hpChange', this._hp, prev)
    }
    if (this._hp <= 0 && prev > 0) {
      this.event.emit('death')
    }
  }

  get alive() { return this._hp > 0 }

  setEquipmentBonus(bonus) {
    this._equipmentBonus = bonus
    // HP가 새 maxHp를 초과하면 조정
    if (this._hp > this.totalMaxHp) {
      this._hp = this.totalMaxHp
    }
    this.event.emit('bonusChanged', bonus)
  }

  takeDamage(amount, attacker = null) {
    const damage = Math.max(1, amount - this.totalDefense)
    this.hp -= damage
    this.event.emit('damage', damage, attacker)
    return damage
  }

  heal(amount) {
    const healed = Math.min(amount, this.totalMaxHp - this._hp)
    this.hp += healed
    this.event.emit('heal', healed)
    return healed
  }

  addExp(amount) {
    this.exp += amount
    const expToLevel = this.level * 100
    if (this.exp >= expToLevel) {
      this.exp -= expToLevel
      this.levelUp()
    }
  }

  levelUp() {
    this.level++
    this.baseMaxHp += 10
    this.baseAttack += 2
    this.baseDefense += 1
    this.hp = this.totalMaxHp
    this.event.emit('levelUp', this.level)
  }
}
