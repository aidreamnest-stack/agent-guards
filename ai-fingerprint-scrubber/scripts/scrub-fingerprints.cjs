#!/usr/bin/env node

/**
 * scrub-fingerprints.cjs
 * Fast scanner to detect AI fingerprints, decorative emojis, and conversational comments in code.
 * Usage: node scripts/scrub-fingerprints.cjs [targetDir]
 */

const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(process.cwd(), process.argv[2] || '.');

// File extensions to inspect
const targetExts = new Set(['.js', '.jsx', '.ts', '.tsx', '.dart', '.py', '.go', '.rs', '.kt', '.java']);
const ignoreDirs = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'out', 'coverage', '.cache']);

function gatherFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoreDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      gatherFiles(fullPath, fileList);
    } else if (entry.isFile() && targetExts.has(path.extname(entry.name))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const files = gatherFiles(targetDir);
console.log(`\n🔍 Inspecting ${files.length} file(s) for AI fingerprints and comment clutter...\n`);

// Regex rules
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
const narrativePhrases = [
  /let's (go ahead and|take a look at|make sure to|ensure that)/i,
  /here (we are|we will|we iterate|we check|we initialize)/i,
  /in order to (prevent|ensure|handle|make sure)/i,
  /notice (how|that) we/i,
  /this step is crucial because/i
];
const dividerBannerRegex = /^[\s/\\*#=-]{20,}$/;
const aiBuzzwords = /\b(delve|leverage|meticulously|multifaceted|seamlessly)\b/i;

const findings = [];
let emojiCount = 0;
let narrativeCount = 0;
let bannerCount = 0;
let buzzwordCount = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Only inspect comments (single-line or block comment start)
    const isComment = trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*') || trimmed.startsWith('/*');
    if (!isComment) continue;

    const relPath = path.relative(process.cwd(), file);

    // 1. Check for decorative emojis in comments
    if (emojiRegex.test(trimmed)) {
      emojiCount++;
      findings.push({
        file: relPath,
        line: i + 1,
        type: 'emoji_in_comment',
        snippet: trimmed,
        action: 'Strip emoji from comment'
      });
    }

    // 2. Check for narrative / tutorial phrases
    for (const phrase of narrativePhrases) {
      if (phrase.test(trimmed)) {
        narrativeCount++;
        findings.push({
          file: relPath,
          line: i + 1,
          type: 'narrative_phrasing',
          snippet: trimmed,
          action: 'Rewrite into concise technical comment or delete'
        });
        break;
      }
    }

    // 3. Check for 80-col divider banners
    if (dividerBannerRegex.test(trimmed) && trimmed.length >= 25) {
      bannerCount++;
      findings.push({
        file: relPath,
        line: i + 1,
        type: 'divider_banner',
        snippet: trimmed,
        action: 'Remove visual comment divider'
      });
    }

    // 4. Check for LLM buzzwords in comments
    if (aiBuzzwords.test(trimmed)) {
      buzzwordCount++;
      findings.push({
        file: relPath,
        line: i + 1,
        type: 'ai_buzzword',
        snippet: trimmed,
        action: 'Replace corporate AI buzzword with plain English'
      });
    }
  }
}

console.log('--- AI Fingerprint Scan Summary ---');
console.log(`📁 Files Scanned:       ${files.length}`);
console.log(`🚀 Emoji Comments:      ${emojiCount}`);
console.log(`🗣️  Narrative Comments:  ${narrativeCount}`);
console.log(`📏 Divider Banners:     ${bannerCount}`);
console.log(`🤖 AI Buzzwords:        ${buzzwordCount}`);
console.log(`⚠️  Total Tells Found:   ${findings.length}\n`);

if (findings.length === 0) {
  console.log('✅ Clean codebase: No obvious AI fingerprints, emoji comments, or narrative fluff found.\n');
} else {
  console.log('🔍 Top Flagged Issues:');
  findings.slice(0, 10).forEach((f) => {
    console.log(`  - [${f.type.toUpperCase()}] ${f.file}:${f.line}`);
    console.log(`    Snippet: "${f.snippet}"`);
    console.log(`    Action:  ${f.action}\n`);
  });
  if (findings.length > 10) {
    console.log(`  ...and ${findings.length - 10} more occurrences.\n`);
  }
}
