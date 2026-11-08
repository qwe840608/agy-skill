#!/usr/bin/env node
/**
 * agy-skill Cross-Platform CLI (Windows, macOS, Linux)
 *
 * One-click installer, locale-aware description localizer, version introspector,
 * and synchronizer for the Universal Google Antigravity Skill across
 * Antigravity, Claude Code, Codex, and OpenCode.
 */

import { execFileSync, execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_ROOT = path.resolve(__dirname, '..');
const HOME = os.homedir();

const DESCRIPTIONS = {
  en: 'Universal guide and operational playbook for Google Antigravity (App 2.0, agy CLI, IDE, Python SDK, and Customizations: Skills, Rules, Plugins, Hooks, MCP, Sidecars, Generative UI). Enables Claude Code, Codex, OpenCode, and Antigravity agents to orchestrate agy CLI headlessly, configure Antigravity, and auto-sync this skill on updates.',
  zh: 'Google Antigravity 全方位操作與配置指南（涵蓋 App 2.0 桌面版、agy CLI 終端機非互動調度、IDE、Python SDK，以及客製化系統：Skills、Rules、Plugins、Hooks、MCP、Sidecars 排程自動化、Generative UI）。讓 Claude Code、Codex、OpenCode 與 Antigravity 代理能無頭調度 agy CLI、配置 Antigravity 並在更新時自動同步此技能。',
};
DESCRIPTIONS.both = `${DESCRIPTIONS.zh} | ${DESCRIPTIONS.en}`;

const GLOBAL_TARGETS = {
  antigravity: {
    name: 'Antigravity (App 2.0 / agy CLI / IDE)',
    dir: path.join(HOME, '.gemini', 'config', 'skills', 'agy-skill'),
  },
  claude: {
    name: 'Claude Code',
    dir: path.join(HOME, '.claude', 'skills', 'agy-skill'),
  },
  codex: {
    name: 'OpenAI Codex',
    dir: path.join(HOME, '.codex', 'skills', 'agy-skill'),
  },
  opencode: {
    name: 'OpenCode',
    dir: path.join(HOME, '.config', 'opencode', 'skills', 'agy-skill'),
  },
};

function detectSystemLocale() {
  const envLocale =
    process.env.AGY_SKILL_LANG ||
    process.env.LC_ALL ||
    process.env.LC_MESSAGES ||
    process.env.LANG ||
    '';
  let intlLocale = '';
  try {
    intlLocale = Intl.DateTimeFormat().resolvedOptions().locale || '';
  } catch {
    intlLocale = '';
  }
  const combined = `${envLocale} ${intlLocale}`.toLowerCase();
  const isZh = /\bzh([_-][a-z]+)?\b/.test(combined) || combined.includes('chinese');
  return {
    rawLocale: intlLocale || envLocale || 'en-US',
    lang: isZh ? 'zh' : 'en',
  };
}

function normalizeLangOption(val) {
  if (!val) return 'auto';
  const v = val.trim().toLowerCase();
  if (v === 'zh' || v === 'zh-tw' || v === 'zh-hk' || v === 'zh-cn' || v === 'tw' || v === 'cn') {
    return 'zh';
  }
  if (v === 'en' || v === 'en-us' || v === 'en-gb') {
    return 'en';
  }
  if (v === 'both' || v === 'bilingual') {
    return 'both';
  }
  return 'auto';
}

function resolveEffectiveLang(langOpt) {
  const normalized = normalizeLangOption(langOpt);
  if (normalized === 'auto') {
    return detectSystemLocale().lang;
  }
  return normalized;
}

function localizeSkillMarkdown(rawSkillMd, targetLang) {
  const desc = DESCRIPTIONS[targetLang] || DESCRIPTIONS.en;
  return rawSkillMd.replace(
    /^---\r?\nname:\s*agy-skill\r?\ndescription:\s*>-\r?\n[\s\S]*?\r?\n---/,
    `---\nname: agy-skill\ndescription: >-\n  ${desc}\n---`
  );
}

function printHelp() {
  console.log(`
agy-skill — Universal Google Antigravity Skill Installer & Synchronizer

Usage:
  npx --yes --allow-git=all github:qwe840608/agy-skill [command] [options]
  agy-skill [command] [options]

Commands:
  install     Install agy-skill to AI coding agents (default when no command is given)
  sync        Introspect local agy CLI, update snapshot, sync to agents, and push to Git
  doctor      Check local agy CLI status and installed skill locations across agents
  uninstall   Remove installed agy-skill from global or workspace directories
  help        Show this help message

Options:
  -g, --global            Install/uninstall globally for all supported agents (default)
  -w, --workspace         Install/uninstall in current workspace (.agents/skills/agy-skill)
  --lang <auto|zh|en|both> Language for SKILL.md description (default: auto-detects OS locale)
  --agent <list>          Comma-separated target agents: antigravity,claude,codex,opencode (default: all)
  --dir <path>            Custom target skills directory (overrides --global / --workspace)
  --no-git                Skip git commit/push during "sync"
  -h, --help              Show this help message

Examples:
  # One-click global install (auto-detects Chinese vs. English from your OS locale)
  npx --yes --allow-git=all github:qwe840608/agy-skill

  # Force English or Traditional Chinese skill description
  npx --yes --allow-git=all github:qwe840608/agy-skill install --lang en
  npx --yes --allow-git=all github:qwe840608/agy-skill install --lang zh

  # Install into the current project workspace (.agents/skills/agy-skill)
  npx --yes --allow-git=all github:qwe840608/agy-skill install --workspace

  # Check installation status & detected language
  npx --yes --allow-git=all github:qwe840608/agy-skill doctor
`);
}

function parseCliArgs(argv) {
  const options = {
    command: 'install',
    scope: 'global',
    lang: 'auto',
    agents: Object.keys(GLOBAL_TARGETS),
    customDir: process.env.AG_SKILLS_DIR || null,
    noGit: false,
  };

  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help' || arg === 'help') {
      options.command = 'help';
    } else if (arg === '-g' || arg === '--global') {
      options.scope = 'global';
    } else if (arg === '-w' || arg === '--workspace') {
      options.scope = 'workspace';
    } else if (arg === '--no-git') {
      options.noGit = true;
    } else if (arg === '--lang' || arg === '-l') {
      options.lang = argv[++i] || 'auto';
    } else if (arg.startsWith('--lang=')) {
      options.lang = arg.slice('--lang='.length);
    } else if (arg === '--agent' || arg === '--agents') {
      const val = argv[++i] || '';
      options.agents = val
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter((s) => GLOBAL_TARGETS[s]);
    } else if (arg.startsWith('--agent=')) {
      options.agents = arg
        .slice('--agent='.length)
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter((s) => GLOBAL_TARGETS[s]);
    } else if (arg === '--dir') {
      options.customDir = argv[++i] || null;
    } else if (arg.startsWith('--dir=')) {
      options.customDir = arg.slice('--dir='.length);
    } else if (!arg.startsWith('-')) {
      positional.push(arg.toLowerCase());
    }
  }

  if (positional.length > 0 && options.command !== 'help') {
    const cmd = positional[0];
    if (['install', 'sync', 'update', 'doctor', 'status', 'uninstall', 'remove', 'help'].includes(cmd)) {
      options.command = cmd === 'update' ? 'sync' : cmd === 'status' ? 'doctor' : cmd === 'remove' ? 'uninstall' : cmd;
    }
  }

  return options;
}

