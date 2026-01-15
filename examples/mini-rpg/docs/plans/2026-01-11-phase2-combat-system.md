# Phase 2: 전투 확장 (투사체/원거리/무기 스킬) 구현 계획서

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Mini RPG에 투사체 시스템, 원거리 무기, 무기 고유 스킬을 추가하여 전투 시스템 확장

**Architecture:**
- 투사체는 Projectile 오브젝트로 풀링하여 관리
- 플레이어와 몬스터 모두 Equipment 컴포넌트를 통해 무기 사용
- 무기 고유 스킬은 별도 키(Q)로 발동, 무기별 쿨다운 관리
- 투사체 속성(속도, 사거리, 관통)은 무기 데이터에서 정의

**Tech Stack:** you-engine (ES6 모듈), JSON 데이터 파일, Canvas 2D API

**설계 결정사항:**
- 몬스터 무기: Equipment 컴포넌트 공유 (플레이어와 동일한 방식)
- 스킬 발동: 별도 스킬키 (Q키)
- 투사체 관통: 무기별 관통 속성 (특정 무기만 관통 가능)
- 사정거리: 거리 기반 (발사 지점에서 일정 거리 이동 후 사라짐)
- 투사체 관리: 풀링 구현 (성능 최적화)
- 스킬 쿨다운: 무기별 쿨다운

**Phase 1 의존성:**
- Equipment 컴포넌트 (장비 장착/해제)
- Stats 컴포넌트 (장비 보너스 연동)
- AttackController (공격 타입 분기 기초)
- weapons.json (무기 데이터)

---

## Task 1: 투사체 풀 매니저 생성

**Files:**
- Create: `examples/mini-rpg/scripts/services/projectile-pool.js`
- Create: `examples/mini-rpg/tests/projectile-pool.test.js`

**Step 1: 테스트 파일 작성**

```javascript
// examples/mini-rpg/tests/projectile-pool.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProjectilePool } from '../scripts/services/projectile-pool.js'

describe('ProjectilePool', () => {
  let pool

  beforeEach(() => {
    pool = new ProjectilePool({ maxSize: 50 })
  })

  it('should initialize with max size', () => {
    expect(pool.maxSize).toBe(50)
    expect(pool.activeCount).toBe(0)
  })

  it('should acquire projectile from pool', () => {
    const projectile = pool.acquire({
      x: 100,
      y: 100,
      dirX: 1,
      dirY: 0,
      speed: 300,
      range: 200,
      damage: 10,
      owner: 'player'
    })

    expect(projectile).not.toBeNull()
    expect(pool.activeCount).toBe(1)
  })

  it('should release projectile back to pool', () => {
    const projectile = pool.acquire({
      x: 100, y: 100, dirX: 1, dirY: 0,
      speed: 300, range: 200, damage: 10, owner: 'player'
    })

    pool.release(projectile)

    expect(pool.activeCount).toBe(0)
  })

  it('should reuse released projectiles', () => {
    const p1 = pool.acquire({
      x: 100, y: 100, dirX: 1, dirY: 0,
      speed: 300, range: 200, damage: 10, owner: 'player'
    })
    pool.release(p1)

    const p2 = pool.acquire({
      x: 200, y: 200, dirX: 0, dirY: 1,
      speed: 300, range: 200, damage: 10, owner: 'player'
    })

    expect(p1).toBe(p2) // 같은 객체 재사용
    expect(p2.x).toBe(200)
  })

  it('should return null when pool is exhausted', () => {
    const smallPool = new ProjectilePool({ maxSize: 2 })

    smallPool.acquire({ x: 0, y: 0, dirX: 1, dirY: 0, speed: 100, range: 100, damage: 5, owner: 'p' })
    smallPool.acquire({ x: 0, y: 0, dirX: 1, dirY: 0, speed: 100, range: 100, damage: 5, owner: 'p' })
    const third = smallPool.acquire({ x: 0, y: 0, dirX: 1, dirY: 0, speed: 100, range: 100, damage: 5, owner: 'p' })

    expect(third).toBeNull()
  })

  it('should get all active projectiles', () => {
    pool.acquire({ x: 0, y: 0, dirX: 1, dirY: 0, speed: 100, range: 100, damage: 5, owner: 'p' })
    pool.acquire({ x: 0, y: 0, dirX: 1, dirY: 0, speed: 100, range: 100, damage: 5, owner: 'p' })

    const active = pool.getActiveProjectiles()
    expect(active.length).toBe(2)
  })
})
```

**Step 2: 테스트 실행 확인 (실패)**

```bash
pnpm test examples/mini-rpg/tests/projectile-pool.test.js
```

Expected: FAIL - module not found

**Step 3: ProjectilePool 클래스 작성**

```javascript
// examples/mini-rpg/scripts/services/projectile-pool.js

export class ProjectilePool {
  constructor({ maxSize = 100 } = {}) {
    this._maxSize = maxSize
    this._pool = []      // 사용 가능한 투사체
    this._active = []    // 활성 투사체
  }

  get maxSize() { return this._maxSize }
  get activeCount() { return this._active.length }

  acquire(config) {
    if (this._active.length >= this._maxSize) {
      return null
    }

    let projectile
    if (this._pool.length > 0) {
      projectile = this._pool.pop()
    } else {
      projectile = this._createProjectile()
    }

    this._initProjectile(projectile, config)
    this._active.push(projectile)

    return projectile
  }

  release(projectile) {
    const index = this._active.indexOf(projectile)
    if (index !== -1) {
      this._active.splice(index, 1)
      projectile.active = false
      this._pool.push(projectile)
    }
  }

  releaseAll() {
    while (this._active.length > 0) {
      this.release(this._active[0])
    }
  }

  getActiveProjectiles() {
    return this._active.slice()
  }

  _createProjectile() {
    return {
      x: 0,
      y: 0,
      startX: 0,
      startY: 0,
      dirX: 0,
      dirY: 0,
      speed: 0,
      range: 0,
      damage: 0,
      owner: null,
      piercing: false,
      hitTargets: null,
      active: false
    }
  }

  _initProjectile(projectile, config) {
    projectile.x = config.x
    projectile.y = config.y
    projectile.startX = config.x
    projectile.startY = config.y
    projectile.dirX = config.dirX
    projectile.dirY = config.dirY
    projectile.speed = config.speed
    projectile.range = config.range
    projectile.damage = config.damage
    projectile.owner = config.owner
    projectile.piercing = config.piercing || false
    projectile.hitTargets = new Set()
    projectile.active = true
  }
}
```

**Step 4: 테스트 실행 확인 (성공)**

```bash
pnpm test examples/mini-rpg/tests/projectile-pool.test.js
```

Expected: PASS

**Step 5: Commit**

```bash
git add examples/mini-rpg/
git commit -m "feat(mini-rpg): ProjectilePool 서비스 구현"
```

---

## Task 2: 투사체 시스템 컴포넌트 생성

**Files:**
- Create: `examples/mini-rpg/scripts/components/projectile-system.js`
- Create: `examples/mini-rpg/tests/projectile-system.test.js`

**Step 1: 테스트 파일 작성**

