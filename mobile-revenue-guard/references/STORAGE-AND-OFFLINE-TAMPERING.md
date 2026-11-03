# Mobile Storage & Offline Tampering Reference

This reference covers anti-tampering techniques for persisting digital entitlements and preventing offline paywall bypasses.

---

## 1. The Rooted Phone Paywall Bypass

When an app stores entitlements in plain key-value stores:
```dart
// ❌ CRITICAL SECURITY FLAW:
final prefs = await SharedPreferences.getInstance();
await prefs.setBool('is_pro_member', true);
```

On Android, this writes to an unencrypted XML file:
`/data/data/com.example.app/shared_prefs/com.example.app_preferences.xml`
```xml
<boolean name="is_pro_member" value="false" />
```

Any user with a rooted phone, MT Manager, or ADB can change `value="false"` to `value="true"` in 10 seconds. All paywalls and ads disappear forever.

---

## 2. Hardware Keystore & Keychain Protection

Entitlement flags must be encrypted using keys protected by the device's hardware security module (Secure Enclave on iOS, TEE / StrongBox on Android).

### Recommended Implementation (Flutter):
Use `flutter_secure_storage`:
```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final storage = const FlutterSecureStorage(
  aOptions: AndroidOptions(encryptedSharedPreferences: true),
  iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
);

// Save verified entitlement
await storage.write(key: 'entitlement_token', value: signedServerJwt);
```

### Server-Authoritative Design (Best Practice):
Do not store simple boolean flags (`is_pro = true`). Instead:
1. Store a signed, short-lived JWT token issued by your backend after validating the store receipt.
2. Verify the cryptographic signature and expiration timestamp locally before granting access.

---

## 3. Graceful Offline Access (Airplane Mode Safety)

A paying customer expects their offline features (e.g. offline music, saved wallpapers, pro photo filters) to work without an internet connection.

### The Naive Bug to Avoid:
```dart
// ❌ DO NOT DO THIS:
try {
  final status = await api.checkSubscriptionStatus();
  user.isPro = status.isActive;
} catch (e) {
  // Bug: Offline network timeout wipes the paying user's access!
  user.isPro = false;
}
```

### The Human Production Standard:
```dart
// ✅ CORRECT GRACEFUL DEGRADATION:
try {
  final status = await api.checkSubscriptionStatus();
  await cacheVerifiedEntitlement(status);
  user.isPro = status.isActive;
} catch (e) {
  // If network is offline, rely on securely cached entitlement with grace period
  final cached = await readSecureCachedEntitlement();
  if (cached != null && cached.isWithinGracePeriod(days: 14)) {
    user.isPro = true; // Preserve access during network failure
  } else {
    user.isPro = false; // Only expire if grace period elapsed
  }
}
```
Only downgrade user entitlements when the store or backend explicitly returns `403 REVOKED` or `EXPIRED`.
