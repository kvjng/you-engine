import { Component } from '../../../../you/component.js'
import { Stats } from './stats.js'
import { Equipment } from './equipment.js'
import { EventEmitter } from '../../../../you/utilities/event.js'

export class AttackController extends Component {
  constructor({
    baseRange = 50,
    baseCooldown = 0.5
  } = {}) {
    super()
    this.baseRange = baseRange
    this.baseCooldown = baseCooldown
    this._cooldownTimer = 0
    this._attacking = false
    this._attackDuration = 0.15
    this._attackTimer = 0
    this._facingDirection = [1, 0] // 기본 오른쪽
    this.event = new EventEmitter(this)
  }

  get range() {
    const equipment = this.object.findComponent(Equipment)
    const weapon = equipment?.getSlot('weapon')
    return weapon?.range || this.baseRange
  }

  get cooldown() {
    return this.baseCooldown
  }

  get attackType() {
    const equipment = this.object.findComponent(Equipment)
    const weapon = equipment?.getSlot('weapon')
    return weapon?.attackType || 'melee'
  }

  get weaponData() {
    const equipment = this.object.findComponent(Equipment)
    return equipment?.getSlot('weapon')
  }

  get canAttack() { return this._cooldownTimer <= 0 }
  get attacking() { return this._attacking }

  get facingDirection() { return this._facingDirection }

  setFacingDirection(dirX, dirY) {
    const length = Math.sqrt(dirX * dirX + dirY * dirY)
    if (length > 0) {
      this._facingDirection = [dirX / length, dirY / length]
    }
  }

  attack(targets) {
    if (!this.canAttack) return []

    this._cooldownTimer = this.cooldown
    this._attacking = true
    this._attackTimer = this._attackDuration

    const stats = this.object.findComponent(Stats)

    // 원거리 무기는 투사체 발사 정보 반환
    if (this.attackType === 'ranged') {
      return this.prepareRangedAttack(stats)
    }

    // 근접 공격
    return this.performMeleeAttack(targets, stats)
  }

  performMeleeAttack(targets, stats) {
    const pos = this.object.position
    const hits = []

    for (const target of targets) {
      const targetPos = target.position
      const dx = targetPos[0] - pos[0]
      const dy = targetPos[1] - pos[1]
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance <= this.range) {
        const targetStats = target.findComponent(Stats)
        if (targetStats && targetStats.alive) {
          const damage = targetStats.takeDamage(stats.totalAttack)
          hits.push({ target, damage })
        }
      }
    }

    return hits
  }

  prepareRangedAttack(stats) {
    const weapon = this.weaponData
    const pos = this.object.position
    const dir = this._facingDirection

    const baseConfig = {
      x: pos[0],
      y: pos[1],
      damage: stats.totalAttack,
      speed: weapon?.projectileSpeed || 300,
      range: this.range,
      piercing: weapon?.projectile?.piercing || false,
      owner: this.object.tags?.has('player') ? 'player' : 'enemy',
      size: weapon?.projectile?.size || 8,
      color: weapon?.projectile?.color || '#ffff44'
    }

    const projectileConfigs = []
    const count = weapon?.projectileCount || 1
    const spreadAngle = (weapon?.projectile?.spreadAngle || 15) * Math.PI / 180

    if (count === 1) {
      projectileConfigs.push({ ...baseConfig, dirX: dir[0], dirY: dir[1] })
    } else {
      const startAngle = -spreadAngle * (count - 1) / 2
      const baseAngle = Math.atan2(dir[1], dir[0])
      for (let i = 0; i < count; i++) {
        const angle = baseAngle + startAngle + spreadAngle * i
        projectileConfigs.push({
          ...baseConfig,
          dirX: Math.cos(angle),
          dirY: Math.sin(angle)
        })
      }
    }

    this.event.emit('rangedAttack', projectileConfigs)
    return [{ type: 'ranged', projectiles: projectileConfigs }]
  }

  didUpdate(deltaTime) {
    if (this._cooldownTimer > 0) {
      this._cooldownTimer -= deltaTime
    }

    if (this._attacking) {
      this._attackTimer -= deltaTime
      if (this._attackTimer <= 0) {
        this._attacking = false
      }
    }
  }
}
