#!/usr/bin/env node

/**
 * validate-dependencies.cjs
 * Deterministic schema validator for dependency-audit.json reports.
 * Pure Node.js stdlib with zero external dependencies.
 * Usage: node scripts/validate-dependencies.cjs [path/to/dependency-audit.json]
 */

const fs = require('fs');
const path = require('path');

function validatePackage(pkg, index, errors) {
  const prefix = `packages[${index}]`;
  if (!pkg.name || typeof pkg.name !== 'string') {
    errors.push(`${prefix}.name must be a non-empty string`);
  }
  const validEcosystems = ['npm', 'pub.dev', 'pypi', 'crates.io', 'gomod'];
  if (!validEcosystems.includes(pkg.ecosystem)) {
    errors.push(`${prefix}.ecosystem must be one of: ${validEcosystems.join(', ')}`);
  }
  if (typeof pkg.risk_score !== 'number' || pkg.risk_score < 0 || pkg.risk_score > 100) {
    errors.push(`${prefix}.risk_score must be a number between 0 and 100`);
  }
  if (!['APPROVED', 'NEEDS_REVIEW', 'BLOCKED'].includes(pkg.verdict)) {
    errors.push(`${prefix}.verdict must be APPROVED, NEEDS_REVIEW, or BLOCKED`);
  }
  if (!pkg.recommendation || pkg.recommendation.length < 5) {
    errors.push(`${prefix}.recommendation must be at least 5 characters long`);
  }
}

function validateDependencyAudit(report) {
  const errors = [];

  if (report.version !== '1.0.0') {
    errors.push(`version must be "1.0.0" (got: "${report.version}")`);
  }
  if (!report.manifest_file || typeof report.manifest_file !== 'string') {
    errors.push('manifest_file is required');
  }
  if (!Array.isArray(report.packages)) {
    errors.push('packages must be an array');
  } else {
    report.packages.forEach((pkg, idx) => validatePackage(pkg, idx, errors));
  }

  if (!report.summary || typeof report.summary !== 'object') {
    errors.push('summary object is required');
  } else {
    ['total_scanned', 'approved', 'needs_review', 'blocked'].forEach((field) => {
      if (typeof report.summary[field] !== 'number') {
        errors.push(`summary.${field} must be an integer`);
      }
    });
    if (!['PASS', 'WARN', 'FAIL'].includes(report.summary.verdict)) {
      errors.push('summary.verdict must be PASS, WARN, or FAIL');
    }
  }

  return errors;
}

function main() {
  const targetFile = process.argv[2] || 'dependency-audit.json';
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

  const errors = validateDependencyAudit(data);

  if (errors.length > 0) {
    console.error(`\n❌ Schema Validation Failed with ${errors.length} error(s):`);
    errors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  }

  console.log(`\n✅ Valid dependency audit report conforming to schemas/manifest-audit-schema.json`);
  console.log(`   Manifest:     ${data.manifest_file}`);
  console.log(`   Verdict:      ${data.summary.verdict}`);
  console.log(`   Total:        ${data.summary.total_scanned}`);
  console.log(`   Blocked:      ${data.summary.blocked}`);
  console.log(`   Needs Review: ${data.summary.needs_review}\n`);
}

if (require.main === module) {
  main();
}

module.exports = { validateDependencyAudit };
