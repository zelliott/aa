import { execSync } from 'node:child_process';
import path from 'node:path';

const source = process.argv[2] ?? 'data/pantry.db';
const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
const target = process.argv[3] ?? `backups/pantry-${stamp}.db`;

execSync(`mkdir -p ${path.dirname(target)} && sqlite3 ${source} ".backup '${target}'"`, {
  stdio: 'inherit',
});

console.log(`Backed up ${source} to ${target}`);
