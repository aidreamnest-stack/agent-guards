# Google Play Billing Reference

This guide covers mission-critical production requirements and common revenue leaks when integrating Google Play Billing (Play Billing Library v6/v7).

---

## 1. The 72-Hour Purchase Acknowledgment Deadline

Google Play enforces a strict policy: every valid purchase must be explicitly acknowledged or consumed by the app or your backend server within **3 days (72 hours)**.

### The Auto-Refund Mechanism:
```
[User Completes Checkout] ──> Status: PURCHASED
  │
  ├──> [App Grants In-App Items]
  │
  └──> [Did the app or server acknowledge?]
         ├── YES ──> Transaction is finalized. Developer keeps the money.
         └── NO  ──> After 72 hours, Google Play automatically cancels the order,
                     refunds the customer's credit card, and marks purchase as VOID.
```

### Flutter Code Example:
```dart
// CRITICAL: Always acknowledge non-consumables and subscriptions
if (purchaseDetails.status == PurchaseStatus.purchased) {
  // 1. Deliver the digital good to the user
  await deliverEntitlements(purchaseDetails.productID);

  // 2. Acknowledge with Google Play (completes purchase on Android)
  if (purchaseDetails.pendingCompletePurchase) {
    await InAppPurchase.instance.completePurchase(purchaseDetails);
  }
}
```

### Backend Acknowledgment (Preferred for Server-Authoritative Apps):
Call Google Play Developer API:
```http
POST https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{packageName}/purchases/products/{productId}/tokens/{token}:acknowledge
Authorization: Bearer <oauth2_token>
```

---

## 2. Consumable vs Non-Consumable Lifecycle

- **Consumables (Coins, Gems, Extra Lives)**:
  Must be **consumed** via `consumeAsync()` (Android) or `consume()` (Server). Consuming automatically acknowledges the purchase. If you fail to consume, the user will be blocked from purchasing that coin pack a second time ("You already own this item").
- **Non-Consumables (Lifetime Access, Pro Upgrade)**:
  Must **never** be consumed. Must be acknowledged via `acknowledgePurchase()`.

---

## 3. Pending Transactions (Slow Payments & Cash Vouchers)

In emerging markets (India UPI, Brazil Boleto, Japan Konbini), purchases often enter a `PENDING` state while the user travels to a convenience store or authorizes a bank transfer.

### Audit Rule:
- ❌ **NEVER** grant digital goods when `purchase.purchaseState == PurchaseState.PENDING`.
- ✅ Only grant goods when `purchase.purchaseState == PurchaseState.PURCHASED`.
- When the payment clears (hours or days later), Google Play fires the `PurchasesUpdatedListener`. Your app must handle this asynchronously and acknowledge immediately.

---

## 4. Voided Purchases Reconciliation

Users frequently initiate credit card chargebacks or request refunds directly from Google Play customer support.

### Production Requirement:
Integrate the **Google Play Voided Purchases API** on your backend:
```http
GET https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{packageName}/purchases/voidedpurchases
```
Run a scheduled daily job to query voided purchase tokens and revoke the corresponding user entitlements in your database.
