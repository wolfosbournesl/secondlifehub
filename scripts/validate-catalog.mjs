import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jsonPath = path.join(root, 'data', 'catalog.json');
const csvPath = path.join(root, 'data', 'catalog.csv');
const items = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
const csv = await fs.readFile(csvPath, 'utf8');

const required = ['id', 'type', 'name', 'description', 'slurl', 'category', 'tags', 'maturity', 'access', 'source', 'data_status'];
if (!Array.isArray(items) || items.length < 5) throw new Error('O catálogo precisa de pelo menos 5 registros.');
const ids = new Set();
for (const item of items) {
  for (const key of required) if (!(key in item)) throw new Error(`Campo ausente: ${key}`);
  if (ids.has(item.id)) throw new Error(`ID duplicado: ${item.id}`);
  ids.add(item.id);
  if (!/^https:\/\/maps\.secondlife\.com\/secondlife\//.test(item.slurl)) throw new Error(`SLurl inválida: ${item.id}`);
  if (!['region', 'parcel', 'experience'].includes(item.type)) throw new Error(`Tipo inválido: ${item.id}`);
  if (!Array.isArray(item.tags)) throw new Error(`Tags precisam ser uma lista: ${item.id}`);
  if (!Array.isArray(item.related_events)) throw new Error(`related_events precisa ser uma lista: ${item.id}`);
  if (!['G', 'M', 'A'].includes(item.maturity)) throw new Error(`Maturidade inválida: ${item.id}`);
}
const csvLines = csv.trim().split(/\r?\n/);
if (csvLines.length !== items.length + 1) throw new Error('JSON e CSV devem ter a mesma quantidade de registros.');
if (!csvLines[0].startsWith('id,type,name,region')) throw new Error('Cabeçalho CSV inválido.');
console.log(`Catalog OK: ${items.length} registros JSON, ${csvLines.length - 1} registros CSV, SLurls válidas.`);
