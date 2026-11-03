/**
 * validate-dependencies.test.cjs
 * Self-contained unit tests for validate-dependencies.cjs validator.
 * Run with: node scripts/validate-dependencies.test.cjs
 */

const assert = require('assert');
const { validateDependencyAudit } = require('./validate-dependencies.cjs');

console.log('🧪 Running validate-dependencies test suite...\n');

// Test 1: Valid Audit Report Passes
{
  const validReport = {
    version: '1.0.0',
    scanned_at: new Date().toISOString(),
    manifest_file: 'package.json',
    packages: [
      {
        name: 'lodash-debounce-fast',
        ecosystem: 'npm',
        version: '1.0.0',
        age_days: 3,
        weekly_downloads: 12,
        has_public_repo: false,
        has_install_hooks: true,
        risk_score: 92.5,
        verdict: 'BLOCKED',
        findings: ['Package created 3 days ago', 'Suspicious postinstall script detected'],
        recommendation: 'Reject package and implement 6-line debounce in utils/debounce.js'
      }
    ],
    summary: {
      total_scanned: 1,
      approved: 0,
      needs_review: 0,
      blocked: 1,
      verdict: 'FAIL'
    }
  };

  const errors = validateDependencyAudit(validReport);
  assert.strictEqual(errors.length, 0, `Expected 0 errors, got: ${errors.join(', ')}`);
  console.log('✅ Test 1 Passed: Valid dependency audit passes validation.');
}

// Test 2: Invalid Ecosystem Fails
{
  const badEcosystemReport = {
    version: '1.0.0',
    manifest_file: 'package.json',
    packages: [
      {
        name: 'test-pkg',
        ecosystem: 'unknown-ecosystem',
        version: '1.0.0',
        risk_score: 10,
        verdict: 'APPROVED',
        recommendation: 'Valid recommendation'
      }
    ],
    summary: { total_scanned: 1, approved: 1, needs_review: 0, blocked: 0, verdict: 'PASS' }
  };

  const errors = validateDependencyAudit(badEcosystemReport);
  assert.ok(errors.some((e) => e.includes('ecosystem must be one of')), 'Expected ecosystem enum error');
  console.log('✅ Test 2 Passed: Invalid ecosystem caught.');
}

// Test 3: Invalid Risk Score Fails
{
  const badRiskScoreReport = {
    version: '1.0.0',
    manifest_file: 'package.json',
    packages: [
      {
        name: 'test-pkg',
        ecosystem: 'npm',
        version: '1.0.0',
        risk_score: 150, // Max is 100
        verdict: 'APPROVED',
        recommendation: 'Valid recommendation'
      }
    ],
    summary: { total_scanned: 1, approved: 1, needs_review: 0, blocked: 0, verdict: 'PASS' }
  };

  const errors = validateDependencyAudit(badRiskScoreReport);
  assert.ok(errors.some((e) => e.includes('risk_score must be a number between 0 and 100')), 'Expected risk_score range error');
  console.log('✅ Test 3 Passed: Out-of-bounds risk score caught.');
}

console.log('\n🎉 All validate-dependencies unit tests passed!\n');
