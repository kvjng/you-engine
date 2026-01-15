# Phase 1: 인벤토리/아이템/장비 시스템 구현 계획서

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Mini RPG에 인벤토리, 아이템, 장비 시스템을 추가하여 아이템 수집 및 장비 교체 기능 구현

**Architecture:**
- 아이템 데이터는 종류별 JSON 파일로 분리 관리
- 인벤토리는 Inventory 컴포넌트로 플레이어에 부착
- 장비는 Equipment 컴포넌트로 Stats와 연동
- 필드 드롭 아이템은 FieldItem 오브젝트로 생성

**Tech Stack:** you-engine (ES6 모듈), JSON 데이터 파일, Canvas 2D API

**설계 결정사항:**
- 아이템 스택: 소비 아이템 최대 99개
- 인벤토리 슬롯: 확장형 (시작 10칸 → 최대 30칸, 가방 아이템으로 확장)
- 필드 드롭: 터치 획득 + 자동 마그넷 (가까이 가면 끌려옴)
- 장비 장착: 인벤토리 UI + 숫자키 단축키
- 드롭 테이블: 공용 JSON 파일로 관리
- 인벤토리 풀: 필드 아이템 시간 제한 후 자동 삭제
- 스탯 계산: 단순 합산

---

## Task 1: 아이템 데이터 구조 정의

**Files:**
- Create: `examples/mini-rpg/data/items/consumables.json`
- Create: `examples/mini-rpg/data/items/weapons.json`
- Create: `examples/mini-rpg/data/items/armors.json`
- Create: `examples/mini-rpg/data/items/accessories.json`
- Create: `examples/mini-rpg/data/drop-tables.json`

**Step 1: 소비 아이템 JSON 작성**

```json
{
  "items": [
    {
      "id": "potion_small",
      "name": "작은 HP 포션",
      "type": "consumable",
      "stackable": true,
      "maxStack": 99,
      "effect": {
        "type": "heal",
        "value": 30
      },
      "description": "HP를 30 회복한다."
    },
    {
      "id": "potion_medium",
      "name": "중간 HP 포션",
      "type": "consumable",
      "stackable": true,
      "maxStack": 99,
      "effect": {
        "type": "heal",
        "value": 60
      },
      "description": "HP를 60 회복한다."
    },
    {
      "id": "potion_large",
      "name": "큰 HP 포션",
      "type": "consumable",
      "stackable": true,
      "maxStack": 99,
      "effect": {
        "type": "heal",
        "value": 100
      },
      "description": "HP를 100 회복한다."
    },
    {
      "id": "bag_small",
      "name": "작은 가방",
      "type": "consumable",
      "stackable": false,
      "effect": {
        "type": "expand_inventory",
        "value": 5
      },
      "description": "인벤토리 슬롯을 5칸 확장한다."
    }
  ]
}
```

**Step 2: 무기 JSON 작성**

```json
{
  "items": [
    {
      "id": "sword_wood",
      "name": "나무 검",
      "type": "weapon",
      "slot": "weapon",
      "stackable": false,
      "stats": {
        "attack": 5
      },
      "attackType": "melee",
      "range": 50,
      "description": "초보자용 나무 검."
    },
    {
      "id": "sword_iron",
      "name": "철 검",
      "type": "weapon",
      "slot": "weapon",
      "stackable": false,
      "stats": {
        "attack": 10
      },
      "attackType": "melee",
      "range": 55,
      "description": "단단한 철로 만든 검."
    },
    {
      "id": "bow_short",
      "name": "단궁",
      "type": "weapon",
      "slot": "weapon",
      "stackable": false,
      "stats": {
        "attack": 7
      },
      "attackType": "ranged",
      "range": 200,
      "projectileSpeed": 300,
      "description": "가벼운 단궁."
    },
    {
      "id": "staff_magic",
      "name": "마법 지팡이",
      "type": "weapon",
      "slot": "weapon",
      "stackable": false,
      "stats": {
        "attack": 8
      },
      "attackType": "ranged",
      "range": 180,
      "projectileSpeed": 250,
      "projectileCount": 2,
      "description": "마법 탄환을 2발 동시에 발사한다."
    }
  ]
}
```

**Step 3: 방어구 JSON 작성**

```json
{
  "items": [
    {
      "id": "armor_cloth",
      "name": "천 갑옷",
      "type": "armor",
      "slot": "armor",
      "stackable": false,
      "stats": {
        "defense": 3
      },
      "description": "가벼운 천으로 만든 갑옷."
    },
    {
      "id": "armor_leather",
      "name": "가죽 갑옷",
      "type": "armor",
      "slot": "armor",
      "stackable": false,
      "stats": {
        "defense": 6
      },
      "description": "질긴 가죽으로 만든 갑옷."
    },
    {
      "id": "armor_iron",
      "name": "철 갑옷",
      "type": "armor",
      "slot": "armor",
      "stackable": false,
      "stats": {
        "defense": 10
      },
      "description": "무거운 철 갑옷."
    }
  ]
}
```

**Step 4: 악세서리 JSON 작성**

```json
{
  "items": [
    {
      "id": "ring_agility",
      "name": "민첩의 반지",
      "type": "accessory",
      "slot": "accessory",
      "stackable": false,
      "stats": {
        "speedBonus": 0.1
      },
      "description": "이동속도가 10% 증가한다."
    },
    {
      "id": "necklace_life",
      "name": "생명의 목걸이",
      "type": "accessory",
      "slot": "accessory",
      "stackable": false,
      "stats": {
        "maxHpBonus": 20
      },
      "description": "최대 HP가 20 증가한다."
    }
  ]
}
```

**Step 5: 드롭 테이블 JSON 작성**

