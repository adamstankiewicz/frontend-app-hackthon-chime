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
  const videoPreviewRef = useRef();
  const [audioVideoDidStart, setAudioVideoDidStart] = useState(false);
  const [roster, setRoster] = useState({});
  const [isVideoActive, setIsVideoActive] = useState(false);

  useEffect(() => {
    if (!manager) {
      manager = new ConversationManager(
        meetingId,
        {
          onUpdateRoster: (newRoster) => { setRoster({ ...newRoster }); },
          onAudioVideoDidStart: () => { setAudioVideoDidStart(true); },
          onVideoTileDidUpdate: (tileState) => {
            const { tileId } = tileState;
            // const tileElement = document.getElementById(`tile-${tileId}`);
            // tileElement.style.display = 'block';
            // const videoElement = document.getElementById(`video-${tileId}`);
            manager.audioVideo.bindVideoElement(tileId, videoPreviewRef.current);
            // manager.audioVideo.bindVideoElement(tileId, videoElement);
          }
        }
      );
    }
    new AsyncScheduler().start(
      async () => {
        await manager.initialize();
        manager.audioVideo.startVideoPreviewForVideoInput(videoPreviewRef.current);
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
  }, [manager, isVideoActive])

  function handleJoinButtonClick() {
    new AsyncScheduler().start(
      async () => {
        await manager.join();
        manager.audioVideo.stopVideoPreviewForVideoInput(videoPreviewRef.current);
        await manager.chooseFirstVideoInputDevice();
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
          <video id="video-preview" className="h-100 w-100" ref={videoPreviewRef} />
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
          </div>
        }
      </div>
      {audioVideoDidStart &&
        <>
          <VideoTiles />
          <AttendeeList attendees={roster} />
        </>
      }
    </div>
  );
}