```javascript
// examples/mini-rpg/tests/projectile-system.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProjectileSystem } from '../scripts/components/projectile-system.js'
import { ProjectilePool } from '../scripts/services/projectile-pool.js'

describe('ProjectileSystem', () => {
  let system
  let pool

  beforeEach(() => {
    pool = new ProjectilePool({ maxSize: 50 })
    system = new ProjectileSystem({ pool })
  })

  it('should fire projectile', () => {
    system.fire({
      x: 100, y: 100,
      dirX: 1, dirY: 0,
      speed: 300, range: 200,
      damage: 10, owner: 'player'
    })

    expect(pool.activeCount).toBe(1)
  })

  it('should update projectile position', () => {
    system.fire({
      x: 100, y: 100,
      dirX: 1, dirY: 0,
      speed: 100, range: 200,
      damage: 10, owner: 'player'
    })

    system.update(1) // 1초

    const projectiles = pool.getActiveProjectiles()
    expect(projectiles[0].x).toBe(200) // 100 + 100 * 1
  })

  it('should release projectile when out of range', () => {
    system.fire({
      x: 100, y: 100,
      dirX: 1, dirY: 0,
      speed: 100, range: 50,
      damage: 10, owner: 'player'
    })

    system.update(1) // 1초 이동 = 100 거리, range 50 초과

    expect(pool.activeCount).toBe(0)
  })

  it('should detect collision with targets', () => {
    const onHit = vi.fn()
    system.event.on('hit', onHit)

    system.fire({
      x: 100, y: 100,
      dirX: 1, dirY: 0,
      speed: 100, range: 200,
      damage: 10, owner: 'player'
    })

    const targets = [
      { position: [120, 100], radius: 16 }
    ]

    system.checkCollisions(targets, 'player')

    expect(onHit).toHaveBeenCalled()
  })

  it('should not hit same owner', () => {
    const onHit = vi.fn()
    system.event.on('hit', onHit)

    system.fire({
      x: 100, y: 100,
      dirX: 1, dirY: 0,
      speed: 100, range: 200,
      damage: 10, owner: 'player'
    })

    const targets = [
      { position: [120, 100], radius: 16, isPlayer: true }
    ]

    // owner가 'player'인 투사체는 isPlayer: true인 대상 무시
    system.checkCollisions(targets, 'player')

    expect(onHit).not.toHaveBeenCalled()
  })

  it('should handle piercing projectiles', () => {
    const onHit = vi.fn()
    system.event.on('hit', onHit)

    system.fire({
      x: 100, y: 100,
      dirX: 1, dirY: 0,
      speed: 100, range: 200,
      damage: 10, owner: 'player',
      piercing: true
    })

    const targets = [
      { position: [120, 100], radius: 16 },
      { position: [140, 100], radius: 16 }
    ]

    system.checkCollisions(targets, 'player')

    // 관통 투사체는 여러 대상 타격
    expect(onHit).toHaveBeenCalledTimes(2)
    expect(pool.activeCount).toBe(1) // 투사체 유지
  })

  it('should release non-piercing projectile on hit', () => {
    system.fire({
      x: 100, y: 100,
      dirX: 1, dirY: 0,
      speed: 100, range: 200,
      damage: 10, owner: 'player',
      piercing: false
    })

    const targets = [
      { position: [120, 100], radius: 16 }
    ]

    system.checkCollisions(targets, 'player')

    expect(pool.activeCount).toBe(0) // 투사체 제거
  })
})
```

**Step 2: 테스트 실행 확인 (실패)**

```bash
pnpm test examples/mini-rpg/tests/projectile-system.test.js
```

Expected: FAIL

**Step 3: ProjectileSystem 컴포넌트 작성**

```javascript
// examples/mini-rpg/scripts/components/projectile-system.js
import { EventEmitter } from '../../../../you/utilities/event.js'

export class ProjectileSystem {
  constructor({ pool }) {
    this._pool = pool
    this.event = new EventEmitter(this)
  }

  fire(config) {
    return this._pool.acquire(config)
  }

  fireMultiple(configs) {
    return configs.map(config => this.fire(config)).filter(p => p !== null)
  }

  update(deltaTime) {
    const toRelease = []

    for (const projectile of this._pool.getActiveProjectiles()) {
      // 이동
      projectile.x += projectile.dirX * projectile.speed * deltaTime
      projectile.y += projectile.dirY * projectile.speed * deltaTime

      // 거리 체크
      const dx = projectile.x - projectile.startX
      const dy = projectile.y - projectile.startY
      const traveled = Math.sqrt(dx * dx + dy * dy)

      if (traveled >= projectile.range) {
        toRelease.push(projectile)
      }
    }

    for (const projectile of toRelease) {
      this._pool.release(projectile)
    }
  }

  checkCollisions(targets, excludeOwner = null) {
    const toRelease = []

    for (const projectile of this._pool.getActiveProjectiles()) {
      for (const target of targets) {
        // 같은 소유자 무시
        if (excludeOwner === 'player' && target.isPlayer) continue
        if (excludeOwner === 'enemy' && target.isEnemy) continue

        // 이미 타격한 대상 무시 (관통 투사체용)
        if (projectile.hitTargets.has(target)) continue

        // 충돌 체크
        const dx = target.position[0] - projectile.x
        const dy = target.position[1] - projectile.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const hitRadius = (target.radius || 16) + 4 // 투사체 반경 4

        if (distance <= hitRadius) {
          projectile.hitTargets.add(target)

          this.event.emit('hit', {
            projectile,
            target,
            damage: projectile.damage
          })

          if (!projectile.piercing) {
            toRelease.push(projectile)
            break // 비관통 투사체는 첫 타격 후 중단
          }
        }
      }
    }

    for (const projectile of toRelease) {
      this._pool.release(projectile)
    }
  }

  getActiveProjectiles() {
    return this._pool.getActiveProjectiles()
  }

  clear() {
    this._pool.releaseAll()
  }
}
```

**Step 4: 테스트 실행 확인 (성공)**

```bash
pnpm test examples/mini-rpg/tests/projectile-system.test.js
```

Expected: PASS

**Step 5: Commit**

```bash
git add examples/mini-rpg/
git commit -m "feat(mini-rpg): ProjectileSystem 컴포넌트 구현"
```

---

## Task 3: 투사체 렌더러 생성

**Files:**
- Create: `examples/mini-rpg/scripts/components/projectile-renderer.js`

**Step 1: ProjectileRenderer 클래스 작성**

```javascript
// examples/mini-rpg/scripts/components/projectile-renderer.js

export class ProjectileRenderer {
  constructor({
    size = 8,
    color = '#ffff44',
    trailLength = 3
  } = {}) {
    this._size = size
    this._color = color
    this._trailLength = trailLength
  }

  render(context, projectiles) {
    for (const projectile of projectiles) {
      this.renderProjectile(context, projectile)
    }
  }

  renderProjectile(context, projectile) {
    const { x, y, dirX, dirY } = projectile

    // 트레일 (잔상)
    context.save()
    for (let i = this._trailLength; i > 0; i--) {
      const alpha = 0.2 * (1 - i / this._trailLength)
      const offset = i * 6
      const trailX = x - dirX * offset
      const trailY = y - dirY * offset

      context.fillStyle = this._color
      context.globalAlpha = alpha
      context.beginPath()
      context.arc(trailX, trailY, this._size * 0.6, 0, Math.PI * 2)
      context.fill()
    }
    context.restore()

    // 메인 투사체
    context.fillStyle = this._color
    context.beginPath()
    context.arc(x, y, this._size, 0, Math.PI * 2)
    context.fill()

    // 광택 효과
    context.fillStyle = '#ffffff'
    context.globalAlpha = 0.6
    context.beginPath()
    context.arc(x - this._size * 0.3, y - this._size * 0.3, this._size * 0.3, 0, Math.PI * 2)
    context.fill()
    context.globalAlpha = 1
  }
}
```

