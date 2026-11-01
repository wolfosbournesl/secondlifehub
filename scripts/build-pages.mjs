import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workerSource = await fs.readFile(path.join(root, 'worker', 'index.js'), 'utf8');
const start = workerSource.indexOf('const page = `') + 'const page = `'.length;
const end = workerSource.indexOf('`;', start);
if (start < 'const page = `'.length || end < 0) throw new Error('Não foi possível extrair a página do Worker.');

let page = workerSource.slice(start, end);
page = page.replaceAll('V0.8.27', 'V0.8.28').replaceAll('v0.8.27', 'v0.8.28');
const staticBridge = `
  const githubPagesMode = location.hostname.endsWith('.github.io') || location.search.includes('static=1');
  const profileRelayOrigin = atob('aHR0cHM6Ly9zZWNvbmRsaWZlaHViLXJlbGF5LnZvbGtzZWM1NC5jaGF0Z3B0LnNpdGU=');
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
    '/api/catalog': 'data/catalog.json',
  };
  const githubPagesTarget = (input) => {
    const target = new URL(input, location.href);
    if (!githubPagesMode || !target.pathname.startsWith('/api/')) return input;
    if (target.pathname === '/api/groups-search') {
      const query = target.searchParams.get('q') || '';
      return 'https://search.secondlife.com/?query_term='+encodeURIComponent(query)+'&search_type=standard&collection_chosen=groups';
    }
    if (target.pathname === '/api/avatar-profile') return 'data/avatar-profile.json';
    return githubPagesStatic[target.pathname] || 'data/unavailable.json';
  };
  if (githubPagesMode) {
    const nativeFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const value = typeof input === 'string' ? input : input?.url || '';
      if (value.startsWith('/api/groups-search')) {
        return nativeFetch(new URL(value, profileRelayOrigin).toString(), { ...init, headers: { accept: 'application/json', ...(init?.headers || {}) } }).catch(() => new Response(JSON.stringify({ status: 'relay_unavailable', message: 'A busca pública de grupos não respondeu agora.', note: 'Tente novamente em alguns segundos.' }), { status: 503, headers: { 'content-type': 'application/json' } }));
      }
      if (value.startsWith('/api/avatar-profile')) {
        return nativeFetch(new URL(value, profileRelayOrigin).toString(), { ...init, headers: { accept: 'application/json', ...(init?.headers || {}) } }).catch(() => new Response(JSON.stringify({ status: 'relay_unavailable', message: 'O relay do perfil não respondeu agora.', note: 'A consulta permanece dentro do Hub; tente novamente em alguns segundos.', fetched_at: new Date().toISOString() }), { status: 503, headers: { 'content-type': 'application/json' } }));
      }
      if (value.startsWith('/api/intelligence/search')) {
        return nativeFetch(new URL(value, profileRelayOrigin).toString(), { ...init, headers: { accept: 'application/json', ...(init?.headers || {}) } }).then((response) => { if (!response.ok) throw new Error('directory relay unavailable'); return response; }).catch(() => nativeFetch('data/intelligence-search.json', init));
      }
      if (value.startsWith('/api/showbuzz')) {
        return nativeFetch(new URL(value, profileRelayOrigin).toString(), { ...init, headers: { accept: 'application/json', ...(init?.headers || {}) } }).catch(() => new Response(JSON.stringify({ status: 'relay_unavailable', message: 'O feed ShowBuzz não respondeu agora.', note: 'Tente novamente em alguns segundos.', fetched_at: new Date().toISOString() }), { status: 503, headers: { 'content-type': 'application/json' } }));
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
const busyDirectory = await getJson('https://inworldmap.com/api/search?sort=busiest&page=1', { items: [] });
const directoryByName = new Map((busyDirectory.items || []).map((item) => [String(item.name || item.region || '').toLowerCase(), item]));
const enrichedBusy = (home.busiest || []).slice(0, 12).map((item) => {
  const detail = directoryByName.get(String(item.name || '').toLowerCase()) || {};
  return { ...item, language: detail.language || null, language_name: detail.language_name || null, country: detail.country || null, region_type: detail.region_type || detail.type || null };
});
const unavailable = (message) => ({ status: 'unavailable', error: message });
const fetchedAt = new Date().toISOString();
await fs.writeFile(path.join(dataDir, 'world.json'), json({ source: 'Inworld Map public read-only API', totals: home.totals || {}, scan: home.latest_scan || home.scan || {}, busiest: enrichedBusy, recent_changes: (stats.recent_changes || []).slice(0, 40), fetched_at: fetchedAt }), 'utf8');
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

const eventsHtml = await getText('https://secondlife.com/events/upcoming.php?lang=en-US&per_page=15', '');
const eventCategory = (id) => ({ '27': 'Artes e cultura', '22': 'Comercial', '26': 'Educação', '30': 'Live DJ', '20': 'Live Music', '29': 'Diversos', '31': 'Espiritualidade', '18': 'Discussão', '24': 'Jogos e concursos', '23': 'Noite e entretenimento', '25': 'Desfiles', '19': 'Esportes', '28': 'Caridade e suporte' })[String(id)] || 'Outros';
const eventRows = [...eventsHtml.matchAll(/<tr data-event-id="(\d+)"([^>]*)>([\s\S]*?)<\/tr>/gi)].map((match) => {
  const body = match[3];
  const text = (value) => String(value || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&#0*39;|&#x27;/gi, "'").replace(/&quot;/gi, '"').replace(/\s+/g, ' ').trim();
  const link = body.match(/href="secondlife:\/\/\/app\/region\/([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
  const encoded = link?.[1] || '';
  const parts = encoded.split('/');
  const region = decodeURIComponent(parts[0] || '');
  const categoryId = (match[2].match(/category-id="(\d+)"/i) || [])[1] || '';
  const title = text((body.match(/class="event-link"[^>]*>([\s\S]*?)(?:<\/a>|<\/td>)/i) || [])[1]);
  const date = text((body.match(/<td class="event_date">([\s\S]*?)<\/td>/i) || [])[1]);
  return { id: match[1], title, date, region, location: text(link?.[2]), category_id: categoryId, category: eventCategory(categoryId), slurl: region ? 'https://maps.secondlife.com/secondlife/'+encodeURIComponent(region)+'/128/128/25' : 'https://secondlife.com/events/?lang=en-US', detail: 'https://secondlife.com/my/community/events/event.php?id='+match[1], source: 'Second Life official events' };
});
await fs.writeFile(path.join(dataDir, 'events.json'), json(eventRows.length ? { source: 'Second Life official events', events: eventRows, fetched_at: fetchedAt, note: 'Snapshot público substituível; confirme horário e disponibilidade na fonte oficial.' } : unavailable('Agenda oficial indisponível')), 'utf8');
await fs.writeFile(path.join(dataDir, 'event-previews.json'), json(unavailable('Préviews disponíveis no mapa oficial')), 'utf8');
await fs.writeFile(path.join(dataDir, 'showbuzz.json'), json(unavailable('ShowBuzz precisa de relay server-side')), 'utf8');
await fs.writeFile(path.join(dataDir, 'showbuzz-calendar.json'), json(unavailable('Agenda ShowBuzz precisa de relay server-side')), 'utf8');
await fs.writeFile(path.join(dataDir, 'showbuzz-images.json'), json(unavailable('Imagens ShowBuzz precisam de relay server-side')), 'utf8');
await fs.copyFile(path.join(root, 'data', 'catalog.json'), path.join(dataDir, 'catalog.json'));
await fs.writeFile(path.join(dataDir, 'avatar-profile.json'), json(unavailable('No GitHub Pages, abra o perfil público do avatar diretamente no World API')), 'utf8');
await fs.writeFile(path.join(dataDir, 'unavailable.json'), json(unavailable('Este módulo precisa de uma fonte pública compatível com GitHub Pages')), 'utf8');
