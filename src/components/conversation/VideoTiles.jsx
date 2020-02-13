
import React from 'react';

export default function VideoTiles({
  attendees,
  refs,
}) {
  const renderTile = (tileId) => {
    return (
      <div
        key={`tile-${tileId}`}
        id={`tile-${tileId}`}
        className="text-center border mr-1 w-100 h-100"
        style={{ flex: '0 0 auto', maxWidth: 180 }}
      >
        <video
          id={`video-${tileId}`}
          className="w-100 h-100"
          style={{ maxWidth: 180 }}
          ref={refs.current[tileId - 1]}
        />
        <div>{tileId}</div>
      </div>
    );
  };

  return (
    <>
      {Object.keys(attendees).length > 0 &&
        <div className="row">
          <div className="col">
            <div className="tiles d-flex mt-1" style={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
              {Object.keys(attendees).map((_, index) => {
                return renderTile(index + 1);
              })}
            </div>
          </div>
        </div>
      }
    </>
  );
}
