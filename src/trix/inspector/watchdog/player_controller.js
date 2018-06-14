/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require trix/watchdog/player
//= require trix/watchdog/player_view

Trix.Watchdog.PlayerController = class PlayerController {
  constructor(element, recording) {
    this.element = element;
    this.recording = recording;
    this.player = new Trix.Watchdog.Player(this.recording);
    this.player.delegate = this;

    this.view = new Trix.Watchdog.PlayerView(this.element);
    this.view.delegate = this;

    this.view.setLength(this.player.length);
    this.player.seek(0);
  }

  play() {
    return this.player.play();
  }

  stop() {
    return this.player.stop();
  }

  playerViewDidClickPlayButton() {
    if (this.player.isPlaying()) {
      return this.player.stop();
    } else {
      return this.player.play();
    }
  }

  playerViewDidChangeSliderValue(value) {
    return this.player.seek(value);
  }

  playerDidSeekToIndex(index) {
    let events, snapshot;
    this.view.setIndex(index);

    if (snapshot = this.player.getSnapshot(index)) {
      this.view.renderSnapshot(snapshot);
    }

    if (events = this.player.getEvents(index)) {
      return this.view.renderEvents(events);
    }
  }

  playerDidStartPlaying() {
    return this.view.playerDidStartPlaying();
  }

  playerDidStopPlaying() {
    return this.view.playerDidStopPlaying();
  }
};
