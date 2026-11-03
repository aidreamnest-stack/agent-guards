# The Senior Engineer's Commenting Philosophy

> "Good code is its own best documentation. As you're about to add a comment, ask yourself, 'How can I improve the code so that this comment isn't needed?'" — Steve McConnell

---

## 1. Code Explains WHAT, Comments Explain WHY

The biggest difference between real senior engineers and AI models lies in comment intent:

```
┌────────────────────────────────────────────────────────┐
│                        THE CODE                        │
│ Tells the compiler and developer:                      │
│ - WHAT is happening step-by-step                       │
│ - HOW variables, loops, and data structures interact   │
└────────────────────────────────────────────────────────┘
                            ▲
                            │
┌────────────────────────────────────────────────────────┐
│                      THE COMMENT                       │
│ Tells the future maintainer:                           │
│ - WHY this specific approach was chosen                │
│ - WHAT external constraint forced an awkward design    │
│ - WHAT edge case will explode if this line is changed  │
└────────────────────────────────────────────────────────┘
```

---

## 2. The 5 Valid Reasons to Write a Comment

If a comment does not fall into one of these five categories, delete it:

### Reason 1: Non-Obvious Business Invariants
Constraints imposed by laws, partners, or payment gateways that cannot be inferred from pure logic:
```dart
// Apple App Store guideline 3.1.1 requires restoring purchases 
// without requiring the user to create a third-party account.
if (user.isGuest) {
  await restoreStoreKitPurchases();
}
```

### Reason 2: Platform, Browser, or OS Errata
Documenting workarounds for upstream bugs in external libraries, runtimes, or hardware:
```javascript
// Workaround for Safari 16 WebKit bug where IndexedDB connections 
// silently hang during iOS background tab suspension.
await timeout(openDatabase(), 3000);
```

### Reason 3: Algorithmic Performance Tradeoffs
Explaining why an unusual data structure was selected over a standard one:
```go
// Using flat uint32 slice instead of map[uint32]struct{} to avoid 
// GC pointer-chasing overhead during high-frequency telemetry ingest.
```

### Reason 4: Concurrency & Lock Ownership
Documenting thread-safety rules:
```go
// Caller must hold stateLock before invoking drainQueueUnsafe.
```

### Reason 5: Warnings Against "Obvious" Refactorings
Preventing future developers from re-introducing a bug they think is a cleanup:
```typescript
// DO NOT use Array.prototype.sort() here: V8's Timsort is not 
// guaranteed stable across legacy node versions for identical keys.
```

---

## 3. The 3-Second Test for AI Comments

Look at any comment and ask:
1. *Could a junior developer who knows the language syntax understand the code without this comment?*
   - If **Yes** $\implies$ **Delete the comment.**
2. *Does this comment explain a hidden pitfall or business context?*
   - If **Yes** $\implies$ **Keep it, but make it as terse as possible.**
