/** Original vector silhouettes; deliberately independent from legacy sprite assets. */
const paths:Record<string,string>={
  blade:'M15 35 32 7 37 5 37 11 21 39M10 32 25 41M13 39 8 47',
  hammer:'M11 12 22 7 36 17 26 24Z M24 21 10 45 M7 43 13 47',
  branch:'M20 46 27 10 21 5 M26 16 36 9 M24 26 14 16 M22 35 33 25',
  leaf:'M24 45 24 21 M24 30 Q5 26 11 8 Q29 10 24 30 M24 24 Q40 22 37 9 Q26 9 24 24',
  prism:'M17 46 27 23 M22 19 25 5 39 10 37 23 22 19 M25 5 30 17 39 10',
  orb:'M18 46 25 29 M15 17 A12 12 0 1 0 39 17 A12 12 0 1 0 15 17 M27 8 32 17 27 26 22 17Z',
  plate:'M17 7 24 12 31 7 41 17 35 22 34 44 14 44 13 22 7 17Z M24 15 24 40 M17 26 31 26',
  robe:'M19 6 29 6 34 17 40 45 8 45 14 17Z M19 6 24 17 29 6 M24 17 20 43',
  ember:'M24 46 Q4 37 15 23 L23 5 28 22 36 17 Q46 41 24 46Z M24 40 20 30 27 21 29 36Z',
};
export function itemIcon(icon:string){return `<svg class="item-icon" viewBox="0 0 48 52" aria-hidden="true"><path d="${paths[icon]??paths.ember}" fill="#263b38" stroke="currentColor" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round"/></svg>`;}
