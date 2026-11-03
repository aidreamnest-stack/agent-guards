# Invariant Preservation Reference

An invariant is a condition, rule, or boundary that must remain true across every code modification, regardless of how a feature is implemented or refactored.

When AI coding assistants make changes, they lack the historical context of why an awkward-looking check was added three months ago during an outage. They tend to clean up "redundant" code, accidentally deleting mission-critical invariants.

---

## 1. Platform Isolation Invariants

In cross-platform codebases (Flutter, React Native, Electron, multi-platform Node/Go), platform checks are frequently targeted by LLMs seeking to "unify" code.

### The Attack Vector:
An agent replaces platform branches with a single unified call, breaking platform-specific behaviors.

### Examples to Defend:
```dart
// CRITICAL INVARIANT: iOS keychain has different entitlement sync than Android Keystore
if (Platform.isIOS) {
  await _syncKeychainEntitlements();
} else if (Platform.isAndroid) {
  await _syncKeystoreTokens();
}
```
If an agent turns this into:
```dart
// BUG INTRODUCED BY AGENT:
await _syncUnifiedTokens(); // Fails on iOS simulator or lacks keychain accessibility flags
```

### Audit Rule:
Any deletion of `Platform.is*`, `defaultTargetPlatform`, `process.platform`, `#if os(...)`, or architecture guards (`sys.platform`, runtime arch) must be flagged with `SEVERITY: BLOCKER`.

---

## 2. Concurrency & UI Lifecycle Invariants

Asynchronous code in mobile and frontend frameworks requires strict lifecycle gating.

### Common AI Deletion Patterns:
1. **Mounted Checks in Flutter / React**:
   ```dart
   final data = await fetchProfile();
   // Agent deletes this line:
   if (!mounted) return;
   setState(() => _profile = data);
   ```
   *Result*: `setState() called after dispose()` runtime crash in production.
2. **Mutex & Semaphore Locks**:
   ```go
   mu.Lock()
   defer mu.Unlock()
   // Agent refactors function into a goroutine without propagating lock ownership
   ```
   *Result*: Data races, memory corruption, and intermittent deadlocks.
3. **Cancellation Tokens**:
   Dropping `CancellationToken` or `AbortSignal` parameters when forwarding HTTP requests, causing dangling background requests that waste bandwidth and battery.

---

## 3. Security & Access Control Boundaries

AI models frequently bypass security checks when attempting to make tests pass or reduce boilerplate.

### Patterns to Watch For:
- **Authorization Gating**: Stripping `@UseGuards(AuthGuard)` or middleware decorators from API routes.
- **CSRF & Origin Verification**: Removing `SameSite` cookie flags or CORS origin allowlists.
- **Input Sanitization**: Removing path normalization (`filepath.Clean()`, `path.resolve()`) before file system operations.
- **Credential Masking**: Deleting regex scrubbers that prevent passwords or tokens from leaking into application logs.

---

## 4. Monetization & Paywall Invariants

In apps with paid subscriptions, ad-free passes, or usage quotas, agents often break bypass logic.

### Rules:
- If a user has `hasLifetimeAccess == true` or `isSubscriber == true`, ad display code must never be invoked.
- Reward claiming logic must never be called on initialization or ad load events.
- Entitlement status must never be read from unencrypted key-value stores.

---

## Invariant Review Checklist (For Reviewers)

| Category | Invariant Check | Action If Violated |
| :--- | :--- | :--- |
| **Platform** | Are platform guards (`Platform.is*`, `#ifdef`) preserved exactly? | Reject diff. Restore platform branch. |
| **Lifecycle** | Are `mounted`, `isDisposed`, and `AbortSignal` checks intact? | Reject diff. Require lifecycle guard. |
| **Locks** | Are mutexes, semaphores, and transaction boundaries maintained? | Reject diff. Require thread-safety proof. |
| **Security** | Were any auth checks or input sanitizers bypassed? | Hard fail. Escalate security issue. |
