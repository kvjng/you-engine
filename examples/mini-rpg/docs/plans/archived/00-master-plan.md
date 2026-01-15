# Mini RPG 총괄 계획서 (Master Plan)

> 이 문서는 Mini RPG 프로젝트의 전체 로드맵을 정의합니다.
> 각 Phase의 상세 구현 계획은 별도 문서로 관리됩니다.

**Goal:** 바람의나라 스타일 2.5D 탑다운 RPG 예제 게임 구현

**Architecture:** SceneApplication + Object/Component 패턴 사용. 씬 스택으로 타이틀/게임/게임오버 관리. 컴포넌트로 플레이어/몬스터 로직 분리.

**Tech Stack:** you-engine (ES6 모듈), Canvas 2D API, 도형 기반 프로토타입 그래픽

---

## Phase 1: 프로젝트 기초 설정

### Task 1: 프로젝트 구조 및 진입점

**Files:**
- Create: `examples/mini-rpg/index.html`
- Create: `examples/mini-rpg/scripts/main.js`
- Create: `examples/mini-rpg/scripts/game.js`
- Create: `examples/mini-rpg/styles/style.css`

**Step 1: HTML 파일 작성**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mini RPG</title>
  <link rel="stylesheet" href="styles/style.css">
</head>
<body>
  <canvas id="game"></canvas>
  <script type="module" src="scripts/main.js"></script>
</body>
</html>
```

**Step 2: CSS 파일 작성**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #1a1a2e;
}

canvas {
  border: 2px solid #4a4a6a;
  background: #2d2d44;
}
```

**Step 3: main.js 작성**

```javascript
import { You } from '../../../you/you.js'
import { MiniRPG } from './game.js'

You.run({
  screens: {
    main: {
      canvas: document.querySelector('#game'),
      size: [800, 600]
    }
  },
  applications: [new MiniRPG({ mainScreen: 'main' })]
})
```

**Step 4: game.js 기본 구조 작성**

```javascript
import { SceneApplication } from '../../../you/application.js'

export class MiniRPG extends SceneApplication {
  didCreate() {
    console.log('MiniRPG started')
  }
}
```

**Step 5: 브라우저에서 확인**

파일: `examples/mini-rpg/index.html`을 브라우저에서 열기
Expected: 콘솔에 "MiniRPG started" 출력, 800x600 캔버스 표시

**Step 6: Commit**

```bash
git add examples/mini-rpg/
git commit -m "feat(examples): mini-rpg 프로젝트 기초 구조 설정"
```

---

### Task 2: 게임 씬 기본 구조

**Files:**
- Create: `examples/mini-rpg/scripts/scenes/game-scene.js`
- Modify: `examples/mini-rpg/scripts/game.js`

**Step 1: GameScene 클래스 작성**

```javascript
import { Scene } from '../../../../you/scene.js'

export class GameScene extends Scene {
  willCreate() {
    this.mapSize = [1600, 1200]
  }

  didCreate() {
    console.log('GameScene created')
  }

  didUpdate(deltaTime, events, input) {
    // 게임 로직
  }

  didRender(context) {
    // 배경 렌더링
    context.fillStyle = '#3d5a3d'
    context.fillRect(0, 0, this.mapSize[0], this.mapSize[1])
  }
}
```

**Step 2: game.js에서 GameScene 사용**

```javascript
import { SceneApplication } from '../../../you/application.js'
import { GameScene } from './scenes/game-scene.js'

export class MiniRPG extends SceneApplication {
  didCreate() {
    this.push(new GameScene())
  }
}
```

**Step 3: 브라우저에서 확인**

Expected: 초록색 배경 렌더링, 콘솔에 "GameScene created"

**Step 4: Commit**

```bash
git add examples/mini-rpg/scripts/
git commit -m "feat(examples): mini-rpg 게임 씬 기본 구조"
```

---

## Phase 2: 플레이어 시스템

### Task 3: 플레이어 오브젝트 및 이동

**Files:**
- Create: `examples/mini-rpg/scripts/objects/player.js`
- Create: `examples/mini-rpg/scripts/components/player-controller.js`
- Create: `examples/mini-rpg/scripts/components/shape-renderer.js`
- Modify: `examples/mini-rpg/scripts/scenes/game-scene.js`

**Step 1: ShapeRenderer 컴포넌트 작성**

