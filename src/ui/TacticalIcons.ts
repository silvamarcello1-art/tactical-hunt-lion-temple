/** Original inline vector rune/utility icons. No external sprites or fonts. */
export function tacticalIcon(id:string):string {
  const shapes:Record<string,string>={
    magic_wall:'<path d="M12 32V16l6-7 6 7v16m-4 0V14l6-8 6 8v18m-3 0V18l5-6 4 6v14" fill="#9178c6" stroke="#d6c9ff"/>',
    fire_field:'<path d="M24 8c3 10 12 10 10 20-1 10-20 12-22 1-1-6 6-8 6-15 4 3 4 5 4 7 4-3 3-8 2-13Z" fill="#e78a44" stroke="#ffcf75"/><path d="M24 23c6 6 5 11 0 12-6 0-6-6 0-12" fill="#ffeab1"/>',
    sudden_death:'<path d="M13 22c0-17 22-17 22 0v8l-6 3v6H19v-6l-6-3Z" fill="#ddd3ed" stroke="#9b7cc5"/><path d="M18 22h4v5h-4zm8 0h4v5h-4zm-5 11h6m-3-3v8" stroke="#34233f" fill="#34233f"/>',
    destroy_field:'<path d="M23 10c2 9 12 9 10 18-1 8-18 10-19 0-1-5 5-7 5-13 4 4 2 6 4 7 4-4 0-9 0-12Z" fill="#a9babb"/><path d="m10 38 28-28" stroke="#b5e2df" stroke-width="4"/><path d="m12 40 28-28" stroke="#294d57" stroke-width="2"/>',
    push:'<path d="M10 19h17v-8l12 13-12 13v-8H10Z" fill="#acbd9d" stroke="#e2e7c8"/>',
    stop:'<rect x="13" y="13" width="22" height="22" rx="2" fill="#bd776a" stroke="#f1b6a4"/>',
  };
  return `<svg class="tactical-icon" viewBox="0 0 48 48" aria-hidden="true"><path d="m8 7 25-3 8 8-2 29-27 3-7-9Z" fill="#3c4140" stroke="#797d69"/>${shapes[id]??''}</svg>`;
}
