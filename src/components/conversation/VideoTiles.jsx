
import React from 'react';

const MAX_TILES = 16;

export default function VideoTiles() {
  return (
    <div className="row">
      <div className="col">
        <div className="tiles d-flex" style={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
          {[...Array(MAX_TILES)].map((_, index) => {
            const id = index + 1;
            return (
              <div
                id={`tile-${id}`}
                className="text-center pr-1"
                style={{ flex: '0 0 auto', maxWidth: 160, display: 'none' }}
              >
                <video id={`video-${id}`} className="border w-100 h-100" />
                <div>{id}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