```javascript
import { Component } from '../../../../you/component.js'

export class ShapeRenderer extends Component {
  constructor({
    shape = 'circle',
    size = 32,
    color = '#ffffff',
    strokeColor = null,
    strokeWidth = 0
  } = {}) {
    super()
    this.shape = shape
    this.size = size
    this.color = color
    this.strokeColor = strokeColor
    this.strokeWidth = strokeWidth
  }

  didRender(context) {
    const pos = this.object.position
    const halfSize = this.size / 2

    context.save()
    context.translate(pos[0], pos[1])

    if (this.shape === 'circle') {
      context.beginPath()
      context.arc(0, 0, halfSize, 0, Math.PI * 2)
      context.fillStyle = this.color
      context.fill()
      if (this.strokeColor) {
        context.strokeStyle = this.strokeColor
        context.lineWidth = this.strokeWidth
        context.stroke()
      }
    } else if (this.shape === 'rect') {
      context.fillStyle = this.color
      context.fillRect(-halfSize, -halfSize, this.size, this.size)
      if (this.strokeColor) {
        context.strokeStyle = this.strokeColor
        context.lineWidth = this.strokeWidth
        context.strokeRect(-halfSize, -halfSize, this.size, this.size)
      }
    }

    context.restore()
  }
}
```

**Step 2: PlayerController 컴포넌트 작성**

```javascript
import { Component } from '../../../../you/component.js'

export class PlayerController extends Component {
  constructor({ speed = 150 } = {}) {
    super()
    this.speed = speed
    this.direction = [0, 0]
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
    pos[0] += dir[0] * this.speed * deltaTime
    pos[1] += dir[1] * this.speed * deltaTime
  }
}
```

**Step 3: Player 오브젝트 작성**

```javascript
import { Object } from '../../../../you/object.js'
import { PlayerController } from '../components/player-controller.js'
import { ShapeRenderer } from '../components/shape-renderer.js'

export function createPlayer(x, y) {
  const player = new Object({
    name: 'player',
    components: [
      new PlayerController({ speed: 150 }),
      new ShapeRenderer({
        shape: 'circle',
        size: 32,
        color: '#4a90d9',
        strokeColor: '#2a5a99',
        strokeWidth: 3
      })
    ]
  })

  player.position = [x, y]

  return player
}
```

**Step 4: GameScene에 플레이어 추가**

```javascript
import { Scene } from '../../../../you/scene.js'
import { createPlayer } from '../objects/player.js'

export class GameScene extends Scene {
  willCreate() {
    this.mapSize = [1600, 1200]
  }

  didCreate() {
    const player = createPlayer(400, 300)
    this.add(player)

    // 카메라가 플레이어를 따라가도록
    this.player = player
  }

  didUpdate(deltaTime, events, input) {
    // 카메라 플레이어 추적
    if (this.camera && this.player) {
      this.camera.position[0] = this.player.position[0]
      this.camera.position[1] = this.player.position[1]
    }
  }

  didRender(context) {
    context.fillStyle = '#3d5a3d'
    context.fillRect(0, 0, this.mapSize[0], this.mapSize[1])
  }
}
```

**Step 5: 브라우저에서 확인**

Expected: 파란색 원 플레이어, WASD/화살표로 이동, 카메라 추적

**Step 6: Commit**

```bash
git add examples/mini-rpg/scripts/
git commit -m "feat(examples): mini-rpg 플레이어 이동 구현"
```

---

### Task 4: 플레이어 맵 경계 제한

**Files:**
- Modify: `examples/mini-rpg/scripts/components/player-controller.js`
- Modify: `examples/mini-rpg/scripts/scenes/game-scene.js`

**Step 1: PlayerController에 경계 제한 추가**

```javascript
import { Component } from '../../../../you/component.js'

export class PlayerController extends Component {
  constructor({ speed = 150, bounds = null } = {}) {
    super()
    this.speed = speed
    this.direction = [0, 0]
    this.bounds = bounds // { minX, minY, maxX, maxY }
  }

  setBounds(minX, minY, maxX, maxY) {
    this.bounds = { minX, minY, maxX, maxY }
  }

  didUpdate(deltaTime, events, input) {
    const dir = [0, 0]

    if (input.keys.has('w') || input.keys.has('ArrowUp')) dir[1] = -1
    if (input.keys.has('s') || input.keys.has('ArrowDown')) dir[1] = 1
    if (input.keys.has('a') || input.keys.has('ArrowLeft')) dir[0] = -1
    if (input.keys.has('d') || input.keys.has('ArrowRight')) dir[0] = 1

    const length = Math.sqrt(dir[0] * dir[0] + dir[1] * dir[1])
    if (length > 0) {
      dir[0] /= length
      dir[1] /= length
    }

    this.direction = dir

    const pos = this.object.position
    pos[0] += dir[0] * this.speed * deltaTime
    pos[1] += dir[1] * this.speed * deltaTime

    // 경계 제한
    if (this.bounds) {
      const halfSize = 16 // 플레이어 반지름
      pos[0] = Math.max(this.bounds.minX + halfSize, Math.min(this.bounds.maxX - halfSize, pos[0]))
      pos[1] = Math.max(this.bounds.minY + halfSize, Math.min(this.bounds.maxY - halfSize, pos[1]))
    }
  }
}
```

