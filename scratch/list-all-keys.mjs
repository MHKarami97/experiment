import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read i18n.ts
const i18nTs = fs.readFileSync(path.join(__dirname, '../src/app/i18n.ts'), 'utf8');

// Load json files
const projectileFa = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/experiments/physics/motion/projectile/i18n/fa.json'), 'utf8'));
const projectileEn = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/experiments/physics/motion/projectile/i18n/en.json'), 'utf8'));
const kinematicsFa = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/experiments/physics/motion/1d-2d-kinematics/i18n/fa.json'), 'utf8'));
const kinematicsEn = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/experiments/physics/motion/1d-2d-kinematics/i18n/en.json'), 'utf8'));
const inclinedPlaneFa = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/experiments/physics/motion/newton-inclined-plane/i18n/fa.json'), 'utf8'));
const inclinedPlaneEn = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/experiments/physics/motion/newton-inclined-plane/i18n/en.json'), 'utf8'));

// Helper to get nested value
function getVal(obj, pathStr) {
  const parts = pathStr.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur === undefined || cur === null) return undefined;
    cur = cur[p];
  }
  return cur;
}

// Let's extract globalMessages object from i18n.ts using basic JS eval via a dummy module
// We can construct the full dictionary
// In i18n.ts, let's see what top-level keys exist in globalMessages.fa and globalMessages.en
// We can use a script that imports i18n.ts using ts-node or vite-node, or parse the keys.
// Even simpler: let's scan all keys used in .vue and .ts files and test both fa and en.

function getAllFiles(dir, exts = ['.vue', '.ts']) {
  let res = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        res = res.concat(getAllFiles(full, exts));
      }
    } else {
      if (exts.includes(path.extname(full))) {
        res.push(full);
      }
    }
  }
  return res;
}

const files = getAllFiles(path.join(__dirname, '../src'));
const keyRegex = /(?:\$t|(?<=[^a-zA-Z0-9_]|^)t)\s*\(\s*['"`]([a-zA-Z0-9_.]+)['"`]/g;
const propKeyRegex = /(?:titleKey|descKey|labelKey|nameKey|explanationKey)\s*:\s*['"`]([a-zA-Z0-9_.]+)['"`]/g;

const allKeys = new Map();

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = keyRegex.exec(content)) !== null) {
    if (!allKeys.has(m[1])) allKeys.set(m[1], []);
    allKeys.get(m[1]).push(path.relative(path.join(__dirname, '..'), f));
  }
  while ((m = propKeyRegex.exec(content)) !== null) {
    if (!allKeys.has(m[1])) allKeys.set(m[1], []);
    allKeys.get(m[1]).push(path.relative(path.join(__dirname, '..'), f));
  }
}

console.log('Total extracted keys:', allKeys.size);

// Print keys grouped by prefix
const prefixes = {};
for (const k of allKeys.keys()) {
  const prefix = k.split('.')[0];
  prefixes[prefix] = (prefixes[prefix] || 0) + 1;
}
console.log('Prefixes breakdown:', prefixes);
for (const k of Array.from(allKeys.keys()).sort()) {
  console.log('  ', k, '->', allKeys.get(k)[0]);
}
