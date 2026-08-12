/* Runs every *.test.mjs in this folder, each in its OWN child process.
 *
 * Isolation matters: some test files (quote-distributor.test.mjs) end with
 * process.exit(), which would terminate a shared runner mid-suite and skip
 * every file after it. Spawning each file as a child contains that — one
 * file's exit code cannot end another file's run — and lets those original
 * test files stay byte-for-byte unchanged.
 *
 * Replaces `node tests/<one-file>` in package.json. On that old single-file
 * script every test after the first was silently never run, which looks
 * green and is worse than having no tests.
 */
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(HERE).filter((f) => f.endsWith('.test.mjs')).sort();

if (files.length === 0) {
  console.error('No *.test.mjs files found in tests/');
  process.exit(1);
}

let failed = 0;
for (const f of files) {
  console.log(`\n=== ${f} ===`);
  const r = spawnSync(process.execPath, [join(HERE, f)], { stdio: 'inherit' });
  if (r.status !== 0) { failed++; console.error(`FAILED ${f} (exit ${r.status})`); }
}

console.log(`\n${files.length} test file(s), ${failed} failed.`);
process.exit(failed ? 1 : 0);
