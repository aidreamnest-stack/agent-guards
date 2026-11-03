/**
 * validate-billing.test.cjs
 * Self-contained unit tests for validate-billing.cjs validator.
 * Run with: node scripts/validate-billing.test.cjs
 */

const assert = require('assert');
const { validateBillingAudit } = require('./validate-billing.cjs');

console.log('🧪 Running validate-billing test suite...\n');

// Test 1: Valid Billing Report Passes
{
  const validReport = {
    version: '1.0.0',
    target_app: 'com.example.mobileapp',
    audited_at: new Date().toISOString(),
    invariants: {
      google_play_72h_acknowledge: {
        status: 'VERIFIED',
        evidence: 'completePurchase called on all PurchaseStatus.purchased streams in billing_service.dart',
        remediation: 'None required'
      },
      encrypted_entitlement_storage: {
        status: 'VERIFIED',
        evidence: 'flutter_secure_storage used with Keychain and EncryptedSharedPreferences',
        remediation: 'None required'
      },
      storekit2_jws_verification: {
        status: 'VERIFIED',
        evidence: 'StoreKit 2 Transaction.updates pattern matches .verified case',
        remediation: 'None required'
      },
      rewarded_ad_ssv_and_debounce: {
        status: 'VERIFIED',
        evidence: 'AdMob SSV callback verified with ECDSA public keys on server',
        remediation: 'None required'
      },
      offline_grace_period_resilience: {
        status: 'VERIFIED',
        evidence: 'Cached entitlements preserved for 14 days during offline network timeouts',
        remediation: 'None required'
      },
      lifetime_ad_free_bypass: {
        status: 'VERIFIED',
        evidence: 'auth.hasLifetimeAccess bypasses all banner, native and interstitial ads',
        remediation: 'None required'
      }
    },
    verdict: 'PASS',
    summary: {
      blockers: 0,
      warnings: 0,
      recommendation: 'All monetization invariants verified. Ready for release.'
    }
  };

  const errors = validateBillingAudit(validReport);
  assert.strictEqual(errors.length, 0, `Expected 0 errors, got: ${errors.join(', ')}`);
  console.log('✅ Test 1 Passed: Valid billing audit passes validation.');
}

// Test 2: Missing Required Invariant Fails
{
  const missingInvariantReport = {
    version: '1.0.0',
    target_app: 'com.example.mobileapp',
    invariants: {
      google_play_72h_acknowledge: { status: 'VERIFIED', evidence: '', remediation: '' }
      // Missing other 5 invariants
    },
    verdict: 'FAIL',
    summary: { blockers: 5, warnings: 0, recommendation: 'Audit missing invariants' }
  };

  const errors = validateBillingAudit(missingInvariantReport);
  assert.ok(errors.some((e) => e.includes('Missing required invariant')), 'Expected missing invariant error');
  console.log('✅ Test 2 Passed: Missing invariant caught.');
}

// Test 3: Invalid Invariant Status Fails
{
  const badStatusReport = {
    version: '1.0.0',
    target_app: 'com.example.mobileapp',
    invariants: {
      google_play_72h_acknowledge: { status: 'INVALID_STATUS', evidence: '', remediation: '' },
      encrypted_entitlement_storage: { status: 'VERIFIED', evidence: '', remediation: '' },
      storekit2_jws_verification: { status: 'VERIFIED', evidence: '', remediation: '' },
      rewarded_ad_ssv_and_debounce: { status: 'VERIFIED', evidence: '', remediation: '' },
      offline_grace_period_resilience: { status: 'VERIFIED', evidence: '', remediation: '' },
      lifetime_ad_free_bypass: { status: 'VERIFIED', evidence: '', remediation: '' }
    },
    verdict: 'FAIL',
    summary: { blockers: 1, warnings: 0, recommendation: 'Fix status' }
  };

  const errors = validateBillingAudit(badStatusReport);
  assert.ok(errors.some((e) => e.includes('status must be one of')), 'Expected status enum error');
  console.log('✅ Test 3 Passed: Invalid invariant status caught.');
}

console.log('\n🎉 All validate-billing unit tests passed!\n');
