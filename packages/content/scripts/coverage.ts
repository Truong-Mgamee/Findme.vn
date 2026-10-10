import { coverageMarkdown, writeCoverage, writeKeyManifest } from '../src/atoms/index.js';

const { manifest } = writeKeyManifest();
const { report, jsonPath, mdPath } = writeCoverage({ manifest });
console.log(coverageMarkdown(report));
console.log(`wrote ${jsonPath}\nwrote ${mdPath}`);
