// Tests for bin/cli.mjs: install, uninstall, doctor, sync, argument handling.
// Runs with the built-in Node test runner (node >= 18): `npm test`.
//
// Every test works in a scratch directory and never touches the real home
// directory: AGY_SKILL_HOME redirects the "global" agent paths, and AGY_BIN
// points at a path that does not exist so no real `agy` is needed.

import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const CLI = path.join(REPO_ROOT, 'bin', 'cli.mjs');
const MISSING_AGY = path.join(os.tmpdir(), 'agy-skill-test-no-such-agy-binary');

const EN_MARKER = 'How to delegate work to the Google Antigravity CLI (agy)';
const ZH_RE = /[一-鿿]/;

let sandbox;

before(() => {
  sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-skill-test-'));
});

after(() => {
  fs.rmSync(sandbox, { recursive: true, force: true });
});

function fresh(name) {
  const dir = path.join(sandbox, name);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function run(args, { home, cwd, env = {} } = {}) {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    cwd: cwd || REPO_ROOT,
    encoding: 'utf8',
    env: {
      ...process.env,
      AGY_SKILL_HOME: home || path.join(sandbox, 'unused-home'),
      AGY_BIN: MISSING_AGY,
      AGY_SKILL_LANG: '',
      ...env,
    },
  });
  return { code: result.status, out: result.stdout + result.stderr };
}

function readSkill(dir) {
  return fs.readFileSync(path.join(dir, 'agy-skill', 'SKILL.md'), 'utf8');
}

function frontmatter(text) {
  const end = text.indexOf('\n---', 4);
  return text.slice(0, end);
}

