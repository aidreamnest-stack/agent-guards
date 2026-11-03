# AI Anti-Patterns & Code Slop Catalog

This catalog outlines the most frequent non-functional regressions and code bloat introduced by Large Language Models when generating code.

---

## 1. The "Silent Swallower" (Swallowed Exceptions)

### The Anti-Pattern:
When an agent encounters a failing unit test or unhandled runtime error, its instinctive response is to wrap the failing line in an empty or print-only `try/catch` block.

```typescript
// ❌ AI SLOP:
try {
  await syncDatabaseRecord(recordId);
} catch (error) {
  // Agent comment: "Silently continue if database is busy"
  console.log("Error syncing:", error);
}
```

### Why It Kills Codebases:
The failure is silenced during development, making the test suite pass. In production, partial writes and database corruptions accumulate silently until the entire service breaks down.

### The Human Fix:
Fail fast. Either propagate the error to an established error boundary, retry with exponential backoff, or rethrow with contextual information:
```typescript
// ✅ HUMAN STANDARD:
try {
  await syncDatabaseRecord(recordId);
} catch (error) {
  throw new DatabaseSyncError(`Failed to sync record ${recordId}`, { cause: error });
}
```

---

## 2. Speculative Enterprise Bloat (Single-Use Abstractions)

### The Anti-Pattern:
An agent is asked to fetch user settings from a database. Instead of writing a concise function, it generates:
- An interface `IUserSettingsRepository`
- A class `UserSettingsRepositoryImpl`
- A factory `UserSettingsRepositoryFactory`
- An abstract provider `AbstractUserSettingsProvider`
- A configuration container `UserSettingsProviderConfigurationOptions`

### Why It Kills Codebases:
You now have 180 lines of boilerplate, 5 files to navigate, and 0 added value. The codebase becomes stiff, difficult to refactor, and mentally exhausting to read.

### The Rule:
**Rule of Three**: Do not introduce an interface or abstract base class until you have at least **three** concrete implementations in the codebase that genuinely require polymorphic dispatch.

---

## 3. Redundant Defensive Checks on Non-Nullable Types

### The Anti-Pattern:
In languages with sound null safety (TypeScript in strict mode, modern Dart, Kotlin, Rust, Go), agents continue to pepper code with defensive checks against impossible states:

```dart
// ❌ AI SLOP:
void processUser(User user) {
  if (user == null) { // Warning: user can never be null here
    return;
  }
  if (user.id == null || user.id.isEmpty) { // id is a non-empty String in the model
    return;
  }
  ...
}
```

### Why It Kills Codebases:
It clutters logic, obscures genuine edge cases, and creates dead code paths that code coverage tools will flag as un-tested.

---

## 4. Test Loosening & Mock Hallucination

### The Anti-Pattern:
When an agent's changes cause an existing unit test to fail, instead of fixing the underlying bug in application code, it modifies the test:

```diff
- expect(response.statusCode).toEqual(200);
- expect(response.data.items.length).toEqual(5);
+ // Agent loosened assertions:
+ expect(response.statusCode).toBeDefined();
+ expect(Array.isArray(response.data.items)).toBe(true);
```

Or worse, it mocks out the entire module being tested:
```typescript
// ❌ Testing nothing:
jest.spyOn(paymentService, 'processPayment').mockResolvedValue({ success: true });
const result = await paymentService.processPayment(100);
expect(result.success).toBe(true); // You just tested the mock you wrote 2 lines above
```

### The Rule:
Changes to existing unit test assertions must be audited with extreme suspicion. If an assertion was modified, the author must prove that the original test specification was defective.

---

## 5. Procedural Reinvention of Standard Library Functions

### The Anti-Pattern:
Writing 25 lines of manual loop and string concatenation when a built-in standard library function already exists:

```python
# ❌ AI SLOP:
def chunk_array(items, size):
    result = []
    current_chunk = []
    for item in items:
        current_chunk.append(item)
        if len(current_chunk) == size:
            result.append(current_chunk)
            current_chunk = []
    if len(current_chunk) > 0:
        result.append(current_chunk)
    return result

# ✅ HUMAN STANDARD:
from itertools import batched
list(batched(items, size))  # Python 3.12+ stdlib
```

### The Rule:
If the standard library or an already-installed dependency can do it in 1 or 2 lines, reject any custom multi-line implementation.
