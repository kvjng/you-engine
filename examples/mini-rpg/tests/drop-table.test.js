import { describe, it, expect, beforeEach } from 'vitest'
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

  it('should return null for unknown table', () => {
    expect(dropTable.getTable('unknown')).toBeNull()
  })

  it('should return empty array when rolling unknown table', () => {
    const drops = dropTable.roll('unknown')
    expect(drops).toEqual([])
  })

  it('should roll drops with 100% chance', () => {
    const table = {
      drops: [
        { itemId: 'potion', chance: 1.0, minCount: 1, maxCount: 1 }
      ]
    }
    dropTable.registerTable('test', table)

    const drops = dropTable.roll('test')
    expect(drops.length).toBe(1)
    expect(drops[0].itemId).toBe('potion')
    expect(drops[0].count).toBe(1)
  })

  it('should not drop items with 0% chance', () => {
    const table = {
      drops: [
        { itemId: 'potion', chance: 0, minCount: 1, maxCount: 1 }
      ]
    }
    dropTable.registerTable('test', table)

    const drops = dropTable.roll('test')
    expect(drops.length).toBe(0)
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

  it('should load multiple tables from object', () => {
    const tables = {
      mushroom: {
        drops: [{ itemId: 'potion_small', chance: 0.3, minCount: 1, maxCount: 1 }]
      },
      ant: {
        drops: [{ itemId: 'potion_small', chance: 0.2, minCount: 1, maxCount: 1 }]
      }
    }

    dropTable.loadTables(tables)

    expect(dropTable.getTable('mushroom')).toEqual(tables.mushroom)
    expect(dropTable.getTable('ant')).toEqual(tables.ant)
  })

  it('should handle multiple drops in one table', () => {
    const table = {
      drops: [
        { itemId: 'potion', chance: 1.0, minCount: 1, maxCount: 1 },
        { itemId: 'sword', chance: 1.0, minCount: 1, maxCount: 1 }
      ]
    }
    dropTable.registerTable('test', table)

    const drops = dropTable.roll('test')
    expect(drops.length).toBe(2)
    expect(drops.map(d => d.itemId)).toContain('potion')
    expect(drops.map(d => d.itemId)).toContain('sword')
  })
})
