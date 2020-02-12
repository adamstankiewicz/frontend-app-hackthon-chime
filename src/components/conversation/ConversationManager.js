import qs from 'qs';
import {
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  MeetingSessionConfiguration,
  MeetingSessionStatusCode,
  LogLevel,
} from 'amazon-chime-sdk-js';

export default class ConversationManager {
  meetingId = null;
  audioVideo = null;
  canStartLocalVideo = true;
  cameraDeviceIds = [];

  constructor(meetingId) {
    this.meetingId = meetingId; 
  }

  async joinMeeting() {
    const options = {
      title: this.meetingId,
      name: 'test',
    };
    const response = await fetch(
      `${process.env.CHIME_BASE_URL}/join?${qs.stringify(options)}`,
      {
        method: 'POST',
      }
    );
    const json = await response.json();
    if (json.error) {
      throw new Error(`Server error: ${json.error}`);
    }
    return json;
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

  async initialize() {
    const joinInfo = (await this.joinMeeting()).JoinInfo;
    const logger = new ConsoleLogger('SDK', LogLevel.INFO);
    this.session = new DefaultMeetingSession(
      new MeetingSessionConfiguration(joinInfo.Meeting, joinInfo.Attendee),
      logger,
      new DefaultDeviceController(logger),
    );
    this.audioVideo = this.session.audioVideo;
    this.setupDeviceLabelTrigger();
    await this.chooseDevices();
    this.audioVideo.addObserver(this);
  }

  audioVideoDidStartConnecting(reconnecting) {
    this.log(`session connecting. reconnecting: ${reconnecting}`);
  }

  audioVideoDidStart() {
    this.log('session started');
  }

  audioVideoDidStop(sessionStatus) {
    this.log(`session stopped from ${JSON.stringify(sessionStatus)}`);
    if (sessionStatus.statusCode() === MeetingSessionStatusCode.AudioCallEnded) {
      this.log('meeting ended');
    }
  }

  videoTileDidUpdate(tileState) {
    this.log(`video tile updated: ${JSON.stringify(tileState)}`);
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