**Step 2: GameScene에서 경계 설정**

```javascript
didCreate() {
  const player = createPlayer(400, 300)
  this.add(player)

  // 경계 설정
  const controller = player.findComponent(PlayerController)
  controller.setBounds(0, 0, this.mapSize[0], this.mapSize[1])

  this.player = player
}
```

**Step 3: 브라우저에서 확인**

Expected: 플레이어가 맵 경계를 벗어나지 않음

**Step 4: Commit**

```bash
git add examples/mini-rpg/scripts/
git commit -m "feat(examples): mini-rpg 플레이어 경계 제한"
```

---

## Phase 3: 몬스터 시스템

### Task 5: 몬스터 기본 구조

**Files:**
- Create: `examples/mini-rpg/scripts/objects/enemy.js`
- Create: `examples/mini-rpg/scripts/components/enemy-ai.js`
- Modify: `examples/mini-rpg/scripts/scenes/game-scene.js`

**Step 1: EnemyAI 컴포넌트 작성**

```javascript
import { Component } from '../../../../you/component.js'

export class EnemyAI extends Component {
  constructor({
    speed = 50,
    detectionRange = 150,
    attackRange = 30
  } = {}) {
    super()
    this.speed = speed
    this.detectionRange = detectionRange
    this.attackRange = attackRange
    this.target = null
    this.state = 'idle' // idle, chase, attack
  }

  setTarget(target) {
    this.target = target
  }

  didUpdate(deltaTime) {
    if (!this.target) return

    const pos = this.object.position
    const targetPos = this.target.position

    const dx = targetPos[0] - pos[0]
    const dy = targetPos[1] - pos[1]
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < this.attackRange) {
      this.state = 'attack'
    } else if (distance < this.detectionRange) {
      this.state = 'chase'
      // 플레이어 방향으로 이동
      const dirX = dx / distance
      const dirY = dy / distance
      pos[0] += dirX * this.speed * deltaTime
      pos[1] += dirY * this.speed * deltaTime
    } else {
      this.state = 'idle'
    }
  }
}
```

**Step 2: Enemy 팩토리 함수 작성**

```javascript
import { Object } from '../../../../you/object.js'
import { EnemyAI } from '../components/enemy-ai.js'
import { ShapeRenderer } from '../components/shape-renderer.js'

export function createMushroom(x, y) {
  const enemy = new Object({
    name: 'mushroom',
    tags: ['enemy'],
    components: [
      new EnemyAI({ speed: 40, detectionRange: 120, attackRange: 25 }),
      new ShapeRenderer({
        shape: 'circle',
        size: 28,
        color: '#d94a4a',
        strokeColor: '#992a2a',
        strokeWidth: 2
      })
    ]
  })

  enemy.position = [x, y]

  return enemy
}

export function createAnt(x, y) {
  const enemy = new Object({
    name: 'ant',
    tags: ['enemy'],
    components: [
      new EnemyAI({ speed: 80, detectionRange: 100, attackRange: 20 }),
      new ShapeRenderer({
        shape: 'circle',
        size: 20,
        color: '#2a2a2a',
        strokeColor: '#1a1a1a',
        strokeWidth: 2
      })
    ]
  })

  enemy.position = [x, y]

  return enemy
}
```

**Step 3: GameScene에 몬스터 추가**

```javascript
import { createMushroom, createAnt } from '../objects/enemy.js'
import { EnemyAI } from '../components/enemy-ai.js'

didCreate() {
  const player = createPlayer(400, 300)
  this.add(player)

  const controller = player.findComponent(PlayerController)
  controller.setBounds(0, 0, this.mapSize[0], this.mapSize[1])

  this.player = player

  // 몬스터 추가
  this.spawnEnemies()
}

spawnEnemies() {
  const enemies = [
    createMushroom(600, 400),
    createMushroom(700, 500),
    createAnt(500, 200),
    createAnt(800, 300),
    createAnt(550, 350)
  ]

  for (const enemy of enemies) {
    const ai = enemy.findComponent(EnemyAI)
    ai.setTarget(this.player)
    this.add(enemy)
  }
}
```

**Step 4: 브라우저에서 확인**

Expected: 빨간 버섯, 검은 개미 표시, 플레이어 접근 시 추적

**Step 5: Commit**

```bash
git add examples/mini-rpg/scripts/
git commit -m "feat(examples): mini-rpg 몬스터 AI 구현"
```

---

## Phase 4: 전투 시스템

### Task 6: 스탯 컴포넌트

