#!/usr/bin/env node

/**
 * validate-findings.cjs
 * Deterministic validator for slop-findings.json against schemas/slop-audit-schema.json.
 * Zero external dependencies: pure Node.js stdlib.
 * Usage: node scripts/validate-findings.cjs [path/to/slop-findings.json]
 */

const fs = require('fs');
const path = require('path');

function validateFinding(finding, index, errors) {
  const prefix = `findings[${index}]`;
  if (!finding.id || !/^(INVARIANT|DUPLICATION|SLOP|TEST_REGRESSION)-[0-9]{3}$/.test(finding.id)) {
    errors.push(`${prefix}.id must match ^(INVARIANT|DUPLICATION|SLOP|TEST_REGRESSION)-[0-9]{3}$ (got: "${finding.id}")`);
  }
  const validCategories = [
    'invariant_deletion',
    'wheel_reinvention',
    'swallowed_exception',
    'speculative_bloat',
    'redundant_defensive_code',
    'test_loosening'
  ];
  if (!validCategories.includes(finding.category)) {
    errors.push(`${prefix}.category must be one of: ${validCategories.join(', ')} (got: "${finding.category}")`);
  }
  const validSeverities = ['BLOCKER', 'HIGH', 'MEDIUM', 'LOW'];
  if (!validSeverities.includes(finding.severity)) {
    errors.push(`${prefix}.severity must be one of: ${validSeverities.join(', ')} (got: "${finding.severity}")`);
  }
  if (!finding.file || typeof finding.file !== 'string') {
    errors.push(`${prefix}.file must be a non-empty string`);
  }
  if (typeof finding.line !== 'number' || finding.line < 1) {
    errors.push(`${prefix}.line must be a positive integer`);
  }
  if (!finding.description || finding.description.length < 5) {
    errors.push(`${prefix}.description must be at least 5 characters`);
  }
  if (!finding.remediation || finding.remediation.length < 5) {
    errors.push(`${prefix}.remediation must be at least 5 characters`);
  }
}

function validateReport(report) {
  const errors = [];

  if (report.version !== '1.0.0') {
    errors.push(`version must be "1.0.0" (got: "${report.version}")`);
  }
  if (!report.target_repo || typeof report.target_repo !== 'string') {
    errors.push('target_repo is required and must be a non-empty string');
  }
  if (!report.churn_metrics || typeof report.churn_metrics !== 'object') {
    errors.push('churn_metrics object is required');
  } else {
    ['lines_added', 'lines_deleted', 'files_changed', 'churn_ratio'].forEach((field) => {
      if (typeof report.churn_metrics[field] !== 'number') {
        errors.push(`churn_metrics.${field} must be a number`);
      }
    });
  }

  if (!Array.isArray(report.findings)) {
    errors.push('findings must be an array');
  } else {
    report.findings.forEach((finding, idx) => validateFinding(finding, idx, errors));
  }

  if (!report.summary || typeof report.summary !== 'object') {
    errors.push('summary object is required');
  } else {
    if (!['PASS', 'WARN', 'FAIL'].includes(report.summary.verdict)) {
      errors.push('summary.verdict must be PASS, WARN, or FAIL');
    }
    if (typeof report.summary.blockers !== 'number') {
      errors.push('summary.blockers must be an integer');
    }
    if (typeof report.summary.warnings !== 'number') {
      errors.push('summary.warnings must be an integer');
    }
  }

  return errors;
}

function main() {
  const targetFile = process.argv[2] || 'slop-findings.json';
  const resolvedPath = path.resolve(process.cwd(), targetFile);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ Findings file not found at: ${resolvedPath}`);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
  } catch (err) {
    console.error(`❌ Failed to parse JSON: ${err.message}`);
    process.exit(1);
  }

  const errors = validateReport(data);

  if (errors.length > 0) {
    console.error(`\n❌ Schema Validation Failed with ${errors.length} error(s):`);
    errors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  }

  console.log(`\n✅ Valid findings report conforming to schemas/slop-audit-schema.json`);
  console.log(`   Target:       ${data.target_repo}`);
  console.log(`   Verdict:      ${data.summary.verdict}`);
  console.log(`   Blockers:     ${data.summary.blockers}`);
  console.log(`   Warnings:     ${data.summary.warnings}`);
  console.log(`   Findings:     ${data.findings.length} item(s)\n`);
}

if (require.main === module) {
  main();
}

module.exports = { validateReport };