```json
{
  "tables": {
    "mushroom": {
      "drops": [
        { "itemId": "potion_small", "chance": 0.3, "minCount": 1, "maxCount": 1 }
      ]
    },
    "ant": {
      "drops": [
        { "itemId": "potion_small", "chance": 0.2, "minCount": 1, "maxCount": 1 }
      ]
    },
    "common_monster": {
      "drops": [
        { "itemId": "potion_small", "chance": 0.25, "minCount": 1, "maxCount": 2 },
        { "itemId": "sword_wood", "chance": 0.05, "minCount": 1, "maxCount": 1 },
        { "itemId": "armor_cloth", "chance": 0.05, "minCount": 1, "maxCount": 1 }
      ]
    },
    "rare_monster": {
      "drops": [
        { "itemId": "potion_medium", "chance": 0.3, "minCount": 1, "maxCount": 1 },
        { "itemId": "sword_iron", "chance": 0.1, "minCount": 1, "maxCount": 1 },
        { "itemId": "armor_leather", "chance": 0.1, "minCount": 1, "maxCount": 1 },
        { "itemId": "ring_agility", "chance": 0.03, "minCount": 1, "maxCount": 1 }
      ]
    }
  }
}
```

**Step 6: 브라우저에서 JSON 로드 확인**

콘솔에서 fetch로 JSON 파일 로드 테스트

**Step 7: Commit**

```bash
git add examples/mini-rpg/data/
git commit -m "feat(mini-rpg): 아이템 및 드롭 테이블 데이터 정의"
```

---

## Task 2: ItemManager 서비스 생성

**Files:**
- Create: `examples/mini-rpg/scripts/services/item-manager.js`

**Step 1: 테스트 파일 작성**

```javascript
// examples/mini-rpg/tests/item-manager.test.js
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
```

**Step 2: 테스트 실행 확인 (실패)**

```bash
pnpm test examples/mini-rpg/tests/item-manager.test.js
```

Expected: FAIL - module not found

**Step 3: ItemManager 클래스 작성**

```javascript
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
```

**Step 4: 테스트 실행 확인 (성공)**

```bash
pnpm test examples/mini-rpg/tests/item-manager.test.js
```

Expected: PASS

**Step 5: Commit**

```bash
git add examples/mini-rpg/
git commit -m "feat(mini-rpg): ItemManager 서비스 구현"
```

---

## Task 3: DropTable 서비스 생성

**Files:**
- Create: `examples/mini-rpg/scripts/services/drop-table.js`

**Step 1: 테스트 파일 작성**

```javascript
// examples/mini-rpg/tests/drop-table.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DropTable } from '../scripts/services/drop-table.js'

describe('DropTable', () => {
  let dropTable

  beforeEach(() => {
    dropTable = new DropTable()
  })

  it('should register drop table', () => {
    const table = {
      drops: [
        { itemId: 'potion', chance: 0.5, minCount: 1, maxCount: 1 }
      ]
    }
    dropTable.registerTable('monster1', table)
    expect(dropTable.getTable('monster1')).toEqual(table)
  })

  it('should return empty array for unknown table', () => {
    const drops = dropTable.roll('unknown')
    expect(drops).toEqual([])
  })

  it('should roll drops based on chance', () => {
    const table = {
      drops: [
        { itemId: 'potion', chance: 1.0, minCount: 1, maxCount: 1 }
      ]
    }
    dropTable.registerTable('test', table)

    // chance가 1.0이면 항상 드롭
    const drops = dropTable.roll('test')
    expect(drops.length).toBe(1)
    expect(drops[0].itemId).toBe('potion')
    expect(drops[0].count).toBe(1)
  })

  it('should respect minCount and maxCount', () => {
    const table = {
      drops: [
        { itemId: 'potion', chance: 1.0, minCount: 2, maxCount: 5 }
      ]
    }
    dropTable.registerTable('test', table)

    const drops = dropTable.roll('test')
    expect(drops[0].count).toBeGreaterThanOrEqual(2)
    expect(drops[0].count).toBeLessThanOrEqual(5)
  })
})
```

**Step 2: 테스트 실행 확인 (실패)**

```bash
pnpm test examples/mini-rpg/tests/drop-table.test.js
```

Expected: FAIL

**Step 3: DropTable 클래스 작성**

```javascript
export class DropTable {
  constructor() {
    this._tables = new Map()
  }

  registerTable(tableId, tableData) {
    this._tables.set(tableId, tableData)
  }

  getTable(tableId) {
    return this._tables.get(tableId) ?? null
  }

  loadTables(tablesObject) {
    for (const [id, table] of Object.entries(tablesObject)) {
      this.registerTable(id, table)
    }
  }

  roll(tableId) {
    const table = this._tables.get(tableId)
    if (!table) return []

    const results = []
    for (const drop of table.drops) {
      if (Math.random() < drop.chance) {
        const count = this._randomRange(drop.minCount, drop.maxCount)
        results.push({
          itemId: drop.itemId,
          count
        })
      }
    }
    return results
  }

  _randomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }
}
```

**Step 4: 테스트 실행 확인 (성공)**

```bash
pnpm test examples/mini-rpg/tests/drop-table.test.js
```

Expected: PASS

**Step 5: Commit**

```bash
git add examples/mini-rpg/
git commit -m "feat(mini-rpg): DropTable 서비스 구현"
```

---

## Task 4: Inventory 컴포넌트 생성

**Files:**
- Create: `examples/mini-rpg/scripts/components/inventory.js`

**Step 1: 테스트 파일 작성**

