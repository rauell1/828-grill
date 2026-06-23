#!/usr/bin/env node
/**
 * update-docs.js
 * Regenerates auto-generated sections in docs/SITEMAP.md, docs/CODEBASE.md,
 * and appends a snapshot to docs/ROLLBACK.md.
 * Run: node scripts/update-docs.js
 * Called automatically by .github/workflows/update-docs.yml on every push.
 */

'use strict';
const fs   = require('fs');
const path = require('path');
const cp   = require('child_process');

const ROOT    = path.resolve(__dirname, '..');
const DOCS    = path.join(ROOT, 'docs');
const API_DIR = path.join(ROOT, 'src', 'app', 'api');
const COMP    = path.join(ROOT, 'src', 'components', 'grill');

// ── Helpers ───────────────────────────────────────────────────────────────────

function git(cmd) {
  try { return cp.execSync(`git -C "${ROOT}" ${cmd}`, { encoding: 'utf8' }).trim(); }
  catch { return ''; }
}

function readDoc(name) {
  return fs.readFileSync(path.join(DOCS, name), 'utf8');
}

function writeDoc(name, content) {
  fs.writeFileSync(path.join(DOCS, name), content, 'utf8');
  console.log(`  ✓ ${name}`);
}

/** Replace content between <!-- AUTO:key --> and <!-- /AUTO:key --> markers */
function spliceAuto(src, key, generated) {
  const open  = `<!-- AUTO:${key} -->`;
  const close = `<!-- /AUTO:${key} -->`;
  const before = src.indexOf(open);
  const after  = src.indexOf(close);
  if (before === -1 || after === -1) return src; // markers missing — skip
  return src.slice(0, before + open.length) + '\n' + generated + '\n' + src.slice(after);
}

// ── Scan API routes ───────────────────────────────────────────────────────────

function scanApiDir(dir, prefix = '') {
  const routes = [];
  if (!fs.existsSync(dir)) return routes;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      routes.push(...scanApiDir(fullPath, prefix + '/' + entry.name));
    } else if (entry.name === 'route.ts') {
      const src = fs.readFileSync(fullPath, 'utf8');
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
        .filter(m => src.includes(`export async function ${m}`) || src.includes(`export function ${m}`));
      if (methods.length) routes.push({ path: '/api' + prefix, methods });
    }
  }
  return routes;
}

function buildApiTable() {
  const routes = scanApiDir(API_DIR);
  routes.sort((a, b) => a.path.localeCompare(b.path));
  const rows = routes.map(r => `| ${r.methods.join('/')} | \`${r.path}\` |`);
  return '| Method | Route |\n|--------|-------|\n' + rows.join('\n');
}

// ── Scan components ───────────────────────────────────────────────────────────

function scanComponents() {
  if (!fs.existsSync(COMP)) return '';
  const files = fs.readdirSync(COMP)
    .filter(f => f.endsWith('.tsx') || f.endsWith('.ts'))
    .sort();
  return files.map(f => `- \`${f}\``).join('\n');
}

// ── SITEMAP.md ────────────────────────────────────────────────────────────────

function updateSitemap() {
  const src   = readDoc('SITEMAP.md');
  const table = buildApiTable();
  const out   = spliceAuto(src, 'api-routes', table);
  writeDoc('SITEMAP.md', out);
}

// ── CODEBASE.md ───────────────────────────────────────────────────────────────

function updateCodebase() {
  const src  = readDoc('CODEBASE.md');
  const list = scanComponents();
  const out  = spliceAuto(src, 'components', list);
  writeDoc('CODEBASE.md', out);
}

// ── ROLLBACK.md ───────────────────────────────────────────────────────────────

function updateRollback() {
  const hash    = git('rev-parse --short HEAD');
  const msg     = git('log -1 --pretty=%s');
  const author  = git('log -1 --pretty=%an');
  const date    = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
  const changed = git('diff-tree --no-commit-id -r --name-only HEAD')
    .split('\n').filter(Boolean).slice(0, 8).join(', ') || '—';

  const src    = readDoc('ROLLBACK.md');
  const newRow = `| \`${hash}\` | ${date} | ${msg.slice(0, 60)} | ${changed} |`;

  // Find the auto-table or append after the Milestone Snapshots heading
  if (src.includes('<!-- AUTO:snapshots -->')) {
    const existing = src.match(/<!-- AUTO:snapshots -->([\s\S]*?)<!-- \/AUTO:snapshots -->/)?.[1]?.trim() ?? '';
    const rows     = existing ? existing.split('\n').filter(r => r.startsWith('|')) : [];
    // Keep max 20 rows
    const kept = [newRow, ...rows.filter(r => !r.startsWith('| Commit'))].slice(0, 20);
    const header = '| Commit | Date (UTC) | Description | Files changed |\n|--------|------------|-------------|---------------|';
    const table  = header + '\n' + kept.join('\n');
    writeDoc('ROLLBACK.md', spliceAuto(src, 'snapshots', table));
  } else {
    // First run — append table with markers
    const header = '\n\n## Deployment Snapshots (auto-updated)\n\n<!-- AUTO:snapshots -->\n| Commit | Date (UTC) | Description | Files changed |\n|--------|------------|-------------|---------------|\n';
    const table  = header + newRow + '\n<!-- /AUTO:snapshots -->';
    writeDoc('ROLLBACK.md', src + table);
  }
}

// ── Run ───────────────────────────────────────────────────────────────────────

console.log('Updating docs...');
try { updateSitemap();  } catch (e) { console.error('SITEMAP:', e.message); }
try { updateCodebase(); } catch (e) { console.error('CODEBASE:', e.message); }
try { updateRollback(); } catch (e) { console.error('ROLLBACK:', e.message); }
console.log('Done.');