**Files:**
- Create: `examples/mini-rpg/scripts/components/stats.js`
- Modify: `examples/mini-rpg/scripts/objects/player.js`
- Modify: `examples/mini-rpg/scripts/objects/enemy.js`

**Step 1: Stats 컴포넌트 작성**

```javascript
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
    this.maxHp = maxHp
    this._hp = hp ?? maxHp
    this.attack = attack
    this.defense = defense
    this.level = level
    this.exp = exp
    this.event = new EventEmitter(this)
  }

  get hp() { return this._hp }

  set hp(value) {
    const prev = this._hp
    this._hp = Math.max(0, Math.min(this.maxHp, value))
    if (this._hp !== prev) {
      this.event.emit('hpChange', this._hp, prev)
    }
    if (this._hp <= 0 && prev > 0) {
      this.event.emit('death')
    }
  }

  get alive() { return this._hp > 0 }

  takeDamage(amount, attacker = null) {
    const damage = Math.max(1, amount - this.defense)
    this.hp -= damage
    this.event.emit('damage', damage, attacker)
    return damage
  }

  heal(amount) {
    const healed = Math.min(amount, this.maxHp - this._hp)
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
    this.maxHp += 10
    this.attack += 2
    this.defense += 1
    this.hp = this.maxHp
    this.event.emit('levelUp', this.level)
  }
}
```

**Step 2: Player에 Stats 추가**

```javascript
import { Stats } from '../components/stats.js'

export function createPlayer(x, y) {
  const player = new Object({
    name: 'player',
    components: [
      new Stats({ maxHp: 100, attack: 15, defense: 5 }),
      new PlayerController({ speed: 150 }),
      new ShapeRenderer({
        shape: 'circle',
        size: 32,
        color: '#4a90d9',
        strokeColor: '#2a5a99',
        strokeWidth: 3
      })
    ]
  })

  player.position = [x, y]

  return player
}
```

**Step 3: Enemy에 Stats 추가**

```javascript
import { Stats } from '../components/stats.js'

export function createMushroom(x, y) {
  const enemy = new Object({
    name: 'mushroom',
    tags: ['enemy'],
    components: [
      new Stats({ maxHp: 30, attack: 8, defense: 2 }),
      new EnemyAI({ speed: 40, detectionRange: 120, attackRange: 25 }),
      new ShapeRenderer({ /* ... */ })
    ]
  })
  // ...
}

export function createAnt(x, y) {
  const enemy = new Object({
    name: 'ant',
    tags: ['enemy'],
    components: [
      new Stats({ maxHp: 15, attack: 5, defense: 1 }),
      new EnemyAI({ speed: 80, detectionRange: 100, attackRange: 20 }),
      new ShapeRenderer({ /* ... */ })
    ]
  })
  // ...
}
```

**Step 4: Commit**

```bash
git add examples/mini-rpg/scripts/
git commit -m "feat(examples): mini-rpg 스탯 시스템 구현"
```

---

### Task 7: 플레이어 공격

**Files:**
- Create: `examples/mini-rpg/scripts/components/attack-controller.js`
- Modify: `examples/mini-rpg/scripts/objects/player.js`
- Modify: `examples/mini-rpg/scripts/scenes/game-scene.js`

**Step 1: AttackController 컴포넌트 작성**

```javascript
import { Component } from '../../../../you/component.js'
import { Stats } from './stats.js'

export class AttackController extends Component {
  constructor({
    range = 50,
    cooldown = 0.5
  } = {}) {
    super()
    this.range = range
    this.cooldown = cooldown
    this._cooldownTimer = 0
    this._attacking = false
    this._attackDuration = 0.15
    this._attackTimer = 0
  }

  get canAttack() { return this._cooldownTimer <= 0 }
  get attacking() { return this._attacking }

  attack(targets) {
    if (!this.canAttack) return []

    this._cooldownTimer = this.cooldown
    this._attacking = true
    this._attackTimer = this._attackDuration

    const stats = this.object.findComponent(Stats)
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
          const damage = targetStats.takeDamage(stats.attack)
          hits.push({ target, damage })
        }
      }
    }

    return hits
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

**Step 2: Player에 AttackController 추가**

```javascript
import { AttackController } from '../components/attack-controller.js'

export function createPlayer(x, y) {
  const player = new Object({
    name: 'player',
    components: [
      new Stats({ maxHp: 100, attack: 15, defense: 5 }),
      new PlayerController({ speed: 150 }),
      new AttackController({ range: 50, cooldown: 0.4 }),
      new ShapeRenderer({ /* ... */ })
    ]
  })
  // ...
}
```

**Step 3: GameScene에서 공격 처리**

```javascript
import { AttackController } from '../components/attack-controller.js'