**Step 2: 브라우저에서 확인 (다음 Task에서 통합)**

**Step 3: Commit**

```bash
git add examples/mini-rpg/scripts/components/
git commit -m "feat(mini-rpg): ProjectileRenderer 컴포넌트 구현"
```

---

## Task 4: 무기 데이터 확장 (투사체/스킬 속성)

**Files:**
- Modify: `examples/mini-rpg/data/items/weapons.json`

**Step 1: 무기 데이터에 투사체 및 스킬 속성 추가**

```json
{
  "items": [
    {
      "id": "sword_wood",
      "name": "나무 검",
      "type": "weapon",
      "slot": "weapon",
      "stackable": false,
      "stats": { "attack": 5 },
      "attackType": "melee",
      "range": 50,
      "skill": {
        "id": "spin_attack",
        "name": "회전베기",
        "description": "주변 360도 공격",
        "cooldown": 5,
        "type": "aoe",
        "radius": 60,
        "damageMultiplier": 1.5
      },
      "description": "초보자용 나무 검."
    },
    {
      "id": "sword_iron",
      "name": "철 검",
      "type": "weapon",
      "slot": "weapon",
      "stackable": false,
      "stats": { "attack": 10 },
      "attackType": "melee",
      "range": 55,
      "skill": {
        "id": "spin_attack",
        "name": "회전베기",
        "description": "주변 360도 공격",
        "cooldown": 4,
        "type": "aoe",
        "radius": 70,
        "damageMultiplier": 2.0
      },
      "description": "단단한 철로 만든 검."
    },
    {
      "id": "bow_short",
      "name": "단궁",
      "type": "weapon",
      "slot": "weapon",
      "stackable": false,
      "stats": { "attack": 7 },
      "attackType": "ranged",
      "range": 200,
      "projectile": {
        "speed": 300,
        "size": 6,
        "color": "#8b4513",
        "piercing": false
      },
      "skill": {
        "id": "multi_shot",
        "name": "다중 화살",
        "description": "부채꼴 3발 동시 발사",
        "cooldown": 6,
        "type": "multi_projectile",
        "projectileCount": 3,
        "spreadAngle": 30,
        "damageMultiplier": 0.8
      },
      "description": "가벼운 단궁."
    },
    {
      "id": "staff_magic",
      "name": "마법 지팡이",
      "type": "weapon",
      "slot": "weapon",
      "stackable": false,
      "stats": { "attack": 8 },
      "attackType": "ranged",
      "range": 180,
      "projectile": {
        "speed": 250,
        "size": 10,
        "color": "#9966ff",
        "piercing": false,
        "count": 2,
        "spreadAngle": 10
      },
      "skill": {
        "id": "magic_explosion",
        "name": "마법 폭발",
        "description": "범위 폭발 데미지",
        "cooldown": 8,
        "type": "explosion",
        "radius": 80,
        "damageMultiplier": 2.5
      },
      "description": "마법 탄환을 2발 동시에 발사한다."
    },
    {
      "id": "spear_iron",
      "name": "철 창",
      "type": "weapon",
      "slot": "weapon",
      "stackable": false,
      "stats": { "attack": 9 },
      "attackType": "ranged",
      "range": 150,
      "projectile": {
        "speed": 350,
        "size": 8,
        "color": "#c0c0c0",
        "piercing": true
      },
      "skill": {
        "id": "piercing_throw",
        "name": "관통 투척",
        "description": "모든 적을 관통하는 강력한 투척",
        "cooldown": 7,
        "type": "piercing_projectile",
        "damageMultiplier": 2.0,
        "range": 300
      },
      "description": "던져서 적을 관통하는 철 창."
    }
  ]
}
```

**Step 2: Commit**

```bash
git add examples/mini-rpg/data/items/
git commit -m "feat(mini-rpg): 무기 데이터에 투사체/스킬 속성 추가"
```

---

## Task 5: AttackController 원거리 공격 완성

**Files:**
- Modify: `examples/mini-rpg/scripts/components/attack-controller.js`

**Step 1: AttackController에 투사체 발사 로직 추가**

```javascript
// attack-controller.js 수정
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
    const weapon = this.weaponData
    return weapon?.range || this.baseRange
  }

  get cooldown() {
    return this.baseCooldown
  }

  get attackType() {
    const weapon = this.weaponData
    return weapon?.attackType || 'melee'
  }

  get weaponData() {
    const equipment = this.object?.findComponent(Equipment)
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

  attack(targets = []) {
    if (!this.canAttack) return []

    this._cooldownTimer = this.cooldown
    this._attacking = true
    this._attackTimer = this._attackDuration

    const stats = this.object.findComponent(Stats)
    const weapon = this.weaponData

    if (this.attackType === 'ranged') {
      return this.prepareRangedAttack(stats, weapon)
    }

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

    this.event.emit('meleeAttack', hits)
    return hits
  }

  prepareRangedAttack(stats, weapon) {
    const projectileData = weapon?.projectile || {}
    const pos = this.object.position
    const dir = this._facingDirection

    const baseConfig = {
      x: pos[0],
      y: pos[1],
      damage: stats.totalAttack,
      speed: projectileData.speed || 300,
      range: this.range,
      piercing: projectileData.piercing || false,
      owner: this.object.tags?.has('player') ? 'player' : 'enemy',
      size: projectileData.size || 8,
      color: projectileData.color || '#ffff44'
    }

    const projectileConfigs = []
    const count = projectileData.count || 1
    const spreadAngle = (projectileData.spreadAngle || 0) * Math.PI / 180

    if (count === 1) {
      projectileConfigs.push({
        ...baseConfig,
        dirX: dir[0],
        dirY: dir[1]
      })
    } else {
      // 다중 발사: 부채꼴 배치
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
```

**Step 2: 브라우저에서 확인 (다음 Task에서 통합)**

**Step 3: Commit**

```bash
git add examples/mini-rpg/scripts/components/
git commit -m "feat(mini-rpg): AttackController 원거리 공격 완성"
```

---

## Task 6: GameScene에 투사체 시스템 통합

**Files:**
- Modify: `examples/mini-rpg/scripts/scenes/game-scene.js`

**Step 1: GameScene에 투사체 시스템 추가**