```javascript
// examples/mini-rpg/tests/inventory.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { Inventory } from '../scripts/components/inventory.js'

describe('Inventory', () => {
  let inventory

  beforeEach(() => {
    inventory = new Inventory({ maxSlots: 10 })
  })

  it('should initialize with correct slot count', () => {
    expect(inventory.maxSlots).toBe(10)
    expect(inventory.usedSlots).toBe(0)
  })

  it('should add non-stackable item', () => {
    const result = inventory.addItem('sword_wood', 1, { stackable: false })
    expect(result).toBe(true)
    expect(inventory.usedSlots).toBe(1)
  })

  it('should add stackable items', () => {
    inventory.addItem('potion', 5, { stackable: true, maxStack: 99 })
    inventory.addItem('potion', 3, { stackable: true, maxStack: 99 })

    const slot = inventory.findItem('potion')
    expect(slot.count).toBe(8)
    expect(inventory.usedSlots).toBe(1)
  })

  it('should respect max stack', () => {
    inventory.addItem('potion', 99, { stackable: true, maxStack: 99 })
    inventory.addItem('potion', 10, { stackable: true, maxStack: 99 })

    // 99 + 10 = 109, 첫 슬롯 99, 두 번째 슬롯 10
    expect(inventory.usedSlots).toBe(2)
  })

  it('should return false when inventory is full', () => {
    for (let i = 0; i < 10; i++) {
      inventory.addItem(`item${i}`, 1, { stackable: false })
    }
    const result = inventory.addItem('extra', 1, { stackable: false })
    expect(result).toBe(false)
  })

  it('should remove item', () => {
    inventory.addItem('potion', 5, { stackable: true, maxStack: 99 })
    const removed = inventory.removeItem('potion', 3)

    expect(removed).toBe(3)
    const slot = inventory.findItem('potion')
    expect(slot.count).toBe(2)
  })

  it('should expand max slots', () => {
    inventory.expandSlots(5)
    expect(inventory.maxSlots).toBe(15)
  })

  it('should not expand beyond max limit', () => {
    inventory.expandSlots(100)
    expect(inventory.maxSlots).toBe(30) // maxCapacity
  })

  it('should get item count', () => {
    inventory.addItem('potion', 10, { stackable: true, maxStack: 99 })
    expect(inventory.getItemCount('potion')).toBe(10)
    expect(inventory.getItemCount('unknown')).toBe(0)
  })
})
```

**Step 2: 테스트 실행 확인 (실패)**

```bash
pnpm test examples/mini-rpg/tests/inventory.test.js
```

Expected: FAIL

**Step 3: Inventory 컴포넌트 작성**

```javascript
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
```

**Step 4: 테스트 실행 확인 (성공)**

```bash
pnpm test examples/mini-rpg/tests/inventory.test.js
```

Expected: PASS

**Step 5: Commit**

```bash
git add examples/mini-rpg/
git commit -m "feat(mini-rpg): Inventory 컴포넌트 구현"
```

---

## Task 5: Equipment 컴포넌트 생성

**Files:**
- Create: `examples/mini-rpg/scripts/components/equipment.js`

**Step 1: 테스트 파일 작성**

```javascript
// examples/mini-rpg/tests/equipment.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { Equipment } from '../scripts/components/equipment.js'

describe('Equipment', () => {
  let equipment

  beforeEach(() => {
    equipment = new Equipment()
  })

  it('should have three slots', () => {
    expect(equipment.getSlot('weapon')).toBeNull()
    expect(equipment.getSlot('armor')).toBeNull()
    expect(equipment.getSlot('accessory')).toBeNull()
  })

  it('should equip item to correct slot', () => {
    const weapon = { id: 'sword_wood', slot: 'weapon', stats: { attack: 5 } }
    const result = equipment.equip(weapon)

    expect(result.success).toBe(true)
    expect(result.unequipped).toBeNull()
    expect(equipment.getSlot('weapon')).toEqual(weapon)
  })

  it('should return unequipped item when replacing', () => {
    const sword1 = { id: 'sword_wood', slot: 'weapon', stats: { attack: 5 } }
    const sword2 = { id: 'sword_iron', slot: 'weapon', stats: { attack: 10 } }

    equipment.equip(sword1)
    const result = equipment.equip(sword2)

    expect(result.success).toBe(true)
    expect(result.unequipped).toEqual(sword1)
    expect(equipment.getSlot('weapon')).toEqual(sword2)
  })

  it('should unequip item', () => {
    const weapon = { id: 'sword_wood', slot: 'weapon', stats: { attack: 5 } }
    equipment.equip(weapon)

    const unequipped = equipment.unequip('weapon')

    expect(unequipped).toEqual(weapon)
    expect(equipment.getSlot('weapon')).toBeNull()
  })

  it('should calculate total stats bonus', () => {
    const weapon = { id: 'sword', slot: 'weapon', stats: { attack: 10 } }
    const armor = { id: 'armor', slot: 'armor', stats: { defense: 5 } }
    const accessory = { id: 'ring', slot: 'accessory', stats: { maxHpBonus: 20 } }

    equipment.equip(weapon)
    equipment.equip(armor)
    equipment.equip(accessory)

    const bonus = equipment.getTotalBonus()
    expect(bonus.attack).toBe(10)
    expect(bonus.defense).toBe(5)
    expect(bonus.maxHpBonus).toBe(20)
  })

  it('should return empty bonus when nothing equipped', () => {
    const bonus = equipment.getTotalBonus()
    expect(bonus).toEqual({})
  })
})
```

**Step 2: 테스트 실행 확인 (실패)**

```bash
pnpm test examples/mini-rpg/tests/equipment.test.js
```

Expected: FAIL

**Step 3: Equipment 컴포넌트 작성**

```javascript
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
```

**Step 4: 테스트 실행 확인 (성공)**

