// Test runner: launches Jest with Node's experimental ESM loader enabled.
//
// Jest runs once and exits by default (it does not watch), so the `--run` flag
// used by the client's Vitest command is accepted here for command parity and
// simply filtered out before Jest sees it (Jest rejects unknown options).
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const jestBin = join(here, '..', 'node_modules', 'jest', 'bin', 'jest.js');

const args = process.argv.slice(2).filter((arg) => arg !== '--run');

const child = spawn(process.execPath, ['--experimental-vm-modules', jestBin, ...args], {
  stdio: 'inherit',
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
