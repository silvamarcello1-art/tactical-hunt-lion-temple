import {
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { extname, relative, resolve, sep } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const outputDirectory = resolve(root, 'dist');
const serverDirectory = resolve(outputDirectory, 'server');

const excludedFiles = new Set([
  'assets/character-atlas-source.png',
  'assets/wiki/ancient-lion-knight.gif',
  'assets/wiki/ancient-lion-warlock.gif',
  'assets/wiki/drume.gif',
]);

const mimeTypes = {
  '.css':'text/css; charset=utf-8',
  '.gif':'image/gif',
  '.html':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.png':'image/png',
  '.svg':'image/svg+xml',
  '.webp':'image/webp',
};

async function listFiles(directory) {
  const entries = await readdir(directory);
  const files = [];
  for (const entry of entries) {
    if (entry === 'server') continue;
    const absolute = resolve(directory, entry);
    const info = await stat(absolute);
    if (info.isDirectory()) files.push(...await listFiles(absolute));
    else files.push(absolute);
  }
  return files;
}

await rm(serverDirectory, { recursive:true, force:true });
await mkdir(serverDirectory, { recursive:true });

const assets = {};
for (const absolutePath of await listFiles(outputDirectory)) {
  const relativePath = relative(outputDirectory, absolutePath).split(sep).join('/');
  if (excludedFiles.has(relativePath)) continue;
  const extension = extname(relativePath).toLowerCase();
  const buffer = await readFile(absolutePath);
  const textual = ['.css', '.html', '.js', '.json', '.svg'].includes(extension);
  assets[`/${relativePath}`] = {
    body:textual ? buffer.toString('utf8') : buffer.toString('base64'),
    encoding:textual ? 'text' : 'base64',
    type:mimeTypes[extension] ?? 'application/octet-stream',
  };
}

const workerSource = `
const assets = ${JSON.stringify(assets)};

function decodeBase64(value) {
  const decoded = atob(value);
  const bytes = new Uint8Array(decoded.length);
  for (let index = 0; index < decoded.length; index++) {
    bytes[index] = decoded.charCodeAt(index);
  }
  return bytes;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    let path = decodeURIComponent(url.pathname);
    if (path === '/') path = '/index.html';
    const asset = assets[path] ?? assets['/index.html'];
    if (!asset) return new Response('Not found', { status: 404 });
    const body = asset.encoding === 'base64'
      ? decodeBase64(asset.body)
      : asset.body;
    return new Response(body, {
      headers: {
        'Content-Type': asset.type,
        'Cache-Control': path === '/index.html'
          ? 'no-cache'
          : 'public, max-age=31536000, immutable',
      },
    });
  },
};
`;

await writeFile(resolve(serverDirectory, 'index.js'), workerSource, 'utf8');