didUpdate(deltaTime, events, input) {
  // 카메라 추적
  if (this.camera && this.player) {
    this.camera.position[0] = this.player.position[0]
    this.camera.position[1] = this.player.position[1]
  }

  // 공격 입력
  for (const ev of events) {
    if (ev.type === 'keydown' && (ev.key === ' ' || ev.key === 'j')) {
      this.playerAttack()
    }
  }

  // 죽은 적 제거
  this.removeDeadEnemies()
}

playerAttack() {
  const attackController = this.player.findComponent(AttackController)
  const enemies = this.findAll('enemy') ?? []
  const hits = attackController.attack(enemies)

  for (const hit of hits) {
    console.log(`Hit ${hit.target.name} for ${hit.damage} damage`)
  }
}

removeDeadEnemies() {
  const enemies = this.objects.filter(obj => obj.tags.has('enemy'))
  for (const enemy of enemies) {
    const stats = enemy.findComponent(Stats)
    if (stats && !stats.alive) {
      this.remove(enemy)
    }
  }
}
```

**Step 4: 브라우저에서 확인**

Expected: 스페이스바/J키로 공격, 범위 내 적에게 데미지, 적 사망 시 제거

**Step 5: Commit**

```bash
git add examples/mini-rpg/scripts/
git commit -m "feat(examples): mini-rpg 플레이어 공격 구현"
```

---

### Task 8: 몬스터 공격

**Files:**
- Modify: `examples/mini-rpg/scripts/components/enemy-ai.js`

**Step 1: EnemyAI에 공격 로직 추가**

```javascript
import { Component } from '../../../../you/component.js'
import { Stats } from './stats.js'

export class EnemyAI extends Component {
  constructor({
    speed = 50,
    detectionRange = 150,
    attackRange = 30,
    attackCooldown = 1.0
  } = {}) {
    super()
    this.speed = speed
    this.detectionRange = detectionRange
    this.attackRange = attackRange
    this.attackCooldown = attackCooldown
    this._cooldownTimer = 0
    this.target = null
    this.state = 'idle'
  }

  setTarget(target) {
    this.target = target
  }

  didUpdate(deltaTime) {
    if (!this.target) return

    // 쿨다운 감소
    if (this._cooldownTimer > 0) {
      this._cooldownTimer -= deltaTime
    }

    const pos = this.object.position
    const targetPos = this.target.position

    const dx = targetPos[0] - pos[0]
    const dy = targetPos[1] - pos[1]
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < this.attackRange) {
      this.state = 'attack'
      this.tryAttack()
    } else if (distance < this.detectionRange) {
      this.state = 'chase'
      const dirX = dx / distance
      const dirY = dy / distance
      pos[0] += dirX * this.speed * deltaTime
      pos[1] += dirY * this.speed * deltaTime
    } else {
      this.state = 'idle'
    }
  }

  tryAttack() {
    if (this._cooldownTimer > 0) return

    this._cooldownTimer = this.attackCooldown

    const stats = this.object.findComponent(Stats)
    const targetStats = this.target.findComponent(Stats)

    if (stats && targetStats && targetStats.alive) {
      const damage = targetStats.takeDamage(stats.attack)
      console.log(`${this.object.name} attacks player for ${damage} damage`)
    }
  }
}
```

**Step 2: 브라우저에서 확인**

Expected: 몬스터가 공격 범위 내에서 플레이어에게 데미지

**Step 3: Commit**

```bash
git add examples/mini-rpg/scripts/
git commit -m "feat(examples): mini-rpg 몬스터 공격 구현"
```

---

## Phase 5: UI 시스템

### Task 9: HP 바 표시

**Files:**
- Create: `examples/mini-rpg/scripts/components/hp-bar.js`
- Modify: `examples/mini-rpg/scripts/objects/player.js`
- Modify: `examples/mini-rpg/scripts/objects/enemy.js`

**Step 1: HpBar 컴포넌트 작성**

```javascript
import { Component } from '../../../../you/component.js'
import { Stats } from './stats.js'

export class HpBar extends Component {
  constructor({
    width = 40,
    height = 6,
    offsetY = -25,
    bgColor = '#333333',
    fgColor = '#44dd44',
    lowColor = '#dd4444'
  } = {}) {
    super()
    this.width = width
    this.height = height
    this.offsetY = offsetY
    this.bgColor = bgColor
    this.fgColor = fgColor
    this.lowColor = lowColor
  }