```javascript
// game-scene.js 수정
import { Scene } from '../../../../you/scene.js'
import { ProjectilePool } from '../services/projectile-pool.js'
import { ProjectileSystem } from '../components/projectile-system.js'
import { ProjectileRenderer } from '../components/projectile-renderer.js'
import { AttackController } from '../components/attack-controller.js'
import { Stats } from '../components/stats.js'
// ... 기존 import

export class GameScene extends Scene {
  didCreate() {
    // ... 기존 코드

    // 투사체 시스템 초기화
    this.projectilePool = new ProjectilePool({ maxSize: 100 })
    this.projectileSystem = new ProjectileSystem({ pool: this.projectilePool })
    this.projectileRenderer = new ProjectileRenderer()

    // 투사체 충돌 이벤트 핸들링
    this.projectileSystem.event.on('hit', (data) => {
      this.onProjectileHit(data)
    })

    // 플레이어 원거리 공격 이벤트
    const playerAttack = this.player.findComponent(AttackController)
    playerAttack.event.on('rangedAttack', (configs) => {
      for (const config of configs) {
        this.projectileSystem.fire(config)
      }
    })
  }

  didUpdate(deltaTime, events, input) {
    // ... 기존 코드

    // 투사체 업데이트
    this.projectileSystem.update(deltaTime)

    // 플레이어 투사체 충돌 체크 (적 대상)
    const enemies = this.objects.filter(obj => obj.tags.has('enemy'))
    const enemyTargets = enemies.map(e => ({
      ...e,
      isEnemy: true,
      radius: 16
    }))
    this.projectileSystem.checkCollisions(enemyTargets, 'player')

    // 적 투사체 충돌 체크 (플레이어 대상)
    const playerTarget = [{
      ...this.player,
      isPlayer: true,
      radius: 16
    }]
    this.projectileSystem.checkCollisions(playerTarget, 'enemy')

    // 플레이어 방향 업데이트
    this.updatePlayerFacingDirection(input)
  }

  updatePlayerFacingDirection(input) {
    const playerController = this.player.findComponent(PlayerController)
    const attackController = this.player.findComponent(AttackController)

    if (playerController && attackController) {
      const dir = playerController.direction
      if (dir[0] !== 0 || dir[1] !== 0) {
        attackController.setFacingDirection(dir[0], dir[1])
      }
    }
  }

  onProjectileHit(data) {
    const { projectile, target, damage } = data

    const targetStats = target.findComponent?.(Stats)
    if (targetStats && targetStats.alive) {
      targetStats.takeDamage(damage)

      // 피격 효과
      const renderer = target.findComponent?.(ShapeRenderer)
      if (renderer) {
        renderer.flash('#ffffff', 0.1)
      }

      // 사망 처리
      if (!targetStats.alive && target.tags?.has('enemy')) {
        const playerStats = this.player.findComponent(Stats)
        playerStats.addExp(target.expReward || 10)
      }
    }
  }

  didRender(context, screen, camera) {
    // ... 기존 렌더링

    // 투사체 렌더링 (카메라 변환 적용 후)
    context.save()
    camera.apply(context)
    this.projectileRenderer.render(context, this.projectileSystem.getActiveProjectiles())
    context.restore()
  }

  // playerAttack 메서드 수정
  playerAttack() {
    const attackController = this.player.findComponent(AttackController)
    const enemies = this.objects.filter(obj => obj.tags.has('enemy'))

    const results = attackController.attack(enemies)

    // 근접 공격 결과 처리
    for (const result of results) {
      if (result.type !== 'ranged') {
        // 근접 공격 결과
        console.log(`Hit ${result.target.name} for ${result.damage} damage`)

        const renderer = result.target.findComponent(ShapeRenderer)
        if (renderer) {
          renderer.flash('#ffffff', 0.1)
        }

        const targetStats = result.target.findComponent(Stats)
        if (!targetStats.alive) {
          const playerStats = this.player.findComponent(Stats)
          playerStats.addExp(result.target.expReward || 10)
        }
      }
      // 원거리 공격은 이벤트로 처리됨
    }
  }
}
```

**Step 2: 브라우저에서 확인**

Expected:
- 활/지팡이 장착 시 투사체 발사
- 투사체가 적에게 명중 시 데미지
- 투사체 트레일 효과

**Step 3: Commit**

```bash
git add examples/mini-rpg/scripts/
git commit -m "feat(mini-rpg): GameScene에 투사체 시스템 통합"
```

---

## Task 7: 무기 스킬 시스템 생성

**Files:**
- Create: `examples/mini-rpg/scripts/components/weapon-skill.js`
- Create: `examples/mini-rpg/tests/weapon-skill.test.js`

**Step 1: 테스트 파일 작성**

```javascript
// examples/mini-rpg/tests/weapon-skill.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WeaponSkill } from '../scripts/components/weapon-skill.js'

describe('WeaponSkill', () => {
  let skill

  beforeEach(() => {
    skill = new WeaponSkill()
    skill.object = {
      position: [100, 100],
      findComponent: vi.fn()
    }
  })

  it('should not be ready without weapon', () => {
    skill.object.findComponent.mockReturnValue(null)
    expect(skill.canUse).toBe(false)
  })

  it('should be ready with weapon and no cooldown', () => {
    const mockEquipment = {
      getSlot: () => ({
        skill: { cooldown: 5, type: 'aoe' }
      })
    }
    skill.object.findComponent.mockReturnValue(mockEquipment)

    expect(skill.canUse).toBe(true)
  })

  it('should start cooldown after use', () => {
    const mockEquipment = {
      getSlot: () => ({
        skill: { cooldown: 5, type: 'aoe', radius: 60, damageMultiplier: 1.5 }
      })
    }
    const mockStats = {
      totalAttack: 10
    }
    skill.object.findComponent
      .mockReturnValueOnce(mockEquipment) // canUse check
      .mockReturnValueOnce(mockEquipment) // useSkill
      .mockReturnValueOnce(mockStats)

    skill.useSkill([])

    // cooldown started
    expect(skill.cooldownRemaining).toBeGreaterThan(0)
    expect(skill.canUse).toBe(false)
  })

  it('should reduce cooldown over time', () => {
    skill._cooldownTimer = 5

    skill.didUpdate(2)

    expect(skill._cooldownTimer).toBe(3)
  })

  it('should emit skillUsed event', () => {
    const onSkillUsed = vi.fn()
    skill.event.on('skillUsed', onSkillUsed)

    const mockEquipment = {
      getSlot: () => ({
        skill: { cooldown: 5, type: 'aoe', radius: 60, damageMultiplier: 1.5 }
      })
    }
    const mockStats = { totalAttack: 10 }
    skill.object.findComponent
      .mockReturnValueOnce(mockEquipment)
      .mockReturnValueOnce(mockEquipment)
      .mockReturnValueOnce(mockStats)

    skill.useSkill([])

    expect(onSkillUsed).toHaveBeenCalled()
  })
})
```

**Step 2: 테스트 실행 확인 (실패)**

```bash
pnpm test examples/mini-rpg/tests/weapon-skill.test.js
```

Expected: FAIL

**Step 3: WeaponSkill 컴포넌트 작성**

