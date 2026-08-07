import { describe, expect, it, beforeEach } from 'vitest';
import { CurrencyService } from './CurrencyService';

const localStorageMock = (() => {
  const storage = new Map<string, string>();
  return {
    getItem(key: string) {
      return storage.has(key) ? storage.get(key) ?? null : null;
    },
    setItem(key: string, value: string) {
      storage.set(key, value);
    },
    removeItem(key: string) {
      storage.delete(key);
    },
    clear() {
      storage.clear();
    },
    key(index: number) {
      return Array.from(storage.keys())[index] ?? null;
    },
    get length() {
      return storage.size;
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  configurable: true,
  writable: true,
});

describe('CurrencyService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with zero boss token balance', () => {
    const service = new CurrencyService();
    expect(service.getBossToken()).toBe(0);
  });

  it('awards boss tokens once per sessionId+bossId+rewardType', () => {
    const service = new CurrencyService();
    expect(
      service.awardBossToken('session-1', 'lion-king', 'bossToken', 1),
    ).toBe(true);
    expect(service.getBossToken()).toBe(1);
    expect(
      service.awardBossToken('session-1', 'lion-king', 'bossToken', 1),
    ).toBe(false);
    expect(service.getBossToken()).toBe(1);
  });

  it('supports configurable bossTokenReward amounts', () => {
    const service = new CurrencyService();
    expect(
      service.awardBossToken('session-1', 'lion-king', 'bossToken', 3),
    ).toBe(true);
    expect(service.getBossToken()).toBe(3);
  });

  it('persists boss tokens across reloads', () => {
    const service = new CurrencyService();
    service.awardBossToken('session-1', 'lion-king', 'bossToken', 1);
    const reloaded = new CurrencyService();
    expect(reloaded.getBossToken()).toBe(1);
  });

  it('persists reward keys across reloads', () => {
    const service = new CurrencyService();
    service.awardBossToken('session-1', 'lion-king', 'bossToken', 1);
    const reloaded = new CurrencyService();
    expect(
      reloaded.awardBossToken('session-1', 'lion-king', 'bossToken', 1),
    ).toBe(false);
  });

  it('rewards different bosses separately', () => {
    const service = new CurrencyService();
    expect(service.awardBossToken('session-1', 'lion-king', 'bossToken', 1)).toBe(true);
    expect(service.awardBossToken('session-1', 'dragon-queen', 'bossToken', 1)).toBe(true);
    expect(service.getBossToken()).toBe(2);
  });

  it('supports multiple loops with distinct sessionIds', () => {
    const first = new CurrencyService();
    expect(first.awardBossToken('session-A', 'lion-king', 'bossToken', 1)).toBe(true);
    expect(first.getBossToken()).toBe(1);
    const second = new CurrencyService();
    expect(second.getBossToken()).toBe(1);
    expect(second.awardBossToken('session-B', 'lion-king', 'bossToken', 1)).toBe(true);
    expect(second.getBossToken()).toBe(2);
    const third = new CurrencyService();
    expect(third.getBossToken()).toBe(2);
    expect(third.awardBossToken('session-C', 'lion-king', 'bossToken', 1)).toBe(true);
    expect(third.getBossToken()).toBe(3);
  });

  it('rewards three different bosses separately in the same session', () => {
    const service = new CurrencyService();
    expect(service.awardBossToken('session-1', 'boss-1', 'bossToken', 1)).toBe(true);
    expect(service.awardBossToken('session-1', 'boss-2', 'bossToken', 1)).toBe(true);
    expect(service.awardBossToken('session-1', 'boss-3', 'bossToken', 1)).toBe(true);
    expect(service.getBossToken()).toBe(3);
  });
});
