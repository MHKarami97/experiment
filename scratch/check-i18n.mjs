import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectileFa = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/experiments/physics/motion/projectile/i18n/fa.json'), 'utf8'));
const projectileEn = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/experiments/physics/motion/projectile/i18n/en.json'), 'utf8'));
const kinematicsFa = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/experiments/physics/motion/1d-2d-kinematics/i18n/fa.json'), 'utf8'));
const kinematicsEn = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/experiments/physics/motion/1d-2d-kinematics/i18n/en.json'), 'utf8'));
const inclinedPlaneFa = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/experiments/physics/motion/newton-inclined-plane/i18n/fa.json'), 'utf8'));
const inclinedPlaneEn = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/experiments/physics/motion/newton-inclined-plane/i18n/en.json'), 'utf8'));
const pulleysLeversFa = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/experiments/physics/motion/pulleys-levers/i18n/fa.json'), 'utf8'));
const pulleysLeversEn = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/experiments/physics/motion/pulleys-levers/i18n/en.json'), 'utf8'));

// Build dictionary of all available keys in fa and en
function flattenKeys(obj, prefix = '') {
  let res = {};
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      Object.assign(res, flattenKeys(v, fullKey));
    } else {
      res[fullKey] = v;
    }
  }
  return res;
}

// Extract global keys from src/app/i18n.ts
const i18nTs = fs.readFileSync(path.join(__dirname, '../src/app/i18n.ts'), 'utf8');

// We can scan all files in src/
function getAllFiles(dir, exts = ['.vue', '.ts', '.json']) {
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

const allSrcFiles = getAllFiles(path.join(__dirname, '../src'));

// Find all key usages:
// 1. $t('...') or t('...')
// 2. titleKey: '...', descKey: '...', labelKey: '...', nameKey: '...'
const keyRegex = /(?:\$t|(?<=[^a-zA-Z0-9_]|^)t)\s*\(\s*['"`]([a-zA-Z0-9_.]+)['"`]/g;
const propKeyRegex = /(?:titleKey|descKey|labelKey|nameKey|explanationKey)\s*:\s*['"`]([a-zA-Z0-9_.]+)['"`]/g;

const usedKeys = new Map();

for (const f of allSrcFiles) {
  if (f.endsWith('.json')) continue;
  const content = fs.readFileSync(f, 'utf8');
  let match;
  while ((match = keyRegex.exec(content)) !== null) {
    const key = match[1];
    if (!usedKeys.has(key)) usedKeys.set(key, []);
    usedKeys.get(key).push(path.relative(path.join(__dirname, '..'), f));
  }
  while ((match = propKeyRegex.exec(content)) !== null) {
    const key = match[1];
    if (!usedKeys.has(key)) usedKeys.set(key, []);
    usedKeys.get(key).push(path.relative(path.join(__dirname, '..'), f));
  }
}

console.log(`TOTAL REFERENCED KEYS: ${usedKeys.size}`);

const faFlat = {
  ...flattenKeys(projectileFa, 'projectile'),
  ...flattenKeys(kinematicsFa, 'kinematics'),
  ...flattenKeys(inclinedPlaneFa, 'inclinedPlane'),
  ...flattenKeys(pulleysLeversFa, 'pulleysLevers')
};

const enFlat = {
  ...flattenKeys(projectileEn, 'projectile'),
  ...flattenKeys(kinematicsEn, 'kinematics'),
  ...flattenKeys(inclinedPlaneEn, 'inclinedPlane'),
  ...flattenKeys(pulleysLeversEn, 'pulleysLevers')
};

// Check used keys
for (const [key, files] of usedKeys.entries()) {
  if (key.startsWith('projectile.') || key.startsWith('kinematics.') || key.startsWith('inclinedPlane.') || key.startsWith('pulleysLevers.')) {
    if (!faFlat[key]) {
      console.log(`[MISSING FA]: "${key}" used in ${files[0]}`);
    }
    if (!enFlat[key]) {
      console.log(`[MISSING EN]: "${key}" used in ${files[0]}`);
    }
  } else {
    // Check if key is in i18nTs
    // e.g. 'common.play', 'app.title', 'experiments.projectile.title'
    const keyPart = key.split('.').pop();
    if (!i18nTs.includes(`'${key}'`) && !i18nTs.includes(`"${key}"`) && !i18nTs.includes(`${keyPart}:`)) {
      console.log(`[POTENTIALLY MISSING GLOBAL]: "${key}" used in ${files[0]}`);
    }
  }
}
