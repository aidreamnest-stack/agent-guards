# AI Slop Guard

> An enterprise-grade differential audit guard and automated review harness to catch silent invariant deletions, re-invented wheels, and architectural bloat in AI-generated code before it hits production.

Coding assistants like Cursor, Copilot, Claude Code, and Antigravity can write code at blistering speed. But they also have a habit of making changes that look completely fine during a quick scan while silently breaking things under the hood.

They delete platform guards because they look "messy." They write a 40-line custom string parser instead of using the standard library. They wrap every async call in an empty `try/catch` and swallow errors that will page you at 3 AM.

**AI Slop Guard** provides an automated inspection harness and differential audit protocol to stop those regressions before they merge.

---

## Architecture Overview

Built on modular playbooks, formal machine-readable contracts, and deterministic test harnesses:

```
ai-slop-guard/
├── SKILL.md                                 # Orchestrator & subagent choreography
├── README.md                                # Public documentation & developer manifesto
├── schemas/
│   └── slop-audit-schema.json               # Formal JSON Schema (draft-07) for findings
├── references/
│   ├── INVARIANT-PRESERVATION.md            # Platform isolation, concurrency & auth checks
│   ├── ANTI-PATTERNS-AND-SLOP.md            # Complete catalog of LLM slop patterns
│   └── DIFFERENTIAL-METRICS.md              # Churn ratio, file spread & complexity formulas
└── scripts/
    ├── scan-diff.cjs                        # Fast zero-dependency git diff scanner
    ├── validate-findings.cjs                # Schema validator for audit reports
    └── validate-findings.test.cjs           # Unit test suite for validation harness
```

---

## Operating Modes

1. **Quick Review Mode (Default)**: Runs on single pull requests or local working trees. Audits deleted lines against platform invariants, flags empty catch blocks, and scores the diff churn ratio.
2. **Full Architecture Audit Mode**: Coordinates `research` and `general` subagents to perform AST-level duplication analysis across the entire codebase, generating a validated `slop-findings.json` artifact conforming to `schemas/slop-audit-schema.json`.

---

## The 5-Phase Inspection Workflow

```
[Phase 1: Diff & Scope Extraction] ──> Quantify churn ratio & touched surfaces
  │
[Phase 2: Invariant Deletion Audit] ─> Scan removed lines for platform/auth/state guards
  │
[Phase 3: Wheel Re-invention Scan] ──> Cross-reference added helpers against existing codebase
  │
[Phase 4: Slop & Anti-Pattern Check] > Detect swallowed errors, fake factories, speculative types
  │
[Phase 5: Deterministic Validation] ─> Validate findings against schema & run local test suite
```

---

## Quick Start & CLI Usage

### Scan Your Current Git Branch for Invariant Deletions:
```bash
# Compare incoming changes against main branch
node scripts/scan-diff.cjs main
```

### Validate a Slop Audit Report:
```bash
node scripts/validate-findings.cjs path/to/slop-findings.json
```

### Run the Validator Test Suite:
```bash
node scripts/validate-findings.test.cjs
```

---

## How to Install in Coding Assistants

### In Antigravity / Cursor / Claude Code
Copy this entire directory into your project's `.agents/skills/` folder:
```bash
mkdir -p .agents/skills
cp -r ai-slop-and-regression-guard .agents/skills/
```
Your agent will automatically discover the skill and enforce invariant preservation across all pull requests and refactoring tasks.

---

## The Golden Rule of AI PR Reviews
> *If a bug fix or feature diff is more than 3x larger than the actual logic change, you are looking at AI slop. Strip it down to the shortest working change.*

## License
MIT License. Free to use across open-source and commercial repositories.
