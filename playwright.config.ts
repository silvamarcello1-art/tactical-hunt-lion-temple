import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir:'./tests/e2e',
  timeout:110_000,
  expect:{ timeout:10_000 },
  fullyParallel:false,
  workers:1,
  reporter:'list',
  use:{
    baseURL:process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4173',
    channel:'msedge',
    headless:true,
    viewport:{ width:1366, height:768 },
    trace:'retain-on-failure',
    screenshot:'only-on-failure',
  },
  webServer:{
    command:'pnpm exec vite --host 127.0.0.1 --port 4173',
    url:'http://127.0.0.1:4173',
    reuseExistingServer:true,
    timeout:30_000,
  },
});
