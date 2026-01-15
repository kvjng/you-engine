import { describe, it, expect, beforeEach } from 'vitest'
import { ItemManager } from '../scripts/services/item-manager.js'

describe('ItemManager', () => {
  let itemManager

  beforeEach(() => {
    itemManager = new ItemManager()
  })

  it('should register item data', () => {
    const itemData = {
      id: 'test_item',
      name: 'Test Item',
      type: 'consumable'
    }
    itemManager.registerItem(itemData)
    expect(itemManager.getItem('test_item')).toEqual(itemData)
  })

  it('should return null for unknown item', () => {
    expect(itemManager.getItem('unknown')).toBeNull()
  })

  it('should load items from array', () => {
    const items = [
      { id: 'item1', name: 'Item 1', type: 'consumable' },
      { id: 'item2', name: 'Item 2', type: 'weapon' }
    ]
    itemManager.loadItems(items)
    expect(itemManager.getItem('item1')).toEqual(items[0])
    expect(itemManager.getItem('item2')).toEqual(items[1])
  })

  it('should get items by type', () => {
    const items = [
      { id: 'item1', name: 'Item 1', type: 'consumable' },
      { id: 'item2', name: 'Item 2', type: 'weapon' },
      { id: 'item3', name: 'Item 3', type: 'consumable' }
    ]
    itemManager.loadItems(items)
    const consumables = itemManager.getItemsByType('consumable')
    expect(consumables.length).toBe(2)
  })
})
