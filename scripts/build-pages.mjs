import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workerSource = await fs.readFile(path.join(root, 'worker', 'index.js'), 'utf8');
const start = workerSource.indexOf('const page = `') + 'const page = `'.length;
const end = workerSource.indexOf('`;', start);
if (start < 'const page = `'.length || end < 0) throw new Error('Não foi possível extrair a página do Worker.');

let page = workerSource.slice(start, end);
const staticBridge = `
  const githubPagesMode = location.hostname.endsWith('.github.io') || location.search.includes('static=1');
  const githubPagesStatic = {
    '/api/world': 'data/world.json',
    '/api/live': 'data/live.json',
    '/api/events': 'data/events.json',
    '/api/event-previews': 'data/event-previews.json',
    '/api/intelligence/home': 'data/intelligence-home.json',
    '/api/intelligence/stats': 'data/intelligence-stats.json',
    '/api/intelligence/languages': 'data/languages.json',
    '/api/intelligence/search': 'data/intelligence-search.json',
    '/api/intelligence/land': 'data/land.json',
    '/api/intelligence/region': 'data/region.json',
    '/api/intelligence/random': 'data/random.json',
    '/api/intelligence/map': 'data/map.json',
    '/api/showbuzz': 'data/showbuzz.json',
    '/api/showbuzz-calendar': 'data/showbuzz-calendar.json',
    '/api/showbuzz-images': 'data/showbuzz-images.json',
  };
  const githubPagesTarget = (input) => {
    const target = new URL(input, location.href);
    if (!githubPagesMode || !target.pathname.startsWith('/api/')) return input;
    if (target.pathname === '/api/groups-search') {
      const query = target.searchParams.get('q') || '';
      return 'https://search.secondlife.com/?query_term='+encodeURIComponent(query)+'&search_type=standard&collection_chosen=groups';
    }
    if (target.pathname === '/api/avatar-presence') return 'data/avatar-profile.json';
    return githubPagesStatic[target.pathname] || 'data/unavailable.json';
  };
  if (githubPagesMode) {
    const nativeFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const value = typeof input === 'string' ? input : input?.url || '';
      if (value.startsWith('/api/avatar-presence')) {
        const query = new URL(value, location.href).searchParams.get('q') || '';
        const uuid = query.match(/[0-9a-f]{8}(?:-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|[0-9a-f]{24})/i)?.[0] || '';
        const payload = { status: 'static_pages', input: query, online: null, message: 'O GitHub Pages não executa o relay do perfil; abra a fonte pública para consultar os detalhes atuais.', note: 'A aplicação permanece no GitHub Pages e oferece o perfil público oficial para consulta direta.', profile_url: uuid ? 'https://world.secondlife.com/resident/' + uuid : null, search_url: uuid ? null : 'https://search.secondlife.com/?query_term=' + encodeURIComponent(query) + '&search_type=standard&collection_chosen=people' };
        return Promise.resolve(new Response(JSON.stringify(payload), { status: 503, headers: { 'content-type': 'application/json' } }));
      }
      if (value.startsWith('/api/')) return nativeFetch(githubPagesTarget(value), init);
      return nativeFetch(input, init);
    };
    const kicker = document.querySelector('.brand-kicker');
    if (kicker) kicker.textContent = 'GITHUB PAGES · STATIC SNAPSHOT';
  }
`;
page = page.replace('<script>', '<script>\n' + staticBridge);
page = page.replace('<title>Second Life Hub — grid intelligence</title>', '<title>Second Life Hub — GitHub Pages</title>');
await fs.writeFile(path.join(root, 'docs', 'app.html'), '<!doctype html>\n' + page, 'utf8');

const dataDir = path.join(root, 'docs', 'data');
await fs.mkdir(dataDir, { recursive: true });
const json = (value) => JSON.stringify(value, null, 2) + '\n';
async function getJson(url, fallback) {
  try {
    const response = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'Second Life Hub GitHub Pages snapshot' } });
    if (!response.ok) throw new Error(String(response.status));
    return await response.json();
  } catch {
    return fallback;
  }
}
async function getText(url, fallback) {
  try {
    const response = await fetch(url, { headers: { accept: 'text/html,application/xhtml+xml', 'user-agent': 'Second Life Hub GitHub Pages snapshot' } });
    if (!response.ok) throw new Error(String(response.status));
    return await response.text();
  } catch {
    return fallback;
  }
}

