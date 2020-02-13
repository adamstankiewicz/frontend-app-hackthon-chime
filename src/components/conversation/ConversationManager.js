import qs from 'qs';
import {
  ConsoleLogger,
  DefaultActiveSpeakerPolicy,
  DefaultDeviceController,
  DefaultMeetingSession,
  MeetingSessionConfiguration,
  MeetingSessionStatusCode,
  LogLevel,
} from 'amazon-chime-sdk-js';
import { getAuthenticatedHttpClient as getHttpClient } from '@edx/frontend-platform/auth';

export default class ConversationManager {
  meetingId = null;
  audioVideo = null;
  canStartLocalVideo = true;
  roster = {};
  showActiveSpeakerScores = false;
  handlers = null;

  constructor(meetingId, handlers={}) {
    this.meetingId = meetingId;
    this.handlers = handlers;
  }

  async joinMeeting() {
    // FIXME: intentionally left here due to needing to run the node server temporarily
    // const options = {
    //   title: this.meetingId,
    //   name: 'test',
    // }
    // const response = await fetch(
    //   `${process.env.MEETING_INFO_URL}/join?${qs.stringify(options)}`,
    //   { method: 'POST' }
    // );
    // const json = await response.json();
    // if (json.error) {
    //   throw new Error(`Server error: ${json.error}`);
    // }
    // return json;
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
    await this.audioVideo.chooseVideoInputDevice(devices.pop());
  }

  async chooseFirstAudioInputDevice() {
    const devices = await this.audioVideo.listAudioInputDevices()
    await this.audioVideo.chooseAudioInputDevice(devices.pop());
  }

  async chooseFirstAudioOutputDevice() {
    const devices = await this.audioVideo.listAudioOutputDevices()
    await this.audioVideo.chooseAudioOutputDevice(devices.pop());
  }

  async chooseDevices() {
    await this.chooseFirstAudioInputDevice()
    await this.chooseFirstAudioOutputDevice()
    await this.chooseFirstVideoInputDevice()
  }

  setupSubscribeToAttendeeIdPresenceHandler() {
    const handler = (attendeeId, present) => {
      this.log(`${attendeeId} present = ${present}`);
      if (!present) {
        delete this.roster[attendeeId];
        return;
      }
      this.setupSubscribeToVolumeIndicator(attendeeId);
      this.setupActiveSpeakerDetector();
      this.handleUpdatedRoster();
    };
    this.audioVideo.realtimeSubscribeToAttendeeIdPresence(handler);
  }

  setupSubscribeToVolumeIndicator(attendeeId) {
    this.audioVideo.realtimeSubscribeToVolumeIndicator(attendeeId, (
      attendeeId,
      volume,
      muted,
      signalStrength
    ) => {
      if (!this.roster[attendeeId]) {
        this.roster[attendeeId] = {};
      }
      if (volume !== null) {
        this.roster[attendeeId].volume = Math.round(volume * 100);
      }
      if (muted !== null) {
        this.roster[attendeeId].muted = muted;
      }
      if (signalStrength !== null) {
        this.roster[attendeeId].signalStrength = Math.round(signalStrength * 100);
      }
      this.handleUpdatedRoster();
    });
  }

  setupActiveSpeakerDetector() {
    const activeSpeakerHandler = (attendeeIds) => {
      for (const attendeeId in this.roster) {
        this.roster[attendeeId].active = false;
      }
      for (const attendeeId of attendeeIds) {
        if (this.roster[attendeeId]) {
          this.roster[attendeeId].active = true;
          break; // only show the most active speaker
        }
      }
      this.handleUpdatedRoster();
    };
    this.audioVideo.subscribeToActiveSpeakerDetector(
      new DefaultActiveSpeakerPolicy(),
      activeSpeakerHandler,
    );
  }

  handleUpdatedRoster() {
    if ('onUpdateRoster' in this.handlers) {
      this.handlers.onUpdateRoster(this.roster);
    }
  }

  async initialize() {
    // FIXME: intentionally left here due to needing to run the node server temporarily
    // const joinInfo = (await this.joinMeeting()).JoinInfo;
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
    this.log(`video tile updated: ${tileState.tileId}`);
    if ('onVideoTileDidUpdate' in this.handlers) {
      this.handlers.onVideoTileDidUpdate(tileState);
    }
  }

  videoTileWasRemoved(tileId) {
    this.log(`video tile was removed: ${tileId}`);
  }

  videoAvailabilityDidChange(availability) {
    this.canStartLocalVideo = availability.canStartLocalVideo;
    this.log(`video availability changed: canStartLocalVideo=${availability.canStartLocalVideo} remoteVideoAvailable=${availability.remoteVideoAvailable}`);
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
