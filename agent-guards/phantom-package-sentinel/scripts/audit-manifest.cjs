#!/usr/bin/env node

/**
 * audit-manifest.cjs
 * Fast checker to audit newly added npm packages against registries for age and popularity.
 * Usage: node scripts/audit-manifest.cjs <packageName>
 */

const { execSync } = require('child_process');

const pkgName = process.argv[2];

if (!pkgName) {
  console.log('Usage: node scripts/audit-manifest.cjs <packageName>');
  process.exit(1);
}

console.log(`\n🔍 Inspecting package "${pkgName}" on registry...\n`);

try {
  const rawInfo = execSync(`npm view ${pkgName} time.created maintainers repository.url version --json`, {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'ignore'],
  });

  const info = JSON.parse(rawInfo);
  const createdDate = info['time.created'] ? new Date(info['time.created']) : null;
  const now = new Date();
  const ageDays = createdDate ? Math.floor((now - createdDate) / (1000 * 60 * 60 * 24)) : null;

  console.log(`📦 Name:         ${pkgName}`);
  console.log(`📌 Version:      ${info.version || 'Unknown'}`);
  console.log(`🗓️  Created:      ${createdDate ? createdDate.toISOString().split('T')[0] : 'Unknown'} (${ageDays !== null ? ageDays + ' days ago' : 'N/A'})`);
  console.log(`🔗 Repo:         ${info['repository.url'] || 'None / Not linked'}`);

  const issues = [];

  if (ageDays !== null && ageDays < 30) {
    issues.push(`⚠️  Package was registered very recently (${ageDays} days ago). Potential squatting or hallucination target.`);
  }

  if (!info['repository.url']) {
    issues.push(`⚠️  No source code repository URL provided in package metadata.`);
  }

  if (issues.length > 0) {
    console.log('\n--- Warnings Detected ---');
    issues.forEach((iss) => console.log(iss));
    console.log('\nReview package source code and verify author before running npm install.\n');
  } else {
    console.log('\n✅ Package metadata looks healthy (established age and repository link).\n');
  }
} catch (err) {
  console.log(`❌ Failed to retrieve package "${pkgName}". It may not exist on the public registry (possible hallucination) or registry was unreachable.`);
  process.exit(1);
}
