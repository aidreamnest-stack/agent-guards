#!/usr/bin/env node

/**
 * scan-orphans.cjs
 * Fast scanner to detect unimported and abandoned dependencies in Node.js projects.
 * Usage: node scripts/scan-orphans.cjs [projectDir]
 */

const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(process.cwd(), process.argv[2] || '.');
const packageJsonPath = path.join(targetDir, 'package.json');

if (!fs.existsSync(packageJsonPath)) {
  console.error(`❌ package.json not found in ${targetDir}`);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const dependencies = Object.keys(pkg.dependencies || {});
const devDependencies = Object.keys(pkg.devDependencies || {});
const allDeclared = [...dependencies, ...devDependencies];

if (allDeclared.length === 0) {
  console.log('✅ No dependencies declared in package.json.');
  process.exit(0);
}

// 1. Collect all CLI commands used in package.json scripts
const scriptsText = Object.values(pkg.scripts || {}).join(' ');

// 1.5 Collect all config file names in project root for bundler/linter tools
const configFiles = fs.readdirSync(targetDir).filter((f) => 
  f.includes('config') || f.startsWith('.eslint') || f.startsWith('.prettier')
);
const configText = configFiles.map((f) => {
  try {
    return fs.readFileSync(path.join(targetDir, f), 'utf-8');
  } catch (e) {
    return '';
  }
}).join(' ');

// 2. Recursively gather all source files
const sourceExts = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue', '.svelte']);
const ignoreDirs = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'out', 'coverage', '.cache']);

function gatherFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoreDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      gatherFiles(fullPath, fileList);
    } else if (entry.isFile() && sourceExts.has(path.extname(entry.name))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const sourceFiles = gatherFiles(targetDir);
console.log(`\n🔍 Scanning ${sourceFiles.length} source file(s) across ${allDeclared.length} declared dependencies...\n`);

// 3. Read all source code into memory for fast searching
const sourceContents = sourceFiles.map((file) => fs.readFileSync(file, 'utf-8'));

// 4. Check each dependency
const orphans = [];
const retained = [];

for (const dep of allDeclared) {
  // Check if used in scripts (e.g. CLI tools)
  if (scriptsText.includes(dep)) {
    retained.push({ name: dep, reason: 'Used in package.json scripts' });
    continue;
  }

  // Check if used in configuration files (e.g. postcss, tailwind, eslint)
  if (configText.includes(dep) || configFiles.some((f) => f.includes(dep))) {
    retained.push({ name: dep, reason: 'Referenced in project configuration files' });
    continue;
  }

  // Check for TypeScript ambient types
  if (dep.startsWith('@types/')) {
    const baseName = dep.replace('@types/', '');
    if (dependencies.includes(baseName) || devDependencies.includes(baseName) || baseName === 'node') {
      retained.push({ name: dep, reason: 'TypeScript type definitions for active runtime' });
      continue;
    }
  }

  // Build regex patterns for imports/requires
  // matches: from 'dep', from "dep/sub", require('dep')
  const escapedDep = dep.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  const importRegex = new RegExp(`['"\`]${escapedDep}(?:/[^'"\`]+)?['"\`]`);

  let isUsed = false;
  for (const content of sourceContents) {
    if (importRegex.test(content)) {
      isUsed = true;
      break;
    }
  }

  if (isUsed) {
    retained.push({ name: dep, reason: 'Imported in source code' });
  } else {
    const isDev = devDependencies.includes(dep);
    orphans.push({
      name: dep,
      dependency_type: isDev ? 'dev' : 'production',
      import_matches: 0,
      uninstall_command: `npm uninstall ${isDev ? '-D ' : ''}${dep}`,
      reason: 'Zero imports, requires, or script references found in codebase'
    });
  }
}

// 5. Output Report
console.log(`--- Dependency Audit Summary ---`);
console.log(`📦 Total Declared:  ${allDeclared.length}`);
console.log(`✅ Active & In Use: ${retained.length}`);
console.log(`⚠️  Orphaned:        ${orphans.length}\n`);

if (orphans.length === 0) {
  console.log('🎉 Clean manifest: Every declared dependency is actively used!\n');
} else {
  console.log('🚨 Critical Notice: The following dependencies appear completely UNUSED:\n');
  orphans.forEach((o) => {
    console.log(`  - [${o.dependency_type.toUpperCase()}] ${o.name}`);
    console.log(`    Uninstall: ${o.uninstall_command}`);
  });
  console.log('\nAsk user permission before removing any of the above packages.\n');
}
