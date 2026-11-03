/**
 * validate-findings.test.cjs
 * Self-contained unit tests for validate-findings.cjs validator.
 * Run with: node scripts/validate-findings.test.cjs
 */

const assert = require('assert');
const { validateReport } = require('./validate-findings.cjs');

console.log('🧪 Running validate-findings test suite...\n');

// Test 1: Valid Report Passes
{
  const validReport = {
    version: '1.0.0',
    target_repo: 'test-org/test-repo',
    base_ref: 'origin/main',
    head_ref: 'HEAD',
    churn_metrics: {
      lines_added: 45,
      lines_deleted: 12,
      files_changed: 2,
      churn_ratio: 1.25
    },
    findings: [
      {
        id: 'INVARIANT-001',
        category: 'invariant_deletion',
        severity: 'BLOCKER',
        file: 'lib/main.dart',
        line: 42,
        snippet: '- if (Platform.isIOS) { ... }',
        description: 'Stripped platform check for iOS keychain sync',
        remediation: 'Restore the Platform.isIOS branch'
      }
    ],
    summary: {
      verdict: 'FAIL',
      blockers: 1,
      warnings: 0,
      recommendation: 'Restore iOS guard before merge'
    }
  };

  const errors = validateReport(validReport);
  assert.strictEqual(errors.length, 0, `Expected 0 errors, got: ${errors.join(', ')}`);
  console.log('✅ Test 1 Passed: Valid report cleanly passes validation.');
}

// Test 2: Invalid Finding ID Format Fails
{
  const badIdReport = {
    version: '1.0.0',
    target_repo: 'test-org/test-repo',
    churn_metrics: { lines_added: 1, lines_deleted: 1, files_changed: 1, churn_ratio: 1 },
    findings: [
      {
        id: 'INVALID_ID',
        category: 'invariant_deletion',
        severity: 'BLOCKER',
        file: 'test.ts',
        line: 1,
        description: 'Valid description',
        remediation: 'Valid remediation'
      }
    ],
    summary: { verdict: 'FAIL', blockers: 1, warnings: 0, recommendation: 'Fix id' }
  };

  const errors = validateReport(badIdReport);
  assert.ok(errors.some((e) => e.includes('id must match')), 'Expected ID format error');
  console.log('✅ Test 2 Passed: Malformed finding ID correctly caught.');
}

// Test 3: Invalid Severity Fails
{
  const badSeverityReport = {
    version: '1.0.0',
    target_repo: 'test-org/test-repo',
    churn_metrics: { lines_added: 1, lines_deleted: 1, files_changed: 1, churn_ratio: 1 },
    findings: [
      {
        id: 'SLOP-001',
        category: 'speculative_bloat',
        severity: 'CATASTROPHIC', // Not in allowed enum
        file: 'test.ts',
        line: 1,
        description: 'Valid description',
        remediation: 'Valid remediation'
      }
    ],
    summary: { verdict: 'WARN', blockers: 0, warnings: 1, recommendation: 'Fix severity' }
  };

  const errors = validateReport(badSeverityReport);
  assert.ok(errors.some((e) => e.includes('severity must be one of')), 'Expected severity enum error');
  console.log('✅ Test 3 Passed: Invalid severity enum correctly caught.');
}

console.log('\n🎉 All validate-findings unit tests passed!\n');
