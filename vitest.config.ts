import { defineConfig } from 'vitest/config';

export default defineConfig({
  test:{
    include:['src/**/*.test.ts'],
    // Full-hunt simulations compete for CPU on Windows; keep existing test
    // deadlines/assertions rather than inflating their timeout under contention.
    fileParallelism:false,
  },
});