```javascript
// examples/mini-rpg/scripts/components/weapon-skill.js
import { Component } from '../../../../you/component.js'
import { Equipment } from './equipment.js'
import { Stats } from './stats.js'
import { EventEmitter } from '../../../../you/utilities/event.js'

export class WeaponSkill extends Component {
  constructor() {
    super()
    this._cooldownTimer = 0
    this.event = new EventEmitter(this)
  }

  get weaponData() {
    const equipment = this.object?.findComponent(Equipment)
    return equipment?.getSlot('weapon')
  }

  get skillData() {
    return this.weaponData?.skill || null
  }

  get canUse() {
    return this.skillData !== null && this._cooldownTimer <= 0
  }

  get cooldownRemaining() {
    return Math.max(0, this._cooldownTimer)
  }

  get cooldownTotal() {
    return this.skillData?.cooldown || 0
  }

  get cooldownProgress() {
    if (this.cooldownTotal === 0) return 1
    return 1 - (this.cooldownRemaining / this.cooldownTotal)
  }

  useSkill(targets = []) {
    if (!this.canUse) return null

    const skill = this.skillData
    const stats = this.object.findComponent(Stats)
    const damage = stats.totalAttack * (skill.damageMultiplier || 1)

    this._cooldownTimer = skill.cooldown

    const result = this.executeSkill(skill, damage, targets)

    this.event.emit('skillUsed', {
      skill,
      result
    })

    return result
  }

  executeSkill(skill, damage, targets) {
    const pos = this.object.position

    switch (skill.type) {
      case 'aoe':
        return this.executeAoeSkill(pos, skill, damage, targets)

      case 'multi_projectile':
        return this.executeMultiProjectile(pos, skill, damage)

      case 'explosion':
        return this.executeExplosion(pos, skill, damage, targets)

      case 'piercing_projectile':
        return this.executePiercingProjectile(pos, skill, damage)

      default:
        return null
    }
  }

  executeAoeSkill(pos, skill, damage, targets) {
    const hits = []
    const radius = skill.radius || 60

    for (const target of targets) {
      const dx = target.position[0] - pos[0]
      const dy = target.position[1] - pos[1]
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance <= radius) {
        const targetStats = target.findComponent?.(Stats)
        if (targetStats && targetStats.alive) {
          const dealt = targetStats.takeDamage(damage)
          hits.push({ target, damage: dealt })
        }
      }
    }

    return {
      type: 'aoe',
      position: [...pos],
      radius,
      hits
    }
  }

  executeMultiProjectile(pos, skill, damage) {
    const attackController = this.object.findComponent?.(require('./attack-controller.js').AttackController)
    const dir = attackController?.facingDirection || [1, 0]

    const count = skill.projectileCount || 3
    const spreadAngle = (skill.spreadAngle || 30) * Math.PI / 180
    const baseAngle = Math.atan2(dir[1], dir[0])
    const startAngle = -spreadAngle * (count - 1) / 2

    const projectiles = []
    for (let i = 0; i < count; i++) {
      const angle = baseAngle + startAngle + spreadAngle * i
      projectiles.push({
        x: pos[0],
        y: pos[1],
        dirX: Math.cos(angle),
        dirY: Math.sin(angle),
        damage: damage * (skill.damageMultiplier || 1),
        speed: 350,
        range: skill.range || 200,
        piercing: false,
        owner: this.object.tags?.has('player') ? 'player' : 'enemy'
      })
    }

    return {
      type: 'multi_projectile',
      projectiles
    }
  }

  executeExplosion(pos, skill, damage, targets) {
    // 폭발은 즉시 범위 데미지
    const radius = skill.radius || 80
    const hits = []

    for (const target of targets) {
      const dx = target.position[0] - pos[0]
      const dy = target.position[1] - pos[1]
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance <= radius) {
        const targetStats = target.findComponent?.(Stats)
        if (targetStats && targetStats.alive) {
          const dealt = targetStats.takeDamage(damage)
          hits.push({ target, damage: dealt })
        }
      }
    }

    return {
      type: 'explosion',
      position: [...pos],
      radius,
      hits
    }
  }

  executePiercingProjectile(pos, skill, damage) {
    const attackController = this.object.findComponent?.(require('./attack-controller.js').AttackController)
    const dir = attackController?.facingDirection || [1, 0]

    return {
      type: 'piercing_projectile',
      projectiles: [{
        x: pos[0],
        y: pos[1],
        dirX: dir[0],
        dirY: dir[1],
        damage,
        speed: 400,
        range: skill.range || 300,
        piercing: true,
        owner: this.object.tags?.has('player') ? 'player' : 'enemy'
      }]
    }
  }

  didUpdate(deltaTime) {
    if (this._cooldownTimer > 0) {
      this._cooldownTimer -= deltaTime
    }
  }
}
```

**Step 4: 테스트 실행 확인 (성공)**

```bash
pnpm test examples/mini-rpg/tests/weapon-skill.test.js
```

Expected: PASS

**Step 5: Commit**

```bash
git add examples/mini-rpg/
git commit -m "feat(mini-rpg): WeaponSkill 컴포넌트 구현"
```

---

## Task 8: 플레이어에 WeaponSkill 통합

**Files:**
- Modify: `examples/mini-rpg/scripts/objects/player.js`
- Modify: `examples/mini-rpg/scripts/scenes/game-scene.js`

**Step 1: Player에 WeaponSkill 컴포넌트 추가**

```javascript
// player.js 수정
import { Object } from '../../../../you/object.js'
import { PlayerController } from '../components/player-controller.js'
import { ShapeRenderer } from '../components/shape-renderer.js'
import { Stats } from '../components/stats.js'
import { AttackController } from '../components/attack-controller.js'
import { HpBar } from '../components/hp-bar.js'
import { Inventory } from '../components/inventory.js'
import { Equipment } from '../components/equipment.js'
import { WeaponSkill } from '../components/weapon-skill.js'

export function createPlayer(x, y) {
  const player = new Object({
    name: 'player',
    tags: ['player'],
    components: [
      new PlayerController({ speed: 150 }),
      new ShapeRenderer({
        shape: 'circle',
        size: 32,
        color: '#4a90d9',
        strokeColor: '#2a5a99',
        strokeWidth: 3
      }),
      new Stats({ maxHp: 100, attack: 15, defense: 5 }),
      new AttackController({ baseRange: 50, baseCooldown: 0.4 }),
      new HpBar({ width: 40, height: 6, offsetY: -25 }),
      new Inventory({ maxSlots: 10, maxCapacity: 30 }),
      new Equipment(),
      new WeaponSkill()
    ]
  })

  player.position = [x, y]

  // Equipment 변경 시 Stats에 보너스 적용
  const equipment = player.findComponent(Equipment)
  const stats = player.findComponent(Stats)

  equipment.event.on('equipped', () => {
    stats.setEquipmentBonus(equipment.getTotalBonus())
  })
  equipment.event.on('unequipped', () => {
    stats.setEquipmentBonus(equipment.getTotalBonus())
  })

  return player
}
```

**Step 2: GameScene에서 스킬 발동 처리**

