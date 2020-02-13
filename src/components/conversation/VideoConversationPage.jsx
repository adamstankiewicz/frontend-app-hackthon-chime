import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import classNames from 'classnames';
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
                onClick={async (e) => { await handleJoinButtonClick(e); } }
              >
                Join conversation
              </Button>
            </div>
          }
        </div>
      </div>
      {audioVideoDidStart &&
        <>
          <div className="row mt-1">
            <div className="col">
              <div className="tiles d-flex" style={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
                {[...Array(16)].map((_, index) => {
                  return (
                    <div
                      id={`tile-${index}`}
                      className="text-center pr-1"
                      style={{ flex: '0 0 auto' }}
                    >
                      <video className="bg-dark" />
                      <div>{index}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="row mt-3">
            {users.length > 0 &&
              <div className="row">
                <div className="col">
                  <h4>Attendee IDs</h4>
                  <ul>
                    {users.map((user) => {
                      return <li key={user.attendeeId}>{user.attendeeId}</li>
                    })}
                  </ul>
                </div>
              </div>
            }
          </div>
        </>
      }
    </div>
  );
}
