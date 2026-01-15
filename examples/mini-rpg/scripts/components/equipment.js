import { Component } from '../../../../you/component.js'
import { EventEmitter } from '../../../../you/utilities/event.js'

export class Equipment extends Component {
  constructor() {
    super()
    this._slots = {
      weapon: null,
      armor: null,
      accessory: null
    }
    this.event = new EventEmitter(this)
  }

  getSlot(slotName) {
    return this._slots[slotName] ?? null
  }

  equip(itemData) {
    const slot = itemData.slot
    if (!(slot in this._slots)) {
      return { success: false, unequipped: null }
    }

    const prev = this._slots[slot]
    this._slots[slot] = itemData

    this.event.emit('equipped', slot, itemData, prev)

    return { success: true, unequipped: prev }
  }

  unequip(slotName) {
    if (!(slotName in this._slots)) return null

    const item = this._slots[slotName]
    this._slots[slotName] = null

    if (item) {
      this.event.emit('unequipped', slotName, item)
    }

    return item
  }

  getTotalBonus() {
    const bonus = {}

    for (const item of Object.values(this._slots)) {
      if (item && item.stats) {
        for (const [stat, value] of Object.entries(item.stats)) {
          bonus[stat] = (bonus[stat] || 0) + value
        }
      }
    }

    return bonus
  }

  getEquippedItems() {
    return { ...this._slots }
  }

  isSlotEmpty(slotName) {
    return this._slots[slotName] === null
  }
}
