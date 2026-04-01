import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function readJson(relativePath) {
  const fullPath = path.join(__dirname, relativePath);
  const raw = await readFile(fullPath, 'utf-8');
  return JSON.parse(raw);
}

const output = {
  shared: await readJson('shared/site.json'),
  home: await readJson('pages/home.json'),
  exhibition: await readJson('pages/exhibition.json'),
  about: await readJson('pages/about.json'),
  collection: await readJson('pages/collection.json'),
  route: await readJson('pages/route.json'),
  linocut: await readJson('pages/linocut.json'),
  virtual: await readJson('pages/virtual.json'),
  memory: await readJson('pages/memory.json'),
  visit: await readJson('pages/visit.json'),
  artTemplate: await readJson('templates/artTemplate.json'),
  qrTemplate: await readJson('templates/qrTemplate.json')
};

const destination = path.join(__dirname, 'build/site_texts_ru_master_v3.json');
await writeFile(destination, `${JSON.stringify(output, null, 2)}\n`, 'utf-8');
console.log(`Built ${destination}`);
