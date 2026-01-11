import { View } from '../../../../you/ui/view.js'
import { Inventory } from '../components/inventory.js'
import { Equipment } from '../components/equipment.js'
import { Stats } from '../components/stats.js'

export class InventoryUI extends View {
  constructor() {
    super()
    this.player = null
    this.visible = false
    this.selectedSlot = 0
    this.slotSize = 48
    this.padding = 10
    this.cols = 5
  }

  setPlayer(player) {
    this.player = player
  }

  toggle() {
    this.visible = !this.visible
  }

  show() {
    this.visible = true
  }

  hide() {
    this.visible = false
  }

  selectSlot(index) {
    const inventory = this.player?.findComponent(Inventory)
    if (inventory && index >= 0 && index < inventory.maxSlots) {
      this.selectedSlot = index
    }
  }

  useSelectedItem() {
    if (!this.player) return null

    const inventory = this.player.findComponent(Inventory)
    const equipment = this.player.findComponent(Equipment)
    const stats = this.player.findComponent(Stats)

    const slot = inventory.getSlotAt(this.selectedSlot)
    if (!slot) return null

    const itemData = slot.itemData

    // 소비 아이템
    if (itemData.type === 'consumable') {
      return this.useConsumable(inventory, stats, slot)
    }

    // 장비 아이템
    if (['weapon', 'armor', 'accessory'].includes(itemData.type)) {
      return this.equipItem(inventory, equipment, slot)
    }

    return null
  }

  useConsumable(inventory, stats, slot) {
    const effect = slot.itemData.effect
    let used = false

    switch (effect.type) {
      case 'heal':
        if (stats.hp < stats.totalMaxHp) {
          stats.heal(effect.value)
          used = true
        }
        break
      case 'expand_inventory':
        inventory.expandSlots(effect.value)
        used = true
        break
    }

    if (used) {
      inventory.removeItem(slot.itemId, 1)
      return { type: 'used', item: slot.itemData }
    }

    return null
  }

  equipItem(inventory, equipment, slot) {
    const itemData = slot.itemData

    // 인벤토리에서 제거
    inventory.removeItem(slot.itemId, 1)

    // 장비 장착 (기존 장비는 인벤토리로)
    const result = equipment.equip(itemData)

    if (result.unequipped) {
      inventory.addItem(result.unequipped.id, 1, result.unequipped)
    }

    return { type: 'equipped', item: itemData, unequipped: result.unequipped }
  }

  unequipSlot(slotName) {
    if (!this.player) return null

    const inventory = this.player.findComponent(Inventory)
    const equipment = this.player.findComponent(Equipment)

    const item = equipment.unequip(slotName)
    if (item) {
      const success = inventory.addItem(item.id, 1, item)
      if (!success) {
        // 인벤토리 꽉 참 - 다시 장착
        equipment.equip(item)
        return null
      }
      return { type: 'unequipped', item }
    }
    return null
  }

  didRender(context, screen) {
    if (!this.visible || !this.player) return

    const inventory = this.player.findComponent(Inventory)
    const equipment = this.player.findComponent(Equipment)
    if (!inventory) return

    // 배경
    const width = this.cols * (this.slotSize + this.padding) + this.padding
    const rows = Math.ceil(inventory.maxSlots / this.cols)
    const height = rows * (this.slotSize + this.padding) + this.padding + 100 // 장비 슬롯 공간

    const x = (screen.width - width) / 2
    const y = (screen.height - height) / 2

    // 반투명 배경
    context.fillStyle = 'rgba(0, 0, 0, 0.85)'
    context.fillRect(x, y, width, height)
    context.strokeStyle = '#666666'
    context.lineWidth = 2
    context.strokeRect(x, y, width, height)

    // 제목
    context.fillStyle = '#ffffff'
    context.font = 'bold 16px Arial'
    context.fillText('인벤토리', x + this.padding, y + 20)

    // 장비 슬롯 (상단)
    this.renderEquipmentSlots(context, x + this.padding, y + 35, equipment)

    // 인벤토리 슬롯
    const inventoryStartY = y + 95
    this.renderInventorySlots(context, x + this.padding, inventoryStartY, inventory)

    // 선택된 아이템 정보
    const selectedItem = inventory.getSlotAt(this.selectedSlot)
    if (selectedItem) {
      this.renderItemInfo(context, x + this.padding, y + height - 40, selectedItem.itemData)
    }
  }

  renderEquipmentSlots(context, startX, startY, equipment) {
    const slots = ['weapon', 'armor', 'accessory']
    const labels = ['무기', '방어구', '악세서리']

    for (let i = 0; i < slots.length; i++) {
      const x = startX + i * (this.slotSize + this.padding)
      const y = startY
      const item = equipment?.getSlot(slots[i])

      // 슬롯 배경
      context.fillStyle = item ? '#444466' : '#333344'
      context.fillRect(x, y, this.slotSize, this.slotSize)
      context.strokeStyle = '#666688'
      context.strokeRect(x, y, this.slotSize, this.slotSize)

      // 라벨
      context.fillStyle = '#888888'
      context.font = '10px Arial'
      context.fillText(labels[i], x + 2, y + this.slotSize + 12)

      // 아이템
      if (item) {
        this.renderItemInSlot(context, x, y, item)
      }
    }
  }

  renderInventorySlots(context, startX, startY, inventory) {
    for (let i = 0; i < inventory.maxSlots; i++) {
      const col = i % this.cols
      const row = Math.floor(i / this.cols)
      const x = startX + col * (this.slotSize + this.padding)
      const y = startY + row * (this.slotSize + this.padding)
      const slot = inventory.getSlotAt(i)

      // 슬롯 배경
      const isSelected = i === this.selectedSlot
      context.fillStyle = isSelected ? '#555577' : '#333344'
      context.fillRect(x, y, this.slotSize, this.slotSize)
      context.strokeStyle = isSelected ? '#8888ff' : '#666688'
      context.lineWidth = isSelected ? 2 : 1
      context.strokeRect(x, y, this.slotSize, this.slotSize)

      // 슬롯 번호 (1-9, 0)
      if (i < 10) {
        context.fillStyle = '#666666'
        context.font = '10px Arial'
        context.fillText(String((i + 1) % 10), x + 2, y + 10)
      }

      // 아이템
      if (slot) {
        this.renderItemInSlot(context, x, y, slot.itemData, slot.count)
      }
    }
  }

  renderItemInSlot(context, x, y, itemData, count = 1) {
    // 아이템 색상 표시
    const color = this.getItemColor(itemData.type)
    context.fillStyle = color
    context.fillRect(x + 8, y + 8, this.slotSize - 16, this.slotSize - 16)

    // 수량
    if (count > 1) {
      context.fillStyle = '#ffffff'
      context.font = 'bold 12px Arial'
      context.textAlign = 'right'
      context.fillText(String(count), x + this.slotSize - 4, y + this.slotSize - 4)
      context.textAlign = 'left'
    }
  }

  renderItemInfo(context, x, y, itemData) {
    context.fillStyle = '#cccccc'
    context.font = '12px Arial'
    context.fillText(`${itemData.name} - ${itemData.description || ''}`, x, y)
    context.fillStyle = '#888888'
    context.font = '10px Arial'
    context.fillText('[E] 사용/장착', x, y + 14)
  }

  getItemColor(type) {
    switch (type) {
      case 'consumable': return '#44dd44'
      case 'weapon': return '#dd8844'
      case 'armor': return '#4488dd'
      case 'accessory': return '#dd44dd'
      default: return '#888888'
    }
  }
}
