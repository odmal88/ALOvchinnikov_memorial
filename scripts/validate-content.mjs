import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const errors = [];
const warnings = [];

const requiredJsonFiles = [
  '09_SOURCE_JSON/shared/site.json',
  '09_SOURCE_JSON/pages/home.json',
  '09_SOURCE_JSON/pages/exhibition.json',
  '09_SOURCE_JSON/pages/about.json',
  '09_SOURCE_JSON/pages/collection.json',
  '09_SOURCE_JSON/pages/route.json',
  '09_SOURCE_JSON/pages/linocut.json',
  '09_SOURCE_JSON/pages/virtual.json',
  '09_SOURCE_JSON/pages/memory.json',
  '09_SOURCE_JSON/pages/visit.json',
  '09_SOURCE_JSON/templates/artTemplate.json',
  '09_SOURCE_JSON/templates/qrTemplate.json'
];

const runtimeFiles = [
  'bootstrap.js',
  'content-sync.js',
  'home-selected-works-sync.js',
  'artist-route-map.js',
  'works-model.js',
  'app.js',
  'works-runtime.js'
];

const allowedCategories = new Set(['north', 'city', 'history', 'interior', 'graphics', 'volga']);
const allowedRoutes = new Set(['/', '/artist', '/exhibition', '/works', '/digital', '/digital/workshop', '/digital/animated', '/visit', '/contacts']);

function full(rel) {
  return path.join(repoRoot, rel);
}

async function readText(rel) {
  return readFile(full(rel), 'utf-8');
}

async function readJson(rel, required = true) {
  if (!existsSync(full(rel))) {
    if (required) errors.push(`Missing JSON file: ${rel}`);
    return null;
  }
  try {
    return JSON.parse(await readText(rel));
  } catch (error) {
    errors.push(`Invalid JSON in ${rel}: ${error.message}`);
    return null;
  }
}

async function walkJson(dir) {
  if (!existsSync(full(dir))) return [];
  const result = [];
  async function walk(abs, rel) {
    const entries = await readdir(abs, { withFileTypes: true });
    for (const entry of entries) {
      const nextAbs = path.join(abs, entry.name);
      const nextRel = path.join(rel, entry.name).replace(/\\/g, '/');
      if (entry.isDirectory()) await walk(nextAbs, nextRel);
      if (entry.isFile() && entry.name.endsWith('.json')) result.push(nextRel);
    }
  }
  await walk(full(dir), dir);
  return result;
}

function slugifyRu(text) {
  const map = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya' };
  return String(text || '').trim().toLowerCase().split('').map((ch) => map[ch] ?? ch).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-');
}

function isExternal(value) {
  return /^(https?:|data:|mailto:|tel:)/i.test(String(value || ''));
}

function assetExists(value) {
  if (!value || isExternal(value)) return true;
  const clean = String(value).split('?')[0].replace(/^\.\//, '').replace(/^\//, '');
  return existsSync(full(clean));
}

function checkRoutes(obj, source, trail = []) {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => checkRoutes(item, source, trail.concat(`[${index}]`)));
    return;
  }
  for (const [key, value] of Object.entries(obj)) {
    const nextTrail = trail.concat(key);
    if (key === 'route' && typeof value === 'string') {
      const route = value.startsWith('#') ? value.slice(1) : value;
      const ok = !route || isExternal(route) || allowedRoutes.has(route) || /^\/works\/[a-z0-9][a-z0-9-]*$/.test(route);
      if (!ok) warnings.push(`Suspicious route in ${source} at ${nextTrail.join('.')}: ${value}`);
    }
    checkRoutes(value, source, nextTrail);
  }
}

async function validateJson() {
  for (const file of await walkJson('09_SOURCE_JSON')) await readJson(file, true);
  for (const file of requiredJsonFiles) await readJson(file, true);
}