  didRender(context) {
    const stats = this.object.findComponent(Stats)
    if (!stats) return

    const pos = this.object.position
    const x = pos[0] - this.width / 2
    const y = pos[1] + this.offsetY

    // 배경
    context.fillStyle = this.bgColor
    context.fillRect(x, y, this.width, this.height)

    // HP 바
    const ratio = stats.hp / stats.maxHp
    const barWidth = this.width * ratio
    context.fillStyle = ratio > 0.3 ? this.fgColor : this.lowColor
    context.fillRect(x, y, barWidth, this.height)
  }
}
```

**Step 2: Player에 HpBar 추가**

```javascript
import { HpBar } from '../components/hp-bar.js'

export function createPlayer(x, y) {
  const player = new Object({
    name: 'player',
    components: [
      new Stats({ maxHp: 100, attack: 15, defense: 5 }),
      new PlayerController({ speed: 150 }),
      new AttackController({ range: 50, cooldown: 0.4 }),
      new ShapeRenderer({ /* ... */ }),
      new HpBar({ width: 40, height: 6, offsetY: -25 })
    ]
  })
  // ...
}
```

**Step 3: Enemy에 HpBar 추가**

```javascript
import { HpBar } from '../components/hp-bar.js'

// createMushroom, createAnt에 각각 추가
new HpBar({ width: 30, height: 4, offsetY: -20 })
```

**Step 4: 브라우저에서 확인**

Expected: 플레이어와 몬스터 위에 HP 바 표시, 데미지 시 감소

**Step 5: Commit**

```bash
git add examples/mini-rpg/scripts/
git commit -m "feat(examples): mini-rpg HP 바 표시"
```

---

### Task 10: 게임 UI (HUD)

**Files:**
- Create: `examples/mini-rpg/scripts/ui/hud.js`
- Modify: `examples/mini-rpg/scripts/scenes/game-scene.js`

**Step 1: HUD 클래스 작성**

```javascript
import { View } from '../../../../you/ui/view.js'
import { Stats } from '../components/stats.js'

export class HUD extends View {
  constructor() {
    super()
    this.player = null
  }

  setPlayer(player) {
    this.player = player
  }

  didRender(context, screen) {
    if (!this.player) return

    const stats = this.player.findComponent(Stats)
    if (!stats) return

    const padding = 20

    // HP 바 (좌상단)
    this.renderHpBar(context, padding, padding, stats)

    // 레벨/경험치 (HP 바 아래)
    this.renderLevelInfo(context, padding, padding + 30, stats)
  }

  renderHpBar(context, x, y, stats) {
    const width = 200
    const height = 20

    // 라벨
    context.fillStyle = '#ffffff'
    context.font = '14px Arial'
    context.fillText('HP', x, y + 14)

    // 배경
    const barX = x + 30
    context.fillStyle = '#333333'
    context.fillRect(barX, y, width, height)

    // HP
    const ratio = stats.hp / stats.maxHp
    context.fillStyle = ratio > 0.3 ? '#44dd44' : '#dd4444'
    context.fillRect(barX, y, width * ratio, height)

    // 테두리
    context.strokeStyle = '#ffffff'
    context.lineWidth = 2
    context.strokeRect(barX, y, width, height)

    // 수치
    context.fillStyle = '#ffffff'
    context.fillText(`${stats.hp}/${stats.maxHp}`, barX + width + 10, y + 14)
  }

  renderLevelInfo(context, x, y, stats) {
    context.fillStyle = '#ffffff'
    context.font = '14px Arial'
    context.fillText(`Lv.${stats.level}`, x, y + 14)

    // 경험치 바
    const expToLevel = stats.level * 100
    const expRatio = stats.exp / expToLevel
    const barX = x + 50
    const width = 100
    const height = 10

    context.fillStyle = '#333333'
    context.fillRect(barX, y + 5, width, height)

    context.fillStyle = '#4488dd'
    context.fillRect(barX, y + 5, width * expRatio, height)
  }
}
```

**Step 2: GameScene에 HUD 추가**

```javascript
import { HUD } from '../ui/hud.js'

didCreate() {
  const player = createPlayer(400, 300)
  this.add(player)
  // ...

  // HUD 추가
  const hud = new HUD()
  hud.setPlayer(player)
  this.add(hud)

  this.player = player
}
```

**Step 3: 브라우저에서 확인**

Expected: 좌상단에 HP 바, 레벨, 경험치 표시

**Step 4: Commit**

```bash
git add examples/mini-rpg/scripts/
git commit -m "feat(examples): mini-rpg HUD 구현"
```

---

## Phase 6: 게임 진행

### Task 11: 경험치 및 레벨업

**Files:**
- Modify: `examples/mini-rpg/scripts/scenes/game-scene.js`
- Modify: `examples/mini-rpg/scripts/objects/enemy.js`

**Step 1: Enemy에 경험치 보상 추가**

```javascript
// enemy.js - 각 몬스터 팩토리에 expReward 속성 추가

