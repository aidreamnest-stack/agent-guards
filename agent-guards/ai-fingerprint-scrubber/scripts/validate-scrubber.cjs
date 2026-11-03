#!/usr/bin/env node

/**
 * validate-scrubber.cjs
 * Deterministic schema validator for fingerprint-audit.json reports.
 * Usage: node scripts/validate-scrubber.cjs [path/to/fingerprint-audit.json]
 */

const fs = require('fs');
const path = require('path');

function validateFinding(f, idx, errors) {
  const prefix = `findings[${idx}]`;
  if (!f.file || typeof f.file !== 'string') errors.push(`${prefix}.file must be a string`);
  if (typeof f.line !== 'number' || f.line < 1) errors.push(`${prefix}.line must be a positive integer`);
  const validTypes = ['emoji_in_comment', 'narrative_phrasing', 'echo_comment', 'ai_buzzword', 'divider_banner'];
  if (!validTypes.includes(f.type)) errors.push(`${prefix}.type must be one of: ${validTypes.join(', ')}`);
  const validActions = ['DELETE_COMMENT', 'REWRITE_CONCISE', 'STRIP_EMOJI', 'REMOVE_BANNER'];
  if (!validActions.includes(f.suggested_action)) errors.push(`${prefix}.suggested_action must be one of: ${validActions.join(', ')}`);
  if (!f.remediation || f.remediation.length < 5) errors.push(`${prefix}.remediation must be at least 5 characters`);
}

function validateFingerprintAudit(report) {
  const errors = [];

  if (report.version !== '1.0.0') errors.push(`version must be "1.0.0" (got: "${report.version}")`);
  if (!report.target_path || typeof report.target_path !== 'string') errors.push('target_path is required');
  if (typeof report.total_files_scanned !== 'number') errors.push('total_files_scanned must be a number');

  if (!report.fingerprint_counts || typeof report.fingerprint_counts !== 'object') {
    errors.push('fingerprint_counts object is required');
  } else {
    ['emoji_comments', 'narrative_comments', 'echo_comments', 'ai_buzzwords', 'divider_banners'].forEach((key) => {
      if (typeof report.fingerprint_counts[key] !== 'number') {
        errors.push(`fingerprint_counts.${key} must be a number`);
      }
    });
  }

  if (!Array.isArray(report.findings)) {
    errors.push('findings must be an array');
  } else {
    report.findings.forEach((f, idx) => validateFinding(f, idx, errors));
  }

  if (!report.summary || typeof report.summary !== 'object') {
    errors.push('summary object is required');
  } else {
    if (!['CLEAN', 'FINGERPRINTS_DETECTED'].includes(report.summary.verdict)) {
      errors.push('summary.verdict must be CLEAN or FINGERPRINTS_DETECTED');
    }
    if (typeof report.summary.human_code_score !== 'number' || report.summary.human_code_score < 0 || report.summary.human_code_score > 100) {
      errors.push('summary.human_code_score must be between 0 and 100');
    }
  }

  return errors;
}

function main() {
  const targetFile = process.argv[2] || 'fingerprint-audit.json';
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

  const errors = validateFingerprintAudit(data);

  if (errors.length > 0) {
    console.error(`\n❌ Schema Validation Failed with ${errors.length} error(s):`);
    errors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  }

  console.log(`\n✅ Valid fingerprint audit report conforming to schemas/fingerprint-audit-schema.json`);
  console.log(`   Target:            ${data.target_path}`);
  console.log(`   Verdict:           ${data.summary.verdict}`);
  console.log(`   Human Code Score:  ${data.summary.human_code_score}/100`);
  console.log(`   Total Flags:       ${data.findings.length}\n`);
}

if (require.main === module) {
  main();
}

module.exports = { validateFingerprintAudit };
