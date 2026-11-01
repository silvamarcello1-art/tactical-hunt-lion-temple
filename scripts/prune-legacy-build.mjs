import { readdir, realpath, unlink } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';

// Vite copies all public files, including archived references not used at runtime.
// Remove only known legacy copies inside this generated dist; never touch public.
const output = await realpath(resolve(import.meta.dirname, '../dist'));
const legacy = path => /^(assets\/(wiki|tibia)\/|assets\/character-atlas(?:-source)?\.png$)/.test(path);
let removed = 0;
async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes:true })) {
    const path = resolve(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Unexpected symlink in build: ' + path);
    const contained = relative(output, await realpath(path));
    if (contained.startsWith('..') || contained.includes(':')) throw new Error('Path outside dist');
    if (entry.isDirectory()) await visit(path);
    else if (legacy(contained.split(sep).join('/'))) { await unlink(path); removed++; }
  }
}
await visit(output);
console.info('Excluded ' + removed + ' legacy reference copies from generated build.');