async function validateDrafts() {
  for (const file of runtimeFiles) {
    if (!existsSync(full(file))) continue;
    const text = await readText(file);
    if (/09_SOURCE_JSON\/drafts\//.test(text) || /drafts\//.test(text)) {
      errors.push(`Runtime file appears to reference drafts/: ${file}`);
    }
  }
}

async function validateJsonRoutes() {
  const files = ['09_SOURCE_JSON/shared/site.json', ...(await walkJson('09_SOURCE_JSON/pages')), ...(await walkJson('09_SOURCE_JSON/templates'))];
  for (const file of files) checkRoutes(await readJson(file, true), file);
}

async function validateWorks() {
  const catalogPath = '09_SOURCE_JSON/shared/works-catalog-1-110.json';
  const imageMapPath = '09_SOURCE_JSON/shared/works-image-map.json';
  const runtimeMapPath = '09_SOURCE_JSON/shared/works-runtime-map.json';
  const catalog = await readJson(catalogPath, false);
  if (!catalog) {
    warnings.push(`Works catalog not found: ${catalogPath}`);
    return;
  }
  if (!Array.isArray(catalog)) {
    errors.push(`Works catalog must be an array: ${catalogPath}`);
    return;
  }
  const imageMap = (await readJson(imageMapPath, false)) || {};
  const runtimeMap = (await readJson(runtimeMapPath, false)) || { works: {} };
  const runtimeWorks = runtimeMap.works || {};
  const ids = new Set();
  const slugs = new Set();

  catalog.forEach((record, index) => {
    const id = String(record?.id ?? '').trim();
    const row = `${catalogPath}[${index}]`;
    if (!id) return errors.push(`${row}: missing id`);
    if (ids.has(id)) errors.push(`${row}: duplicate id ${id}`);
    ids.add(id);
    if (!record.title) warnings.push(`${row}: missing title`);

    const entry = runtimeWorks[id] || {};
    if (entry.category && !allowedCategories.has(entry.category)) errors.push(`${runtimeMapPath}.works.${id}: unknown category ${entry.category}`);
    const slug = slugifyRu(entry.slug || record.slug || record.title || `work-${id}`) || `work-${id}`;
    if (slugs.has(slug)) errors.push(`${row}: duplicate generated/runtime slug ${slug}`);
    slugs.add(slug);

    const imageMeta = imageMap[id] || {};
    const image = record.image || imageMeta.image;
    const thumb = record.thumbnail || imageMeta.thumbnail;
    const missing = Boolean(record.missingImage || imageMeta.missingImage);
    if (image && !assetExists(image)) warnings.push(`${row}: image path does not exist locally: ${image}`);
    if (thumb && !assetExists(thumb)) warnings.push(`${row}: thumbnail path does not exist locally: ${thumb}`);
    if (!image && !thumb && !missing) warnings.push(`${row}: no image/thumbnail and missingImage is not true`);
  });
}

async function validateContentSync() {
  if (!existsSync(full('content-sync.js'))) return;
  const text = await readText('content-sync.js');
  const declaresRoute = /route:\s*['"]09_SOURCE_JSON\/pages\/route\.json['"]/.test(text);
  const fetchesRoute = /fetchJson\(JSON_PATHS\.route\)/.test(text);
  const hasSyncRoute = /function\s+syncRoute\s*\(/.test(text);
  if (declaresRoute && (!fetchesRoute || !hasSyncRoute)) warnings.push('content-sync.js declares pages/route.json, but route sync does not appear active yet.');
}

await validateJson();
await validateDrafts();
await validateJsonRoutes();
await validateWorks();
await validateContentSync();

if (warnings.length) {
  console.log('\nContent warnings:');
  warnings.forEach((item) => console.log(`  - ${item}`));
}
if (errors.length) {
  console.error('\nContent errors:');
  errors.forEach((item) => console.error(`  - ${item}`));
  console.error(`\nValidation failed: ${errors.length} error(s), ${warnings.length} warning(s).`);
  process.exit(1);
}
console.log(`Content validation passed: 0 errors, ${warnings.length} warning(s).`);
