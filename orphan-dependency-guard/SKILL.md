---
name: orphan-dependency-guard
description: Automated audit and pruning skill to scan project manifests, detect unused and abandoned dependencies left behind by AI coding sessions, issue critical bloat notices, and safely prune them with explicit user permission.
---

# Orphan Dependency Guard

Audit manifests, detect deadweight packages, and safely eliminate unused dependencies introduced or abandoned by AI coding assistants.

## The Problem: AI Dependency Accumulation

When developers work with AI coding tools, agents frequently install libraries to test an idea, solve a subproblem, or build a prototype:
1. An agent runs `npm install moment` or `flutter pub add http`.
2. Later, another prompt refactors the logic to use native `Intl` or an internal API client.
3. The code no longer imports the package, but the agent **never removes it from the manifest**.
4. Over months of AI-assisted refactoring, projects accumulate 20–50 phantom packages in `package.json` or `pubspec.yaml`.

This leads to:
- **Massive bundle bloat**: Shipping megabytes of dead JavaScript or binary assets to users.
- **Exploding `node_modules` & CI build times**: Fetching and parsing hundreds of unneeded transitive dependencies.
- **Supply-Chain Vulnerability Surface**: Every unmaintained package sitting in your manifest is an attack vector waiting for an upstream maintainer account hijack.

---

## Operating Modes

- **Passive Audit Mode (Default)**: Scans manifests, maps every declared dependency against actual codebase imports, and generates a structured report highlighting unused packages with bundle size estimates. Makes zero modifications to files.
- **Interactive Prune Mode**: Upon reviewing the audit report, prompts the user with a **Critical Notice** for each unused dependency. Once the user explicitly approves removal, safely uninstalls the package, regenerates lockfiles, and executes the test suite to guarantee zero build breakage.

---

## Subagent Choreography & Terminology

- **Orchestrator (Parent)**: Coordinates the audit lifecycle, holds write isolation, presents the Critical Notice to the user, and manages confirmation prompts before executing uninstall commands.
- **`research` Subagent**: Read-only codebase explorer. Scans all source files, configurations, build scripts, and style files to trace import statements (`import`, `require`, `package:`, `from`, dynamic imports).
- **`general` Subagent**: Executes `scripts/scan-orphans.cjs`, runs ecosystem package managers (`npm uninstall`, `flutter pub remove`), and runs local build/test verification.

---

## Universal Safety Rules (Zero Broken Builds)

1. **False-Positive Prevention**: Never flag build tools, config-only plugins (e.g. `postcss`, `tailwindcss`, `babel` plugins), or TypeScript `@types/*` without inspecting framework config files. Refer to [references/FALSE-POSITIVE-DEFENSE.md](references/FALSE-POSITIVE-DEFENSE.md).
2. **Explicit User Permission Gate**: The agent must **NEVER** automatically delete a package from a manifest without presenting the finding to the user and receiving explicit permission.
3. **Rollback Guarantee**: If running tests after pruning fails, immediately restore the manifest and lockfile.

---

## The 5-Phase Pruning Protocol

```
[Phase 1: Manifest Ingestion] ───────> Extract direct dependencies from manifest
  │
[Phase 2: Comprehensive Code Search] > Search all source files for import / require syntax
  │
[Phase 3: False-Positive Filter] ────> Check configs, scripts, peer deps, and asset bundles
  │
[Phase 4: Critical Notice & Gate] ───> Issue high-visibility report & request user confirmation
  │
[Phase 5: Safe Pruning & Test Run] ──> Uninstall approved packages & verify test suite passes
```

### Phase 1: Manifest Ingestion (subagent_type: `general`)
Parse the project's dependency manifest:
- Node.js: `package.json` (`dependencies` and `devDependencies`)
- Flutter/Dart: `pubspec.yaml` (`dependencies` and `dev_dependencies`)
- Python: `requirements.txt` or `pyproject.toml`
- Go: `go.mod` (direct vs indirect)
Catalog every declared root package name.

### Phase 2: Comprehensive Import Search (subagent_type: `research`)
Search all source files using ecosystem-specific pattern matching as defined in [references/ECOSYSTEM-IMPORT-PATTERNS.md](references/ECOSYSTEM-IMPORT-PATTERNS.md):
- **JavaScript / TypeScript**:
  - `import ... from '<pkg>'`
  - `import('<pkg>')`
  - `require('<pkg>')`
  - Subpath imports: `<pkg>/subpath`
- **Flutter / Dart**:
  - `import 'package:<pkg>/...'`
  - `export 'package:<pkg>/...'`
- **Python**:
  - `import <pkg>`
  - `from <pkg> import ...`

Mark every package with at least 1 verified import location as `[RETAINED]`.

### Phase 3: False-Positive Defense (subagent_type: `research`)
Before flagging an unimported dependency as orphaned, check non-source locations:
- Is it a CLI tool invoked in `package.json` `scripts`? (e.g. `rimraf`, `concurrently`, `tsc`).
- Is it a Tailwind / PostCSS plugin declared as a string in `tailwind.config.js` or `postcss.config.js`?
- Is it a Flutter native plugin referenced only in `AndroidManifest.xml` or `Info.plist`?
If matched in configs, classify as `[CONFIG_DEPENDENCY]` and preserve it.

### Phase 4: Critical Notice & Permission Gate (subagent_type: `general`)
For every confirmed unused package, generate a **Critical Notice**:
```markdown
> [!WARNING] ORPHANED DEPENDENCY DETECTED: `lodash`
> - Declared in: `package.json`
> - Codebase usage: 0 files import or require this package.
> - Estimated dead weight: ~71 KB gzipped (adds 4.2 MB to node_modules).
> - Security footprint: Broad utility surface area with no active caller.
> 
> **Action**: Would you like to remove `lodash`? (Run `npm uninstall lodash`)
```
Stop and wait for the user's explicit confirmation.

### Phase 5: Safe Pruning & Test Run (subagent_type: `general`)
Upon user approval:
1. Run the appropriate uninstall command:
   ```bash
   # Node
   npm uninstall <pkg>
   # Flutter
   flutter pub remove <pkg>
   # Python
   pip uninstall -y <pkg>
   ```
2. Run project unit tests to confirm nothing was broken:
   ```bash
   npm test # or flutter test
   ```
3. If tests fail, restore `git checkout -- <manifest> <lockfile>` and report the hidden coupling.

---

## Companion References
- [references/ECOSYSTEM-IMPORT-PATTERNS.md](references/ECOSYSTEM-IMPORT-PATTERNS.md): Exact regex and AST search syntax per language.
- [references/FALSE-POSITIVE-DEFENSE.md](references/FALSE-POSITIVE-DEFENSE.md): Whitelist rules for CLI tools, type definitions, and bundler plugins.
- [references/BUNDLE-IMPACT-METRICS.md](references/BUNDLE-IMPACT-METRICS.md): Formulas for measuring dead weight and transitive tree reductions.
- [schemas/orphan-audit-schema.json](schemas/orphan-audit-schema.json): Machine-readable JSON schema for dependency pruning reports.
