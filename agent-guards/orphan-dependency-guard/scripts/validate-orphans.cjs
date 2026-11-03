#!/usr/bin/env node

/**
 * validate-orphans.cjs
 * Deterministic schema validator for orphan-dependencies.json reports.
 * Usage: node scripts/validate-orphans.cjs [path/to/orphan-dependencies.json]
 */

const fs = require('fs');
const path = require('path');

function validateOrphanPackage(pkg, index, errors) {
  const prefix = `orphaned_packages[${index}]`;
  if (!pkg.name || typeof pkg.name !== 'string') {
    errors.push(`${prefix}.name must be a non-empty string`);
  }
  if (!['production', 'dev'].includes(pkg.dependency_type)) {
    errors.push(`${prefix}.dependency_type must be "production" or "dev"`);
  }
  if (pkg.import_matches !== 0) {
    errors.push(`${prefix}.import_matches must be 0 for an orphaned package`);
  }
  if (!pkg.uninstall_command || pkg.uninstall_command.length < 5) {
    errors.push(`${prefix}.uninstall_command must be a valid command string`);
  }
  if (!pkg.reason || pkg.reason.length < 5) {
    errors.push(`${prefix}.reason must be at least 5 characters long`);
  }
}

function validateOrphanAudit(report) {
  const errors = [];

  if (report.version !== '1.0.0') {
    errors.push(`version must be "1.0.0" (got: "${report.version}")`);
  }
  if (!report.manifest_file || typeof report.manifest_file !== 'string') {
    errors.push('manifest_file is required');
  }
  const validTypes = ['npm', 'pub.dev', 'pypi', 'gomod', 'cargo'];
  if (!validTypes.includes(report.manifest_type)) {
    errors.push(`manifest_type must be one of: ${validTypes.join(', ')}`);
  }
  if (typeof report.total_declared !== 'number') {
    errors.push('total_declared must be a number');
  }
  if (typeof report.retained_count !== 'number') {
    errors.push('retained_count must be a number');
  }
  if (typeof report.orphaned_count !== 'number') {
    errors.push('orphaned_count must be a number');
  }

  if (!Array.isArray(report.orphaned_packages)) {
    errors.push('orphaned_packages must be an array');
  } else {
    report.orphaned_packages.forEach((pkg, idx) => validateOrphanPackage(pkg, idx, errors));
  }

  if (!report.summary || typeof report.summary !== 'object') {
    errors.push('summary object is required');
  } else {
    if (!['CLEAN', 'BLOAT_DETECTED'].includes(report.summary.verdict)) {
      errors.push('summary.verdict must be CLEAN or BLOAT_DETECTED');
    }
    if (typeof report.summary.action_required !== 'boolean') {
      errors.push('summary.action_required must be a boolean');
    }
  }

  return errors;
}

function main() {
  const targetFile = process.argv[2] || 'orphan-dependencies.json';
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

  const errors = validateOrphanAudit(data);

  if (errors.length > 0) {
    console.error(`\n❌ Schema Validation Failed with ${errors.length} error(s):`);
    errors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  }

  console.log(`\n✅ Valid orphan dependency report conforming to schemas/orphan-audit-schema.json`);
  console.log(`   Manifest:     ${data.manifest_file} (${data.manifest_type})`);
  console.log(`   Verdict:      ${data.summary.verdict}`);
  console.log(`   Declared:     ${data.total_declared}`);
  console.log(`   Retained:     ${data.retained_count}`);
  console.log(`   Orphaned:     ${data.orphaned_count}\n`);
}

if (require.main === module) {
  main();
}

module.exports = { validateOrphanAudit };
