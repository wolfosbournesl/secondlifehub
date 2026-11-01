import fs from 'node:fs/promises';

const payload = JSON.parse(await fs.readFile(new URL('../docs/data/events.json', import.meta.url), 'utf8'));
if (payload.status === 'unavailable' || !Array.isArray(payload.events) || payload.events.length === 0) {
  throw new Error('The public events snapshot is empty or unavailable.');
}

for (const event of payload.events) {
  for (const field of ['id', 'title', 'date', 'region', 'slurl', 'detail']) {
    if (!String(event[field] || '').trim()) throw new Error(`Event ${event.id || 'unknown'} is missing ${field}.`);
  }
  if (!/^https:\/\/maps\.secondlife\.com\/secondlife\//.test(event.slurl)) throw new Error(`Event ${event.id} has an invalid SLurl.`);
  if (!/^https:\/\/secondlife\.com\/my\/community\/events\/event\.php\?id=/.test(event.detail)) throw new Error(`Event ${event.id} has an invalid official detail URL.`);
}

console.log(`Events OK: ${payload.events.length} official snapshot records.`);
