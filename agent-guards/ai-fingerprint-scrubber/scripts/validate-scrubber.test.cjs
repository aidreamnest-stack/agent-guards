/**
 * validate-scrubber.test.cjs
 * Self-contained unit tests for validate-scrubber.cjs validator.
 * Run with: node scripts/validate-scrubber.test.cjs
 */

const assert = require('assert');
const { validateFingerprintAudit } = require('./validate-scrubber.cjs');

console.log('🧪 Running validate-scrubber test suite...\n');

// Test 1: Valid Fingerprint Report Passes
{
  const validReport = {
    version: '1.0.0',
    scanned_at: new Date().toISOString(),
    target_path: 'src/services/',
    total_files_scanned: 15,
    fingerprint_counts: {
      emoji_comments: 4,
      narrative_comments: 2,
      echo_comments: 3,
      ai_buzzwords: 1,
      divider_banners: 1
    },
    findings: [
      {
        file: 'src/services/auth.ts',
        line: 12,
        type: 'emoji_in_comment',
        raw_snippet: '// 🚀 Step 1: Initialize token storage ✨',
        suggested_action: 'STRIP_EMOJI',
        remediation: 'Remove decorative emojis and write technical comment'
      },
      {
        file: 'src/services/auth.ts',
        line: 25,
        type: 'narrative_phrasing',
        raw_snippet: '// Let us go ahead and make sure the token is valid',
        suggested_action: 'REWRITE_CONCISE',
        remediation: 'Rewrite to: // Require non-expired OAuth token'
      }
    ],
    summary: {
      verdict: 'FINGERPRINTS_DETECTED',
      human_code_score: 68.5,
      recommendation: 'Scrub 11 AI fingerprints to align with staff-level engineering standards'
    }
  };

  const errors = validateFingerprintAudit(validReport);
  assert.strictEqual(errors.length, 0, `Expected 0 errors, got: ${errors.join(', ')}`);
  console.log('✅ Test 1 Passed: Valid fingerprint audit report passes cleanly.');
}

// Test 2: Invalid Action Fails
{
  const badActionReport = {
    version: '1.0.0',
    target_path: 'src/',
    total_files_scanned: 1,
    fingerprint_counts: { emoji_comments: 1, narrative_comments: 0, echo_comments: 0, ai_buzzwords: 0, divider_banners: 0 },
    findings: [
      {
        file: 'src/test.ts',
        line: 1,
        type: 'emoji_in_comment',
        raw_snippet: '// 🚀 test',
        suggested_action: 'INVALID_ACTION',
        remediation: 'Valid remediation'
      }
    ],
    summary: { verdict: 'FINGERPRINTS_DETECTED', human_code_score: 80, recommendation: 'Fix action' }
  };

  const errors = validateFingerprintAudit(badActionReport);
  assert.ok(errors.some((e) => e.includes('suggested_action must be one of')), 'Expected action enum error');
  console.log('✅ Test 2 Passed: Invalid suggested action caught.');
}

// Test 3: Out-of-bounds Score Fails
{
  const badScoreReport = {
    version: '1.0.0',
    target_path: 'src/',
    total_files_scanned: 1,
    fingerprint_counts: { emoji_comments: 0, narrative_comments: 0, echo_comments: 0, ai_buzzwords: 0, divider_banners: 0 },
    findings: [],
    summary: { verdict: 'CLEAN', human_code_score: 150, recommendation: 'No action' } // Score > 100
  };

  const errors = validateFingerprintAudit(badScoreReport);
  assert.ok(errors.some((e) => e.includes('human_code_score must be between 0 and 100')), 'Expected score range error');
  console.log('✅ Test 3 Passed: Out-of-bounds human code score caught.');
}

console.log('\n🎉 All validate-scrubber unit tests passed!\n');
