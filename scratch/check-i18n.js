const fs = require('fs');
const path = require('path');

// Load global messages
const faApp = require('../src/app/i18n.ts'); // we can read json files directly
const projectileFa = require('../src/experiments/physics/motion/projectile/i18n/fa.json');
const projectileEn = require('../src/experiments/physics/motion/projectile/i18n/en.json');
const kinematicsFa = require('../src/experiments/physics/motion/1d-2d-kinematics/i18n/fa.json');
const kinematicsEn = require('../src/experiments/physics/motion/1d-2d-kinematics/i18n/en.json');
const inclinedPlaneFa = require('../src/experiments/physics/motion/newton-inclined-plane/i18n/fa.json');
const inclinedPlaneEn = require('../src/experiments/physics/motion/newton-inclined-plane/i18n/en.json');

// Also read src/app/i18n.ts content to extract global keys
const i18nContent = fs.readFileSync(path.join(__dirname, '../src/app/i18n.ts'), 'utf8');

console.log('Scanning all .vue and .ts files for $t and t()...');

function getAllFiles(dir, exts = ['.vue', '.ts', '.js']) {
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

const foundKeys = new Set();
const keyLocations = {};

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  let match;
  while ((match = keyRegex.exec(content)) !== null) {
    const key = match[1];
    foundKeys.add(key);
    if (!keyLocations[key]) keyLocations[key] = [];
    keyLocations[key].push(path.relative(path.join(__dirname, '..'), f));
  }
}

console.log(`Found ${foundKeys.size} distinct keys in src/`);

// Build a flat dictionary of existing keys in fa and en
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

// Let's also check experiment configs for titleKey, descKey, labelKey, etc.!
console.log('Checking keys...');
for (const key of Array.from(foundKeys).sort()) {
  console.log('KEY:', key, 'USED IN:', keyLocations[key][0]);
}
