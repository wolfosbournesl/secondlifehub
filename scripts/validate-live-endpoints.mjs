const base = process.env.SECONDLIFE_HUB_BASE || 'https://secondlifehub-relay.volksec54.chatgpt.site';

const cases = [
  ['root', '/?check=full', 200],
  ['catalog', '/api/catalog', 200],
  ['events', '/api/events', 200],
  ['groups', '/api/groups-search?q=music', 200],
  ['event-previews', '/api/event-previews?regions=NOTORIOUS%20Kingdom', 200],
  ['world', '/api/world', 200],
  ['world-search', '/api/world-search?q=beach', 200],
  ['intelligence-home', '/api/intelligence/home', 200],
  ['intelligence-stats', '/api/intelligence/stats', 200],
  ['languages', '/api/intelligence/languages', 200],
  ['directory-search', '/api/intelligence/search?q=beach', 200],
  ['land', '/api/intelligence/land', 200],
  ['region', '/api/intelligence/region?name=NOTORIOUS%20Kingdom', 200],
  ['random', '/api/intelligence/random', 200],
  ['map', '/api/intelligence/map?layer=heat&xmin=560&xmax=610&ymin=1320&ymax=1370', 200],
  ['profile-invalid', '/api/avatar-profile?q=not-a-key', 400],
  ['showbuzz', '/api/showbuzz', 200],
  ['showbuzz-calendar', '/api/showbuzz-calendar', 200],
  ['showbuzz-images', '/api/showbuzz-images?names=DJ%20Example', 200],
  ['live', '/api/live', 200],
  ['image-allowlist', '/api/showbuzz-image?url=https%3A%2F%2Fexample.com%2Fimage.jpg', 404]
];

const expectedShape = {
  catalog: (body) => Array.isArray(body.items) && body.items.length > 0,
  events: (body) => Array.isArray(body.events) && body.events.length > 0,
  groups: (body) => Array.isArray(body.groups),
  'event-previews': (body) => Array.isArray(body.previews),
  world: (body) => body.totals && Array.isArray(body.busiest),
  'world-search': (body) => Array.isArray(body.items),
  'intelligence-home': (body) => body.totals,
  'intelligence-stats': (body) => Array.isArray(body.recent_changes),
  languages: (body) => body.languages || body.items || body.totals,
  'directory-search': (body) => Array.isArray(body.items),
  land: (body) => Array.isArray(body.items),
  region: (body) => body.name || body.region || body.status === 'unavailable',
  random: (body) => body.name || body.region || body.slurl || body.status === 'unavailable',
  map: (body) => Array.isArray(body.points) || Array.isArray(body.items) || body.status === 'unavailable',
  'profile-invalid': (body) => body.status === 'invalid_key',
  showbuzz: (body) => Number.isFinite(Number(body.live_count)) || body.status === 'unavailable',
  'showbuzz-calendar': (body) => Array.isArray(body.upcoming) || body.status === 'unavailable',
  'showbuzz-images': (body) => body.images && typeof body.images === 'object',
  live: (body) => body.grid_status && Number.isFinite(Number(body.inworld)),
  'image-allowlist': () => true
};

async function request(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(new URL(path, base), { cache: 'no-store', signal: controller.signal });
    const text = await response.text();
    let body = null;
    try { body = JSON.parse(text); } catch {}
    return { status: response.status, contentType: response.headers.get('content-type') || '', cors: response.headers.get('access-control-allow-origin') || '', text, body };
  } catch (error) {
    return { error: error.name + ': ' + error.message };
  } finally {
    clearTimeout(timer);
  }
}

const results = [];
for (const [name, path, expectedStatus] of cases) {
  const response = await request(path);
  const shape = expectedShape[name];
  const corsOk = name === 'root' || response.cors === '*';
  const ok = !response.error
    && response.status === expectedStatus
    && corsOk
    && (name === 'root'
      ? response.text.includes('GRID INTELLIGENCE · V0.8.28')
        && response.text.includes('residentes online')
        && response.text.includes('regiões com pessoas')
      : !shape || shape(response.body || {}));
  results.push({
    name,
    ok,
    status: response.status || null,
    expectedStatus,
    detail: response.error || (response.body ? Object.keys(response.body).slice(0, 6).join(', ') : response.contentType)
  });
}

console.table(results);
const failed = results.filter((result) => !result.ok);
console.log('Endpoint smoke test: ' + (results.length - failed.length) + '/' + results.length + ' passed');
if (failed.length) process.exitCode = 1;
