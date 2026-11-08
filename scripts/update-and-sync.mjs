#!/usr/bin/env node
/**
 * agy-skill Auto-Introspection, Cross-Agent Installer & GitHub Sync Script
 *
 * Responsibilities:
 * 1. Inspect local Antigravity CLI (`agy --version`, `--help`, subcommands, `models`, `changelog`)
 *    and built-in skills (`~/.gemini/antigravity/builtin/skills/`) to detect updates.
 * 2. Regenerate `references/version-snapshot.md` and `version-state.json` whenever changes occur.
 * 3. Synchronize `agy-skill` (`SKILL.md`, `references/`, `scripts/`) into global skill directories
 *    for Antigravity, Claude Code, OpenAI Codex, and OpenCode.
 * 4. Commit and push any modifications in this repository to the public GitHub repo (`origin main`).
 */

import { execFileSync, execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const HOME = os.homedir();

const args = new Set(process.argv.slice(2));
const SKIP_GIT = args.has('--no-git');
const SKIP_INSTALL = args.has('--no-install');

function runAgy(cmdArgs) {
  try {
    return execFileSync('agy', cmdArgs, {
      encoding: 'utf8',
      timeout: 30000,
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (err) {
    const stdout = err.stdout ? String(err.stdout).trim() : '';
    const stderr = err.stderr ? String(err.stderr).trim() : '';
    return stdout || stderr || `Error running agy ${cmdArgs.join(' ')}`;
  }
}

function sha256(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

function walkMarkdownFiles(dir, baseDir = dir) {
  const results = {};
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      Object.assign(results, walkMarkdownFiles(fullPath, baseDir));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const rel = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      const text = fs.readFileSync(fullPath, 'utf8');
      results[rel] = sha256(text);
    }
  }
  return results;
}

function extractLatestChangelogSections(changelogText, maxVersions = 3) {
  const lines = changelogText.split(/\r?\n/);
  const out = [];
  let versionCount = 0;
  for (const line of lines) {
    if (/^\d+\.\d+\.\d+:/.test(line.trim())) {
      versionCount++;
      if (versionCount > maxVersions) break;
    }
    out.push(line);
  }
  return out.join('\n').trim();
}

function copyDirRecursive(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function syncSkillToGlobalAgents() {
  const targets = [
    { name: 'Antigravity (App/CLI/IDE)', dir: path.join(HOME, '.gemini', 'config', 'skills', 'agy-skill') },
    { name: 'Claude Code', dir: path.join(HOME, '.claude', 'skills', 'agy-skill') },
    { name: 'OpenAI Codex', dir: path.join(HOME, '.codex', 'skills', 'agy-skill') },
    { name: 'OpenCode', dir: path.join(HOME, '.config', 'opencode', 'skills', 'agy-skill') },
  ];

  for (const target of targets) {
    fs.mkdirSync(target.dir, { recursive: true });
    fs.copyFileSync(path.join(REPO_ROOT, 'SKILL.md'), path.join(target.dir, 'SKILL.md'));
    copyDirRecursive(path.join(REPO_ROOT, 'references'), path.join(target.dir, 'references'));
    copyDirRecursive(path.join(REPO_ROOT, 'scripts'), path.join(target.dir, 'scripts'));
    console.log(`[Sync] Installed agy-skill -> ${target.name} (${target.dir})`);
  }
}

function main() {
  console.log('=== [1/4] Introspecting Local Antigravity Installation ===');
  const version = runAgy(['--version']).split(/\r?\n/)[0].trim();
  const mainHelp = runAgy(['--help']);
  const modelsRaw = runAgy(['models']);
  const modelsClean = modelsRaw
    .split(/\r?\n/)
    .filter((line) => !line.startsWith('Fetching available models'))
    .join('\n')
    .trim();

  const subcommands = [
    'acp',
    'agent',
    'changelog',
    'install',
    'mcp',
    'mic-serve',
    'models',
    'plugin',
    'remote-control',
    'update',
  ];
  const subcommandHelps = {};
  for (const sub of subcommands) {
    subcommandHelps[sub] = runAgy(['help', sub]);
  }

  const changelogFull = runAgy(['changelog']);
  const latestChangelog = extractLatestChangelogSections(changelogFull, 3);

  const builtinSkillsDir = path.join(HOME, '.gemini', 'antigravity', 'builtin', 'skills');
  const builtinSkillHashes = walkMarkdownFiles(builtinSkillsDir);

  const stateFilePath = path.join(REPO_ROOT, 'version-state.json');
  let previousState = null;
  if (fs.existsSync(stateFilePath)) {
    try {
      previousState = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
    } catch {
      previousState = null;
    }
  }

  const newStateCore = {
    agyVersion: version,
    models: modelsClean.split(/\r?\n/).filter(Boolean),
    mainHelpHash: sha256(mainHelp),
    subcommandHelpHashes: Object.fromEntries(
      Object.entries(subcommandHelps).map(([k, v]) => [k, sha256(v)])
    ),
    builtinSkillHashes,
  };

  console.log(`Detected agy CLI version: ${version}`);
  if (previousState && previousState.agyVersion !== version) {
    console.log(`[Update Detected] agy upgraded from ${previousState.agyVersion} -> ${version}!`);
  }

  console.log('=== [2/4] Updating references/version-snapshot.md & version-state.json ===');
  const subcmdMarkdown = subcommands
    .map((sub) => `### \`agy help ${sub}\`\n\`\`\`text\n${subcommandHelps[sub]}\n\`\`\``)
    .join('\n\n');

  const builtinTableRows = Object.entries(builtinSkillHashes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([file, hash]) => `| \`${file}\` | \`${hash.slice(0, 12)}\` |`)
    .join('\n');

  const snapshotMarkdown = `# Antigravity Local Version & CLI Snapshot (Auto-Generated)

> **Auto-generated by \`scripts/update-and-sync.mjs\`**. Do not hand-edit this file; run \`node scripts/update-and-sync.mjs\` after any Antigravity update.

- **Installed \`agy\` CLI Version**: \`${version}\`

---

## 1. Available Models (\`agy models\`)

\`\`\`text
${modelsClean}
\`\`\`

---

## 2. Top-Level CLI Flags & Subcommands (\`agy --help\`)

\`\`\`text
${mainHelp}
\`\`\`

---

## 3. Subcommand Help Outputs

${subcmdMarkdown}

---

## 4. Latest Release Notes (\`agy changelog\` - Top 3 Releases)

\`\`\`text
${latestChangelog}
\`\`\`

---

## 5. Built-in Skills Fingerprint (\`~/.gemini/antigravity/builtin/skills/\`)

| Built-in Skill File | SHA-256 Prefix |
| :--- | :--- |
${builtinTableRows}
`;

  const snapshotPath = path.join(REPO_ROOT, 'references', 'version-snapshot.md');
  const existingSnapshot = fs.existsSync(snapshotPath) ? fs.readFileSync(snapshotPath, 'utf8') : '';
  if (existingSnapshot !== snapshotMarkdown) {
    fs.writeFileSync(snapshotPath, snapshotMarkdown, 'utf8');
    console.log('Updated references/version-snapshot.md');
  } else {
    console.log('references/version-snapshot.md is already up to date.');
  }

  const existingStateStr = fs.existsSync(stateFilePath) ? fs.readFileSync(stateFilePath, 'utf8') : '';
  const newStateStr = JSON.stringify(newStateCore, null, 2) + '\n';
  if (existingStateStr !== newStateStr) {
    fs.writeFileSync(stateFilePath, newStateStr, 'utf8');
    console.log('Updated version-state.json');
  }

  if (!SKIP_INSTALL) {
    console.log('=== [3/4] Synchronizing Skill to Global Agent Directories ===');
    syncSkillToGlobalAgents();
  }

  if (!SKIP_GIT) {
    console.log('=== [4/4] Checking Git Status & Synchronizing with GitHub ===');
    try {
      const status = execSync('git status --porcelain', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
      if (status) {
        console.log('Changes detected in repository:\n' + status);
        execSync('git add -A', { cwd: REPO_ROOT, stdio: 'inherit' });
        const commitMsg = `chore(sync): update agy-skill (agy v${version})`;
        execFileSync('git', ['commit', '-m', commitMsg], { cwd: REPO_ROOT, stdio: 'inherit' });
      } else {
        console.log('Working tree clean.');
      }

      // Check if remote origin exists and push
      const remotes = execSync('git remote', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
      if (remotes.split(/\r?\n/).includes('origin')) {
        console.log('Pushing to origin main...');
        execSync('git push -u origin main', { cwd: REPO_ROOT, stdio: 'inherit' });
        console.log('Successfully synchronized with GitHub!');
      } else {
        console.log('No git remote "origin" configured yet. Skipping push.');
      }
    } catch (err) {
      console.error('Git synchronization notice:', err.message);
    }
  }
}

main();
