/**
 * validate-orphans.test.cjs
 * Self-contained unit tests for validate-orphans.cjs validator.
 * Run with: node scripts/validate-orphans.test.cjs
 */

const assert = require('assert');
const { validateOrphanAudit } = require('./validate-orphans.cjs');

console.log('🧪 Running validate-orphans test suite...\n');

// Test 1: Valid Report Passes
{
  const validReport = {
    version: '1.0.0',
    scanned_at: new Date().toISOString(),
    manifest_file: 'package.json',
    manifest_type: 'npm',
    total_declared: 25,
    retained_count: 23,
    orphaned_count: 2,
    orphaned_packages: [
      {
        name: 'moment',
        dependency_type: 'production',
        import_matches: 0,
        estimated_disk_impact_kb: 4200,
        uninstall_command: 'npm uninstall moment',
        reason: 'Zero imports found in source code; project uses native Intl'
      },
      {
        name: 'uuid',
        dependency_type: 'production',
        import_matches: 0,
        estimated_disk_impact_kb: 350,
        uninstall_command: 'npm uninstall uuid',
        reason: 'Zero imports found; project uses crypto.randomUUID()'
      }
    ],
    summary: {
      verdict: 'BLOAT_DETECTED',
      action_required: true,
      recommendation: 'Request user permission to prune 2 unused packages and reduce node_modules by ~4.5 MB'
    }
  };

  const errors = validateOrphanAudit(validReport);
  assert.strictEqual(errors.length, 0, `Expected 0 errors, got: ${errors.join(', ')}`);
  console.log('✅ Test 1 Passed: Valid orphan dependency audit passes validation.');
}

// Test 2: Invalid Import Matches Fails
{
  const badImportMatchesReport = {
    version: '1.0.0',
    manifest_file: 'package.json',
    manifest_type: 'npm',
    total_declared: 1,
    retained_count: 0,
    orphaned_count: 1,
    orphaned_packages: [
      {
        name: 'test-pkg',
        dependency_type: 'production',
        import_matches: 5, // Must be 0 for an orphan!
        uninstall_command: 'npm uninstall test-pkg',
        reason: 'Valid reason'
      }
    ],
    summary: { verdict: 'BLOAT_DETECTED', action_required: true, recommendation: 'Prune' }
  };

  const errors = validateOrphanAudit(badImportMatchesReport);
  assert.ok(errors.some((e) => e.includes('import_matches must be 0')), 'Expected import_matches error');
  console.log('✅ Test 2 Passed: Non-zero import count on orphan correctly caught.');
}

// Test 3: Invalid Manifest Type Fails
{
  const badManifestTypeReport = {
    version: '1.0.0',
    manifest_file: 'unknown.txt',
    manifest_type: 'invalid-type',
    total_declared: 0,
    retained_count: 0,
    orphaned_count: 0,
    orphaned_packages: [],
    summary: { verdict: 'CLEAN', action_required: false, recommendation: 'No action' }
  };

  const errors = validateOrphanAudit(badManifestTypeReport);
  assert.ok(errors.some((e) => e.includes('manifest_type must be one of')), 'Expected manifest_type error');
  console.log('✅ Test 3 Passed: Invalid manifest type caught.');
}

console.log('\n🎉 All validate-orphans unit tests passed!\n');
