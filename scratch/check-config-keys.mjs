import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read src/app/i18n.ts and evaluate or parse globalMessages
// Since i18n.ts imports JSONs and exports globalMessages, let's create a bundle or parse it
const i18nTs = fs.readFileSync(path.join(__dirname, '../src/app/i18n.ts'), 'utf8');

// Let's also check all keys in config.ts of all experiments:
const configs = [
  '../src/experiments/physics/motion/projectile/config.ts',
  '../src/experiments/physics/motion/1d-2d-kinematics/config.ts',
  '../src/experiments/physics/motion/newton-inclined-plane/config.ts'
];

for (const c of configs) {
  const content = fs.readFileSync(path.join(__dirname, c), 'utf8');
  console.log('--- Config:', c);
  const regex = /(?:titleKey|descKey|labelKey|nameKey|explanationKey)\s*:\s*['"`]([a-zA-Z0-9_.]+)['"`]/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    console.log('  Prop Key:', m[1]);
  }
}
