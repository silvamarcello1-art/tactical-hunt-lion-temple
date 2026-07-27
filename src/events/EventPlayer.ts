import type { CombatEvent } from './types';

export class EventPlayer {
  private index = 0;
  private elapsed = 0;
  private running = false;
  private disposed = false;
  private playbackSpeed = 1;

  constructor(
    private events: CombatEvent[],
    private onEvent: (event: CombatEvent) => void,
    private onTime: (milliseconds: number) => void,
  ) {}

  play() {
    if (this.disposed || this.completed || this.running) return false;
    this.running = true;
    return true;
  }

  pause() {
    if (!this.running) return false;
    this.running = false;
    return true;
  }

  reset() {
    if (this.disposed) return;
    this.index = 0;
    this.elapsed = 0;
    this.running = false;
  }

  dispose() {
    this.running = false;
    this.disposed = true;
  }

  set speed(value: number) {
    this.playbackSpeed =
      Number.isFinite(value) && value > 0 ? value : this.playbackSpeed;
  }

  get speed() {
    return this.playbackSpeed;
  }

  get paused() {
    return !this.running;
  }

  get completed() {
    return this.index >= this.events.length;
  }

  get time() {
    return this.elapsed;
  }

  get eventIndex() {
    return this.index;
  }

  update(delta: number) {
    if (
      !this.running ||
      this.disposed ||
      !Number.isFinite(delta) ||
      delta <= 0
    ) {
      return;
    }
    this.elapsed += delta * this.playbackSpeed;
    this.onTime(this.elapsed);
    while (
      this.index < this.events.length &&
      this.events[this.index].time <= this.elapsed
    ) {
      this.onEvent(this.events[this.index++]);
    }
    if (this.completed) this.running = false;
  }
}
