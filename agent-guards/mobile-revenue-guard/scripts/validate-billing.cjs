#!/usr/bin/env node

/**
 * validate-billing.cjs
 * Deterministic schema validator for billing-audit.json reports.
 * Pure Node.js stdlib with zero external dependencies.
 * Usage: node scripts/validate-billing.cjs [path/to/billing-audit.json]
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_INVARIANTS = [
  'google_play_72h_acknowledge',
  'encrypted_entitlement_storage',
  'storekit2_jws_verification',
  'rewarded_ad_ssv_and_debounce',
  'offline_grace_period_resilience',
  'lifetime_ad_free_bypass'
];

function validateInvariant(key, inv, errors) {
  const prefix = `invariants.${key}`;
  if (!inv || typeof inv !== 'object') {
    errors.push(`${prefix} must be an object`);
    return;
  }
  const validStatuses = ['VERIFIED', 'NEEDS_ATTENTION', 'VIOLATED', 'NOT_APPLICABLE'];
  if (!validStatuses.includes(inv.status)) {
    errors.push(`${prefix}.status must be one of: ${validStatuses.join(', ')}`);
  }
  if (typeof inv.evidence !== 'string') {
    errors.push(`${prefix}.evidence must be a string`);
  }
  if (typeof inv.remediation !== 'string') {
    errors.push(`${prefix}.remediation must be a string`);
  }
}

function validateBillingAudit(report) {
  const errors = [];

  if (report.version !== '1.0.0') {
    errors.push(`version must be "1.0.0" (got: "${report.version}")`);
  }
  if (!report.target_app || typeof report.target_app !== 'string') {
    errors.push('target_app is required');
  }
  if (!report.invariants || typeof report.invariants !== 'object') {
    errors.push('invariants object is required');
  } else {
    REQUIRED_INVARIANTS.forEach((key) => {
      if (!report.invariants[key]) {
        errors.push(`Missing required invariant: ${key}`);
      } else {
        validateInvariant(key, report.invariants[key], errors);
      }
    });
  }

  if (!['PASS', 'WARN', 'FAIL'].includes(report.verdict)) {
    errors.push('verdict must be PASS, WARN, or FAIL');
  }

  if (!report.summary || typeof report.summary !== 'object') {
    errors.push('summary object is required');
  } else {
    if (typeof report.summary.blockers !== 'number') {
      errors.push('summary.blockers must be an integer');
    }
    if (typeof report.summary.warnings !== 'number') {
      errors.push('summary.warnings must be an integer');
    }
    if (!report.summary.recommendation || report.summary.recommendation.length < 5) {
      errors.push('summary.recommendation must be at least 5 characters');
    }
  }

  return errors;
}

function main() {
  const targetFile = process.argv[2] || 'billing-audit.json';
  const resolvedPath = path.resolve(process.cwd(), targetFile);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ Audit report file not found at: ${resolvedPath}`);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
  } catch (err) {
    console.error(`❌ Failed to parse JSON: ${err.message}`);
    process.exit(1);
  }

  const errors = validateBillingAudit(data);

  if (errors.length > 0) {
    console.error(`\n❌ Schema Validation Failed with ${errors.length} error(s):`);
    errors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  }

  console.log(`\n✅ Valid mobile billing audit report conforming to schemas/billing-audit-schema.json`);
  console.log(`   Target App:   ${data.target_app}`);
  console.log(`   Verdict:      ${data.verdict}`);
  console.log(`   Blockers:     ${data.summary.blockers}`);
  console.log(`   Warnings:     ${data.summary.warnings}\n`);
}

if (require.main === module) {
  main();
}

module.exports = { validateBillingAudit };
