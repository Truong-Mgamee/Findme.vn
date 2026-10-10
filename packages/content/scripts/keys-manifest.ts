import { writeKeyManifest } from '../src/atoms/index.js';

const { manifest, path } = writeKeyManifest();
for (const [t, v] of Object.entries(manifest.traditions)) console.log(`${t.padEnd(11)} ${String(v.count).padStart(5)}`);
console.log(`${'total'.padEnd(11)} ${String(manifest.total).padStart(5)}`);
console.log(`wrote ${path}`);
