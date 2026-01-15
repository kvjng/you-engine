import { View } from '../../../../you/ui/view.js'
import { Stats } from '../components/stats.js'
import { Equipment } from '../components/equipment.js'

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
    const equipment = this.player.findComponent(Equipment)
    if (!stats) return

    const padding = 20

    // HP 바 (좌상단)
    this.renderHpBar(context, padding, padding, stats)

    // 레벨/경험치 (HP 바 아래)
    this.renderLevelInfo(context, padding, padding + 30, stats)

    // 장비 정보 (좌측 하단)
    if (equipment) {
      this.renderEquipmentInfo(context, padding, screen.height - 80, equipment)
    }

    // 조작 힌트 (우측 하단)
    this.renderControlHints(context, screen.width - 150, screen.height - 60)
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
    const ratio = stats.hp / stats.totalMaxHp
    context.fillStyle = ratio > 0.3 ? '#44dd44' : '#dd4444'
    context.fillRect(barX, y, width * ratio, height)

    // 테두리
    context.strokeStyle = '#ffffff'
    context.lineWidth = 2
    context.strokeRect(barX, y, width, height)

    // 수치
    context.fillStyle = '#ffffff'
    context.fillText(`${stats.hp}/${stats.totalMaxHp}`, barX + width + 10, y + 14)
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

    // 공격력/방어력 표시
    context.fillStyle = '#ffaa44'
    context.fillText(`ATK: ${stats.totalAttack}`, x + 170, y + 14)
    context.fillStyle = '#44aaff'
    context.fillText(`DEF: ${stats.totalDefense}`, x + 250, y + 14)
  }

  renderEquipmentInfo(context, x, y, equipment) {
    context.fillStyle = '#aaaaaa'
    context.font = '12px Arial'

    const weapon = equipment.getSlot('weapon')
    const armor = equipment.getSlot('armor')
    const accessory = equipment.getSlot('accessory')

    context.fillText(`무기: ${weapon?.name || '없음'}`, x, y)
    context.fillText(`방어구: ${armor?.name || '없음'}`, x, y + 16)
    context.fillText(`악세: ${accessory?.name || '없음'}`, x, y + 32)
  }

  renderControlHints(context, x, y) {
    context.fillStyle = '#888888'
    context.font = '11px Arial'
    context.fillText('[I] 인벤토리', x, y)
    context.fillText('[SPACE/J] 공격', x, y + 14)
    context.fillText('[WASD] 이동', x, y + 28)
  }
}
