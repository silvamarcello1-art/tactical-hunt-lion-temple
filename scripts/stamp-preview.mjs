import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
const commit = execFileSync('git',['rev-parse','--verify','HEAD'],{encoding:'utf8'}).trim();
await writeFile(new URL('../dist/version.json',import.meta.url),JSON.stringify({commit})+'\n');
await writeFile(new URL('../dist/.nojekyll',import.meta.url),'');
