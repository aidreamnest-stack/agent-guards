#!/usr/bin/env node

/**
 * scan-diff.cjs
 * Fast, zero-dependency git diff scanner to detect AI slop and invariant deletion.
 * Usage: node scripts/scan-diff.cjs [baseBranch]
 */

const { execSync } = require('child_process');

const baseBranch = process.argv[2] || 'main';

try {
  const diffStat = execSync(`git diff ${baseBranch}...HEAD --stat`, { encoding: 'utf-8' });
  console.log(`\n🔍 Checking diff against ${baseBranch}...\n`);
  console.log(diffStat || 'No changes detected.');

  const diff = execSync(`git diff ${baseBranch}...HEAD`, { encoding: 'utf-8' });
  const lines = diff.split('\n');

  const warnings = [];
  let deletedGuards = 0;
  let emptyCatches = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for deleted platform or security guards
    if (line.startsWith('-') && !line.startsWith('---')) {
      const trimmed = line.slice(1).trim();
      if (
        trimmed.includes('Platform.is') ||
        trimmed.includes('targetPlatform') ||
        trimmed.includes('process.platform') ||
        trimmed.includes('isAdmin') ||
        trimmed.includes('isAuthenticated') ||
        trimmed.includes('mounted')
      ) {
        deletedGuards++;
        warnings.push(`[INVARIANT DELETED] Line ${i + 1}: "${trimmed}"`);
      }
    }

    // Check for empty catch blocks
    if (line.startsWith('+') && !line.startsWith('+++')) {
      const trimmed = line.slice(1).trim();
      if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(trimmed) || trimmed === 'catch (e) {}') {
        emptyCatches++;
        warnings.push(`[EMPTY CATCH] Line ${i + 1}: Swallowed error detected.`);
      }
    }
  }

  console.log('\n--- Scan Summary ---');
  if (warnings.length === 0) {
    console.log('✅ Clean diff: No obvious invariant deletions or empty catch blocks found.');
  } else {
    console.log(`⚠️  Found ${warnings.length} potential issue(s):\n`);
    warnings.forEach((w) => console.log('  ' + w));
    console.log('\nReview these carefully before merging.\n');
  }
} catch (err) {
  console.error('Failed to run git diff:', err.message);
  process.exit(1);
}
