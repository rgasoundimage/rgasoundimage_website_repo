/* Runs every *.test.mjs in this folder, in alphabetical order.
 *
 * Replaces the hard-coded single-file `test` script. On the old script
 * (`node tests/quote-distributor.test.mjs`) any second test file was
 * silently never run, which is worse than having no tests: it looks green.
 */
import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(HERE).filter(f => f.endsWith('.test.mjs')).sort();

if (files.length === 0) {
  console.error('No *.test.mjs files found in tests/');
  process.exit(1);
}

let failed = 0;
for (const f of files) {
  console.log(`\n=== ${f} ===`);
  try {
    await import(pathToFileURL(join(HERE, f)).href);
  } catch (err) {
    failed++;
    console.error(`FAILED ${f}\n${err && err.message ? err.message : err}`);
  }
}

console.log(`\n${files.length} test file(s), ${failed} failed.`);
process.exit(failed ? 1 : 0);
