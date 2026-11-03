# Orphan Dependency Guard

> An enterprise-grade agent guard and automated scanner to identify unused, abandoned, and deadweight dependencies left behind by AI coding sessions, generate critical bloat notices, and safely prune them with explicit developer consent.

When working with AI coding assistants (Cursor, Copilot, Claude Code, Antigravity), codebases quickly turn into **dependency graveyards**:

1. You ask an agent to build a date picker or an HTTP retry handler.
2. The agent runs `npm install moment` or `flutter pub add http`.
3. Two days later, another prompt asks the agent to refactor the logic using modern native APIs (`Intl`, `fetch`).
4. The agent writes the new code, but **never removes the old library from your manifest**.
5. Six months later, your `package.json` or `pubspec.yaml` has 35 declared dependencies, but only 18 are actually imported.

The result is bloated production bundles, inflated CI build times, gigabytes of wasted `node_modules` storage, and an unnecessary supply-chain attack surface.

**Orphan Dependency Guard** sweeps your codebase, maps every declared package against real source call-sites, and prompts you with a clean, actionable notice before safely removing deadweight packages.

---

## Architecture Overview

```
orphan-dependency-guard/
├── SKILL.md                                 # Orchestrator & subagent pruning protocol
├── README.md                                # Public documentation & developer guide
├── schemas/
│   └── orphan-audit-schema.json             # Formal JSON Schema (draft-07) for orphan audits
├── references/
│   ├── ECOSYSTEM-IMPORT-PATTERNS.md         # Regex & AST patterns per language (JS/TS, Dart, Python)
│   ├── FALSE-POSITIVE-DEFENSE.md            # Whitelist rules for CLI tools, types & build plugins
│   └── BUNDLE-IMPACT-METRICS.md             # Transitive bloat multiplier & disk footprint formulas
└── scripts/
    ├── scan-orphans.cjs                     # Fast zero-dependency import scanner
    ├── validate-orphans.cjs                 # Schema validator for orphan audit reports
    └── validate-orphans.test.cjs            # Unit test suite for validation harness
```

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

---

## The Critical Notice Gate (Zero Blind Deletions)

Unlike aggressive linters that silently break project builds, this guard **never deletes a dependency automatically**. 

When it detects an unused package, it presents a **Critical Notice** and waits for your confirmation:

```markdown
> [!WARNING] ORPHANED DEPENDENCY DETECTED: `moment`
> - Declared in: `package.json` (dependencies)
> - Codebase usage: 0 files import or require this package.
> - Estimated dead weight: ~71 KB gzipped (adds 4.2 MB to node_modules).
> - Security footprint: Broad utility surface area with no active caller.
> 
> **Action**: Would you like to remove `moment`? (Run `npm uninstall moment`)
```

Only when you approve does it execute the uninstall command and run your project's unit tests to guarantee zero regressions.

---

## Quick Start & CLI Usage

### Scan Your Project for Orphan Dependencies:
```bash
node scripts/scan-orphans.cjs [path/to/project]
```

### Validate an Orphan Audit Report:
```bash
node scripts/validate-orphans.cjs path/to/orphan-dependencies.json
```

### Run the Validator Test Suite:
```bash
node scripts/validate-orphans.test.cjs
```

---

## How to Install in Coding Assistants

Copy this folder directly into your project's `.agents/skills/` directory:
```bash
mkdir -p .agents/skills
cp -r orphan-dependency-guard .agents/skills/
```

Whenever you want your agent to perform dependency maintenance, tell it:
> *"Run orphan-dependency-guard to audit our manifest for unused packages."*

---

## Supported Ecosystems
- **JavaScript / TypeScript**: npm, pnpm, yarn (`package.json`)
- **Dart / Flutter**: pub.dev (`pubspec.yaml`)
- **Python**: pip / poetry (`requirements.txt`, `pyproject.toml`)
- **Go**: Go Modules (`go.mod`)

## License
MIT License. Free to use in open-source and commercial repositories.
