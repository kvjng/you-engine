import { Object } from '../../../../you/object.js'
import { EnemyAI } from '../components/enemy-ai.js'
import { ShapeRenderer } from '../components/shape-renderer.js'
import { Stats } from '../components/stats.js'
import { HpBar } from '../components/hp-bar.js'

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
      }),
      new Stats({ maxHp: 30, attack: 8, defense: 2 }),
      new HpBar({ width: 30, height: 4, offsetY: -20 })
    ]
  })

  enemy.position = [x, y]
  enemy.expReward = 25 // 버섯은 25 경험치
  enemy.dropTableId = 'mushroom'

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
      }),
      new Stats({ maxHp: 15, attack: 5, defense: 1 }),
      new HpBar({ width: 30, height: 4, offsetY: -20 })
    ]
  })

  enemy.position = [x, y]
  enemy.expReward = 15 // 개미는 15 경험치
  enemy.dropTableId = 'ant'

  return enemy
}
