#!/usr/bin/env node
// Verifies that `npm pack` would ship everything an agent needs and nothing
// it should not. Run via `npm run pack:check`; CI runs it on every push.

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  'package.json',
  'LICENSE',
  'README.md',
  'README_tw.md',
  'SKILL.md',
  'EXAMPLES_tw.md',
  'bin/cli.mjs',
  'version-state.json',
  'references/cli-and-headless.md',
  'references/customizations.md',
  'references/hooks-plugins-mcp.md',
  'references/version-snapshot.md',
  'references/examples.md',
];

const FORBIDDEN_PREFIXES = ['test/', '.github/', '.githooks/', 'node_modules/'];

// Prefer the npm that launched us (npm_execpath is set by `npm run`), which
// avoids shelling out to npm.cmd on Windows. Fall back to `npm` on PATH.
const packArgs = ['pack', '--dry-run', '--json'];
const result = process.env.npm_execpath
  ? spawnSync(process.execPath, [process.env.npm_execpath, ...packArgs], { cwd: REPO_ROOT, encoding: 'utf8' })
  : spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', packArgs, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      shell: process.platform === 'win32',
    });

if (result.status !== 0) {
  console.error(result.stdout);
  console.error(result.stderr);
  console.error('npm pack --dry-run failed');
  process.exit(1);
}

// npm prints notices to stderr and the JSON to stdout. The JSON shape differs
// by npm version: an array of tarball reports (npm <= 11) or an object keyed by
// package name (npm 12+). Normalize both to one report object.
const jsonStart = Math.min(
  ...['[', '{'].map((c) => result.stdout.indexOf(c)).filter((i) => i >= 0)
);
const parsed = JSON.parse(result.stdout.slice(jsonStart));
let report;
if (Array.isArray(parsed)) report = parsed[0];
else if (parsed && Array.isArray(parsed.files)) report = parsed;
else report = Object.values(parsed)[0];
if (!report || !Array.isArray(report.files)) {
  console.error('Could not understand `npm pack --dry-run --json` output:');
  console.error(result.stdout.slice(0, 500));
  process.exit(1);
}
const files = new Set(report.files.map((f) => f.path.replace(/\\/g, '/')));

let failed = false;
for (const f of REQUIRED) {
  if (!files.has(f)) {
    console.error(`✗ missing from package: ${f}`);
    failed = true;
  }
}
for (const f of files) {
  if (FORBIDDEN_PREFIXES.some((p) => f.startsWith(p))) {
    console.error(`✗ should not be packaged: ${f}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log(`✓ package contents OK (${files.size} files, ${report.size} bytes packed)`);
