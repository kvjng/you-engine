import { Component } from '../../../../you/component.js'
import { EventEmitter } from '../../../../you/utilities/event.js'

export class FieldItemBehavior extends Component {
  constructor({
    lifetime = 30,
    magnetRange = 50,
    magnetSpeed = 200,
    pickupRange = 20
  } = {}) {
    super()
    this.lifetime = lifetime
    this.remainingTime = lifetime
    this.magnetRange = magnetRange
    this.magnetSpeed = magnetSpeed
    this.pickupRange = pickupRange
    this._target = null
    this._pickedUp = false
    this.event = new EventEmitter(this)
  }

  setTarget(target) {
    this._target = target
  }

  didUpdate(deltaTime) {
    if (this._pickedUp) return

    // 수명 감소
    this.remainingTime -= deltaTime
    if (this.remainingTime <= 0) {
      this.event.emit('expired')
      return
    }

    // 타겟이 없으면 대기
    if (!this._target) return

    const pos = this.object.position
    const targetPos = this._target.position
    const dx = targetPos[0] - pos[0]
    const dy = targetPos[1] - pos[1]
    const distance = Math.sqrt(dx * dx + dy * dy)

    // 픽업 범위 내
    if (distance <= this.pickupRange) {
      this._pickedUp = true
      this.event.emit('pickup')
      return
    }

    // 마그넷 범위 내면 끌려감
    if (distance <= this.magnetRange) {
      const dirX = dx / distance
      const dirY = dy / distance
      pos[0] += dirX * this.magnetSpeed * deltaTime
      pos[1] += dirY * this.magnetSpeed * deltaTime
    }
  }
}