export function createMushroom(x, y) {
  const enemy = new Object({ /* ... */ })
  enemy.position = [x, y]
  enemy.expReward = 25 // 경험치 보상
  return enemy
}

export function createAnt(x, y) {
  const enemy = new Object({ /* ... */ })
  enemy.position = [x, y]
  enemy.expReward = 15
  return enemy
}
```

**Step 2: GameScene에서 경험치 획득 처리**

```javascript
playerAttack() {
  const attackController = this.player.findComponent(AttackController)
  const enemies = this.objects.filter(obj => obj.tags.has('enemy'))
  const hits = attackController.attack(enemies)

  for (const hit of hits) {
    const targetStats = hit.target.findComponent(Stats)
    if (!targetStats.alive) {
      // 경험치 획득
      const playerStats = this.player.findComponent(Stats)
      playerStats.addExp(hit.target.expReward || 10)
      console.log(`Gained ${hit.target.expReward} EXP`)
    }
  }
}
```

**Step 3: 레벨업 이벤트 리스닝**

```javascript
didCreate() {
  const player = createPlayer(400, 300)
  this.add(player)

  // 레벨업 이벤트
  const playerStats = player.findComponent(Stats)
  playerStats.event.on('levelUp', (level) => {
    console.log(`Level Up! Now level ${level}`)
    // 레벨업 이펙트 (추후 추가)
  })

  // ...
}
```

**Step 4: 브라우저에서 확인**

Expected: 적 처치 시 경험치 획득, 경험치 바 증가, 레벨업 시 스탯 증가

**Step 5: Commit**

```bash
git add examples/mini-rpg/scripts/
git commit -m "feat(examples): mini-rpg 경험치/레벨업 시스템"
```

---

### Task 12: 게임 오버 및 재시작

**Files:**
- Create: `examples/mini-rpg/scripts/scenes/gameover-scene.js`
- Modify: `examples/mini-rpg/scripts/scenes/game-scene.js`

**Step 1: GameOverScene 작성**

```javascript
import { Scene } from '../../../../you/scene.js'

export class GameOverScene extends Scene {
  didRender(context, screen) {
    // 배경
    context.fillStyle = 'rgba(0, 0, 0, 0.8)'
    context.fillRect(0, 0, screen.width, screen.height)

    // 텍스트
    context.fillStyle = '#dd4444'
    context.font = 'bold 48px Arial'
    context.textAlign = 'center'
    context.fillText('GAME OVER', screen.width / 2, screen.height / 2 - 30)

    context.fillStyle = '#ffffff'
    context.font = '24px Arial'
    context.fillText('Press SPACE to restart', screen.width / 2, screen.height / 2 + 30)

    context.textAlign = 'left'
  }

  didUpdate(deltaTime, events) {
    for (const ev of events) {
      if (ev.type === 'keydown' && ev.key === ' ') {
        this.transit(new (require('./game-scene.js').GameScene)())
      }
    }
  }
}
```

**Step 2: GameScene에서 플레이어 사망 처리**

```javascript
import { GameOverScene } from './gameover-scene.js'

didCreate() {
  const player = createPlayer(400, 300)
  this.add(player)

  // 플레이어 사망 이벤트
  const playerStats = player.findComponent(Stats)
  playerStats.event.on('death', () => {
    this.gameOver()
  })

  // ...
}

gameOver() {
  // 약간의 딜레이 후 게임오버 씬으로 전환
  setTimeout(() => {
    this.transit(new GameOverScene())
  }, 500)
}
```

**Step 3: GameOverScene import 순환 참조 해결**

```javascript
// gameover-scene.js
import { Scene } from '../../../../you/scene.js'
import { GameScene } from './game-scene.js'

export class GameOverScene extends Scene {
  // ...
  didUpdate(deltaTime, events) {
    for (const ev of events) {
      if (ev.type === 'keydown' && ev.key === ' ') {
        this.transit(new GameScene())
      }
    }
  }
}
```

**Step 4: 브라우저에서 확인**

Expected: HP 0 시 게임오버 화면, 스페이스바로 재시작

**Step 5: Commit**

```bash
git add examples/mini-rpg/scripts/
git commit -m "feat(examples): mini-rpg 게임오버/재시작"
```

---

## Phase 7: 마무리

### Task 13: 적 리스폰 시스템

**Files:**
- Modify: `examples/mini-rpg/scripts/scenes/game-scene.js`

**Step 1: 리스폰 로직 추가**

```javascript
willCreate() {
  this.mapSize = [1600, 1200]
  this.respawnTimer = 0
  this.respawnInterval = 5 // 5초마다 리스폰 체크
  this.maxEnemies = 10
}

