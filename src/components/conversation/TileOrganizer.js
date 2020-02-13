export default class TileOrganizer {
  static MAX_TILES = 16;
  tiles = {};

  acquireTileIndex(tileId) {
    for (let index = 0; index < TileOrganizer.MAX_TILES; index++) {
      if (this.tiles[index] === tileId) {
        return index;
      }
    }
    for (let index = 0; index < TileOrganizer.MAX_TILES; index++) {
      if (!(index in this.tiles)) {
        this.tiles[index] = tileId;
        return index;
      }
    }
    throw new Error('no tiles are available');
  }

  releaseTileIndex(tileId) {
    for (let index = 0; index < TileOrganizer.MAX_TILES; index++) {
      if (this.tiles[index] === tileId) {
        delete this.tiles[index];
        return index;
      }
    }
    return TileOrganizer.MAX_TILES;
  }
}
