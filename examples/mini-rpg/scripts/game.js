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
