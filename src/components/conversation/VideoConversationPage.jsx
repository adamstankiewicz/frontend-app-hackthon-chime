import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import classNames from 'classnames';
import { AsyncScheduler } from 'amazon-chime-sdk-js';
import { Button } from '@edx/paragon';

import ConversationManager from './ConversationManager';
import VideoTiles from './VideoTiles';
import AttendeeList from './AttendeeList';

let manager;

export default function VideoConversationPage() {
  const { meetingId } = useParams();
  const videoPrimaryRef = useRef();
  const [audioVideoDidStart, setAudioVideoDidStart] = useState(false);
  const [roster, setRoster] = useState({});
  const [isVideoActive, setIsVideoActive] = useState(false);
  const refs = Array(16);
  for (let i = 0; i < 16; i++) {
    refs[i] = useRef();
  }

  useEffect(() => {
    if (!manager) {
      manager = new ConversationManager(
        meetingId,
        {
          onUpdateRoster: (newRoster) => { setRoster({ ...newRoster }); },
          onAudioVideoDidStart: () => { setAudioVideoDidStart(true); },
          onVideoTileDidUpdate: (tileState) => {
            const { tileId, localTile } = tileState;
            // FIXME: `onVideoTileDidUpdate` not called for remote video streams :(
            // console.log('[onVideoTileDidUpdate]', tileState);
            if (localTile) {
              manager.audioVideo.bindVideoElement(tileId, videoPrimaryRef.current);
              if (refs && refs[0].current) {
                manager.audioVideo.bindVideoElement(tileId, refs[0].current);
              }
            } else {
              manager.audioVideo.bindVideoElement(tileId, videoPrimaryRef.current);
              // console.log('[onVideoTileDidUpdate]', refs.current[tileId]);
              // console.log('[onVideoTileDidUpdate]', document.getElementById(`video-${tileId}`));
              // console.log('[onVideoTileDidUpdate]', tileState);
            }
          }
        }
      );
    }
    new AsyncScheduler().start(
      async () => {
        await manager.initialize();
        manager.audioVideo.startVideoPreviewForVideoInput(videoPrimaryRef.current);
      }
    );
  }, [meetingId]);

  useEffect(() => {
    if (manager) {
      const startLocalVideoTile = async () => {
        await manager.chooseFirstVideoInputDevice();
        manager.audioVideo.startLocalVideoTile();
      };
      if (manager.audioVideo) {
        if (isVideoActive) {
          manager.audioVideo.stopLocalVideoTile();
        } else {
          startLocalVideoTile();
        }
      }
    }
  }, [manager, isVideoActive]);

  function handleJoinButtonClick() {
    new AsyncScheduler().start(
      async () => {
        manager.audioVideo.stopVideoPreviewForVideoInput(videoPrimaryRef.current);
        await manager.join();
        await manager.chooseFirstVideoInputDevice()
        manager.audioVideo.startLocalVideoTile();
      }
    );
  }

  return (
    <div className="container py-3">
      <div className="row">
        <div
          className={classNames('col-12', {
            'col-lg-6 offset-lg-3': !audioVideoDidStart,
            'col-lg-6': audioVideoDidStart,
          })}
        >
          <video id="video-primary" className="h-100 w-100" ref={videoPrimaryRef} />
          {!audioVideoDidStart &&
            <div className="text-center">
              <Button
                className="btn-primary" 
                onClick={() => { handleJoinButtonClick(); } }
              >
                Join conversation
              </Button>
            </div>
          }
        </div>
        {audioVideoDidStart &&
          <div className="col-12 col-lg-6">
            <Button
              className="btn-secondary"
              onClick={() => { setIsVideoActive(!isVideoActive); }}
            >
              Toggle camera
            </Button>
            <AttendeeList attendees={roster} />
          </div>
        }
      </div>
      {audioVideoDidStart &&
        <VideoTiles
          attendees={roster} 
          refs={refs}
        />
      }
    </div>
  );
}
