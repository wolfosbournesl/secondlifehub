import fs from 'node:fs/promises';

const source = await fs.readFile(new URL('../worker/index.js', import.meta.url), 'utf8');
const bridge = await fs.readFile(new URL('./build-pages.mjs', import.meta.url), 'utf8');
const readme = await fs.readFile(new URL('../README.md', import.meta.url), 'utf8');

const keyPattern = /\^\(\?:\[0-9a-f\]\{32\}\|\[0-9a-f\]\{8\}-\[0-9a-f\]\{4\}-\[1-5\]\[0-9a-f\]\{3\}-\[89ab\]\[0-9a-f\]\{3\}-\[0-9a-f\]\{12\}\)\$/i;
const required = [
  ['frontend key validation', 'function isProfileKey(value)'],
  ['strict worker key validation', 'function normalizeAvatarUuid(value)'],
  ['key-only API response', "status: 'invalid_key'"],
  ['key-only UI copy', 'UUID/key do avatar'],
  ['static bridge relay', '/api/avatar-profile'],
];

for (const [label, needle] of required) {
  if (!source.includes(needle) && !bridge.includes(needle)) throw new Error(`Missing ${label}: ${needle}`);
}
if (!keyPattern.test(source)) throw new Error('The worker key validator is not strict enough.');
if (source.includes('name_lookup_unavailable') || source.includes('collection_chosen=people') || bridge.includes('collection_chosen=people')) {
  throw new Error('Name lookup remnants remain in the profile flow.');
}
if (!readme.includes('only by UUID/key') || !readme.includes('names and profile URLs are rejected')) {
  throw new Error('README does not document the key-only profile contract.');
}

console.log('Profile key-only contract OK');
