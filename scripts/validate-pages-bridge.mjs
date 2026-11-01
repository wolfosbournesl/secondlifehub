import fs from 'node:fs/promises';

const root = new URL('..', import.meta.url);
const worker = await fs.readFile(new URL('worker/index.js', root), 'utf8');
const build = await fs.readFile(new URL('scripts/build-pages.mjs', root), 'utf8');
const pages = await fs.readFile(new URL('docs/app.html', root), 'utf8');

const routes = [
  '/api/catalog', '/api/events', '/api/groups-search', '/api/event-previews',
  '/api/world', '/api/world-search', '/api/intelligence/home', '/api/intelligence/stats',
  '/api/intelligence/languages', '/api/intelligence/search', '/api/intelligence/land',
  '/api/intelligence/region', '/api/intelligence/random', '/api/intelligence/map',
  '/api/avatar-profile', '/api/showbuzz-image', '/api/showbuzz', '/api/showbuzz-calendar',
  '/api/showbuzz-images', '/api/live'
];

const missingWorkerRoutes = routes.filter((route) => !worker.includes(`url.pathname === '${route}'`));
const requiredBridgeMarkers = [
  "const profileRelayOrigin =",
  "if (value.startsWith('/api/'))",
  "'/api/world-search': 'data/intelligence-search.json'"
];
const missingBuildMarkers = requiredBridgeMarkers.filter((marker) => !build.includes(marker));
const missingPagesMarkers = requiredBridgeMarkers.filter((marker) => !pages.includes(marker));
const missingWorkerMarkers = ['access-control-allow-origin', 'access-control-allow-methods'].filter((marker) => !worker.includes(marker));

const checks = [
  ['worker routes', missingWorkerRoutes.length === 0, missingWorkerRoutes.join(', ')],
  ['worker CORS wrapper', missingWorkerMarkers.length === 0, missingWorkerMarkers.join(', ')],
  ['build bridge', missingBuildMarkers.length === 0, missingBuildMarkers.join(', ')],
  ['generated Pages bridge', missingPagesMarkers.length === 0, missingPagesMarkers.join(', ')]
];

for (const [name, ok, detail] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ': ' + detail : ''}`);
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
