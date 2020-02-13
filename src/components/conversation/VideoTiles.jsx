
import React, { useEffect, useState } from 'react';

export default function VideoTiles({
  attendees,
}) {
  const [numUsers, setNumUsers] = useState(0);

  useEffect(() => {
    setNumUsers(attendees ? Object.keys(attendees).length : 0)
  }, [attendees]);

  return (
    <>
      {numUsers > 0 &&
        <div className="row">
          <div className="col">
            <div className="tiles d-flex mt-1" style={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
              {[...Array(numUsers)].map((_, index) => {
                const id = index + 1;
                return (
                  <div
                    key={`tile-${id}`}
                    id={`tile-${id}`}
                    className="text-center border mr-1"
                    style={{ flex: '0 0 auto', maxWidth: 180, display: 'block' }}
                  >
                    <video id={`video-${id}`} />
                    <div>{id}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      }
    </>
  );
}
