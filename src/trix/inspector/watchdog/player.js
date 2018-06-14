/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require trix/watchdog/recording

Trix.Watchdog.Player = class Player {
  constructor(recording) {
    this.tick = this.tick.bind(this);
    this.recording = recording;
    this.playing = false;
    this.index = -1;
    this.length = this.recording.getFrameCount();
  }

  play() {
    if (this.playing) { return; }
    if (this.hasEnded()) { this.index = -1; }
    this.playing = true;
    __guardMethod__(this.delegate, 'playerDidStartPlaying', o => o.playerDidStartPlaying());
    return this.tick();
  }

  tick() {
    if (this.hasEnded()) {
      return this.stop();
    } else {
      this.seek(this.index + 1);
      const duration = this.getTimeToNextFrame();
      return this.timeout = setTimeout(this.tick, duration);
    }
  }

  seek(index) {
    const previousIndex = this.index;

    if (index < 0) {
      this.index = 0;
    } else if (index >= this.length) {
      this.index = this.length - 1;
    } else {
      this.index = index;
    }

    if (this.index !== previousIndex) {
      return __guardMethod__(this.delegate, 'playerDidSeekToIndex', o => o.playerDidSeekToIndex(index));
    }
  }

  stop() {
    if (!this.playing) { return; }
    clearTimeout(this.timeout);
    this.timeout = null;
    this.playing = false;
    return __guardMethod__(this.delegate, 'playerDidStopPlaying', o => o.playerDidStopPlaying());
  }

  isPlaying() {
    return this.playing;
  }

  hasEnded() {
    return this.index >= (this.length - 1);
  }

  getSnapshot() {
    return this.recording.getSnapshotAtFrameIndex(this.index);
  }

  getEvents() {
    return this.recording.getEventsUpToFrameIndex(this.index);
  }

  getTimeToNextFrame() {
    const current = this.recording.getTimestampAtFrameIndex(this.index);
    const next = this.recording.getTimestampAtFrameIndex(this.index + 1);
    const duration = (current != null) && (next != null) ? next - current : 0;
    return Math.min(duration, 500);
  }
};

function __guardMethod__(obj, methodName, transform) {
  if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
    return transform(obj, methodName);
  } else {
    return undefined;
  }
}