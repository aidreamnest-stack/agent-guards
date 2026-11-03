---
name: ai-fingerprint-scrubber
description: Code humanizer and audit skill to detect and eliminate unmistakable AI fingerprints—decorative emojis in comments, narrative conversational remarks, robotic docstrings, and noisy comment banners—enforcing clean, idiomatic, senior-level code.
---

# AI Fingerprint Scrubber

Strip unmistakable AI tells, emoji spam in comments, and conversational narrative fluff to produce clean, authentic, senior-developer code.

## The Problem: The AI Fingerprint in Source Code

When Large Language Models generate code, they leave behind obvious stylistic fingerprints that immediately reveal the code was written by a chatbot rather than a human engineer:

1. **Decorative Emoji Clutter**:
   ```javascript
   // ❌ AI Fingerprint:
   // 🚀 Step 1: Initialize database connection ✨
   // ⚠️ WARNING: Ensure token is valid before proceeding 🔒
   console.log("🎉 User authenticated successfully! 🚀");
   ```
   No seasoned staff engineer at Google, Stripe, or Linux puts rockets, sparkles, and padlocks inside production source code comments.
2. **Conversational & Narrative Commentary**:
   Comments that read like an over-enthusiastic tutorial narrator rather than technical documentation:
   `// Here we go ahead and iterate through each user in order to verify that...`
   `// Now, let's gracefully handle the scenario where the network might be down...`
3. **The Obvious Echo (Trivial Comments)**:
   Comments that merely restate the syntax:
   `// Set count to zero` right above `let count = 0;`
   `// Return the user list` right above `return users;`
4. **Robotic AI Vocabulary in Docstrings**:
   Stuffed with telltale LLM buzzwords: *delve*, *leverage*, *meticulously*, *seamlessly*, *multifaceted*, *crucial*.
5. **ASCII / Unicode Divider Banners**:
   Giant 80-column decorative divider lines between small functions:
   `// ========================================================`
   `// HELPER FUNCTIONS`
   `// ========================================================`

This skill scans diffs and source files to purge these tells, enforcing a terse, high-signal, human engineering standard.

---

## Operating Modes

- **Lint & Audit Mode (Default)**: Scans working trees, pull requests, or specified files. Reports all detected AI fingerprints (emojis, narrative phrasing, echo comments, buzzwords) and outputs line numbers with suggested human cleanups.
- **Scrub & Polish Mode**: Automatically purges decorative emojis, rewrites or deletes low-value narrative comments, strips decorative ASCII banners, and normalizes docstrings to concise technical English.

---

## The Core Philosophy: "Code for WHAT, Comments for WHY"

- **The Code**: Explains *what* is happening and *how*. If variable names and architecture are clean, the mechanics are self-evident.
- **The Comments**: Reserved strictly for *why*. They document non-obvious business rules, platform-specific bugs, hardware errata, or race condition workarounds. If a comment does not explain *why*, it usually should not exist.

---

## Subagent Choreography & Terminology

- **Orchestrator (Parent)**: Coordinates the file inspection, sets severity levels, and gates PR approvals based on comment cleanliness.
- **`research` Subagent**: Read-only codebase inspector. Scans code comments and docstrings against the linguistic patterns in [references/TELLTALE-FINGERPRINTS.md](references/TELLTALE-FINGERPRINTS.md).
- **`general` Subagent**: Runs `scripts/scrub-fingerprints.cjs`, performs AST or regex-based comment cleanups, and executes unit tests to verify zero behavioral changes.

---

## The 5-Phase Scrubbing Protocol

```
[Phase 1: Emoji & Glyph Detection] ───> Purge emojis from comments, strings & logs
  │
[Phase 2: Narrative Voice Purge] ─────> Remove "Here we...", "Let's...", "In order to..."
  │
[Phase 3: The Obvious Echo Check] ────> Delete comments that merely repeat the code syntax
  │
[Phase 4: LLM Vocabulary Cleanse] ────> Replace corporate AI buzzwords in docstrings
  │
[Phase 5: Idiomatic Senior Polish] ───> Ensure concise, clean, high-signal code rhythm
```

### Phase 1: Decorative Emoji Detection (subagent_type: `general`)
Scan all single-line (`//`, `#`) and multi-line (`/* */`, `"""`) comments for Unicode emoji ranges ($U+1F300$ to $U+1F9FF$, $U+2600$ to $U+26FF$, etc.):
- ❌ Strip `🚀`, `✨`, `🔥`, `⚡`, `🎉`, `⚠️`, `🔒`, `💡`, `📌`, `🛑`.
- *Exception*: Emojis intended as actual user-facing UI copy (e.g. `Text('🎉 Success!')`) are allowed. Emojis in developer-facing code comments, debug logs, or internal docstrings are strictly prohibited.

### Phase 2: Narrative & Conversational Voice Purge (subagent_type: `research`)
Search for conversational filler phrases cataloged in [references/TELLTALE-FINGERPRINTS.md](references/TELLTALE-FINGERPRINTS.md):
- `Here we...`
- `Let's go ahead and...`
- `Now we need to...`
- `Notice how we...`
- `This is important because...` (when stating common sense)
- `Please note that...`

*Remediation*: Rewrite into direct, technical statements or delete entirely.
*Bad*: `// Let's go ahead and filter out any inactive users so we don't send emails to them`
*Good*: `// Exclude deactivated accounts to satisfy CAN-SPAM compliance`

### Phase 3: Obvious Echo Pruning (subagent_type: `research`)
Identify comments where token similarity with the immediate next line exceeds 80%:
```typescript
// ❌ Redundant echo:
// Check if user is authenticated
if (user.isAuthenticated) { ... }

// ❌ Redundant echo:
// Close the database connection
await db.close();
```
*Action*: Delete the comment completely. The code is already self-explanatory.

### Phase 4: LLM Vocabulary Cleanse (subagent_type: `research`)
Search docstrings and API docs for AI-typical prose markers:
- Replace `delve into` $\implies$ `inspect`, `analyze`
- Replace `leverage` $\implies$ `use`, `call`
- Replace `meticulously` $\implies$ remove word
- Replace `multifaceted` $\implies$ remove word
- Replace `testament to` $\implies$ remove word

### Phase 5: Idiomatic Senior Polish (subagent_type: `general`)
Ensure code formatting aligns with staff-level engineering conventions detailed in [references/NATURAL-CODE-PATTERNS.md](references/NATURAL-CODE-PATTERNS.md):
- Remove excessive decorative ASCII horizontal bars (`// -----------------------`).
- Keep function signatures compact and readable.
- Prefer early returns over 5 levels of nested `if` statements.

---

## Companion References
- [references/TELLTALE-FINGERPRINTS.md](references/TELLTALE-FINGERPRINTS.md): Catalog of regexes, conversational tropes, and emoji ranges.
- [references/COMMENTING-PHILOSOPHY.md](references/COMMENTING-PHILOSOPHY.md): Senior engineering guide to writing high-signal comments.
- [references/NATURAL-CODE-PATTERNS.md](references/NATURAL-CODE-PATTERNS.md): Idiomatic, compact coding patterns vs robotic AI scaffolding.
- [schemas/fingerprint-audit-schema.json](schemas/fingerprint-audit-schema.json): Machine-readable schema for fingerprint audit reports.
