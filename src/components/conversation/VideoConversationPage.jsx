import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AsyncScheduler } from 'amazon-chime-sdk-js';
import { Button } from '@edx/paragon';

import ConversationManager from './ConversationManager';

let manager;

export default function VideoConversationPage() {
  const { meetingId } = useParams();
  const videoPreviewRef = useRef();
  const [audioVideoDidStart, setAudioVideoDidStart] = useState(false);
  const [roster, setRoster] = useState({});
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!manager) {
      manager = new ConversationManager(
        meetingId,
        {
          onUpdateRoster: newRoster => { setRoster(newRoster); },
          onAudioVideoDidStart: () => { setAudioVideoDidStart(true); },
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

  useEffect(() =>{
    const newUsers = [];
    Object.keys(roster).forEach((key) => {
      newUsers.push({
        attendeeId: key,
        ...roster[key],
      });
    });
    setUsers(newUsers);
  }, [roster]);

  async function handleJoinButtonClick() {
    new AsyncScheduler().start(
      async () => {
        await manager.join();
        manager.audioVideo.stopVideoPreviewForVideoInput(videoPreviewRef.current);
      }
    );
  }

  return (
    <div className="container py-3">
      <div className="row">
        <div className="col">
          <div className="row">
            <div className="col-12 col-lg-4 offset-lg-4">
              <video id="video-preview" className="h-100 w-100" ref={videoPreviewRef} />
            </div>
          </div>
          {!audioVideoDidStart &&
            <div className="text-center mt-3">
              <Button
                className="btn-primary" 
                onClick={handleJoinButtonClick}
              >
                Join conversation
              </Button>
            </div>
          }
        </div>
      </div>
      {audioVideoDidStart &&
        <>
          <div className="row">
            <div className="col">
              <div className="tiles">
                {[...Array(16)].map((_, index) => {
                  return (
                    <div
                      id={`tile-${index}`}
                      className="bg-light text-center d-inline-block pr-1"
                      style={{ width: 120 }}
                    >
                      <video className="bg-dark w-100 h-100" />
                      <span className="text-white">{index}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
            
            {users.map((user) => {
              return <p key={user.attendeeId}>{user.attendeeId}</p>
            })}
        </>
      }
    </div>
  );
}
