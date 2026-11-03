# AI Fingerprint Scrubber

> An enterprise-grade agent guard and automated linter to detect and eliminate unmistakable AI fingerprints—decorative emoji clutter in comments, narrative tutorial phrasing, obvious syntactic echo comments, and robotic docstrings—enforcing clean, idiomatic, staff-level code.

Nothing gives away AI-generated code faster than decorative emojis in source comments and narrative, tutorial-style prose:

```javascript
// ❌ AI FINGERPRINT:
// 🚀 Step 1: Initialize the user authentication context ✨
// Let's go ahead and verify that the user's token is valid 🔒
const isValid = await auth.verifyToken(token);
// Check if valid and return true
if (isValid) {
  return true;
}
```

No staff engineer at Google, Stripe, or Cloudflare writes code like this. It reads like an over-excited YouTube tutorial, clutters git diffs, and pollutes code reviews with noise.

**AI Fingerprint Scrubber** audits your source code, detects these tells, and strips them down to clean, terse, senior-developer code:

```javascript
// ✅ CLEAN SENIOR STANDARD:
// Require non-expired OAuth token before socket reconnection
return await auth.verifyToken(token);
```

---

## Architecture Overview

```
ai-fingerprint-scrubber/
├── SKILL.md                                 # Orchestrator & subagent protocol
├── README.md                                # Public documentation & developer manifesto
├── schemas/
│   └── fingerprint-audit-schema.json        # Formal JSON Schema (draft-07) for audit reports
├── references/
│   ├── TELLTALE-FINGERPRINTS.md             # Complete taxonomy of AI tells, emojis & tropes
│   ├── COMMENTING-PHILOSOPHY.md             # "Code for WHAT, Comments for WHY" staff guide
│   └── NATURAL-CODE-PATTERNS.md             # Guard clauses, compact naming & clean rhythm
└── scripts/
    ├── scrub-fingerprints.cjs               # Fast zero-dependency scanner for source comments
    ├── validate-scrubber.cjs                # Schema validator for audit reports
    └── validate-scrubber.test.cjs           # Unit test suite for validation harness
```

---

## The 4 Biggest AI Code Tells It Eliminates

### 1. Decorative Emojis in Comments & Internal Logs
AI loves sprinkling `🚀`, `✨`, `🔥`, `⚡`, `🎉`, `⚠️`, and `🔒` into developer-facing comments and debug logs.
*The Rule*: Emojis belong in user-facing UI copy (when appropriate), never in source code comments or internal debug strings.

### 2. Conversational Narrative Comments
Comments starting with *"Let's go ahead and..."*, *"Here we iterate through..."*, or *"Now we need to ensure that..."*. Code is not a podcast. State the architectural constraint directly or delete the comment.

### 3. The Obvious Syntactic Echo
Comments that merely repeat the code syntax (`// Increment count by 1` right above `count++`). If a junior developer can understand the line without the comment, the comment is dead weight.

### 4. Robotic LLM Vocabulary in Docstrings
Purging inflated, academic AI buzzwords (*"meticulously validates"*, *"delves into"*, *"seamlessly leverages"*, *"multifaceted architecture"*) and replacing them with plain, precise technical English.

---

## The Staff Engineer's Rule: "Code for WHAT, Comments for WHY"

- **The Code**: Explains *what* is happening and *how*. Clean variable names and idiomatic patterns make the mechanics self-evident.
- **The Comments**: Reserved exclusively for *why*. They document external constraints, business rules, hardware quirks, upstream library bugs, or concurrency invariants.

---

## Quick Start & CLI Usage

### Scan Your Codebase for AI Fingerprints:
```bash
# Scan working directory for emoji comments and narrative fluff
node scripts/scrub-fingerprints.cjs [path/to/src]
```

### Validate a Fingerprint Audit Report:
```bash
node scripts/validate-scrubber.cjs path/to/fingerprint-audit.json
```

### Run the Validator Test Suite:
```bash
node scripts/validate-scrubber.test.cjs
```

---

## How to Install in Coding Assistants

Copy this directory into your project's `.agents/skills/` folder:
```bash
mkdir -p .agents/skills
cp -r ai-fingerprint-scrubber .agents/skills/
```

Whenever you ask your coding assistant to write or refactor code, instruct it:
> *"Follow ai-fingerprint-scrubber: no decorative emojis, no narrative commentary, only explain why."*

---

## Supported Languages
- JavaScript / TypeScript (`.js`, `.jsx`, `.ts`, `.tsx`)
- Dart / Flutter (`.dart`)
- Python (`.py`)
- Go (`.go`)
- Rust (`.rs`)
- Kotlin & Java (`.kt`, `.java`)

## License
MIT License. Free to use across open-source and commercial repositories.
