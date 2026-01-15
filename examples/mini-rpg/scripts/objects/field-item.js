import { Object } from '../../../../you/object.js'
import { ShapeRenderer } from '../components/shape-renderer.js'
import { FieldItemBehavior } from '../components/field-item-behavior.js'

export function createFieldItem(x, y, itemId, count, itemData) {
  const item = new Object({
    name: 'field-item',
    tags: ['field-item']
  })

  item.addComponent(new FieldItemBehavior({
    lifetime: 30,
    magnetRange: 60,
    magnetSpeed: 200,
    pickupRange: 25
  }))

  item.addComponent(new ShapeRenderer({
    shape: 'rect',
    size: 16,
    color: getItemColor(itemData.type),
    strokeColor: '#ffffff',
    strokeWidth: 1
  }))

  item.position = [x, y]
  item.itemId = itemId
  item.itemCount = count
  item.itemData = itemData

  return item
}

function getItemColor(type) {
  switch (type) {
    case 'consumable': return '#44dd44'
    case 'weapon': return '#dd8844'
    case 'armor': return '#4488dd'
    case 'accessory': return '#dd44dd'
    default: return '#888888'
  }
}
