# Phantom Package Sentinel

> An enterprise supply-chain security skill and pre-flight verification harness to block AI-hallucinated package names, typosquatting attacks, and malicious install hooks before `npm install`, `pub get`, or `pip install` run.

When you ask an AI assistant to write code, it often invents a package name that sounds completely legitimate. It will tell you:
> *"Just run `npm install express-rate-limiter-redis-pro` and configure it like this..."*

The problem is that attackers actively harvest common LLM hallucinations, register those non-existent package names on public registries (npm, PyPI, pub.dev), and pack them with malicious scripts that steal cloud credentials, environment variables, and SSH keys.

Once an agent or developer blindly runs install commands, the payload executes immediately via install lifecycle hooks.

**Phantom Package Sentinel** stops this attack vector before any package manager touches your machine.

---

## Architecture Overview

```
phantom-package-sentinel/
├── SKILL.md                                 # Orchestrator & subagent protocol
├── README.md                                # Public documentation & threat model
├── schemas/
│   └── manifest-audit-schema.json           # Formal JSON Schema (draft-07) for dependency audits
├── references/
│   ├── ECOSYSTEM-ATTACK-VECTORS.md          # Lifecycle hooks (postinstall, setup.py, build.rs)
│   ├── TYPOSQUAT-TAXONOMY.md                # Hallucination tropes (-helper, -toolkit, -fast)
│   └── REPUTATION-HEURISTICS.md             # Age, download velocity & risk scoring formula
└── scripts/
    ├── audit-manifest.cjs                   # Fast CLI query tool for registry metadata
    ├── validate-dependencies.cjs            # Schema validator for dependency audit reports
    └── validate-dependencies.test.cjs       # Unit test suite for validation harness
```

---

## The 5-Phase Verification Protocol

```
[Phase 1: Manifest Diff Triage] ────> Identify newly introduced package names & versions
  │
[Phase 2: Registry Metadata Probe] ─> Fetch age, maintainer history, and download velocity
  │
[Phase 3: Hallucination Tropes] ────> Scan for LLM naming patterns (-helper, -toolkit, -fast)
  │
[Phase 4: Lifecycle Hook Audit] ────> Inspect for suspicious postinstall, curl, or obfuscation
  │
[Phase 5: The 15-Line YAGNI Challenge] > Replace trivial packages (<15 LOC) with in-house utils
```

---

## Quick Start & CLI Usage

### Audit a Package Name Directly:
```bash
# Query registry age, maintainers, and repository linkage
node scripts/audit-manifest.cjs <package-name>
```

### Validate a Dependency Audit Report:
```bash
node scripts/validate-dependencies.cjs path/to/dependency-audit.json
```

### Run the Validator Test Suite:
```bash
node scripts/validate-dependencies.test.cjs
```

---

## The 15-Line Rule
If an imported package solves a problem that can be written in under **15 lines of standard library code** (such as a basic debounce, UUID generator, array chunker, or date formatter), **reject the package** and write the helper in your local `utils/` directory. Fewer dependencies mean fewer zero-days.

## License
MIT License. Free to use across open-source and commercial repositories.