```bash
pnpm test examples/mini-rpg/tests/equipment.test.js
```

Expected: PASS

**Step 5: Commit**

```bash
git add examples/mini-rpg/
git commit -m "feat(mini-rpg): Equipment 컴포넌트 구현"
```

---

## Task 6: Stats 컴포넌트 장비 보너스 연동

**Files:**
- Modify: `examples/mini-rpg/scripts/components/stats.js`

**Step 1: 테스트 파일 작성**

```javascript
// examples/mini-rpg/tests/stats-equipment.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Stats } from '../scripts/components/stats.js'

describe('Stats with Equipment Bonus', () => {
  let stats

  beforeEach(() => {
    stats = new Stats({ maxHp: 100, attack: 10, defense: 5 })
  })

  it('should apply equipment bonus to attack', () => {
    stats.setEquipmentBonus({ attack: 5 })
    expect(stats.totalAttack).toBe(15)
  })

  it('should apply equipment bonus to defense', () => {
    stats.setEquipmentBonus({ defense: 3 })
    expect(stats.totalDefense).toBe(8)
  })

  it('should apply maxHpBonus', () => {
    stats.setEquipmentBonus({ maxHpBonus: 20 })
    expect(stats.totalMaxHp).toBe(120)
  })

  it('should apply speedBonus', () => {
    stats.setEquipmentBonus({ speedBonus: 0.1 })
    expect(stats.speedMultiplier).toBeCloseTo(1.1)
  })

  it('should update when bonus changes', () => {
    stats.setEquipmentBonus({ attack: 5 })
    expect(stats.totalAttack).toBe(15)

    stats.setEquipmentBonus({ attack: 10 })
    expect(stats.totalAttack).toBe(20)
  })

  it('should use totalAttack in takeDamage calculation', () => {
    const targetStats = new Stats({ maxHp: 100, attack: 10, defense: 5 })
    stats.setEquipmentBonus({ attack: 5 })

    // Stats.attack (10) + bonus (5) = 15
    // 피해 계산은 takeDamage 측에서 하므로 직접 확인
    expect(stats.totalAttack).toBe(15)
  })
})
```

**Step 2: 테스트 실행 확인 (실패)**

```bash
pnpm test examples/mini-rpg/tests/stats-equipment.test.js
```

Expected: FAIL

**Step 3: Stats 컴포넌트 수정**

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
    this.baseMaxHp = maxHp
    this._hp = hp ?? maxHp
    this.baseAttack = attack
    this.baseDefense = defense
    this.level = level
    this.exp = exp
    this._equipmentBonus = {}
    this.event = new EventEmitter(this)
  }

  // 하위 호환성을 위한 getter
  get maxHp() { return this.totalMaxHp }
  get attack() { return this.baseAttack }
  get defense() { return this.baseDefense }

  get totalMaxHp() {
    return this.baseMaxHp + (this._equipmentBonus.maxHpBonus || 0)
  }

  get totalAttack() {
    return this.baseAttack + (this._equipmentBonus.attack || 0)
  }

  get totalDefense() {
    return this.baseDefense + (this._equipmentBonus.defense || 0)
  }

  get speedMultiplier() {
    return 1 + (this._equipmentBonus.speedBonus || 0)
  }

  get hp() { return this._hp }

  set hp(value) {
    const prev = this._hp
    this._hp = Math.max(0, Math.min(this.totalMaxHp, value))
    if (this._hp !== prev) {
      this.event.emit('hpChange', this._hp, prev)
    }
    if (this._hp <= 0 && prev > 0) {
      this.event.emit('death')
    }
  }

  get alive() { return this._hp > 0 }

  setEquipmentBonus(bonus) {
    this._equipmentBonus = bonus
    // HP가 새 maxHp를 초과하면 조정
    if (this._hp > this.totalMaxHp) {
      this._hp = this.totalMaxHp
    }
    this.event.emit('bonusChanged', bonus)
  }

  takeDamage(amount, attacker = null) {
    const damage = Math.max(1, amount - this.totalDefense)
    this.hp -= damage
    this.event.emit('damage', damage, attacker)
    return damage
  }

  heal(amount) {
    const healed = Math.min(amount, this.totalMaxHp - this._hp)
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
    this.baseMaxHp += 10
    this.baseAttack += 2
    this.baseDefense += 1
    this.hp = this.totalMaxHp
    this.event.emit('levelUp', this.level)
  }
}
```

**Step 4: 테스트 실행 확인 (성공)**

```bash
pnpm test examples/mini-rpg/tests/stats-equipment.test.js
```

Expected: PASS

**Step 5: 기존 테스트 확인**

```bash
pnpm test
```

Expected: 기존 테스트도 모두 PASS

**Step 6: Commit**

```bash
git add examples/mini-rpg/
git commit -m "feat(mini-rpg): Stats 컴포넌트에 장비 보너스 연동"
```

---

## Task 7: FieldItem 오브젝트 생성

**Files:**
- Create: `examples/mini-rpg/scripts/objects/field-item.js`
- Create: `examples/mini-rpg/scripts/components/field-item-behavior.js`

**Step 1: FieldItemBehavior 테스트 작성**

```javascript
// examples/mini-rpg/tests/field-item.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FieldItemBehavior } from '../scripts/components/field-item-behavior.js'

