---
name: ai-slop-guard
description: Differential audit skill to catch AI-generated code slop, silent invariant deletion, platform-isolation leaks, and bloated boilerplate before merging agent PRs. Use whenever reviewing or validating agent-generated code, git diffs, or automated refactoring.
---

# AI Slop & Regression Guard

Catch the silent bugs, ghost deletions, and bloated abstractions that AI coding tools introduce when humans stop reading diffs closely.

## Operating Modes

This skill operates in two distinct modes depending on the task:

- **Quick Review Mode (Default)**: Use for single pull requests, working tree diffs, or focused commit ranges. Performs differential static scanning on added/removed lines, checks invariant deletions, and outputs a concise findings table with inline remediation.
- **Full Architecture Audit Mode**: Use when explicitly asked for a comprehensive codebase audit of AI-written modules, legacy refactors, or mass migration branches. Runs all 5 phases, verifies AST-level duplication across the repository, generates a validated `slop-findings.json` artifact conforming to `schemas/slop-audit-schema.json`, and validates findings with `scripts/validate-findings.cjs`.

---

## Subagent Choreography & Terminology

When executing in multi-agent environments (e.g. Antigravity, Claude Code, Cursor background agents):
- **Orchestrator (Parent)**: Owns the execution workflow, coordinates phases, and holds write permissions for retained artifacts (`slop-findings.json`, `audit-report.md`).
- **`research` Subagent**: Read-only exploratory agent. Searches the existing codebase for pre-existing utility functions, historical commit intent, and standard library matches before any new code is approved.
- **`general` Subagent**: Runs bounded local validation inside the sandbox, executes git diff extractions, runs test suites, and executes `scan-diff.cjs`.

---

## Universal Execution Safety

1. **Read-Only Target Repository**: The audit process never mutates source code during the inspection phase.
2. **Deterministic Evaluation**: Every flagged invariant deletion must cite the exact file path, commit/diff line number, and the specific security or platform boundary broken. Speculative complaints ("this code looks ugly") are prohibited.
3. **Sandbox Isolation**: Validator scripts run without network access, using local Node.js runtimes.

---

## The 5-Phase Phased Execution Workflow

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

### Phase 1: Diff & Scope Extraction (subagent_type: `general`)
Extract the raw git diff against the target base branch (`main`, `master`, or `dev`):
```bash
git diff origin/main...HEAD --stat
git diff origin/main...HEAD
```
Calculate the **Differential Churn Ratio**:
$$\text{Churn Ratio} = \frac{\text{Lines Added} + \text{Lines Deleted}}{\text{Net Logic Change}}$$
*Rule*: If a bug fix has a churn ratio greater than 3.0 (adding 60 lines to fix a 2-line logic error), halt and evaluate for over-engineering. Refer to [references/DIFFERENTIAL-METRICS.md](references/DIFFERENTIAL-METRICS.md).

### Phase 2: Invariant Deletion Audit (subagent_type: `general`)
Inspect all lines starting with `-` (deleted lines) in the patch. Cross-reference against the critical categories in [references/INVARIANT-PRESERVATION.md](references/INVARIANT-PRESERVATION.md):
- **Platform isolation guards**: `Platform.isIOS`, `Platform.isAndroid`, `process.platform`, `defaultTargetPlatform`, `#ifdef`.
- **Security & Authorization boundaries**: Role checks (`isAdmin`), authentication gates, token expiry checks, CSRF protection, origin validation.
- **Concurrency & Lifecycle locks**: Mutex locks, cancellation tokens, mounted checks (`if (!mounted) return`), stream subscriptions disposal.
- **Monetization & Entitlement checks**: Lifetime access bypasses, ad frequency caps, receipt verification calls.

*Action*: Any stripped invariant without an explicit prompt mandate is an immediate **BLOCKER**.

### Phase 3: Wheel Re-invention Scan (subagent_type: `research`)
For every newly created function, utility class, or extension method:
1. Search the existing workspace for matching functionality:
   ```bash
   git grep -i "<function_purpose_keyword>" -- "*.ts" "*.dart" "*.go" "*.py"
   ```
2. Check the language standard library. (Does Dart `intl`, Go `strings`, Python `datetime`, or Node `node:crypto` already solve this natively?)
3. If an equivalent helper exists within 3 folder hops or in the standard library, instruct the agent to delete the new implementation and import the existing one.

### Phase 4: Slop & Anti-Pattern Check (subagent_type: `general`)
Audit all newly added lines (`+`) against the anti-patterns cataloged in [references/ANTI-PATTERNS-AND-SLOP.md](references/ANTI-PATTERNS-AND-SLOP.md):
- **Swallowed Exceptions**: Empty `catch (e) {}`, logging without rethrow in critical paths, or replacing typed errors with generic strings.
- **Speculative Abstractions**: Interfaces with only one implementation, factories with one product, generic wrapper types that add zero behavior.
- **Redundant Defensive Checks**: Checking `x != null` on non-nullable types, redundant deep clones on immutable data structures.
- **Test Loosening**: Changing test assertions from specific expected values to `anything()`, `isNotNull`, or deleting failing assertions entirely.

### Phase 5: Deterministic Validation (subagent_type: `general`)
In Full Audit Mode, write all findings into `slop-findings.json` matching `schemas/slop-audit-schema.json`.
Run the local validator:
```bash
node scripts/validate-findings.cjs slop-findings.json
```
Ensure all project unit tests pass without modifying the test suite's existing assertions.

---

## Companion References
- [references/INVARIANT-PRESERVATION.md](references/INVARIANT-PRESERVATION.md): Invariant classification rules and platform guard protection.
- [references/ANTI-PATTERNS-AND-SLOP.md](references/ANTI-PATTERNS-AND-SLOP.md): Comprehensive taxonomy of LLM code slop with before/after diffs.
- [references/DIFFERENTIAL-METRICS.md](references/DIFFERENTIAL-METRICS.md): Churn formulas, file spread heuristics, and complexity thresholds.
- [schemas/slop-audit-schema.json](schemas/slop-audit-schema.json): Machine-readable JSON schema for audit reports.