```javascript
// game-scene.js 수정

import { WeaponSkill } from '../components/weapon-skill.js'

didCreate() {
  // ... 기존 코드

  // 플레이어 스킬 이벤트
  const weaponSkill = this.player.findComponent(WeaponSkill)
  weaponSkill.event.on('skillUsed', (data) => {
    this.onPlayerSkillUsed(data)
  })
}

didUpdate(deltaTime, events, input) {
  // ... 기존 코드

  // 스킬 발동 (Q키)
  for (const ev of events) {
    if (ev.type === 'keydown' && (ev.key === 'q' || ev.key === 'Q')) {
      this.playerUseSkill()
    }
  }
}

playerUseSkill() {
  const weaponSkill = this.player.findComponent(WeaponSkill)
  const enemies = this.objects.filter(obj => obj.tags.has('enemy'))

  const result = weaponSkill.useSkill(enemies)

  if (!result) {
    console.log('Skill not ready')
    return
  }

  console.log('Skill used:', result.type)
}

onPlayerSkillUsed(data) {
  const { skill, result } = data

  if (!result) return

  switch (result.type) {
    case 'aoe':
    case 'explosion':
      // 범위 공격 효과
      this.showAoeEffect(result.position, result.radius)
      for (const hit of result.hits) {
        this.showHitEffect(hit.target)
        this.checkEnemyDeath(hit.target)
      }
      break

    case 'multi_projectile':
    case 'piercing_projectile':
      // 투사체 발사
      for (const config of result.projectiles) {
        this.projectileSystem.fire(config)
      }
      break
  }
}

showAoeEffect(position, radius) {
  // 범위 공격 시각 효과 (간단한 원 확대 효과)
  this._aoeEffects = this._aoeEffects || []
  this._aoeEffects.push({
    x: position[0],
    y: position[1],
    radius: 0,
    maxRadius: radius,
    duration: 0.3,
    elapsed: 0
  })
}

showHitEffect(target) {
  const renderer = target.findComponent?.(ShapeRenderer)
  if (renderer) {
    renderer.flash('#ffff00', 0.15)
  }
}

checkEnemyDeath(enemy) {
  const targetStats = enemy.findComponent(Stats)
  if (!targetStats.alive) {
    const playerStats = this.player.findComponent(Stats)
    playerStats.addExp(enemy.expReward || 10)
  }
}

didRender(context, screen, camera) {
  // ... 기존 렌더링

  // AOE 효과 렌더링
  context.save()
  camera.apply(context)
  this.renderAoeEffects(context)
  context.restore()
}

renderAoeEffects(context) {
  if (!this._aoeEffects) return

  for (let i = this._aoeEffects.length - 1; i >= 0; i--) {
    const effect = this._aoeEffects[i]
    effect.elapsed += 0.016 // approximate deltaTime

    const progress = effect.elapsed / effect.duration
    if (progress >= 1) {
      this._aoeEffects.splice(i, 1)
      continue
    }

    const currentRadius = effect.maxRadius * progress
    const alpha = 1 - progress

    context.strokeStyle = `rgba(255, 255, 100, ${alpha})`
    context.lineWidth = 3
    context.beginPath()
    context.arc(effect.x, effect.y, currentRadius, 0, Math.PI * 2)
    context.stroke()

    context.fillStyle = `rgba(255, 255, 100, ${alpha * 0.2})`
    context.fill()
  }
}
```

**Step 3: 브라우저에서 확인**

Expected:
- Q키로 무기 스킬 발동
- 검: 회전베기 (주변 범위 공격)
- 활: 다중 화살 (부채꼴 발사)
- 지팡이: 마법 폭발 (범위 폭발)

**Step 4: Commit**

```bash
git add examples/mini-rpg/scripts/
git commit -m "feat(mini-rpg): 플레이어에 WeaponSkill 통합"
```

---

## Task 9: 스킬 UI (쿨다운 표시)

**Files:**
- Modify: `examples/mini-rpg/scripts/ui/hud.js`

**Step 1: HUD에 스킬 쿨다운 표시 추가**

```javascript
// hud.js 수정

import { WeaponSkill } from '../components/weapon-skill.js'

didRender(context, screen) {
  // ... 기존 코드

  // 스킬 쿨다운 (하단 중앙)
  const weaponSkill = this.player.findComponent(WeaponSkill)
  if (weaponSkill) {
    this.renderSkillCooldown(context, screen.width / 2 - 30, screen.height - 80, weaponSkill)
  }
}

renderSkillCooldown(context, x, y, weaponSkill) {
  const skill = weaponSkill.skillData
  const size = 60

  // 배경
  context.fillStyle = '#222222'
  context.fillRect(x, y, size, size)
  context.strokeStyle = '#666666'
  context.lineWidth = 2
  context.strokeRect(x, y, size, size)

  if (!skill) {
    // 스킬 없음
    context.fillStyle = '#444444'
    context.font = '10px Arial'
    context.textAlign = 'center'
    context.fillText('No Skill', x + size / 2, y + size / 2 + 4)
    context.textAlign = 'left'
    return
  }

  // 스킬 아이콘 (타입별 색상)
  const iconColor = this.getSkillColor(skill.type)
  context.fillStyle = iconColor
  context.fillRect(x + 8, y + 8, size - 16, size - 16)

  // 쿨다운 오버레이
  if (!weaponSkill.canUse) {
    const progress = weaponSkill.cooldownProgress
    const overlayHeight = (size - 16) * (1 - progress)

    context.fillStyle = 'rgba(0, 0, 0, 0.7)'
    context.fillRect(x + 8, y + 8, size - 16, overlayHeight)

    // 남은 시간
    context.fillStyle = '#ffffff'
    context.font = 'bold 16px Arial'
    context.textAlign = 'center'
    const remaining = Math.ceil(weaponSkill.cooldownRemaining)
    context.fillText(String(remaining), x + size / 2, y + size / 2 + 6)
    context.textAlign = 'left'
  }

  // 키 힌트
  context.fillStyle = '#888888'
  context.font = '10px Arial'
  context.fillText('[Q]', x + 2, y + size + 12)

  // 스킬 이름
  context.fillStyle = '#cccccc'
  context.font = '10px Arial'
  context.fillText(skill.name, x + 20, y + size + 12)
}

getSkillColor(type) {
  switch (type) {
    case 'aoe': return '#ff6644'
    case 'multi_projectile': return '#44ff66'
    case 'explosion': return '#ff44ff'
    case 'piercing_projectile': return '#44ffff'
    default: return '#888888'
  }
}
```

**Step 2: 브라우저에서 확인**

Expected:
- 하단에 스킬 아이콘 표시
- 쿨다운 시 어두워지며 남은 시간 표시
- 무기 없으면 "No Skill" 표시

**Step 3: Commit**

```bash
git add examples/mini-rpg/scripts/ui/
git commit -m "feat(mini-rpg): HUD에 스킬 쿨다운 UI 추가"
```

---

## Task 10: 몬스터에 Equipment 컴포넌트 통합

**Files:**
- Modify: `examples/mini-rpg/scripts/objects/enemy.js`
- Modify: `examples/mini-rpg/data/monsters.json` (생성)

**Step 1: 몬스터 데이터 JSON 생성**

