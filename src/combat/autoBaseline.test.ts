import { expect, it } from 'vitest';
import { defaultAbilityPreferences } from '../data/abilities';
import { CombatEngine } from './CombatEngine';

// Full HuntResult hashes recorded from ed23459 BEFORE the incremental conversion.
const baseline = [
  {
    "seed": 803,
    "wave": true,
    "hash": "524f94c6b61e3ae4f266919262bd5276c403666e1dfc5db85bd04ed2acceb1e1"
  },
  {
    "seed": 803,
    "wave": false,
    "hash": "7f0df2a8789ffe6180939cf72150635a8a7cf8d03298925ae99c6ad3cb5e0c12"
  },
  {
    "seed": 804,
    "wave": true,
    "hash": "98b030957938f5e68dda210ef2a67427eb8f14fe23aacbead12da10fe053bc45"
  },
  {
    "seed": 804,
    "wave": false,
    "hash": "fa2fb08ecb2e5076e0b3055096046dd9e2408987d6c4b5a0475e4be0a4633ed3"
  },
  {
    "seed": 805,
    "wave": true,
    "hash": "982b9965040afb683c4bf262ff51d7b131fc1c1c81fabafeb5162fb137bb9923"
  },
  {
    "seed": 805,
    "wave": false,
    "hash": "9987a40819feb7bd032e6b6eab8c68ab23c70d2f38e5c7f06ddd2cb9a37c9ef3"
  },
  {
    "seed": 806,
    "wave": true,
    "hash": "24d18933dd904319a0c24e7ac0d83cbb7929acd78b875dcb53cdc2d1b63c0449"
  },
  {
    "seed": 806,
    "wave": false,
    "hash": "1cfa8e0bfd9f8a2ee8bded263fd85cc6933b592eb5c655cb3413822ad9f88d00"
  },
  {
    "seed": 807,
    "wave": true,
    "hash": "64e3e21bef73ce486f1aca9044e84f4e2b25edbe8aa240e2e5263005d5714313"
  },
  {
    "seed": 807,
    "wave": false,
    "hash": "f5c696076ba2cfc55e4928ed277c0e77a71f29471897cedaeef04e4ff5f22e02"
  },
  {
    "seed": 808,
    "wave": true,
    "hash": "0c58145a3556e822837652f6c1b0a631f26acc17c8c745848e3d1ed2efebc257"
  },
  {
    "seed": 808,
    "wave": false,
    "hash": "7199a6e884d3c0e90ee83e1e92d3ebfda3e3fb0347e6ae5efc2df04a4d1f5e05"
  },
  {
    "seed": 809,
    "wave": true,
    "hash": "f422e5d0f5d2c81f66457a0d40034d3db90c8bf256c925a624c580e32a57467d"
  },
  {
    "seed": 809,
    "wave": false,
    "hash": "c75113dbeacdc107965a3fafd212d509b4eefef8610147f4b41ee6d2bff61d91"
  },
  {
    "seed": 810,
    "wave": true,
    "hash": "3dfb8688de68395ca4cb2b232e62881771f6a2ab8e4c04b0ae4d88cd6424b361"
  },
  {
    "seed": 810,
    "wave": false,
    "hash": "04964c00a7f0ccbb3bbca5b73840cd642906c1874eae0355ec54234dd7ad725e"
  },
  {
    "seed": 811,
    "wave": true,
    "hash": "94e18b267247cbc6c996840cbcaa5a131b6d644aef795b856fb4eaaacb55da8e"
  },
  {
    "seed": 811,
    "wave": false,
    "hash": "02b088636e4ad9b116ea9dbbe2c13d0c487a4ceb6b89cbcac85481e354e01fa6"
  },
  {
    "seed": 812,
    "wave": true,
    "hash": "8b326dd8bcf10e7e21b31e732b360dac2d4ab2731252ab76c2ff9aa6a39db46b"
  },
  {
    "seed": 812,
    "wave": false,
    "hash": "b4eba1f70dc3c20b385aae31e23c5f2f800aaf1f8c37aed46811356108d1cffb"
  },
  {
    "seed": 813,
    "wave": true,
    "hash": "081629385407c3f1fb45bb524aa9644d9b40860a464ab64418ce8ffaea3e1818"
  },
  {
    "seed": 813,
    "wave": false,
    "hash": "d67a8116cf7dc1b4f5ee7fa476aca01189da868c720dc84f02bf0efa6a20d3f8"
  },
  {
    "seed": 814,
    "wave": true,
    "hash": "2931bd0c0f322c02f0a65ccd0ce0b132b83bad5a7be35ca36d876a238927976b"
  },
  {
    "seed": 814,
    "wave": false,
    "hash": "45ab211ef4c8767a42ff2e56aa217781c67a3ad1f4baf7aef6e7581fcaa39e36"
  }
];

it('preserves all 24 Auto results and events from ed23459 byte for byte', async () => {
  for (const entry of baseline) {
    const preferences = defaultAbilityPreferences();
    preferences.energy_wave.enabled = entry.wave;
    const result = new CombatEngine(entry.seed, preferences).run();
    const bytes = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(result)));
    const digest = Array.from(new Uint8Array(bytes),byte => byte.toString(16).padStart(2,'0')).join('');
    expect(digest, 'seed ' + entry.seed + ', wave ' + entry.wave).toBe(entry.hash);
  }
},60000);
