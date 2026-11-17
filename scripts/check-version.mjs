// manifest.json ile package.json sürümlerinin eşleştiğini doğrular.
import { readFileSync } from 'node:fs';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const manifest = read('../extension/manifest.json').version;
const pkg = read('../package.json').version;

if (manifest !== pkg) {
  console.error(`Sürüm uyuşmuyor: manifest.json ${manifest}, package.json ${pkg}`);
  process.exit(1);
}
console.log(`Sürüm ${manifest}`);