```json
// examples/mini-rpg/data/monsters.json
{
  "monsters": [
    {
      "id": "mushroom",
      "name": "버섯",
      "hp": 30,
      "attack": 8,
      "defense": 2,
      "speed": 40,
      "size": 28,
      "color": "#8b4513",
      "expReward": 25,
      "dropTableId": "mushroom",
      "weaponId": null,
      "attackType": "melee",
      "range": 30
    },
    {
      "id": "ant",
      "name": "개미",
      "hp": 15,
      "attack": 5,
      "defense": 1,
      "speed": 80,
      "size": 20,
      "color": "#333333",
      "expReward": 15,
      "dropTableId": "ant",
      "weaponId": null,
      "attackType": "melee",
      "range": 25
    },
    {
      "id": "bee",
      "name": "꿀벌",
      "hp": 20,
      "attack": 10,
      "defense": 1,
      "speed": 100,
      "size": 18,
      "color": "#ffcc00",
      "expReward": 30,
      "dropTableId": "common_monster",
      "weaponId": "bee_stinger",
      "attackType": "ranged",
      "range": 120
    },
    {
      "id": "slime",
      "name": "슬라임",
      "hp": 50,
      "attack": 12,
      "defense": 5,
      "speed": 30,
      "size": 32,
      "color": "#66ff66",
      "expReward": 40,
      "dropTableId": "rare_monster",
      "weaponId": null,
      "attackType": "melee",
      "range": 35
    },
    {
      "id": "bat",
      "name": "박쥐",
      "hp": 25,
      "attack": 15,
      "defense": 2,
      "speed": 120,
      "size": 22,
      "color": "#663399",
      "expReward": 35,
      "dropTableId": "common_monster",
      "weaponId": null,
      "attackType": "melee",
      "range": 30
    },
    {
      "id": "golem",
      "name": "골렘",
      "hp": 200,
      "attack": 30,
      "defense": 15,
      "speed": 20,
      "size": 48,
      "color": "#666666",
      "expReward": 200,
      "dropTableId": "rare_monster",
      "weaponId": "golem_fist",
      "attackType": "melee",
      "range": 50,
      "isBoss": true
    }
  ],
  "monsterWeapons": [
    {
      "id": "bee_stinger",
      "name": "벌 침",
      "type": "weapon",
      "slot": "weapon",
      "stats": { "attack": 0 },
      "attackType": "ranged",
      "range": 120,
      "projectile": {
        "speed": 200,
        "size": 4,
        "color": "#ffcc00",
        "piercing": false
      }
    },
    {
      "id": "golem_fist",
      "name": "골렘 주먹",
      "type": "weapon",
      "slot": "weapon",
      "stats": { "attack": 5 },
      "attackType": "melee",
      "range": 50
    }
  ]
}
```

**Step 2: Enemy 팩토리 수정**

```javascript
// enemy.js 수정
import { Object } from '../../../../you/object.js'
import { EnemyAI } from '../components/enemy-ai.js'
import { ShapeRenderer } from '../components/shape-renderer.js'
import { Stats } from '../components/stats.js'
import { AttackController } from '../components/attack-controller.js'
import { HpBar } from '../components/hp-bar.js'
import { Equipment } from '../components/equipment.js'

export function createEnemy(monsterData, weaponData, x, y) {
  const enemy = new Object({
    name: monsterData.id,
    tags: ['enemy'],
    components: [
      new EnemyAI({
        speed: monsterData.speed,
        detectionRange: 150,
        attackRange: monsterData.range
      }),
      new ShapeRenderer({
        shape: monsterData.isBoss ? 'rect' : 'circle',
        size: monsterData.size,
        color: monsterData.color,
        strokeColor: darkenColor(monsterData.color),
        strokeWidth: 2
      }),
      new Stats({
        maxHp: monsterData.hp,
        attack: monsterData.attack,
        defense: monsterData.defense
      }),
      new AttackController({
        baseRange: monsterData.range,
        baseCooldown: 1.0
      }),
      new HpBar({
        width: monsterData.size + 10,
        height: 4,
        offsetY: -monsterData.size / 2 - 10
      }),
      new Equipment()
    ]
  })

  enemy.position = [x, y]
  enemy.expReward = monsterData.expReward
  enemy.dropTableId = monsterData.dropTableId
  enemy.monsterData = monsterData

  // 무기 장착
  if (weaponData) {
    const equipment = enemy.findComponent(Equipment)
    equipment.equip(weaponData)
  }

  return enemy
}

// 기존 팩토리 함수 (하위 호환)
export function createMushroom(x, y) {
  return createEnemy({
    id: 'mushroom',
    name: '버섯',
    hp: 30,
    attack: 8,
    defense: 2,
    speed: 40,
    size: 28,
    color: '#8b4513',
    expReward: 25,
    dropTableId: 'mushroom',
    range: 30
  }, null, x, y)
}

export function createAnt(x, y) {
  return createEnemy({
    id: 'ant',
    name: '개미',
    hp: 15,
    attack: 5,
    defense: 1,
    speed: 80,
    size: 20,
    color: '#333333',
    expReward: 15,
    dropTableId: 'ant',
    range: 25
  }, null, x, y)
}

function darkenColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return '#' + [r, g, b].map(c => Math.floor(c * 0.7).toString(16).padStart(2, '0')).join('')
}
```

**Step 3: Commit**

```bash
git add examples/mini-rpg/
git commit -m "feat(mini-rpg): 몬스터에 Equipment 컴포넌트 통합"
```

---

## Task 11: 몬스터 원거리 공격 AI 확장

**Files:**
- Modify: `examples/mini-rpg/scripts/components/enemy-ai.js`

**Step 1: EnemyAI에 원거리 공격 지원 추가**

```javascript
// enemy-ai.js 수정
import { Component } from '../../../../you/component.js'
import { Stats } from './stats.js'
import { AttackController } from './attack-controller.js'
import { EventEmitter } from '../../../../you/utilities/event.js'

export class EnemyAI extends Component {
  constructor({
    speed = 50,
    detectionRange = 150,
    attackRange = 30,
    retreatRange = 0  // 원거리 몬스터용 후퇴 거리
  } = {}) {
    super()
    this.speed = speed
    this.detectionRange = detectionRange
    this.attackRange = attackRange
    this.retreatRange = retreatRange
    this._target = null
    this._state = 'idle' // idle, chase, attack, retreat
    this.event = new EventEmitter(this)
  }

  setTarget(target) {
    this._target = target
  }

  get attackController() {
    return this.object?.findComponent(AttackController)
  }

  didUpdate(deltaTime, events, input) {
    if (!this._target) return

    const stats = this.object.findComponent(Stats)
    if (!stats?.alive) return

    const pos = this.object.position
    const targetPos = this._target.position
    const dx = targetPos[0] - pos[0]
    const dy = targetPos[1] - pos[1]
    const distance = Math.sqrt(dx * dx + dy * dy)

    // 방향 정규화
    const dirX = distance > 0 ? dx / distance : 0
    const dirY = distance > 0 ? dy / distance : 0

    // AttackController에 방향 설정
    const attackController = this.attackController
    if (attackController) {
      attackController.setFacingDirection(dirX, dirY)
    }

    // 감지 범위 밖이면 idle
    if (distance > this.detectionRange) {
      this._state = 'idle'
      return
    }

    // 원거리 몬스터: 너무 가까우면 후퇴
    if (this.retreatRange > 0 && distance < this.retreatRange) {
      this._state = 'retreat'
      pos[0] -= dirX * this.speed * deltaTime
      pos[1] -= dirY * this.speed * deltaTime
      return
    }

    // 공격 범위 내면 공격
    if (distance <= this.attackRange) {
      this._state = 'attack'
      this.tryAttack()
      return
    }

    // 추적
    this._state = 'chase'
    pos[0] += dirX * this.speed * deltaTime
    pos[1] += dirY * this.speed * deltaTime
  }

  tryAttack() {
    const attackController = this.attackController
    if (!attackController || !attackController.canAttack) return

    const targets = [this._target]
    const results = attackController.attack(targets)

    // 원거리 공격 이벤트 발생
    for (const result of results) {
      if (result.type === 'ranged') {
        this.event.emit('rangedAttack', result.projectiles)
      }
    }
  }
}
```

