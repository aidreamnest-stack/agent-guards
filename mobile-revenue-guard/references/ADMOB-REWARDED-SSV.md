# AdMob & Rewarded Ad Server-Side Verification (SSV) Reference

This reference documents how to protect rewarded advertising from race conditions, fake callback exploits, and infinite currency glitches.

---

## 1. The Client-Side Exploit Surface

When AI assistants implement rewarded ads, they frequently place reward unlock logic in premature callbacks:

### ❌ Severe Anti-Patterns:
1. **Unlocking on Load**:
   ```dart
   // CATASTROPHIC BUG: Grants reward when ad merely loads in the background!
   RewardedAd.load(
     adUnitId: adUnitId,
     onAdLoaded: (ad) => grantUserCoins(50), // Exploit: User gets coins without watching
   );
   ```
2. **Unlocking on Open**:
   Granting rewards in `onAdShowedFullScreenContent` before the user watches the mandatory video duration.
3. **Double-Tap Race Condition**:
   Failing to disable the "Watch Ad" button when tapped, allowing the user to spawn two ad instances simultaneously and claim double rewards.

---

## 2. Server-Side Verification (SSV) Architecture

For games and applications where in-game currency or points have real monetary value, never rely exclusively on client-side callbacks. Use **AdMob Server-Side Verification (SSV)**:

```
[Mobile App] ───────── Displays Rewarded Ad ──────────> [User Watches Video]
     │                                                         │
     │ Passes User ID & Nonce in customData                    │
     ▼                                                         ▼
[AdMob SDK] ──── Notifies AdMob Servers ────> [AdMob Verification Server]
                                                       │
                                  Signs callback with ECDSA Private Key
                                                       │
                                                       ▼
                                             [Your Backend Server]
                                                       │
                                         1. Verifies ECDSA signature
                                         2. Checks transaction_id idempotency
                                         3. Credits coins to user database
```

---

## 3. Verifying the SSV Callback on Your Backend

AdMob sends an HTTP GET request to your callback URL with these query parameters:
- `ad_network`
- `ad_unit`
- `custom_data` (Your user's unique ID and session nonce)
- `reward_amount`
- `reward_item`
- `timestamp`
- `transaction_id` (Unique identifier for this reward event)
- `user_id`
- `signature` (Base64-encoded ECDSA signature)
- `key_id` (Identifier of Google's public key)

### Backend Verification Steps:
1. **Fetch Google's Public Key**:
   Download the current trusted public keys from:
   `https://gstatic.com/admob/reward/verifier-keys.json`
2. **Verify Signature**:
   Verify the message payload with the ECDSA public key matching `key_id`.
3. **Idempotency & Replay Protection**:
   Check if `transaction_id` already exists in your database. If yes, respond with HTTP `200 OK` but do **not** award duplicate coins.
4. **Timestamp Freshness**:
   Reject callbacks older than 5 minutes to prevent replay attacks.
