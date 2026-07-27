export type CurrencyId = 'bossToken';

interface CurrencyStorage {
  bossToken: number;
  rewardKeys: string[];
}

const STORAGE_KEY = 'tactical-hunt-currency';

const safeAmount = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.round(value)
    : 0;

export class CurrencyService {
  private bossToken = 0;
  private rewardedKeys = new Set<string>();

  constructor() {
    this.load();
  }

  getBossToken() {
    return this.bossToken;
  }

  awardBossToken(
    sessionId: string,
    bossId: string,
    rewardType: string,
    amount = 1,
  ) {
    const normalizedAmount = safeAmount(amount) || 1;
    const key = `${sessionId}:${bossId}:${rewardType}`;
    if (this.rewardedKeys.has(key)) return false;
    this.rewardedKeys.add(key);
    this.bossToken += normalizedAmount;
    this.persist();
    return true;
  }

  private load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CurrencyStorage;
      this.bossToken = safeAmount(parsed.bossToken);
      this.rewardedKeys = new Set(parsed.rewardKeys ?? []);
    } catch {
      this.bossToken = 0;
      this.rewardedKeys = new Set();
    }
  }

  private persist() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          bossToken: this.bossToken,
          rewardKeys: Array.from(this.rewardedKeys),
        }),
      );
    } catch {
      // Ignore persistence failures.
    }
  }
}