**Step 2: GameScene에서 몬스터 원거리 공격 처리**

```javascript
// game-scene.js 수정

spawnEnemy(monsterData, weaponData, x, y) {
  const enemy = createEnemy(monsterData, weaponData, x, y)

  // 원거리 몬스터 설정
  if (monsterData.attackType === 'ranged') {
    const ai = enemy.findComponent(EnemyAI)
    ai.retreatRange = monsterData.range * 0.5 // 공격 범위의 절반 이내로 접근하면 후퇴

    // 원거리 공격 이벤트
    ai.event.on('rangedAttack', (configs) => {
      for (const config of configs) {
        this.projectileSystem.fire(config)
      }
    })
  }

  this.add(enemy)
  return enemy
}
```

**Step 3: 브라우저에서 확인**

Expected:
- 꿀벌이 원거리에서 침 발사
- 너무 가까워지면 후퇴
- 투사체가 플레이어에게 명중 시 데미지

**Step 4: Commit**

```bash
git add examples/mini-rpg/scripts/
git commit -m "feat(mini-rpg): 몬스터 원거리 공격 AI 확장"
```

---

## Task 12: 몬스터 데이터 로딩 통합

**Files:**
- Modify: `examples/mini-rpg/scripts/game.js`
- Modify: `examples/mini-rpg/scripts/scenes/game-scene.js`

**Step 1: game.js에서 몬스터 데이터 로드**

```javascript
// game.js 수정

async loadGameData() {
  const [consumables, weapons, armors, accessories, dropTables, monsters] = await Promise.all([
    this.loadJson('./data/items/consumables.json'),
    this.loadJson('./data/items/weapons.json'),
    this.loadJson('./data/items/armors.json'),
    this.loadJson('./data/items/accessories.json'),
    this.loadJson('./data/drop-tables.json'),
    this.loadJson('./data/monsters.json')
  ])

  this.itemManager.loadItems(consumables.items)
  this.itemManager.loadItems(weapons.items)
  this.itemManager.loadItems(armors.items)
  this.itemManager.loadItems(accessories.items)

  // 몬스터 무기도 아이템 매니저에 등록
  this.itemManager.loadItems(monsters.monsterWeapons)

  this.dropTable.loadTables(dropTables.tables)

  // 몬스터 데이터 저장
  this.monsterData = new Map()
  for (const monster of monsters.monsters) {
    this.monsterData.set(monster.id, monster)
  }
}

didCreate() {
  // ... 기존 코드

  this.loadGameData().then(() => {
    const scene = new GameScene()
    scene.itemManager = this.itemManager
    scene.dropTable = this.dropTable
    scene.monsterData = this.monsterData
    this.push(scene)
  })
}
```

**Step 2: GameScene에서 데이터 기반 몬스터 생성**

```javascript
// game-scene.js 수정

spawnMonster(monsterId, x, y) {
  const monsterData = this.monsterData.get(monsterId)
  if (!monsterData) {
    console.error(`Unknown monster: ${monsterId}`)
    return null
  }

  let weaponData = null
  if (monsterData.weaponId) {
    weaponData = this.itemManager.getItem(monsterData.weaponId)
  }

  return this.spawnEnemy(monsterData, weaponData, x, y)
}

didCreate() {
  // ... 기존 코드

  // 데이터 기반 몬스터 스폰
  this.spawnMonster('mushroom', 200, 200)
  this.spawnMonster('mushroom', 400, 150)
  this.spawnMonster('ant', 300, 400)
  this.spawnMonster('ant', 500, 350)
  this.spawnMonster('bee', 600, 200) // 원거리 몬스터
}
```

**Step 3: 브라우저에서 확인**

Expected: 데이터 파일에서 로드한 몬스터들 생성

**Step 4: Commit**

```bash
git add examples/mini-rpg/scripts/
git commit -m "feat(mini-rpg): 몬스터 데이터 로딩 통합"
```

---

## Task 13: 최종 테스트 및 정리

**Files:**
- Review: 모든 Phase 2 파일

**Step 1: 전체 테스트 실행**

```bash
pnpm test
```

Expected: 모든 테스트 PASS

**Step 2: 브라우저 통합 테스트**

체크리스트:
- [ ] 원거리 무기 장착 시 투사체 발사
- [ ] 투사체 적 명중 시 데미지
- [ ] 관통 무기(창) 다중 타격
- [ ] Q키로 무기 스킬 발동
- [ ] 스킬 쿨다운 UI 표시
- [ ] 근접 스킬(회전베기) 범위 공격
- [ ] 원거리 스킬(다중 화살) 다수 발사
- [ ] 몬스터 원거리 공격 (꿀벌)
- [ ] 몬스터 후퇴 행동
- [ ] 투사체 트레일 효과
- [ ] AOE 스킬 시각 효과

**Step 3: 코드 정리**

- console.log 정리
- 미사용 import 제거
- 주석 정리

**Step 4: 최종 Commit**

```bash
git add examples/mini-rpg/
git commit -m "feat(mini-rpg): Phase 2 전투 확장 시스템 완성"
```

---

## 파일 구조 (Phase 2 완료 후)

```
examples/mini-rpg/
├── data/
│   ├── items/
│   │   ├── consumables.json
│   │   ├── weapons.json (수정)
│   │   ├── armors.json
│   │   └── accessories.json
│   ├── drop-tables.json
│   └── monsters.json (신규)
├── scripts/
│   ├── components/
│   │   ├── attack-controller.js (수정)
│   │   ├── enemy-ai.js (수정)
│   │   ├── equipment.js
│   │   ├── field-item-behavior.js
│   │   ├── hp-bar.js
│   │   ├── inventory.js
│   │   ├── player-controller.js
│   │   ├── projectile-renderer.js (신규)
│   │   ├── projectile-system.js (신규)
│   │   ├── shape-renderer.js
│   │   ├── stats.js
│   │   └── weapon-skill.js (신규)
│   ├── objects/
│   │   ├── enemy.js (수정)
│   │   ├── field-item.js
│   │   └── player.js (수정)
│   ├── scenes/
│   │   ├── game-scene.js (수정)
│   │   └── gameover-scene.js
│   ├── services/
│   │   ├── drop-table.js
│   │   ├── item-manager.js
│   │   └── projectile-pool.js (신규)
│   ├── ui/
│   │   ├── hud.js (수정)
│   │   └── inventory-ui.js
│   ├── game.js (수정)
│   └── main.js
└── tests/
    ├── drop-table.test.js
    ├── equipment.test.js
    ├── field-item.test.js
    ├── inventory.test.js
    ├── item-manager.test.js
    ├── projectile-pool.test.js (신규)
    ├── projectile-system.test.js (신규)
    ├── stats-equipment.test.js
    └── weapon-skill.test.js (신규)
```
