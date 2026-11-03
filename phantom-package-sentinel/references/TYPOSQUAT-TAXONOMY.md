# Typosquatting & Hallucination Taxonomy Reference

This guide catalogs the naming structures, syntactic tropes, and harvesting methods used in AI package hallucination attacks.

---

## 1. How Attackers Harvest LLM Hallucinations

Attackers do not guess package names at random. They systematically extract them from LLMs:

```
[Attacker Scraper Bot]
  │
  ├──> Prompts popular LLMs with 10,000 coding prompts
  │    ("How do I parse EDI files in Node?", "Best Flutter library for audio waveform", etc.)
  │
  ├──> Extracts all suggested package names in markdown code blocks
  │
  ├──> Queries npm, PyPI, and pub.dev to check if the package exists
  │
  └──> If status == 404 (does not exist):
         └──> Instantly registers the package name on the registry with a payload!
```

When an end-user developer or autonomous coding agent prompts an LLM with a similar question weeks later, the LLM hallucinates the exact same plausible-sounding package name. The developer runs `npm install`, and the trap springs.

---

## 2. Hallucination Naming Tropes

Large Language Models have strong syntactic biases in how they invent names. Look for these four primary patterns:

### Pattern A: The "Utility Suffix" Combo
LLMs love appending generic utility descriptors to known popular packages:
- `<known-package>-helper` (e.g. `express-validator-helper`)
- `<known-package>-toolkit` (e.g. `react-query-toolkit`)
- `<known-package>-wrapper` (e.g. `stripe-node-wrapper`)
- `<known-package>-utils` (e.g. `zustand-persist-utils`)
- `<known-package>-lite` (e.g. `zod-validator-lite`)
- `<known-package>-fast` (e.g. `bcrypt-fast-node`)

### Pattern B: The "Domain Specific Specifier"
Combining a popular framework with a specific business domain without an official release:
- `flutter-woocommerce-sdk`
- `next-auth-supabase-adapter-v2`
- `fastapi-jwt-auth-bearer`

### Pattern C: Ecosystem Case / Delimiter Inversion
- Inverting kebab-case to snake_case or camelCase:
  - Genuine package: `date-fns` $\implies$ Hallucination: `date_fns` or `dateFns`
  - Genuine package: `flutter_secure_storage` $\implies$ Hallucination: `flutter-secure-storage`

### Pattern D: Version Number Squatting
Appending `-v2`, `-v3`, or `-modern` to popular libraries that are still on v1:
- `uuid-v4-browser`
- `chalk-v5-compat`

---

## 3. High-Risk Payload Fingerprints

Once an attacker claims a hallucinated package, their payload typically targets developer credentials:

1. **Environment Stealers**:
   ```javascript
   // Scanning for high-value API keys
   const sensitiveKeys = ['AWS_SECRET_ACCESS_KEY', 'GITHUB_TOKEN', 'OPENAI_API_KEY', 'STRIPE_SECRET_KEY'];
   ```
2. **File System Harvesters**:
   - `~/.ssh/id_rsa` or `~/.ssh/id_ed25519`
   - `~/.aws/credentials`
   - `~/.kube/config`
   - `.env` and `.env.local` in current and parent directories
3. **Webhook Exfiltration**:
   - Sending encoded JSON payloads to Discord webhooks, Telegram bot APIs, or anonymous request bin services.
