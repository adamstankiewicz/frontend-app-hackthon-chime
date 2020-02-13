import {
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  MeetingSessionConfiguration,
  MeetingSessionStatusCode,
  LogLevel,
} from 'amazon-chime-sdk-js';
import { getAuthenticatedHttpClient as getHttpClient } from '@edx/frontend-platform/auth';

import TileOrganizer from './TileOrganizer';

export default class ConversationManager {
  meetingId = null;
  audioVideo = null;
  canStartLocalVideo = true;
  roster = {};
  showActiveSpeakerScores = false;
  handlers = null;
  tileOrganizer = new TileOrganizer();

  constructor(meetingId, handlers={}) {
    this.meetingId = meetingId;
    this.handlers = handlers;
  }

  async joinMeeting() {
    const response = await getHttpClient().get(
      `${process.env.MEETING_INFO_URL}/${this.meetingId}`
    );

    return response.data;
  }

  setupDeviceLabelTrigger() {
    this.audioVideo.setDeviceLabelTrigger(
      async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        return stream;
      }
    );
  }

  async chooseFirstVideoInputDevice() {
    const devices = await this.audioVideo.listVideoInputDevices()
    await this.audioVideo.chooseVideoInputDevice(devices.pop().deviceId);
  }

  async chooseFirstAudioInputDevice() {
    const devices = await this.audioVideo.listAudioInputDevices()
    await this.audioVideo.chooseAudioInputDevice(devices.pop().deviceId);
  }

  async chooseFirstAudioOutputDevice() {
    const devices = await this.audioVideo.listAudioOutputDevices()
    await this.audioVideo.chooseAudioOutputDevice(devices.pop().deviceId);
  }

  async chooseDevices() {
    await this.chooseFirstAudioInputDevice()
    await this.chooseFirstAudioOutputDevice()
    await this.chooseFirstVideoInputDevice()
  }

  setupSubscribeToAttendeeIdPresenceHandler() {
    const handler = (attendeeId, present) => {
      this.log(`${attendeeId} present = ${present}`, this.roster);
      if (!present) {
        delete this.roster[attendeeId];
        return;
      } else {
        this.roster[attendeeId] = {};
      }
      this.handleUpdatedRoster();
    };
    this.audioVideo.realtimeSubscribeToAttendeeIdPresence(handler);
  }

  handleUpdatedRoster() {
    if ('onUpdateRoster' in this.handlers) {
      this.handlers.onUpdateRoster(this.roster);
    }
  }

  async initialize() {
    const joinInfo = await this.joinMeeting();
    const logger = new ConsoleLogger('SDK', LogLevel.INFO);
    this.session = new DefaultMeetingSession(
      new MeetingSessionConfiguration(joinInfo.Meeting, joinInfo.Attendee),
      logger,
      new DefaultDeviceController(logger),
    );
    this.audioVideo = this.session.audioVideo;
    this.setupDeviceLabelTrigger();
    await this.chooseDevices();
    this.setupSubscribeToAttendeeIdPresenceHandler();
    this.audioVideo.addObserver(this);
  }

  audioVideoDidStartConnecting(reconnecting) {
    this.log(`session connecting. reconnecting: ${reconnecting}`);
  }

  audioVideoDidStart() {
    this.log('session started');
    if ('onAudioVideoDidStart' in this.handlers) {
      this.handlers.onAudioVideoDidStart();
    }
  }

  audioVideoDidStop(sessionStatus) {
    this.log(`session stopped from ${JSON.stringify(sessionStatus)}`);
    if (sessionStatus.statusCode() === MeetingSessionStatusCode.AudioCallEnded) {
      this.log('meeting ended');
    }
  }

  videoTileDidUpdate(tileState) {
    this.log(`video tile updated: ${JSON.stringify(tileState)}`);
    const tileIndex = tileState.localTile
      ? 16
      : this.tileOrganizer.acquireTileIndex(tileState.tileId);
    const tileElement = document.getElementById(`tile-${tileIndex}`);
    console.log('videoTileDidUpdate', tileElement);
  }

  videoTileWasRemoved(tileId) {
    this.log(`video tile was removed: ${tileId}`);
  }

  videoAvailabilityDidChange(availability) {
    this.canStartLocalVideo = availability.canStartLocalVideo;
    this.log(`video availability changed: canStartLocalVideo ${availability.canStartLocalVideo}`);
  }

  connectionDidBecomePoor() {
    this.log('connection is poor');
  }

  connectionDidSuggestStopVideo() {
    this.log('suggest turning the video off');
  }

  videoSendDidBecomeUnavailable() {
    this.log('sending video is not available');
  }

  async join() {
    window.addEventListener('unhandledrejection', (event) => {
      this.log(event.reason);
    });
    this.audioVideo.start();
  }

  log(str) {
    console.log(`[DEMO] ${str}`);
  }
}
