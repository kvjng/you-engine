export class ItemManager {
  constructor() {
    this._items = new Map()
  }

  registerItem(itemData) {
    this._items.set(itemData.id, itemData)
  }

  getItem(itemId) {
    return this._items.get(itemId) ?? null
  }

  loadItems(itemsArray) {
    for (const item of itemsArray) {
      this.registerItem(item)
    }
  }

  getItemsByType(type) {
    const result = []
    for (const item of this._items.values()) {
      if (item.type === type) {
        result.push(item)
      }
    }
    return result
  }

  getAllItems() {
    return Array.from(this._items.values())
  }
}