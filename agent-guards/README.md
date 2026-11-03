# Agent Guards

> Production-grade invariant guards, anti-slop filters, and supply-chain sentinels for autonomous coding agents (Antigravity, Cursor, Claude Code, GitHub Copilot Workspace, Codex).

Engineered to the same architectural standards as enterprise security frameworks (modular domain playbooks, machine-readable JSON schemas, and deterministic Node.js test harnesses), these guards address the real-world operational problems that arise when AI agents write production code.

---

## Architecture of Each Guard

Every guard in this repository follows an enterprise-grade modular architecture:

```
guard-name/
├── SKILL.md                 # Orchestrator with operating modes, subagents & phased workflow
├── README.md                # Human developer documentation & threat modeling
├── schemas/                 # Formal JSON Schema (draft-07) for machine-verifiable audit outputs
│   └── *-schema.json
├── references/              # Modular domain-specific reference playbooks
│   ├── TOPIC-A.md
│   └── TOPIC-B.md
└── scripts/                 # Deterministic validation harnesses & automated test suites
    ├── validate-*.cjs
    └── validate-*.test.cjs
```

---

## The 5 Guards in This Repository

### 1. [`ai-slop-guard`](./ai-slop-guard/)
**Focus**: Code quality, invariant preservation, and anti-slop review.
- **Problem**: AI coding tools delete subtle platform guards (`Platform.isIOS`), strip concurrency mutexes, and write 40-line procedural rewrites of 1-line standard library functions.
- **Includes**:
  - `INVARIANT-PRESERVATION.md`: Rules for platform checks, UI lifecycles, and auth boundaries.
  - `ANTI-PATTERNS-AND-SLOP.md`: Catalog of swallowed errors, fake factories, and test mutations.
  - `DIFFERENTIAL-METRICS.md`: Mathematical churn formulas and file spread heuristics.
  - `slop-audit-schema.json`: Formal JSON Schema for audit reports.
  - `scan-diff.cjs` & `validate-findings.cjs`: Automated diff scanner and schema validator with test suite.

### 2. [`ai-fingerprint-scrubber`](./ai-fingerprint-scrubber/)
**Focus**: Clean code humanization, decorative emoji elimination, and narrative comment pruning.
- **Problem**: AI assistants leave unmistakable fingerprints in code: tacky decorative emojis in comments (`// 🚀 Step 1 ✨`), narrative podcast-style comments (`// Let's go ahead and...`), and obvious syntactic echoes.
- **Includes**:
  - `TELLTALE-FINGERPRINTS.md`: Catalog of regexes, conversational tropes, and emoji clutter.
  - `COMMENTING-PHILOSOPHY.md`: "Code explains WHAT, comments explain WHY" staff-level guide.
  - `NATURAL-CODE-PATTERNS.md`: Guard clauses, compact variable naming, and idiomatic rhythm.
  - `fingerprint-audit-schema.json`: Formal JSON Schema for fingerprint audits.
  - `scrub-fingerprints.cjs` & `validate-scrubber.cjs`: Comment scanner and validator with test suite.

### 3. [`phantom-package-sentinel`](./phantom-package-sentinel/)
**Focus**: Supply-chain security and hallucination squatting defense.
- **Problem**: Attackers monitor LLM hallucinations, register non-existent package names on npm, PyPI, and pub.dev, and wait for agents or developers to blindly install them.
- **Includes**:
  - `ECOSYSTEM-ATTACK-VECTORS.md`: Detailed breakdown of `postinstall`, `setup.py`, and `build.rs` execution hooks.
  - `TYPOSQUAT-TAXONOMY.md`: Hallucination naming tropes (`-helper`, `-toolkit`, `-fast`).
  - `REPUTATION-HEURISTICS.md`: Formula for Package Risk Score (PRS) based on age, velocity, and repo proof.
  - `manifest-audit-schema.json`: Formal JSON Schema for dependency audits.
  - `audit-manifest.cjs` & `validate-dependencies.cjs`: Metadata query tool and validator with test suite.

### 4. [`orphan-dependency-guard`](./orphan-dependency-guard/)
**Focus**: Manifest maintenance, deadweight dependency pruning, and bundle bloat reduction.
- **Problem**: AI assistants install dependencies for quick experiments, later refactor the code to use native alternatives, but leave deadweight packages abandoned in `package.json` or `pubspec.yaml`.
- **Includes**:
  - `ECOSYSTEM-IMPORT-PATTERNS.md`: Search syntax for imports/requires across JS/TS, Dart, and Python.
  - `FALSE-POSITIVE-DEFENSE.md`: Whitelist rules for CLI tools in scripts, TypeScript ambient types, and bundler plugins.
  - `BUNDLE-IMPACT-METRICS.md`: Formulas for quantifying bundle bloat, `node_modules` weight, and attack surfaces.
  - `orphan-audit-schema.json`: Formal JSON Schema for orphan dependency audits.
  - `scan-orphans.cjs` & `validate-orphans.cjs`: Fast codebase scanner and report validator with test suite.

### 5. [`mobile-revenue-guard`](./mobile-revenue-guard/)
**Focus**: In-App Purchases, billing integrity, and ad monetization.
- **Problem**: AI assistants fail to acknowledge Google Play purchases within 72 hours (triggering automatic refunds), store entitlements in plaintext `SharedPreferences`, and introduce rewarded ad coin glitches.
- **Includes**:
  - `GOOGLE-PLAY-BILLING.md`: 72-hour acknowledge deadline, RTDN webhooks, and voided purchases API.
  - `APPLE-STOREKIT2.md`: JWS cryptographic signature verification and StoreKit 2 transaction lifecycles.
  - `ADMOB-REWARDED-SSV.md`: Server-Side Verification ECDSA signatures and double-claim defenses.
  - `STORAGE-AND-OFFLINE-TAMPERING.md`: Hardware Keystore/Keychain encryption and graceful offline caching.
  - `billing-audit-schema.json`: Formal JSON Schema for monetization audits.
  - `validate-billing.cjs`: Validator script with comprehensive unit tests.

---

## How to Install

Copy any individual guard directory directly into your project's `.agents/skills/` folder:
```bash
mkdir -p .agents/skills
cp -r ai-fingerprint-scrubber .agents/skills/
```

Your AI assistant will automatically discover the guard and enforce its invariants.

---

## License
MIT License. Created for the software engineering and open-source community.
