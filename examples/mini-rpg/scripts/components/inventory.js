import { Component } from '../../../../you/component.js'
import { EventEmitter } from '../../../../you/utilities/event.js'

export class Inventory extends Component {
  constructor({
    maxSlots = 10,
    maxCapacity = 30
  } = {}) {
    super()
    this._maxSlots = maxSlots
    this._maxCapacity = maxCapacity
    this._slots = [] // { itemId, count, itemData }[]
    this.event = new EventEmitter(this)
  }

  get maxSlots() { return this._maxSlots }
  get maxCapacity() { return this._maxCapacity }
  get usedSlots() { return this._slots.length }
  get isFull() { return this._slots.length >= this._maxSlots }
  get slots() { return this._slots.slice() }

  addItem(itemId, count, itemData) {
    if (itemData.stackable) {
      return this._addStackable(itemId, count, itemData)
    } else {
      return this._addNonStackable(itemId, itemData)
    }
  }

  _addStackable(itemId, count, itemData) {
    let remaining = count

    // 기존 스택에 추가
    for (const slot of this._slots) {
      if (slot.itemId === itemId && slot.count < itemData.maxStack) {
        const canAdd = itemData.maxStack - slot.count
        const toAdd = Math.min(remaining, canAdd)
        slot.count += toAdd
        remaining -= toAdd
        if (remaining <= 0) break
      }
    }

    // 새 슬롯에 추가
    while (remaining > 0 && !this.isFull) {
      const toAdd = Math.min(remaining, itemData.maxStack)
      this._slots.push({ itemId, count: toAdd, itemData })
      remaining -= toAdd
    }

    if (remaining < count) {
      this.event.emit('itemAdded', itemId, count - remaining)
    }

    return remaining < count
  }

  _addNonStackable(itemId, itemData) {
    if (this.isFull) return false

    this._slots.push({ itemId, count: 1, itemData })
    this.event.emit('itemAdded', itemId, 1)
    return true
  }

  removeItem(itemId, count = 1) {
    let remaining = count

    for (let i = this._slots.length - 1; i >= 0 && remaining > 0; i--) {
      const slot = this._slots[i]
      if (slot.itemId === itemId) {
        const toRemove = Math.min(remaining, slot.count)
        slot.count -= toRemove
        remaining -= toRemove

        if (slot.count <= 0) {
          this._slots.splice(i, 1)
        }
      }
    }

    const removed = count - remaining
    if (removed > 0) {
      this.event.emit('itemRemoved', itemId, removed)
    }

    return removed
  }

  findItem(itemId) {
    return this._slots.find(slot => slot.itemId === itemId) ?? null
  }

  getItemCount(itemId) {
    let total = 0
    for (const slot of this._slots) {
      if (slot.itemId === itemId) {
        total += slot.count
      }
    }
    return total
  }

  getSlotAt(index) {
    return this._slots[index] ?? null
  }

  expandSlots(amount) {
    this._maxSlots = Math.min(this._maxSlots + amount, this._maxCapacity)
    this.event.emit('slotsExpanded', this._maxSlots)
  }

  hasItem(itemId) {
    return this._slots.some(slot => slot.itemId === itemId)
  }
}
