import { Scene } from '../../../../you/scene.js'
import { Object } from '../../../../you/object.js'
import { createPlayer } from '../objects/player.js'
import { createMushroom, createAnt } from '../objects/enemy.js'
import { createTree, createRock } from '../objects/structure.js'
import { createFieldItem } from '../objects/field-item.js'
import { PlayerController } from '../components/player-controller.js'
import { EnemyAI } from '../components/enemy-ai.js'
import { AttackController } from '../components/attack-controller.js'
import { Stats } from '../components/stats.js'
import { ShapeRenderer } from '../components/shape-renderer.js'
import { Collider } from '../components/collider.js'
import { TileMap } from '../components/tilemap.js'
import { FieldItemBehavior } from '../components/field-item-behavior.js'
import { Inventory } from '../components/inventory.js'
import { FOREST_MAP } from '../data/maps.js'
import { HUD } from '../ui/hud.js'
import { InventoryUI } from '../ui/inventory-ui.js'
import { GameOverScene } from './gameover-scene.js'

export class GameScene extends Scene {
  willCreate() {
    this.mapSize = [1600, 1200]
    this.respawnTimer = 0
    this.respawnInterval = 5 // 5초마다 리스폰 체크
    this.maxEnemies = 10
    // 외부에서 주입됨 (game.js에서)
    this.itemManager = null
    this.dropTable = null
  }

  didCreate() {
    // 타일맵 오브젝트 생성
    const mapObject = new Object({ name: 'tilemap' })
    this.tilemap = new TileMap({ tiles: FOREST_MAP, tileSize: 16 })
    mapObject.addComponent(this.tilemap)
    mapObject.position = [0, 0]
    this.add(mapObject)

    const player = createPlayer(400, 300)
    this.add(player)

    // 플레이어 경계 설정
    const controller = player.findComponent(PlayerController)
    controller.setBounds(0, 0, this.mapSize[0], this.mapSize[1])

    // 카메라가 플레이어를 따라가도록
    this.player = player

    // 레벨업 이벤트
    const playerStats = player.findComponent(Stats)
    playerStats.event.on('levelUp', (level) => {
      console.log(`Level Up! Now level ${level}`)
    })

    // 플레이어 사망 이벤트
    playerStats.event.on('death', () => {
      this.gameOver()
    })

    this.spawnStructures(30)

    this.spawnEnemies()

    // HUD 추가
    const hud = new HUD()
    hud.setPlayer(player)
    this.add(hud)

    // 인벤토리 UI 추가
    this.inventoryUI = new InventoryUI()
    this.inventoryUI.setPlayer(player)
    this.add(this.inventoryUI)
  }

