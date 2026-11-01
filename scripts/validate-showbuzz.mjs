import fs from 'node:fs/promises';

const worker = await fs.readFile(new URL('../worker/index.js', import.meta.url), 'utf8');
const bridge = await fs.readFile(new URL('./build-pages.mjs', import.meta.url), 'utf8');

for (const endpoint of ['/api/showbuzz', '/api/showbuzz-calendar', '/api/showbuzz-images']) {
  if (!worker.includes(endpoint)) throw new Error(`Worker is missing ${endpoint}.`);
}
if (!bridge.includes("value.startsWith('/api/showbuzz')")) throw new Error('GitHub Pages does not relay ShowBuzz requests.');
const showbuzzBlock = worker.slice(worker.indexOf("if (url.pathname === '/api/showbuzz')"), worker.indexOf("if (url.pathname === '/api/live')"));
if ((showbuzzBlock.match(/access-control-allow-origin/g) || []).length < 3) throw new Error('ShowBuzz JSON endpoints are missing CORS headers.');

console.log('ShowBuzz relay contract OK');
