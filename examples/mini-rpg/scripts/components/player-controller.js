import { Component } from '../../../../you/component.js'
import { Collider } from './collider.js'
import { Stats } from './stats.js'

export class PlayerController extends Component {
  constructor({ speed = 150, bounds = null, radius = 16 } = {}) {
    super()
    this.baseSpeed = speed
    this.direction = [0, 0]
    this.bounds = bounds // { minX, minY, maxX, maxY }
    this.radius = radius
  }

  get speed() {
    const stats = this.object?.findComponent(Stats)
    const multiplier = stats?.speedMultiplier || 1
    return this.baseSpeed * multiplier
  }

  setBounds(minX, minY, maxX, maxY) {
    this.bounds = { minX, minY, maxX, maxY }
  }

  // 충돌 검사: 타일맵 + 구조물 충돌 체크
  checkCollision(newX, newY, radius) {
    const scene = this.object.parent

    // 타일맵 충돌 체크
    if (scene.tilemap) {
      if (!scene.tilemap.isPassableCircle(newX, newY, radius)) {
        return true
      }
    }

    // 구조물 충돌 체크
    const structures = scene.objects.filter(obj => obj.tags.has('structure'))
    for (const structure of structures) {
      const collider = structure.findComponent(Collider)
      if (collider && collider.collidesWithCircle(newX, newY, radius)) {
        return true
      }
    }

    return false
  }

  didUpdate(deltaTime, events, input) {
    const dir = [0, 0]

    if (input.keys.has('w') || input.keys.has('ArrowUp')) dir[1] = -1
    if (input.keys.has('s') || input.keys.has('ArrowDown')) dir[1] = 1
    if (input.keys.has('a') || input.keys.has('ArrowLeft')) dir[0] = -1
    if (input.keys.has('d') || input.keys.has('ArrowRight')) dir[0] = 1

    // 대각선 이동 정규화
    const length = Math.sqrt(dir[0] * dir[0] + dir[1] * dir[1])
    if (length > 0) {
      dir[0] /= length
      dir[1] /= length
    }

    this.direction = dir

    const pos = this.object.position

    // X축 이동 시도 (슬라이딩)
    const newX = pos[0] + dir[0] * this.speed * deltaTime
    if (!this.checkCollision(newX, pos[1], this.radius)) {
      pos[0] = newX
    }

    // Y축 이동 시도 (슬라이딩)
    const newY = pos[1] + dir[1] * this.speed * deltaTime
    if (!this.checkCollision(pos[0], newY, this.radius)) {
      pos[1] = newY
    }

    // 경계 제한
    if (this.bounds) {
      const halfSize = this.radius
      pos[0] = Math.max(this.bounds.minX + halfSize, Math.min(this.bounds.maxX - halfSize, pos[0]))
      pos[1] = Math.max(this.bounds.minY + halfSize, Math.min(this.bounds.maxY - halfSize, pos[1]))
    }
  }
}