  spawnStructures(count = 30) {
    const structures = []
    const playerSpawnRadius = 100
    const playerPos = [400, 300] // 플레이어 초기 위치

    let attempts = 0
    const maxAttempts = count * 10

    while (structures.length < count && attempts < maxAttempts) {
      attempts++

      // 랜덤 위치 (맵 가장자리 타일 피하기)
      const margin = 32
      const x = margin + Math.random() * (this.mapSize[0] - margin * 2)
      const y = margin + Math.random() * (this.mapSize[1] - margin * 2)

      // 플레이어 스폰 근처 제외
      const dx = x - playerPos[0]
      const dy = y - playerPos[1]
      if (Math.sqrt(dx * dx + dy * dy) < playerSpawnRadius) continue

      // 타일맵에서 통과 가능한지 확인
      if (!this.tilemap.isPassable(x, y)) continue

      // 기존 구조물과 겹침 검사
      let overlaps = false
      for (const s of structures) {
        const sdx = s.position[0] - x
        const sdy = s.position[1] - y
        if (Math.sqrt(sdx * sdx + sdy * sdy) < 40) {
          overlaps = true
          break
        }
      }
      if (overlaps) continue

      // 나무:바위 = 7:3 비율
      const structure = Math.random() < 0.7 ? createTree(x, y) : createRock(x, y)
      structures.push(structure)
      this.add(structure)
    }
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

  didUpdate(deltaTime, events, input) {
    // 카메라 플레이어 추적
    if (this.camera && this.player) {
      this.camera.position[0] = this.player.position[0]
      this.camera.position[1] = this.player.position[1]
    }

    // 입력 처리
    for (const ev of events) {
      if (ev.type === 'keydown') {
        // 공격
        if (ev.key === ' ' || ev.key === 'j') {
          if (!this.inventoryUI.visible) {
            this.playerAttack()
          }
        }
        // 인벤토리 토글
        if (ev.key === 'i' || ev.key === 'I') {
          this.inventoryUI.toggle()
        }
        // 인벤토리 열려있을 때 조작
        if (this.inventoryUI.visible) {
          // 숫자키로 슬롯 선택
          const num = parseInt(ev.key)
          if (!isNaN(num)) {
            const slot = num === 0 ? 9 : num - 1
            this.inventoryUI.selectSlot(slot)
          }
          // Enter 또는 E로 아이템 사용/장착
          if (ev.key === 'Enter' || ev.key === 'e' || ev.key === 'E') {
            const result = this.inventoryUI.useSelectedItem()
            if (result) {
              console.log('Item action:', result)
            }
          }
        }
      }
    }

    // 죽은 적 제거
    this.removeDeadEnemies()

    // 필드 아이템 타겟 업데이트
    this.updateFieldItems()

    // 리스폰 체크
    this.respawnTimer += deltaTime
    if (this.respawnTimer >= this.respawnInterval) {
      this.respawnTimer = 0
      this.checkRespawn()
    }

    // 렌더링 순서 정렬 (Y 좌표 기준)
    // tilemap은 항상 첫 번째, HUD는 View 클래스라 별도 처리됨
    this.objects.sort((a, b) => {
      // tilemap은 항상 맨 앞
      if (a.name === 'tilemap') return -1
      if (b.name === 'tilemap') return 1

      // 나머지는 Y 좌표 기준 정렬 (낮은 Y가 먼저)
      return a.position[1] - b.position[1]
    })
  }

  playerAttack() {
    const attackController = this.player.findComponent(AttackController)
    const enemies = this.objects.filter(obj => obj.tags.has('enemy'))
    const results = attackController.attack(enemies)

    for (const result of results) {
      if (result.type === 'ranged') {
        // 원거리 공격 - 임시로 범위 내 첫 적 공격
        this.handleRangedAttack(result, enemies)
      } else {
        // 근접 공격 결과
        this.handleMeleeHit(result)
      }
    }
  }

  handleMeleeHit(hit) {
    console.log(`Hit ${hit.target.name} for ${hit.damage} damage`)

    const renderer = hit.target.findComponent(ShapeRenderer)
    if (renderer) {
      renderer.flash('#ffffff', 0.1)
    }

    const targetStats = hit.target.findComponent(Stats)
    if (!targetStats.alive) {
      const playerStats = this.player.findComponent(Stats)
      playerStats.addExp(hit.target.expReward || 10)
      console.log(`Gained ${hit.target.expReward} EXP`)
    }
  }

  handleRangedAttack(attackData, enemies) {
    // Phase 2 전까지 임시 구현: 범위 내 첫 번째 적 공격
    const pos = this.player.position
    const playerStats = this.player.findComponent(Stats)

    for (const enemy of enemies) {
      const targetPos = enemy.position
      const dx = targetPos[0] - pos[0]
      const dy = targetPos[1] - pos[1]
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance <= attackData.range) {
        const targetStats = enemy.findComponent(Stats)
        if (targetStats && targetStats.alive) {
          const damage = targetStats.takeDamage(attackData.damage)
          console.log(`Ranged hit ${enemy.name} for ${damage} damage`)

          const renderer = enemy.findComponent(ShapeRenderer)
          if (renderer) {
            renderer.flash('#ffffff', 0.1)
          }

          if (!targetStats.alive) {
            playerStats.addExp(enemy.expReward || 10)
          }

          // 한 명만 공격 (투사체 구현 전까지)
          break
        }
      }
    }
  }

