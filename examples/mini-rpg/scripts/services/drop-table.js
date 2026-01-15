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
