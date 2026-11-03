# Bundle & Dependency Impact Metrics

This reference defines how to quantify the performance, storage, and security cost of unused dependencies.

---

## 1. The Transitive Bloat Multiplier

When an AI assistant adds a single root dependency, it rarely adds just one package. Most modern packages pull in a deep tree of transitive dependencies.

### Formula:
$$\text{Bloat Multiplier} = \frac{\text{Total Installed Transitive Packages}}{\text{Declared Root Packages}}$$

*Example*: Adding `webpack-dev-server` pulls in 40+ transitive packages, adding over 50 MB to disk.

---

## 2. Client-Side Bundle Impact vs Dev Tooling

Unused dependencies fall into two impact categories:

### A. Production Client Dependencies (`dependencies`)
If an unused package is declared under `dependencies` in a web or mobile application:
- Even if tree-shaking strips out unreferenced exports, side-effect imports or non-ESM modules can leak into the production JavaScript bundle.
- In mobile apps, unneeded native libraries increase `.apk` / `.aab` / `.ipa` download sizes and memory footprints.

### B. Development Dependencies (`devDependencies`)
Even if dev dependencies never ship to end users:
- They slow down `npm install` and `pnpm install` in CI/CD pipelines.
- They inflate local developer storage (`node_modules` frequently exceeding 1 GB).
- They introduce supply-chain attack surfaces via compromised install scripts.

---

## 3. The Security Exposure Surface (SES)

Every additional package increases vulnerability exposure:

$$\text{SES} = \sum_{p \in \text{Unused Packages}} (\text{Transitive Count}(p) \times \text{Maintainer Count}(p))$$

An unused utility library with 15 transitive dependencies means 15 additional third-party maintainer accounts that could be hijacked with malicious updates. Pruning unused dependencies directly shrinks the attack surface.
