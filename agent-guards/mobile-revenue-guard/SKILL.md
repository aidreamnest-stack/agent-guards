---
name: mobile-revenue-guard
description: Mobile monetization and billing audit skill to prevent lost revenue, unacknowledged Google Play purchases, insecure client-side entitlement storage, and rewarded ad callback exploits. Use whenever modifying in-app purchases, billing services, or ad rewards in mobile codebases.
---

# Mobile Revenue & IAP Guard

Protect app revenue and eliminate silent billing leaks when modifying mobile purchase and advertising flows.

## Operating Modes

- **PR Review Mode (Default)**: Audits individual commits or pull requests touching billing packages (`in_app_purchase`, `purchases_flutter`, StoreKit, Play Billing, AdMob, AppLovin). Checks purchase acknowledge calls, entitlement storage mechanisms, and rewarded ad event handlers.
- **Full Monetization Release Audit Mode**: Comprehensive pre-release audit for production app submissions. Verifies server-side receipt validation, Google Play Real-Time Developer Notifications (RTDN), StoreKit 2 JWS cryptographic signatures, and offline entitlement resilience. Generates a validated `billing-audit.json` conforming to `schemas/billing-audit-schema.json` and runs `scripts/validate-billing.cjs`.

---

## Subagent Choreography & Terminology

- **Orchestrator (Parent)**: Coordinates the billing audit, inspects transaction state machines, and enforces monetization invariants.
- **`research` Subagent**: Read-only codebase explorer. Traces payment token flow from client store listener to backend database, checks whether Google Play and Apple endpoints are called, and verifies keychain/keystore encryption keys.
- **`general` Subagent**: Runs local static analysis on billing handlers, checks for plaintext `SharedPreferences`/`NSUserDefaults` access, executes `scripts/validate-billing.cjs`, and runs payment test suites.

---

## Universal Execution Safety

1. **Zero Real Money Testing in Automation**: Never execute real production credit card or live store transactions in automated test environments. Use sandbox test accounts and mock receipts.
2. **Never Weaken Store Verification in Code**: Do not accept client-side boolean flags (`isPurchased = true`) without verifying store receipt tokens or cryptographic server signatures.
3. **Preserve User Data & Offline Access**: Entitlement revocation logic must strictly distinguish between confirmed server-side store cancellations and transient offline network timeouts.

---

## The 6 Critical Mobile Revenue Invariants

Verify all 6 invariants across every billing or ad modification:

```
[Invariant 1: Google Play 72h Acknowledge] ──> Eliminate auto-refund leaks
  │
[Invariant 2: Anti-Tamper Entitlement Storage] > Hardware Keystore / Keychain only
  │
[Invariant 3: StoreKit 2 JWS Verification] ────> Cryptographic signature check on Apple receipts
  │
[Invariant 4: Rewarded Ad Exploit Defense] ────> Server-Side Verification (SSV) + debounce
  │
[Invariant 5: Graceful Offline Resilience] ────> Network timeouts must not wipe paying users
  │
[Invariant 6: Lifetime Pass Ad-Free Bypass] ───> 100% suppression of all ad formats
```

---

## The 5-Phase Audit Protocol

### Phase 1: Purchase Listener & State Machine Audit (subagent_type: `research`)
Inspect the payment stream listener (e.g. `purchaseStream` in Flutter, `BillingClient.PurchasesUpdatedListener` in Android, `Transaction.updates` in StoreKit 2).
- Trace every code path reaching `PurchaseStatus.purchased` / `PurchaseState.PURCHASED`.
- **Google Play Requirement**: Verify that `completePurchase()` (Flutter), `acknowledgePurchase()` (Android), or backend `purchases.products.acknowledge` is unconditionally invoked. Refer to [references/GOOGLE-PLAY-BILLING.md](references/GOOGLE-PLAY-BILLING.md).
- *Failure condition*: If a purchase is delivered to the user without acknowledging, Google Play will refund the charge after **72 hours**. Flag as **BLOCKER**.

### Phase 2: Local Entitlement Storage Inspection (subagent_type: `general`)
Search the codebase for how purchase entitlements (`isPro`, `hasLifetime`, `tier`) are persisted locally:
- Grep for unencrypted storage calls:
  - Android: `SharedPreferences`, `PreferenceManager`, plain SQLite.
  - iOS: `UserDefaults.standard`.
  - Flutter: `shared_preferences`, plain `hive`, plain `sqflite`.
- Ensure entitlements are stored inside platform hardware keystores (`flutter_secure_storage`, Android Keystore, iOS Keychain) or validated via backend-signed JWTs. Refer to [references/STORAGE-AND-OFFLINE-TAMPERING.md](references/STORAGE-AND-OFFLINE-TAMPERING.md).

### Phase 3: iOS StoreKit 2 Cryptographic Audit (subagent_type: `research`)
Inspect iOS transaction handling:
- Verify that `VerificationResult<Transaction>` checks `.verified` case and does not call `.unsafePayloadValue` in production builds.
- Verify `await transaction.finish()` is called after entitlement delivery. Refer to [references/APPLE-STOREKIT2.md](references/APPLE-STOREKIT2.md).

### Phase 4: Rewarded Ad Callback & SSV Audit (subagent_type: `general`)
Inspect rewarded ad implementations (`RewardedAd`, `RewardedInterstitialAd`):
- Ensure reward delivery logic is strictly inside `onUserEarnedReward` and never in `onAdLoaded` or `onAdOpened`.
- For valuable currencies, verify Server-Side Verification (SSV) is enabled with cryptographic callback verification. Refer to [references/ADMOB-REWARDED-SSV.md](references/ADMOB-REWARDED-SSV.md).
- Verify UI button debounce to prevent multi-tap race conditions.

### Phase 5: Offline Resilience & Restore Logic (subagent_type: `research`)
Inspect "Restore Purchases" and app startup entitlement checks:
- Verify that network errors (`SocketException`, timeout, 5xx responses) catch blocks **preserve** the previously cached local entitlement.
- Entitlements may only be downgraded on explicit store revocation signals (e.g. `PurchaseState.CANCELLED`, StoreKit revocation date, or backend 403 `purchase_revoked`).

---

## Companion References
- [references/GOOGLE-PLAY-BILLING.md](references/GOOGLE-PLAY-BILLING.md): Acknowledge deadlines, RTDN webhooks, and voided purchase reconciliation.
- [references/APPLE-STOREKIT2.md](references/APPLE-STOREKIT2.md): JWS signature verification, App Store Server API V2, and transaction lifecycle.
- [references/ADMOB-REWARDED-SSV.md](references/ADMOB-REWARDED-SSV.md): HMAC SHA-256 callback validation, custom nonces, and fraud defense.
- [references/STORAGE-AND-OFFLINE-TAMPERING.md](references/STORAGE-AND-OFFLINE-TAMPERING.md): Secure keystores, memory-only grants, and anti-tamper storage.
- [schemas/billing-audit-schema.json](schemas/billing-audit-schema.json): Machine-readable JSON schema for monetization audit reports.