const home = await getJson('https://inworldmap.com/api/home', {});
const stats = await getJson('https://inworldmap.com/api/stats', {});
const unavailable = (message) => ({ status: 'unavailable', error: message });
const fetchedAt = new Date().toISOString();
await fs.writeFile(path.join(dataDir, 'world.json'), json({ source: 'Inworld Map public read-only API', totals: home.totals || {}, scan: home.latest_scan || home.scan || {}, busiest: (home.busiest || []).slice(0, 12), recent_changes: (stats.recent_changes || []).slice(0, 40), fetched_at: fetchedAt }), 'utf8');
await fs.writeFile(path.join(dataDir, 'intelligence-home.json'), json({ ...home, fetched_at: fetchedAt }), 'utf8');
await fs.writeFile(path.join(dataDir, 'intelligence-stats.json'), json({ ...stats, fetched_at: fetchedAt }), 'utf8');
await fs.writeFile(path.join(dataDir, 'languages.json'), json(await getJson('https://inworldmap.com/api/languages', unavailable('Idiomas indisponíveis'))), 'utf8');
await fs.writeFile(path.join(dataDir, 'land.json'), json(await getJson('https://inworldmap.com/api/land?sort=price&dir=asc&page=1', unavailable('Terrenos indisponíveis'))), 'utf8');
await fs.writeFile(path.join(dataDir, 'intelligence-search.json'), json(await getJson('https://inworldmap.com/api/search?sort=busiest&page=1', unavailable('Diretório indisponível'))), 'utf8');
await fs.writeFile(path.join(dataDir, 'region.json'), json(unavailable('Detalhe de região disponível no mapa oficial')), 'utf8');
await fs.writeFile(path.join(dataDir, 'random.json'), json(unavailable('Região aleatória indisponível')), 'utf8');
await fs.writeFile(path.join(dataDir, 'map.json'), json(unavailable('Camada de mapa disponível no mapa oficial')), 'utf8');

const feedXml = await getText('https://api.secondlife.com/datafeeds/secondlife.xml', '');
const xmlValue = (tag) => Number(String((feedXml.match(new RegExp('<'+tag+'>\\s*([^<]+?)\\s*</'+tag+'>', 'i')) || [])[1] || 0).replace(/,/g, ''));
const gridStatus = (feedXml.match(/<status>([^<]+)<\/status>/i) || [])[1] || '';
await fs.writeFile(path.join(dataDir, 'live.json'), json(gridStatus ? { source: 'Linden Lab Live Data Feeds', grid_status: gridStatus, signups: xmlValue('signups'), inworld: xmlValue('inworld'), fetched_at: fetchedAt } : unavailable('Feed oficial indisponível')), 'utf8');

const eventsHtml = await getText('https://secondlife.com/events/?lang=en-US', '');
const eventRows = [...eventsHtml.matchAll(/<tr data-event-id="(\d+)"([^>]*)>([\s\S]*?)<\/tr>/gi)].map((match) => {
  const body = match[3];
  const text = (value) => String(value || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&#0*39;|&#x27;/gi, "'").replace(/&quot;/gi, '"').replace(/\s+/g, ' ').trim();
  const link = body.match(/href="secondlife:\/\/\/app\/region\/([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
  const encoded = link?.[1] || '';
  const parts = encoded.split('/');
  const region = decodeURIComponent(parts[0] || '');
  const categoryId = (match[2].match(/category-id="(\d+)"/i) || [])[1] || '';
  const title = text((body.match(/class="event-link"[^>]*>([\s\S]*?)<\/a>/i) || [])[1]);
  const date = text((body.match(/<td class="event_date">([\s\S]*?)<\/td>/i) || [])[1]);
  return { id: match[1], title, date, region, location: text(link?.[2]), category_id: categoryId, slurl: region ? 'https://maps.secondlife.com/secondlife/'+encodeURIComponent(region)+'/128/128/25' : 'https://secondlife.com/events/?lang=en-US', detail: 'https://secondlife.com/my/community/events/event.php?id='+match[1], source: 'Second Life official events' };
});
await fs.writeFile(path.join(dataDir, 'events.json'), json(eventRows.length ? { source: 'Second Life official events', events: eventRows, fetched_at: fetchedAt } : unavailable('Agenda oficial indisponível')), 'utf8');
await fs.writeFile(path.join(dataDir, 'event-previews.json'), json(unavailable('Préviews disponíveis no mapa oficial')), 'utf8');
await fs.writeFile(path.join(dataDir, 'showbuzz.json'), json(unavailable('ShowBuzz precisa de relay server-side')), 'utf8');
await fs.writeFile(path.join(dataDir, 'showbuzz-calendar.json'), json(unavailable('Agenda ShowBuzz precisa de relay server-side')), 'utf8');
await fs.writeFile(path.join(dataDir, 'showbuzz-images.json'), json(unavailable('Imagens ShowBuzz precisam de relay server-side')), 'utf8');
await fs.writeFile(path.join(dataDir, 'avatar-profile.json'), json(unavailable('No GitHub Pages, abra o perfil público do avatar diretamente no World API')), 'utf8');
await fs.writeFile(path.join(dataDir, 'unavailable.json'), json(unavailable('Este módulo precisa de uma fonte pública compatível com GitHub Pages')), 'utf8');
