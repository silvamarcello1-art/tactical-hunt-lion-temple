import type { CombatEngine } from '../combat/CombatEngine';
import type { CombatEvent } from './types';

/** Streams the same simulation used by CombatEngine.run(), on one logical clock. */
export class LiveEventPlayer {
  private elapsed = 0;
  private running = false;
  private disposed = false;
  private playbackSpeed = 1;
  private processed = 0;

  constructor(
    private engine:CombatEngine,
    private onEvent:(event:CombatEvent) => void,
    private onTime:(milliseconds:number) => void,
    private beforeTick:(milliseconds:number) => void = () => {},
  ) {}

  play() {
    if (this.disposed || this.completed || this.running) return false;
    this.running = true;
    return true;
  }
  pause() { const wasRunning = this.running; this.running = false; return wasRunning; }
  dispose() { this.running = false; this.disposed = true; this.engine.dispose(); }
  set speed(value:number) { if (Number.isFinite(value) && value > 0) this.playbackSpeed = value; }
  get speed() { return this.playbackSpeed; }
  get paused() { return !this.running; }
  get isRunning() { return this.running; }
  get completed() { return this.engine.completed; }
  get time() { return this.elapsed; }
  get eventIndex() { return this.processed; }

  update(delta:number) {
    if (!this.running || this.disposed || !Number.isFinite(delta) || delta <= 0) return;
    this.elapsed += delta * this.playbackSpeed;
    const events = this.engine.advanceTo(this.elapsed, this.beforeTick);
    this.onTime(this.elapsed);
    for (const event of events) { this.onEvent(event); this.processed++; }
    if (this.completed) this.running = false;
  }
}