describe('FieldItemBehavior', () => {
  let behavior

  beforeEach(() => {
    behavior = new FieldItemBehavior({
      lifetime: 30,
      magnetRange: 50,
      magnetSpeed: 200,
      pickupRange: 20
    })
    // Mock object
    behavior.object = {
      position: [100, 100],
      destroy: vi.fn()
    }
  })

  it('should decrease lifetime over time', () => {
    behavior.didUpdate(1)
    expect(behavior.remainingTime).toBe(29)
  })

  it('should emit expired event when lifetime ends', () => {
    const onExpire = vi.fn()
    behavior.event.on('expired', onExpire)

    behavior.didUpdate(30)

    expect(onExpire).toHaveBeenCalled()
  })

  it('should move toward target when in magnet range', () => {
    const target = { position: [120, 100] }
    behavior.setTarget(target)

    const initialX = behavior.object.position[0]
    behavior.didUpdate(0.1)

    expect(behavior.object.position[0]).toBeGreaterThan(initialX)
  })

  it('should emit pickup event when in pickup range', () => {
    const onPickup = vi.fn()
    behavior.event.on('pickup', onPickup)

    const target = { position: [110, 100] } // 10 units away, within pickupRange (20)
    behavior.setTarget(target)
    behavior.didUpdate(0.1)

    expect(onPickup).toHaveBeenCalled()
  })

  it('should not move when target is outside magnet range', () => {
    const target = { position: [200, 200] } // far away
    behavior.setTarget(target)

    const initialX = behavior.object.position[0]
    const initialY = behavior.object.position[1]
    behavior.didUpdate(0.1)

    expect(behavior.object.position[0]).toBe(initialX)
    expect(behavior.object.position[1]).toBe(initialY)
  })
})
```

**Step 2: 테스트 실행 확인 (실패)**

```bash
pnpm test examples/mini-rpg/tests/field-item.test.js
```

Expected: FAIL

**Step 3: FieldItemBehavior 컴포넌트 작성**

```javascript
import { Component } from '../../../../you/component.js'
import { EventEmitter } from '../../../../you/utilities/event.js'

export class FieldItemBehavior extends Component {
  constructor({
    lifetime = 30,
    magnetRange = 50,
    magnetSpeed = 200,
    pickupRange = 20
  } = {}) {
    super()
    this.lifetime = lifetime
    this.remainingTime = lifetime
    this.magnetRange = magnetRange
    this.magnetSpeed = magnetSpeed
    this.pickupRange = pickupRange
    this._target = null
    this._pickedUp = false
    this.event = new EventEmitter(this)
  }

  setTarget(target) {
    this._target = target
  }

  didUpdate(deltaTime) {
    if (this._pickedUp) return

    // 수명 감소
    this.remainingTime -= deltaTime
    if (this.remainingTime <= 0) {
      this.event.emit('expired')
      return
    }

    // 타겟이 없으면 대기
    if (!this._target) return

    const pos = this.object.position
    const targetPos = this._target.position
    const dx = targetPos[0] - pos[0]
    const dy = targetPos[1] - pos[1]
    const distance = Math.sqrt(dx * dx + dy * dy)

    // 픽업 범위 내
    if (distance <= this.pickupRange) {
      this._pickedUp = true
      this.event.emit('pickup')
      return
    }

    // 마그넷 범위 내면 끌려감
    if (distance <= this.magnetRange) {
      const dirX = dx / distance
      const dirY = dy / distance
      pos[0] += dirX * this.magnetSpeed * deltaTime
      pos[1] += dirY * this.magnetSpeed * deltaTime
    }
  }
}
```

**Step 4: FieldItem 팩토리 함수 작성**

```javascript
// field-item.js
import { Object } from '../../../../you/object.js'
import { ShapeRenderer } from '../components/shape-renderer.js'
import { FieldItemBehavior } from '../components/field-item-behavior.js'

export function createFieldItem(x, y, itemId, count, itemData) {
  const item = new Object({
    name: 'field-item',
    tags: ['field-item'],
    components: [
      new FieldItemBehavior({
        lifetime: 30,
        magnetRange: 60,
        magnetSpeed: 200,
        pickupRange: 25
      }),
      new ShapeRenderer({
        shape: 'rect',
        size: 16,
        color: getItemColor(itemData.type),
        strokeColor: '#ffffff',
        strokeWidth: 1
      })
    ]
  })

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
```

**Step 5: 테스트 실행 확인 (성공)**

```bash
pnpm test examples/mini-rpg/tests/field-item.test.js
```

Expected: PASS

**Step 6: Commit**

```bash
git add examples/mini-rpg/
git commit -m "feat(mini-rpg): FieldItem 오브젝트 및 동작 구현"
```

---

## Task 8: 플레이어에 Inventory, Equipment 통합

**Files:**
- Modify: `examples/mini-rpg/scripts/objects/player.js`
- Modify: `examples/mini-rpg/scripts/scenes/game-scene.js`

**Step 1: Player에 컴포넌트 추가**

```javascript
// player.js
import { Object } from '../../../../you/object.js'
import { PlayerController } from '../components/player-controller.js'
import { ShapeRenderer } from '../components/shape-renderer.js'
import { Stats } from '../components/stats.js'
import { AttackController } from '../components/attack-controller.js'
import { HpBar } from '../components/hp-bar.js'
import { Inventory } from '../components/inventory.js'
import { Equipment } from '../components/equipment.js'

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
      }),
      new Stats({ maxHp: 100, attack: 15, defense: 5 }),
      new AttackController({ range: 50, cooldown: 0.4 }),
      new HpBar({ width: 40, height: 6, offsetY: -25 }),
      new Inventory({ maxSlots: 10, maxCapacity: 30 }),
      new Equipment()
    ]
  })

  player.position = [x, y]

  // Equipment 변경 시 Stats에 보너스 적용
  const equipment = player.findComponent(Equipment)
  const stats = player.findComponent(Stats)

  equipment.event.on('equipped', () => {
    stats.setEquipmentBonus(equipment.getTotalBonus())
  })
  equipment.event.on('unequipped', () => {
    stats.setEquipmentBonus(equipment.getTotalBonus())
  })

  return player
}
```

**Step 2: GameScene에서 아이템 픽업 처리**

```javascript
// game-scene.js에 추가

