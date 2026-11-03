# Ecosystem Import Patterns Reference

This reference documents the exact syntactical import patterns required to verify whether a declared dependency is consumed anywhere in a codebase.

---

## 1. JavaScript & TypeScript (Node / Web)

### Target Extensions:
`.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`, `.vue`, `.svelte`

### Detection Patterns:
1. **Static ESM Imports**:
   ```javascript
   import { x } from '<package-name>';
   import * as x from '<package-name>';
   import x from '<package-name>';
   import '<package-name>'; // Side-effect import
   ```
2. **Subpath & Deep Imports**:
   ```javascript
   import { x } from '<package-name>/subpath';
   import '<package-name>/style.css';
   ```
3. **CommonJS Requires**:
   ```javascript
   const x = require('<package-name>');
   const { x } = require('<package-name>/subpath');
   ```
4. **Dynamic Imports**:
   ```javascript
   const mod = await import('<package-name>');
   ```
5. **Scoped Packages**:
   For `@org/pkg`, ensure regex captures the full scope:
   ```javascript
   import x from '@org/pkg';
   import x from '@org/pkg/sub';
   ```

---

## 2. Flutter & Dart

### Target Extensions:
`.dart`

### Detection Patterns:
In Dart, every package import starts with the `package:` scheme followed by the package name declared in `pubspec.yaml`:
```dart
import 'package:<package_name>/<file>.dart';
import 'package:<package_name>/<file>.dart' as alias;
import 'package:<package_name>/<file>.dart' show SpecificClass;
export 'package:<package_name>/<file>.dart';
```

### Search Regex:
```regex
(import|export)\s+['"]package:<package_name>/
```

---

## 3. Python

### Target Extensions:
`.py`

### Important Caveat: Package vs Module Name Mismatch
Some packages are installed with one name on PyPI but imported under a different module name:
- `pyyaml` $\implies$ imported as `import yaml`
- `beautifulsoup4` $\implies$ imported as `import bs4`
- `pillow` $\implies$ imported as `import PIL`
- `scikit-learn` $\implies$ imported as `import sklearn`

### Detection Patterns:
```python
import <module_name>
import <module_name> as alias
from <module_name> import something
from <module_name>.submodule import something
```

---

## 4. Go Modules

### Target Extensions:
`.go`

### Detection Patterns:
In Go, imports reference the full module path:
```go
import "github.com/gin-gonic/gin"
import (
    "github.com/google/uuid"
)
```
Go's compiler automatically prunes unused imports at compile time. If an import is removed from `.go` files, `go mod tidy` should be run to prune `go.mod`.
