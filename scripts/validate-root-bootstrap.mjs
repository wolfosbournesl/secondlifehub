import fs from 'node:fs/promises';

const source = await fs.readFile(new URL('../worker/index.js', import.meta.url), 'utf8');
const required = [
  'async function renderRootPage()',
  'https://api.secondlife.com/datafeeds/secondlife.xml',
  'https://inworldmap.com/api/home',
  "setText('gridStatus'",
  "setText('onlineSummary'",
  "setText('regionCount'",
  "setText('activeRegionCount'",
  'renderRootPage()'
];

const missing = required.filter((needle) => !source.includes(needle));
if (missing.length) {
  console.error('Root bootstrap validation failed:', missing.join(', '));
  process.exit(1);
}

console.log('Root bootstrap validation passed:', required.length, 'checks');
