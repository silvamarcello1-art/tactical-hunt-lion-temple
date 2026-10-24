import { expect, type Page } from '@playwright/test';

// Three complete rendered hunts consistently take ~210 s on Windows CI.
// This bounds the whole scenario, not any individual state assertion.
export const REPEATED_HUNT_TIMEOUT_MS = process.env.CI ? 360_000 : 180_000;

// Use only for transient boundaries (boss/reset, loop window, key chords).
// The real engine and renderer still execute every animation frame. Other
// scenarios deliberately retain wall-clock playback and real mouse timing.
export async function installControlledClock(page: Page) {
  await page.clock.install({ time:new Date('2026-01-01T00:00:00Z') });
}

export async function pauseIdleClock(page: Page) {
  await expect(page.locator('html')).toHaveAttribute('data-session-state', 'idle');
  await page.clock.pauseAt(new Date('2026-01-01T01:00:00Z'));
}

export async function advanceUntilAttribute(
  page: Page,
  attribute: string,
  expected: string,
  maximumMs = 120_000,
) {
  for (let elapsed = 0; elapsed <= maximumMs; elapsed += 250) {
    if (await page.locator('html').getAttribute(attribute) === expected) return;
    await page.clock.runFor(250);
  }
  await expect(page.locator('html')).toHaveAttribute(attribute, expected);
}
