---
name: phantom-package-sentinel
description: Zero-trust supply-chain audit skill to detect and block AI-hallucinated package names, typosquatting attacks, and malicious dependency payloads before running package manager install scripts.
---

# Phantom Package Sentinel

Block AI-hallucinated packages, poisoned typosquats, and rogue install hooks before an agent or developer blindly executes install commands.

## Operating Modes

- **Pre-Install Guard Mode (Default)**: Triggered before running any dependency addition command (`npm install <pkg>`, `pnpm add`, `flutter pub add`, `pip install`, `go get`). Fast-checks the specific package name against public registry metadata, validates account age, and scans for install scripts.
- **Full Manifest Audit Mode**: Triggered when reviewing full manifest diffs (`package.json`, `pubspec.yaml`, `requirements.txt`, `go.mod`, `Cargo.toml`). Scans all newly introduced dependencies across all ecosystems, computes composite risk scores, outputs `dependency-audit.json` conforming to `schemas/manifest-audit-schema.json`, and validates findings with `scripts/validate-dependencies.cjs`.

---

## Subagent Choreography & Terminology

- **Orchestrator (Parent)**: Coordinates manifest inspection, verifies lockfile integrity, and gates package installation approval.
- **`research` Subagent**: Queries registry endpoints (npm registry, pub.dev API, PyPI JSON API), verifies upstream GitHub repository linkage, checks contributor reputation, and confirms if standard library alternatives exist.
- **`general` Subagent**: Executes local manifest parsing, checks for suspicious `postinstall` commands in `package.json`, runs `scripts/validate-dependencies.cjs`, and executes unit tests.

---

## Universal Execution Safety

1. **Pre-Execution Gate**: Never run `npm install`, `yarn add`, `pip install`, or `flutter pub get` on unverified packages. Install lifecycle hooks (`preinstall`, `postinstall`, `setup.py`, `build.rs`) execute arbitrary binaries with the current user's privileges.
2. **Read-Only Manifest Inspection**: Manifest auditing is performed statically via text parsing and remote metadata inspection before filesystem modifications occur.
3. **No Execution of Untrusted Tarballs**: If a package is flagged as high-risk or phantom, do not download or unpack the archive locally.

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

### Phase 1: Manifest Diff Triage (subagent_type: `general`)
Inspect incoming changes in lockfiles and dependency manifests:
- `package.json` & `pnpm-lock.yaml`
- `pubspec.yaml` & `pubspec.lock`
- `requirements.txt` & `pyproject.toml`
- `go.mod` & `go.sum`
- `Cargo.toml` & `Cargo.lock`
Extract every package that is newly added (lines with `+` in git diff).

### Phase 2: Registry Metadata Probe (subagent_type: `research`)
Query the authoritative registry metadata API for each candidate:
- **npm**: `npm view <pkg> time.created maintainers repository.url dist-tags --json`
- **pub.dev**: `curl -s https://pub.dev/api/packages/<pkg>`
- **PyPI**: `curl -s https://pypi.org/pypi/<pkg>/json`
Evaluate against the risk thresholds in [references/REPUTATION-HEURISTICS.md](references/REPUTATION-HEURISTICS.md):
- Package age $< 30$ days $\implies$ **HIGH RISK** (Candidate squatting target).
- Weekly downloads $< 1,000$ $\implies$ **SUSPICIOUS**.
- Missing public Git repository URL $\implies$ **REJECT**.

### Phase 3: Hallucination Tropes & Typosquat Scan (subagent_type: `research`)
Cross-reference the package name against known hallucination patterns cataloged in [references/TYPOSQUAT-TAXONOMY.md](references/TYPOSQUAT-TAXONOMY.md):
- Generic suffix appending: `axios-helper`, `flutter-responsive-grid-toolkit`, `jwt-verify-fast`.
- Hyphen-to-underscore inversion across language ecosystems.
- Brand name mimicking with omitted vowels or swapped letters.

### Phase 4: Lifecycle Hook Audit (subagent_type: `general`)
Inspect package manifests for pre/post-install execution vectors as described in [references/ECOSYSTEM-ATTACK-VECTORS.md](references/ECOSYSTEM-ATTACK-VECTORS.md):
- `scripts.postinstall` or `scripts.preinstall` calling `curl`, `wget`, `bash`, `powershell`, or `node -e`.
- Presence of base64-encoded strings or obfuscated eval payloads.

### Phase 5: The 15-Line YAGNI Challenge (subagent_type: `research`)
Before accepting any third-party dependency, ask:
*Can this functionality be written cleanly in under 15 lines of standard library code?*
- Formatting timestamps $\implies$ use native `Intl` or stdlib datetime.
- Simple debounce/throttle $\implies$ use native timer / `setTimeout`.
- URL or path joining $\implies$ use built-in URL / path modules.
If yes, reject the package addition and implement the function locally in the project's utility module.

---

## Companion References
- [references/ECOSYSTEM-ATTACK-VECTORS.md](references/ECOSYSTEM-ATTACK-VECTORS.md): Registry execution hooks, payload delivery, and lockfile attacks.
- [references/TYPOSQUAT-TAXONOMY.md](references/TYPOSQUAT-TAXONOMY.md): Systematic catalog of AI hallucination patterns and squatting strategies.
- [references/REPUTATION-HEURISTICS.md](references/REPUTATION-HEURISTICS.md): Quantitative age, download, and publisher verification thresholds.
- [schemas/manifest-audit-schema.json](schemas/manifest-audit-schema.json): Machine-readable JSON schema for dependency audit artifacts.