  removeDeadEnemies() {
    const enemies = this.objects.filter(obj => obj.tags.has('enemy'))
    for (const enemy of enemies) {
      const stats = enemy.findComponent(Stats)
      if (stats && !stats.alive) {
        // 드롭 처리
        this.spawnDrops(enemy)
        this.remove(enemy)
      }
    }
  }

  spawnDrops(enemy) {
    if (!this.dropTable || !this.itemManager) return

    const tableId = enemy.dropTableId || enemy.name
    const drops = this.dropTable.roll(tableId)

    for (const drop of drops) {
      const itemData = this.itemManager.getItem(drop.itemId)
      if (!itemData) continue

      // 약간의 랜덤 오프셋으로 드롭
      const offsetX = (Math.random() - 0.5) * 40
      const offsetY = (Math.random() - 0.5) * 40
      const x = enemy.position[0] + offsetX
      const y = enemy.position[1] + offsetY

      const fieldItem = createFieldItem(x, y, drop.itemId, drop.count, itemData)
      this.setupFieldItemPickup(fieldItem)
      this.add(fieldItem)
    }
  }

  setupFieldItemPickup(fieldItem) {
    const behavior = fieldItem.findComponent(FieldItemBehavior)
    behavior.event.on('pickup', () => {
      this.pickupItem(fieldItem)
    })
    behavior.event.on('expired', () => {
      this.remove(fieldItem)
    })
  }

  pickupItem(fieldItem) {
    const inventory = this.player.findComponent(Inventory)
    const success = inventory.addItem(
      fieldItem.itemId,
      fieldItem.itemCount,
      fieldItem.itemData
    )

    if (success) {
      this.remove(fieldItem)
      console.log(`Picked up ${fieldItem.itemData.name} x${fieldItem.itemCount}`)
    }
  }

  updateFieldItems() {
    const fieldItems = this.objects.filter(obj => obj.tags.has('field-item'))
    for (const item of fieldItems) {
      const behavior = item.findComponent(FieldItemBehavior)
      if (behavior) {
        behavior.setTarget(this.player)
      }
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

  isValidSpawnPosition(x, y, radius) {
    // 타일맵 충돌 체크
    if (!this.tilemap.isPassableCircle(x, y, radius)) {
      return false
    }

    // 구조물 충돌 체크
    const structures = this.objects.filter(obj => obj.tags.has('structure'))
    for (const structure of structures) {
      const collider = structure.findComponent(Collider)
      if (collider && collider.collidesWithCircle(x, y, radius)) {
        return false
      }
    }

    return true
  }

  spawnRandomEnemy() {
    const playerPos = this.player.position
    const enemyRadius = 12
    let x, y, attempts = 0

    do {
      x = Math.random() * this.mapSize[0]
      y = Math.random() * this.mapSize[1]

      // 플레이어와의 거리 체크
      const dx = x - playerPos[0]
      const dy = y - playerPos[1]
      const dist = Math.sqrt(dx * dx + dy * dy)

      // 플레이어와 충분히 멀고 유효한 스폰 위치인지 체크
      if (dist > 200 && this.isValidSpawnPosition(x, y, enemyRadius)) {
        break
      }
      attempts++
    } while (attempts < 20)

    // 유효한 위치를 찾지 못하면 스폰하지 않음
    if (attempts >= 20) return

    const enemy = Math.random() > 0.4 ? createMushroom(x, y) : createAnt(x, y)
    const ai = enemy.findComponent(EnemyAI)
    ai.setTarget(this.player)
    this.add(enemy)
  }

  gameOver() {
    // 약간의 딜레이 후 게임오버 씬으로 전환
    setTimeout(() => {
      this.transit(new GameOverScene())
    }, 500)
  }
}
