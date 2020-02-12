import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@edx/paragon';

import ConversationManager from './ConversationManager';

let manager;

export default function VideoConversationPage({
  match: { params },
}) {
  const {  meetingId } = params;

  const videoPreviewRef = useRef();
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    if (!manager) {
      manager = new ConversationManager(meetingId);
    }
    return () => {
      manager = null;
    }
  }, [meetingId]);

  useEffect(() => {
    const initialize = async () => {
      await manager.initialize();
      manager.audioVideo.startVideoPreviewForVideoInput(videoPreviewRef.current);
    };
    initialize();
    return () => {
      manager.audioVideo.stopVideoPreviewForVideoInput(videoPreviewRef.current);
    };
  }, [meetingId]);

  async function handleJoinButtonClick() {
    await manager.join();
    setIsJoined(true);
  }

  return (
    <div className="container py-3">
      <div className="row">
        <div className="col">
          <div className="row">
            <div className="col-3">
              <video id="video-preview" className="h-100 w-100" ref={videoPreviewRef} />
            </div>
          </div>
          {!isJoined &&
            <div className="d-flex justify-space-between">
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
    </div>
  );
}