import { FieldItemBehavior } from '../components/field-item-behavior.js'
import { Inventory } from '../components/inventory.js'

didCreate() {
  // ... 기존 코드

  // 필드 아이템 타겟 설정을 위한 참조 저장
  this.itemManager = null // Task 9에서 주입
  this.dropTable = null   // Task 9에서 주입
}

didUpdate(deltaTime, events, input) {
  // ... 기존 코드

  // 필드 아이템 타겟 업데이트
  this.updateFieldItems()

  // 만료된 필드 아이템 제거
  this.removeExpiredItems()
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

removeExpiredItems() {
  const fieldItems = this.objects.filter(obj => obj.tags.has('field-item'))
  for (const item of fieldItems) {
    const behavior = item.findComponent(FieldItemBehavior)
    if (behavior && behavior.remainingTime <= 0) {
      this.remove(item)
    }
  }
}

setupFieldItemPickup(item) {
  const behavior = item.findComponent(FieldItemBehavior)
  behavior.event.on('pickup', () => {
    this.pickupItem(item)
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
```

**Step 3: 브라우저에서 확인**

Expected: 플레이어 생성 시 Inventory, Equipment 컴포넌트 포함

**Step 4: Commit**

```bash
git add examples/mini-rpg/scripts/
git commit -m "feat(mini-rpg): 플레이어에 Inventory, Equipment 통합"
```

---

## Task 9: 몬스터 드롭 시스템 연동

**Files:**
- Modify: `examples/mini-rpg/scripts/scenes/game-scene.js`
- Modify: `examples/mini-rpg/scripts/game.js`

**Step 1: game.js에서 서비스 초기화**

> **Note:** 엔진의 `didCreate()`는 동기 호출이므로 async/await가 작동하지 않습니다.
> 대신 데이터 로딩 완료 후 씬을 push하는 패턴을 사용합니다.

```javascript
// game.js
import { SceneApplication } from '../../../you/application.js'
import { GameScene } from './scenes/game-scene.js'
import { ItemManager } from './services/item-manager.js'
import { DropTable } from './services/drop-table.js'

export class MiniRPG extends SceneApplication {
  didCreate() {
    // 서비스 초기화
    this.itemManager = new ItemManager()
    this.dropTable = new DropTable()

    // 데이터 로드 후 게임 시작
    this.loadGameData().then(() => {
      const scene = new GameScene()
      scene.itemManager = this.itemManager
      scene.dropTable = this.dropTable
      this.push(scene)
    })
  }

  async loadGameData() {
    const [consumables, weapons, armors, accessories, dropTables] = await Promise.all([
      this.loadJson('./data/items/consumables.json'),
      this.loadJson('./data/items/weapons.json'),
      this.loadJson('./data/items/armors.json'),
      this.loadJson('./data/items/accessories.json'),
      this.loadJson('./data/drop-tables.json')
    ])

    this.itemManager.loadItems(consumables.items)
    this.itemManager.loadItems(weapons.items)
    this.itemManager.loadItems(armors.items)
    this.itemManager.loadItems(accessories.items)

    this.dropTable.loadTables(dropTables.tables)
  }

  async loadJson(path) {
    const response = await fetch(path)
    return response.json()
  }
}
```

**Step 2: GameScene에서 드롭 처리**

```javascript
// game-scene.js 수정

import { createFieldItem } from '../objects/field-item.js'

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
```

**Step 3: Enemy에 dropTableId 추가**

```javascript
// enemy.js 수정

export function createMushroom(x, y) {
  const enemy = new Object({ /* ... */ })
  enemy.position = [x, y]
  enemy.expReward = 25
  enemy.dropTableId = 'mushroom' // 드롭 테이블 ID
  return enemy
}

export function createAnt(x, y) {
  const enemy = new Object({ /* ... */ })
  enemy.position = [x, y]
  enemy.expReward = 15
  enemy.dropTableId = 'ant'
  return enemy
}
```

**Step 4: 브라우저에서 확인**

Expected: 몬스터 처치 시 아이템 드롭, 플레이어 접근 시 획득

**Step 5: Commit**

```bash
git add examples/mini-rpg/scripts/
git commit -m "feat(mini-rpg): 몬스터 드롭 시스템 연동"
```

---

## Task 10: 인벤토리 UI 생성

**Files:**
- Create: `examples/mini-rpg/scripts/ui/inventory-ui.js`
- Modify: `examples/mini-rpg/scripts/scenes/game-scene.js`

**Step 1: InventoryUI 클래스 작성**

```javascript
// inventory-ui.js
import { View } from '../../../../you/ui/view.js'
import { Inventory } from '../components/inventory.js'
import { Equipment } from '../components/equipment.js'

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
    // Task 11에서 구현
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
```

**Step 2: GameScene에서 인벤토리 UI 토글**

```javascript
// game-scene.js에 추가

import { InventoryUI } from '../ui/inventory-ui.js'

didCreate() {
  // ... 기존 코드

  // 인벤토리 UI
  this.inventoryUI = new InventoryUI()
  this.inventoryUI.setPlayer(this.player)
  this.add(this.inventoryUI)
}

didUpdate(deltaTime, events, input) {
  // ... 기존 코드

  // 인벤토리 토글
  for (const ev of events) {
    if (ev.type === 'keydown') {
      if (ev.key === 'i' || ev.key === 'I') {
        this.inventoryUI.toggle()
      }
      // 숫자키로 슬롯 선택 (인벤토리 열려있을 때)
      if (this.inventoryUI.visible) {
        const num = parseInt(ev.key)
        if (!isNaN(num)) {
          // 1-9 → 0-8, 0 → 9
          const slot = num === 0 ? 9 : num - 1
          this.inventoryUI.selectSlot(slot)
        }
      }
    }
  }
}
```

**Step 3: 브라우저에서 확인**

Expected: I키로 인벤토리 토글, 슬롯 표시, 숫자키로 선택

**Step 4: Commit**

```bash
git add examples/mini-rpg/scripts/
git commit -m "feat(mini-rpg): 인벤토리 UI 구현"
```

---

## Task 11: 아이템 사용 및 장비 장착 기능

**Files:**
- Modify: `examples/mini-rpg/scripts/ui/inventory-ui.js`
- Modify: `examples/mini-rpg/scripts/scenes/game-scene.js`

**Step 1: InventoryUI에 아이템 사용 로직 추가**

```javascript
// inventory-ui.js 수정

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
```

**Step 2: GameScene에서 아이템 사용 키 처리**

```javascript
// game-scene.js 수정

didUpdate(deltaTime, events, input) {
  // ... 기존 코드

  for (const ev of events) {
    if (ev.type === 'keydown') {
      // 인벤토리 토글
      if (ev.key === 'i' || ev.key === 'I') {
        this.inventoryUI.toggle()
      }

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
}
```

**Step 3: 브라우저에서 확인**

Expected:
- 숫자키로 슬롯 선택 후 Enter/E로 아이템 사용
- 포션 사용 시 HP 회복
- 장비 선택 시 장착, 기존 장비는 인벤토리로

**Step 4: Commit**

```bash
git add examples/mini-rpg/scripts/
git commit -m "feat(mini-rpg): 아이템 사용 및 장비 장착 기능"
```

---

## Task 12: 장비에 따른 공격 방식 변경

**Files:**
- Modify: `examples/mini-rpg/scripts/components/attack-controller.js`
- Modify: `examples/mini-rpg/scripts/scenes/game-scene.js`

**Step 1: AttackController 장비 연동**

```javascript
// attack-controller.js 수정

import { Component } from '../../../../you/component.js'
import { Stats } from './stats.js'
import { Equipment } from './equipment.js'

export class AttackController extends Component {
  constructor({
    baseRange = 50,
    baseCooldown = 0.5
  } = {}) {
    super()
    this.baseRange = baseRange
    this.baseCooldown = baseCooldown
    this._cooldownTimer = 0
    this._attacking = false
    this._attackDuration = 0.15
    this._attackTimer = 0
  }

  get range() {
    const equipment = this.object.findComponent(Equipment)
    const weapon = equipment?.getSlot('weapon')
    return weapon?.range || this.baseRange
  }

  get cooldown() {
    return this.baseCooldown
  }

  get attackType() {
    const equipment = this.object.findComponent(Equipment)
    const weapon = equipment?.getSlot('weapon')
    return weapon?.attackType || 'melee'
  }

  get weaponData() {
    const equipment = this.object.findComponent(Equipment)
    return equipment?.getSlot('weapon')
  }

  get canAttack() { return this._cooldownTimer <= 0 }
  get attacking() { return this._attacking }

  attack(targets) {
    if (!this.canAttack) return []

    this._cooldownTimer = this.cooldown
    this._attacking = true
    this._attackTimer = this._attackDuration

    const stats = this.object.findComponent(Stats)

    // 원거리 무기는 투사체 발사 정보 반환
    if (this.attackType === 'ranged') {
      return this.prepareRangedAttack(stats)
    }

    // 근접 공격
    return this.performMeleeAttack(targets, stats)
  }

  performMeleeAttack(targets, stats) {
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
          const damage = targetStats.takeDamage(stats.totalAttack)
          hits.push({ target, damage })
        }
      }
    }

    return hits
  }

  prepareRangedAttack(stats) {
    const weapon = this.weaponData
    return [{
      type: 'ranged',
      damage: stats.totalAttack,
      speed: weapon?.projectileSpeed || 300,
      range: this.range,
      count: weapon?.projectileCount || 1
    }]
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

**Step 2: GameScene에서 원거리 공격 처리**

원거리 공격은 Phase 2 (전투 확장)에서 투사체 시스템과 함께 구현됩니다.
지금은 근접/원거리 구분만 해둡니다.

```javascript
// game-scene.js 수정

playerAttack() {
  const attackController = this.player.findComponent(AttackController)
  const enemies = this.objects.filter(obj => obj.tags.has('enemy'))

  const results = attackController.attack(enemies)

  for (const result of results) {
    if (result.type === 'ranged') {
      // Phase 2에서 투사체 발사 구현
      console.log('Ranged attack prepared:', result)
      // 임시: 근접 공격처럼 처리
      this.temporaryRangedAttack(result, enemies)
    } else {
      // 근접 공격 결과
      console.log(`Hit ${result.target.name} for ${result.damage} damage`)

      const renderer = result.target.findComponent(ShapeRenderer)
      if (renderer) {
        renderer.flash('#ffffff', 0.1)
      }

      const targetStats = result.target.findComponent(Stats)
      if (!targetStats.alive) {
        const playerStats = this.player.findComponent(Stats)
        playerStats.addExp(result.target.expReward || 10)
      }
    }
  }
}

temporaryRangedAttack(attackData, enemies) {
  // Phase 2 전까지 임시 구현: 범위 내 첫 번째 적 공격
  const pos = this.player.position
  const stats = this.player.findComponent(Stats)

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
          stats.addExp(enemy.expReward || 10)
        }

        // 한 명만 공격 (투사체 구현 전까지)
        break
      }
    }
  }
}
```

**Step 3: 브라우저에서 확인**

Expected: 무기 장착 시 공격 범위/방식 변경

**Step 4: Commit**

```bash
git add examples/mini-rpg/scripts/
git commit -m "feat(mini-rpg): 장비에 따른 공격 방식 변경 기초 구현"
```

---

## Task 13: HUD에 장비 정보 표시

**Files:**
- Modify: `examples/mini-rpg/scripts/ui/hud.js`

**Step 1: HUD에 장비 슬롯 표시 추가**

```javascript
// hud.js 수정

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

    context.fillStyle = '#ffffff'
    context.font = '14px Arial'
    context.fillText('HP', x, y + 14)

    const barX = x + 30
    context.fillStyle = '#333333'
    context.fillRect(barX, y, width, height)

    const ratio = stats.hp / stats.totalMaxHp
    context.fillStyle = ratio > 0.3 ? '#44dd44' : '#dd4444'
    context.fillRect(barX, y, width * ratio, height)

    context.strokeStyle = '#ffffff'
    context.lineWidth = 2
    context.strokeRect(barX, y, width, height)

    context.fillStyle = '#ffffff'
    context.fillText(`${stats.hp}/${stats.totalMaxHp}`, barX + width + 10, y + 14)
  }

  renderLevelInfo(context, x, y, stats) {
    context.fillStyle = '#ffffff'
    context.font = '14px Arial'
    context.fillText(`Lv.${stats.level}`, x, y + 14)

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
```

**Step 2: 브라우저에서 확인**

Expected: HUD에 장비 정보와 조작 힌트 표시

**Step 3: Commit**

```bash
git add examples/mini-rpg/scripts/ui/
git commit -m "feat(mini-rpg): HUD에 장비 정보 및 조작 힌트 표시"
```

---

## Task 14: 속도 보너스 적용

**Files:**
- Modify: `examples/mini-rpg/scripts/components/player-controller.js`

**Step 1: PlayerController에 speedMultiplier 적용**

```javascript
// player-controller.js 수정

import { Component } from '../../../../you/component.js'
import { Stats } from './stats.js'

export class PlayerController extends Component {
  constructor({ speed = 150, bounds = null } = {}) {
    super()
    this.baseSpeed = speed
    this.direction = [0, 0]
    this.bounds = bounds
  }

  get speed() {
    const stats = this.object?.findComponent(Stats)
    const multiplier = stats?.speedMultiplier || 1
    return this.baseSpeed * multiplier
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

    if (this.bounds) {
      const halfSize = 16
      pos[0] = Math.max(this.bounds.minX + halfSize, Math.min(this.bounds.maxX - halfSize, pos[0]))
      pos[1] = Math.max(this.bounds.minY + halfSize, Math.min(this.bounds.maxY - halfSize, pos[1]))
    }
  }
}
```

**Step 2: 브라우저에서 확인**

Expected: 민첩의 반지 장착 시 이동속도 10% 증가

**Step 3: Commit**

```bash
git add examples/mini-rpg/scripts/components/
git commit -m "feat(mini-rpg): 장비 속도 보너스 적용"
```

---

## Task 15: 최종 테스트 및 정리

**Files:**
- Review: 모든 Phase 1 파일

**Step 1: 전체 테스트 실행**

```bash
pnpm test
```

Expected: 모든 테스트 PASS

**Step 2: 브라우저 통합 테스트**

체크리스트:
- [ ] 몬스터 처치 시 아이템 드롭
- [ ] 필드 아이템 마그넷 + 터치 픽업
- [ ] 필드 아이템 시간 초과 시 삭제
- [ ] I키로 인벤토리 열기/닫기
- [ ] 숫자키로 슬롯 선택
- [ ] Enter/E로 아이템 사용/장착
- [ ] 포션 사용 시 HP 회복
- [ ] 장비 장착 시 스탯 변경
- [ ] 속도 보너스 적용
- [ ] HUD에 장비 정보 표시
- [ ] 인벤토리 확장 (가방 아이템)

**Step 3: 코드 정리**

- console.log 정리
- 미사용 import 제거
- 주석 정리

**Step 4: 최종 Commit**

```bash
git add examples/mini-rpg/
git commit -m "feat(mini-rpg): Phase 1 인벤토리/아이템/장비 시스템 완성"
```

---

## 파일 구조 (Phase 1 완료 후)

```
examples/mini-rpg/
├── data/
│   ├── items/
│   │   ├── consumables.json
│   │   ├── weapons.json
│   │   ├── armors.json
│   │   └── accessories.json
│   └── drop-tables.json
├── scripts/
│   ├── components/
│   │   ├── attack-controller.js (수정)
│   │   ├── enemy-ai.js
│   │   ├── equipment.js (신규)
│   │   ├── field-item-behavior.js (신규)
│   │   ├── hp-bar.js
│   │   ├── inventory.js (신규)
│   │   ├── player-controller.js (수정)
│   │   ├── shape-renderer.js
│   │   └── stats.js (수정)
│   ├── objects/
│   │   ├── enemy.js (수정)
│   │   ├── field-item.js (신규)
│   │   └── player.js (수정)
│   ├── scenes/
│   │   ├── game-scene.js (수정)
│   │   └── gameover-scene.js
│   ├── services/
│   │   ├── drop-table.js (신규)
│   │   └── item-manager.js (신규)
│   ├── ui/
│   │   ├── hud.js (수정)
│   │   └── inventory-ui.js (신규)
│   ├── game.js (수정)
│   └── main.js
└── tests/
    ├── drop-table.test.js
    ├── equipment.test.js
    ├── field-item.test.js
    ├── inventory.test.js
    ├── item-manager.test.js
    └── stats-equipment.test.js
```