function resolveAgyBinary() {
  if (process.env.AGY_BIN && fs.existsSync(process.env.AGY_BIN)) {
    return process.env.AGY_BIN;
  }
  const candidates = ['agy'];
  if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
    candidates.push(path.join(process.env.LOCALAPPDATA, 'agy', 'bin', 'agy.exe'));
  } else {
    candidates.push(path.join(HOME, '.local', 'bin', 'agy'));
  }

  for (const bin of candidates) {
    try {
      execFileSync(bin, ['--version'], {
        encoding: 'utf8',
        timeout: 10000,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      });
      return bin;
    } catch {
      // try next candidate
    }
  }
  return null;
}

function tryRunAgy(cmdArgs, bin = resolveAgyBinary()) {
  if (!bin) return null;
  try {
    return execFileSync(bin, cmdArgs, {
      encoding: 'utf8',
      timeout: 30000,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    }).trim();
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    const stdout = err.stdout ? String(err.stdout).trim() : '';
    const stderr = err.stderr ? String(err.stderr).trim() : '';
    return stdout || stderr || null;
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

function expandHome(filepath) {
  if (!filepath) return filepath;
  if (filepath === '~') return HOME;
  if (filepath.startsWith('~/') || filepath.startsWith('~\\')) {
    return path.join(HOME, filepath.slice(2));
  }
  return path.resolve(filepath);
}

function resolveInstallTargets(options) {
  if (options.customDir) {
    const base = expandHome(options.customDir);
    const targetDir = path.basename(base) === 'agy-skill' ? base : path.join(base, 'agy-skill');
    return [{ name: 'Custom Directory', dir: targetDir }];
  }
  if (options.scope === 'workspace') {
    return [
      {
        name: 'Workspace (.agents/skills/agy-skill)',
        dir: path.join(process.cwd(), '.agents', 'skills', 'agy-skill'),
      },
    ];
  }
  return options.agents.map((key) => GLOBAL_TARGETS[key]).filter(Boolean);
}

function deploySkillFiles(targets, langOption = 'auto') {
  const sysLocale = detectSystemLocale();
  const effectiveLang = resolveEffectiveLang(langOption);
  const langLabel =
    effectiveLang === 'zh'
      ? 'Traditional Chinese (繁體中文)'
      : effectiveLang === 'both'
        ? 'Bilingual (中英雙語)'
        : 'English';
  console.log(`  ℹ Description Language: ${langLabel} [detected OS locale: ${sysLocale.rawLocale}]`);

  const rawSkillMd = fs.readFileSync(path.join(PACKAGE_ROOT, 'SKILL.md'), 'utf8');
  const localizedSkillMd = localizeSkillMarkdown(rawSkillMd, effectiveLang);

  for (const target of targets) {
    fs.mkdirSync(target.dir, { recursive: true });
    const legacyScriptsDir = path.join(target.dir, 'scripts');
    if (fs.existsSync(legacyScriptsDir)) {
      fs.rmSync(legacyScriptsDir, { recursive: true, force: true });
    }
    fs.writeFileSync(path.join(target.dir, 'SKILL.md'), localizedSkillMd, 'utf8');
    copyDirRecursive(path.join(PACKAGE_ROOT, 'references'), path.join(target.dir, 'references'));
    console.log(`  ✓ Installed -> ${target.name}: ${target.dir}`);
  }
}

function introspectLocalAgy() {
  const bin = resolveAgyBinary();
  const versionOut = tryRunAgy(['--version'], bin);
  if (!versionOut) {
    console.log('  ℹ Local "agy" CLI not found; using bundled version snapshot.');
    return null;
  }

  const version = versionOut.split(/\r?\n/)[0].trim();
  const mainHelp = tryRunAgy(['--help'], bin) || '';
  const modelsRaw = tryRunAgy(['models'], bin) || '';
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
    subcommandHelps[sub] = tryRunAgy(['help', sub], bin) || '';
  }

  const changelogFull = tryRunAgy(['changelog'], bin) || '';
  const latestChangelog = extractLatestChangelogSections(changelogFull, 3);

  const builtinSkillsDir = path.join(HOME, '.gemini', 'antigravity', 'builtin', 'skills');
  const builtinSkillHashes = walkMarkdownFiles(builtinSkillsDir);

  const subcmdMarkdown = subcommands
    .map((sub) => `### \`agy help ${sub}\`\n\`\`\`text\n${subcommandHelps[sub]}\n\`\`\``)
    .join('\n\n');

  const builtinTableRows = Object.entries(builtinSkillHashes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([file, hash]) => `| \`${file}\` | \`${hash.slice(0, 12)}\` |`)
    .join('\n');

  const snapshotMarkdown = `# Antigravity Local Version & CLI Snapshot (Auto-Generated)

> **Auto-generated by \`agy-skill\`**. Do not hand-edit this file; run \`npm run sync\` (or \`npx --yes --allow-git=all github:qwe840608/agy-skill sync\`) after any Antigravity update.

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

  const stateObj = {
    agyVersion: version,
    models: modelsClean.split(/\r?\n/).filter(Boolean),
    mainHelpHash: sha256(mainHelp),
    subcommandHelpHashes: Object.fromEntries(
      Object.entries(subcommandHelps).map(([k, v]) => [k, sha256(v)])
    ),
    builtinSkillHashes,
  };

  return { version, snapshotMarkdown, stateObj };
}

function runInstall(options) {
  console.log(`\n[agy-skill] Installing on ${os.platform()} (${os.arch()})...`);
  const targets = resolveInstallTargets(options);
  deploySkillFiles(targets, options.lang);
  console.log('\n[agy-skill] Installation complete! Restart your agent session to load agy-skill.');
}

function runSync(options) {
  console.log('=== [1/4] Introspecting Local Antigravity Installation ===');
  const info = introspectLocalAgy();

  if (info) {
    console.log(`  ✓ Detected agy CLI version: ${info.version}`);
    console.log('=== [2/4] Updating references/version-snapshot.md & version-state.json ===');

    const snapshotPath = path.join(PACKAGE_ROOT, 'references', 'version-snapshot.md');
    const existingSnapshot = fs.existsSync(snapshotPath) ? fs.readFileSync(snapshotPath, 'utf8') : '';
    if (existingSnapshot !== info.snapshotMarkdown) {
      fs.writeFileSync(snapshotPath, info.snapshotMarkdown, 'utf8');
      console.log('  ✓ Updated references/version-snapshot.md');
    } else {
      console.log('  ✓ references/version-snapshot.md is already up to date.');
    }

    const stateFilePath = path.join(PACKAGE_ROOT, 'version-state.json');
    const existingStateStr = fs.existsSync(stateFilePath) ? fs.readFileSync(stateFilePath, 'utf8') : '';
    const newStateStr = JSON.stringify(info.stateObj, null, 2) + '\n';
    if (existingStateStr !== newStateStr) {
      fs.writeFileSync(stateFilePath, newStateStr, 'utf8');
      console.log('  ✓ Updated version-state.json');
    }
  }

  console.log('=== [3/4] Synchronizing Skill to Agent Directories ===');
  const targets = resolveInstallTargets(options);
  deploySkillFiles(targets, options.lang);

  const gitDir = path.join(PACKAGE_ROOT, '.git');
  if (!options.noGit && fs.existsSync(gitDir)) {
    console.log('=== [4/4] Checking Git Status & Synchronizing with GitHub ===');
    try {
      const status = execSync('git status --porcelain', { cwd: PACKAGE_ROOT, encoding: 'utf8' }).trim();
      if (status) {
        console.log('Changes detected in repository:\n' + status);
        execSync('git add -A', { cwd: PACKAGE_ROOT, stdio: 'inherit' });
        const verLabel = info ? info.version : 'latest';
        const commitMsg = `chore(sync): update agy-skill (agy v${verLabel})`;
        execFileSync('git', ['commit', '-m', commitMsg], { cwd: PACKAGE_ROOT, stdio: 'inherit' });
      } else {
        console.log('  ✓ Working tree clean.');
      }

      const remotes = execSync('git remote', { cwd: PACKAGE_ROOT, encoding: 'utf8' }).trim();
      if (remotes.split(/\r?\n/).includes('origin')) {
        console.log('  ✓ Pushing to origin main...');
        execSync('git push -u origin main', { cwd: PACKAGE_ROOT, stdio: 'inherit' });
        console.log('  ✓ Successfully synchronized with GitHub!');
      }
    } catch (err) {
      console.error('Git synchronization notice:', err.message);
    }
  }
}

function detectInstalledDescriptionLang(skillFilePath) {
  if (!fs.existsSync(skillFilePath)) return null;
  const content = fs.readFileSync(skillFilePath, 'utf8');
  const hasZh = /[\u4e00-\u9fff]/.test(content.slice(0, 600));
  const hasEn = /Universal guide and operational playbook/i.test(content.slice(0, 600));
  if (hasZh && hasEn) return 'both';
  if (hasZh) return 'zh';
  return 'en';
}

function runDoctor() {
  const sysLocale = detectSystemLocale();
  console.log('\n=== agy-skill Environment & Installation Doctor ===');
  console.log(`OS Platform : ${os.platform()} ${os.release()} (${os.arch()})`);
  console.log(`OS Locale   : ${sysLocale.rawLocale} -> auto description language: "${sysLocale.lang}"`);
  console.log(`Node.js     : ${process.version}`);

  const bin = resolveAgyBinary();
  const agyVer = tryRunAgy(['--version'], bin);
  console.log(
    `agy CLI     : ${agyVer ? `v${agyVer.split(/\r?\n/)[0].trim()} (${bin})` : 'Not found (install via https://antigravity.google/docs/cli/install)'}`
  );

  console.log('\nGlobal Agent Skill Locations:');
  for (const target of Object.values(GLOBAL_TARGETS)) {
    const skillFile = path.join(target.dir, 'SKILL.md');
    const installedLang = detectInstalledDescriptionLang(skillFile);
    const statusText = installedLang ? `✓ [Installed: lang=${installedLang}]` : '✗ [Missing]             ';
    console.log(`  ${statusText} ${target.name} -> ${target.dir}`);
  }

  const wsSkill = path.join(process.cwd(), '.agents', 'skills', 'agy-skill', 'SKILL.md');
  const wsLang = detectInstalledDescriptionLang(wsSkill);
  console.log(
    `\nWorkspace (.agents/skills/agy-skill): ${wsLang ? `✓ [Installed: lang=${wsLang}]` : '- [Not installed in current CWD]'}`
  );
}

function runUninstall(options) {
  const targets = resolveInstallTargets(options);
  for (const target of targets) {
    if (fs.existsSync(target.dir)) {
      fs.rmSync(target.dir, { recursive: true, force: true });
      console.log(`  ✓ Removed -> ${target.name}: ${target.dir}`);
    } else {
      console.log(`  - Not installed -> ${target.name}: ${target.dir}`);
    }
  }
}

function main() {
  const options = parseCliArgs(process.argv.slice(2));
  switch (options.command) {
    case 'help':
      printHelp();
      break;
    case 'install':
      runInstall(options);
      break;
    case 'sync':
      runSync(options);
      break;
    case 'doctor':
      runDoctor();
      break;
    case 'uninstall':
      runUninstall(options);
      break;
    default:
      printHelp();
  }
}

main();