function sha256File(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

describe('help and argument parsing', () => {
  test('help exits 0 and prints usage', () => {
    const r = run(['help']);
    assert.equal(r.code, 0);
    assert.match(r.out, /Usage:/);
    assert.match(r.out, /install/);
  });

  test('--agent with only unknown names exits 1 without installing', () => {
    const home = fresh('home-bad-agent');
    const r = run(['install', '--agent', 'foo,bar'], { home });
    assert.equal(r.code, 1);
    assert.match(r.out, /Unknown agent name\(s\) ignored: foo, bar/);
    assert.equal(fs.existsSync(path.join(home, '.claude', 'skills', 'agy-skill')), false);
  });
});

describe('install', () => {
  test('--dir installs SKILL.md and references/ with the English description', () => {
    const dir = fresh('install-en');
    const r = run(['install', '--dir', dir, '--lang', 'en']);
    assert.equal(r.code, 0, r.out);
    const skill = readSkill(dir);
    const fm = frontmatter(skill);
    assert.ok(fm.includes(EN_MARKER), 'English description present');
    assert.equal(ZH_RE.test(fm), false, 'no Chinese in English description');
    for (const f of ['cli-and-headless.md', 'customizations.md', 'hooks-plugins-mcp.md', 'version-snapshot.md']) {
      assert.ok(fs.existsSync(path.join(dir, 'agy-skill', 'references', f)), `references/${f} installed`);
    }
    // Body must be identical to the repository copy; only the frontmatter is localized.
    const repoBody = fs.readFileSync(path.join(REPO_ROOT, 'SKILL.md'), 'utf8').split('\n---')[1];
    assert.equal(skill.split('\n---')[1], repoBody);
  });

  test('--lang zh and --lang both localize only the description', () => {
    const dirZh = fresh('install-zh');
    assert.equal(run(['install', '--dir', dirZh, '--lang', 'zh']).code, 0);
    const fmZh = frontmatter(readSkill(dirZh));
    assert.ok(ZH_RE.test(fmZh));
    assert.equal(fmZh.includes(EN_MARKER), false);

    const dirBoth = fresh('install-both');
    assert.equal(run(['install', '--dir', dirBoth, '--lang', 'both']).code, 0);
    const fmBoth = frontmatter(readSkill(dirBoth));
    assert.ok(ZH_RE.test(fmBoth));
    assert.ok(fmBoth.includes(EN_MARKER));
  });

  test('--dir already ending in agy-skill is not nested twice', () => {
    const base = fresh('install-nested');
    const target = path.join(base, 'agy-skill');
    assert.equal(run(['install', '--dir', target, '--lang', 'en']).code, 0);
    assert.ok(fs.existsSync(path.join(target, 'SKILL.md')));
    assert.equal(fs.existsSync(path.join(target, 'agy-skill')), false);
  });

  test('re-install overwrites stale files, removes legacy scripts/, keeps unrelated siblings', () => {
    const dir = fresh('install-reinstall');
    const target = path.join(dir, 'agy-skill');
    fs.mkdirSync(path.join(target, 'scripts'), { recursive: true });
    fs.writeFileSync(path.join(target, 'scripts', 'old.sh'), 'legacy');
    fs.writeFileSync(path.join(target, 'SKILL.md'), 'stale content');
    fs.writeFileSync(path.join(dir, 'other-skill.md'), 'keep me');

    assert.equal(run(['install', '--dir', dir, '--lang', 'en']).code, 0);
    assert.equal(fs.existsSync(path.join(target, 'scripts')), false, 'legacy scripts/ removed');
    assert.ok(readSkill(dir).includes(EN_MARKER), 'stale SKILL.md replaced');
    assert.equal(fs.readFileSync(path.join(dir, 'other-skill.md'), 'utf8'), 'keep me');
  });

  test('--global installs into all four agent directories under AGY_SKILL_HOME', () => {
    const home = fresh('home-global');
    const r = run(['install', '--global', '--lang', 'en'], { home });
    assert.equal(r.code, 0, r.out);
    const expected = [
      ['.gemini', 'config', 'skills'],
      ['.claude', 'skills'],
      ['.codex', 'skills'],
      ['.config', 'opencode', 'skills'],
    ];
    for (const parts of expected) {
      const skill = path.join(home, ...parts, 'agy-skill', 'SKILL.md');
      assert.ok(fs.existsSync(skill), `${skill} exists`);
    }
  });

  test('--agent limits the global install to the named agents', () => {
    const home = fresh('home-agent-subset');
    const r = run(['install', '--agent', 'claude,codex', '--lang', 'en'], { home });
    assert.equal(r.code, 0, r.out);
    assert.ok(fs.existsSync(path.join(home, '.claude', 'skills', 'agy-skill', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(home, '.codex', 'skills', 'agy-skill', 'SKILL.md')));
    assert.equal(fs.existsSync(path.join(home, '.gemini')), false);
    assert.equal(fs.existsSync(path.join(home, '.config')), false);
  });

  test('--workspace installs into <cwd>/.agents/skills/agy-skill', () => {
    const ws = fresh('workspace');
    const r = run(['install', '--workspace', '--lang', 'en'], { cwd: ws });
    assert.equal(r.code, 0, r.out);
    assert.ok(fs.existsSync(path.join(ws, '.agents', 'skills', 'agy-skill', 'SKILL.md')));
  });
});

describe('uninstall', () => {
  test('removes only the agy-skill directory and reports already-removed targets', () => {
    const dir = fresh('uninstall');
    fs.writeFileSync(path.join(dir, 'keep.txt'), 'keep');
    assert.equal(run(['install', '--dir', dir, '--lang', 'en']).code, 0);
    assert.ok(fs.existsSync(path.join(dir, 'agy-skill')));

    const r1 = run(['uninstall', '--dir', dir]);
    assert.equal(r1.code, 0, r1.out);
    assert.match(r1.out, /Removed/);
    assert.equal(fs.existsSync(path.join(dir, 'agy-skill')), false);
    assert.equal(fs.readFileSync(path.join(dir, 'keep.txt'), 'utf8'), 'keep');

    const r2 = run(['uninstall', '--dir', dir]);
    assert.equal(r2.code, 0);
    assert.match(r2.out, /Not installed/);
  });

  test('--global uninstall under AGY_SKILL_HOME leaves sibling skills alone', () => {
    const home = fresh('home-uninstall');
    assert.equal(run(['install', '--global', '--lang', 'en'], { home }).code, 0);
    const sibling = path.join(home, '.claude', 'skills', 'my-other-skill', 'SKILL.md');
    fs.mkdirSync(path.dirname(sibling), { recursive: true });
    fs.writeFileSync(sibling, 'mine');

    const r = run(['uninstall', '--global'], { home });
    assert.equal(r.code, 0, r.out);
    assert.equal(fs.existsSync(path.join(home, '.claude', 'skills', 'agy-skill')), false);
    assert.equal(fs.existsSync(path.join(home, '.gemini', 'config', 'skills', 'agy-skill')), false);
    assert.equal(fs.readFileSync(sibling, 'utf8'), 'mine');
  });
});

describe('doctor', () => {
  test('reports agy missing and skills missing on a clean home', () => {
    const home = fresh('home-doctor-clean');
    const r = run(['doctor'], { home, cwd: home });
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /agy CLI\s*:\s*Not found/);
    const missing = r.out.match(/\[Missing\]/g) || [];
    assert.equal(missing.length, 4, 'all four agents reported missing');
    assert.match(r.out, /Not installed in current CWD/);
  });

  test('reports installed language per agent after install', () => {
    const home = fresh('home-doctor-installed');
    assert.equal(run(['install', '--agent', 'claude', '--lang', 'both'], { home }).code, 0);
    assert.equal(run(['install', '--agent', 'codex', '--lang', 'en'], { home }).code, 0);
    assert.equal(run(['install', '--agent', 'opencode', '--lang', 'zh'], { home }).code, 0);
    const r = run(['doctor'], { home, cwd: home });
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /\[Installed: lang=both\] Claude Code/);
    assert.match(r.out, /\[Installed: lang=en\] OpenAI Codex/);
    assert.match(r.out, /\[Installed: lang=zh\] OpenCode/);
    assert.match(r.out, /\[Missing\]\s+Antigravity/);
  });
});

describe('sync', () => {
  test('--no-git without agy keeps the bundled snapshot and still deploys', () => {
    const dir = fresh('sync-dir');
    const snapshot = path.join(REPO_ROOT, 'references', 'version-snapshot.md');
    const state = path.join(REPO_ROOT, 'version-state.json');
    const before = [sha256File(snapshot), sha256File(state)];

    const r = run(['sync', '--no-git', '--dir', dir, '--lang', 'en']);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /not found; using bundled version snapshot/);
    assert.doesNotMatch(r.out, /Checking Git Status/);
    assert.deepEqual([sha256File(snapshot), sha256File(state)], before, 'repo snapshot untouched');
    assert.ok(fs.existsSync(path.join(dir, 'agy-skill', 'references', 'version-snapshot.md')));
  });
});
