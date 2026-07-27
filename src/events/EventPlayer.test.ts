import { describe, expect, it, vi } from 'vitest';
import type { CombatEvent } from './types';
import { EventPlayer } from './EventPlayer';

const events: CombatEvent[] = [
  { id:'one', time:100, type:'spawn', floor:1 },
  { id:'two', time:200, type:'floor_complete', floor:1 },
  { id:'three', time:300, type:'hunt_complete', floor:1 },
];

describe('EventPlayer', () => {
  it('inicia, pausa e retoma sem duplicar eventos', () => {
    const onEvent = vi.fn();
    const onTime = vi.fn();
    const player = new EventPlayer(events, onEvent, onTime);

    expect(player.play()).toBe(true);
    expect(player.play()).toBe(false);
    player.update(120);
    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(player.pause()).toBe(true);
    player.update(500);
    expect(player.time).toBe(120);
    expect(onEvent).toHaveBeenCalledTimes(1);

    expect(player.play()).toBe(true);
    player.update(100);
    expect(onEvent).toHaveBeenCalledTimes(2);
    expect(onEvent.mock.calls.map(([item]) => item.id)).toEqual(['one', 'two']);
  });

  it('aplica velocidade, conclui e impede reinício duplicado', () => {
    const onEvent = vi.fn();
    const player = new EventPlayer(events, onEvent, vi.fn());
    player.speed = 4;
    player.play();
    player.update(75);

    expect(player.time).toBe(300);
    expect(player.completed).toBe(true);
    expect(player.paused).toBe(true);
    expect(onEvent).toHaveBeenCalledTimes(3);
    expect(player.play()).toBe(false);
  });

  it.each([1,2,4])(
    'preserva a ordem da timeline na velocidade %sx',
    (speed) => {
      const onEvent = vi.fn();
      const player = new EventPlayer(events, onEvent, vi.fn());
      player.speed = speed;
      player.play();
      player.update(300 / speed);

      expect(player.time).toBe(300);
      expect(onEvent.mock.calls.map(([item]) => item.id)).toEqual([
        'one',
        'two',
        'three',
      ]);
      expect(player.completed).toBe(true);
    },
  );

  it('reinicia timeline e ignora deltas inválidos', () => {
    const onEvent = vi.fn();
    const player = new EventPlayer(events, onEvent, vi.fn());
    player.play();
    player.update(Number.NaN);
    player.update(-10);
    expect(player.time).toBe(0);
    expect(onEvent).not.toHaveBeenCalled();

    player.update(150);
    player.reset();
    expect(player.time).toBe(0);
    expect(player.eventIndex).toBe(0);
    expect(player.paused).toBe(true);

    player.play();
    player.update(150);
    expect(onEvent).toHaveBeenCalledTimes(2);
  });

  it('descarta eventos pendentes e não aceita retomada após dispose', () => {
    const onEvent = vi.fn();
    const player = new EventPlayer(events, onEvent, vi.fn());
    player.play();
    player.update(150);
    player.dispose();
    player.update(1000);

    expect(onEvent.mock.calls.map(([item]) => item.id)).toEqual(['one']);
    expect(player.play()).toBe(false);
    expect(player.isRunning).toBe(false);
  });
});