didUpdate(deltaTime, events, input) {
  // ... 기존 로직

  // 리스폰 체크
  this.respawnTimer += deltaTime
  if (this.respawnTimer >= this.respawnInterval) {
    this.respawnTimer = 0
    this.checkRespawn()
  }
}

checkRespawn() {
  const enemies = this.objects.filter(obj => obj.tags.has('enemy'))
  const count = enemies.length

  if (count < this.maxEnemies) {
    const toSpawn = Math.min(3, this.maxEnemies - count)
    for (let i = 0; i < toSpawn; i++) {
      this.spawnRandomEnemy()
    }
  }
}

spawnRandomEnemy() {
  // 플레이어로부터 일정 거리 떨어진 곳에 스폰
  const playerPos = this.player.position
  let x, y, attempts = 0

  do {
    x = Math.random() * this.mapSize[0]
    y = Math.random() * this.mapSize[1]
    const dx = x - playerPos[0]
    const dy = y - playerPos[1]
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > 200) break
    attempts++
  } while (attempts < 10)

  const enemy = Math.random() > 0.4 ? createMushroom(x, y) : createAnt(x, y)
  const ai = enemy.findComponent(EnemyAI)
  ai.setTarget(this.player)
  this.add(enemy)
}
```

**Step 2: 브라우저에서 확인**

Expected: 적 처치 후 일정 시간 뒤 새 적 등장

**Step 3: Commit**

```bash
git add examples/mini-rpg/scripts/
git commit -m "feat(examples): mini-rpg 적 리스폰 시스템"
```

---

### Task 14: 공격 이펙트

**Files:**
- Modify: `examples/mini-rpg/scripts/components/attack-controller.js`
- Modify: `examples/mini-rpg/scripts/components/shape-renderer.js`

**Step 1: 공격 시 시각적 피드백 추가**

```javascript
// shape-renderer.js
export class ShapeRenderer extends Component {
  constructor(options = {}) {
    super()
    // ... 기존 속성
    this.flashColor = null
    this.flashDuration = 0
  }

  flash(color, duration = 0.1) {
    this.flashColor = color
    this.flashDuration = duration
  }

  didUpdate(deltaTime) {
    if (this.flashDuration > 0) {
      this.flashDuration -= deltaTime
      if (this.flashDuration <= 0) {
        this.flashColor = null
      }
    }
  }

  didRender(context) {
    const pos = this.object.position
    const halfSize = this.size / 2
    const color = this.flashColor || this.color

    // ... 나머지 렌더링 로직에서 this.color 대신 color 사용
  }
}
```

**Step 2: 피격 시 플래시 효과**

```javascript
// game-scene.js
playerAttack() {
  // ... 기존 로직
  for (const hit of hits) {
    // 피격 이펙트
    const renderer = hit.target.findComponent(ShapeRenderer)
    if (renderer) {
      renderer.flash('#ffffff', 0.1)
    }
    // ...
  }
}
```

**Step 3: 브라우저에서 확인**

Expected: 공격 시 피격 대상이 흰색으로 깜빡임

**Step 4: Commit**

```bash
git add examples/mini-rpg/scripts/
git commit -m "feat(examples): mini-rpg 공격 이펙트"
```

---

### Task 15: 최종 정리 및 테스트

**Files:**
- Review: 모든 파일

**Step 1: 코드 정리**

- console.log 제거 또는 정리
- 미사용 import 제거
- 주석 정리

**Step 2: 전체 플레이 테스트**

체크리스트:
- [ ] 플레이어 4방향 이동
- [ ] 맵 경계 제한
- [ ] 카메라 플레이어 추적
- [ ] 몬스터 추적 AI
- [ ] 플레이어 공격 (스페이스/J)
- [ ] 몬스터 공격
- [ ] HP 바 표시
- [ ] HUD (HP, 레벨, 경험치)
- [ ] 경험치 획득 및 레벨업
- [ ] 게임오버 및 재시작
- [ ] 적 리스폰

**Step 3: 최종 Commit**

```bash
git add examples/mini-rpg/
git commit -m "feat(examples): mini-rpg 예제 게임 완성"
```

---

## 파일 구조 (최종)

```
examples/mini-rpg/
├── index.html
├── docs/
│   ├── game-design.md
│   └── implementation-plan.md
├── scripts/
│   ├── main.js
│   ├── game.js
│   ├── components/
│   │   ├── attack-controller.js
│   │   ├── enemy-ai.js
│   │   ├── hp-bar.js
│   │   ├── player-controller.js
│   │   ├── shape-renderer.js
│   │   └── stats.js
│   ├── objects/
│   │   ├── enemy.js
│   │   └── player.js
│   ├── scenes/
│   │   ├── game-scene.js
│   │   └── gameover-scene.js
│   └── ui/
│       └── hud.js
└── styles/
    └── style.css
```
