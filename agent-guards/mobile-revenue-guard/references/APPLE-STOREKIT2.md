# Apple StoreKit 2 & App Store Billing Reference

This reference covers modern StoreKit 2 integration, JWS transaction verification, and App Store Server API V2 requirements on iOS/macOS.

---

## 1. StoreKit 2 JWS Signature Verification

In StoreKit 2, every transaction is cryptographically signed by Apple using JSON Web Signatures (JWS). Transactions are returned wrapped in a `VerificationResult<Transaction>`.

### The Critical Swift Implementation:
```swift
// CRITICAL: Verify cryptographic JWS signature before granting entitlements
for await result in Transaction.updates {
    switch result {
    case .verified(let transaction):
        // 1. Deliver the purchased product to the user
        await grantUserEntitlement(transaction.productID)

        // 2. Finish the transaction with Apple
        await transaction.finish()

    case .unverified(let unverifiedTransaction, let verificationError):
        // REJECT FRAUDULENT TRANSACTIONS:
        // Do NOT call .unsafePayloadValue in production code!
        logger.error("Transaction signature verification failed: \(verificationError)")
    }
}
```

### Audit Rule:
Search for calls to `.unsafePayloadValue` across all Swift files. Any usage in release builds is a **CRITICAL VULNERABILITY** that allows jailbreak receipt spoofing.

---

## 2. Calling `transaction.finish()`

Unlike StoreKit 1 where unfinished transactions could hang indefinitely, StoreKit 2 requires calling `await transaction.finish()` once the app has delivered the product.

- If you **forget** to call `finish()`: The transaction will re-appear in `Transaction.updates` on every app launch, causing redundant network calls and potential database locks.
- If you call `finish()` **too early** (before your database write completes): If the database write fails or crashes, Apple considers the transaction complete and the user loses their purchase.

---

## 3. App Store Server Notifications V2

To handle subscription cancellations, upgrades, and refunds authoritatively, configure **App Store Server Notifications V2** on your backend:

### Key Notification Types to Handle:
- `DID_RENEW`: Subscription successfully renewed. Extend entitlement expiration date.
- `EXPIRED`: Subscription lapsed. Downgrade user tier.
- `REVOKE`: User received a refund or family sharing was removed. Revoke entitlements immediately.
- `GRACE_PERIOD_EXPIRED`: Billing retry failed after grace period. Revoke access.

---

## 4. Family Sharing Support

If an in-app purchase supports Apple Family Sharing, check `transaction.ownershipType`:
- `.purchased`: The current user personally bought the item.
- `.familyShared`: The item is shared via iCloud Family Sharing.
If family sharing is enabled, ensure your user profile links the entitlement to the Apple ID rather than an arbitrary email account.
