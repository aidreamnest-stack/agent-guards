# False-Positive Defense Reference

This guide provides rules to avoid erroneously flagging necessary tools, type definitions, and framework plugins that are never directly imported in application source code.

---

## 1. The 5 Categories of Non-Imported Dependencies

Never mark a package as orphaned until checking these five categories:

### Category 1: CLI Execution Tools
Packages invoked exclusively in `package.json` `scripts`:
- `tsc`, `typescript`
- `rimraf`, `shx`
- `concurrently`, `npm-run-all`
- `cross-env`
- `nodemon`, `tsx`, `ts-node`
- `husky`, `lint-staged`
- `prettier`, `eslint`

*Audit Check*: Read all script values in `package.json`. If a dependency's binary name matches a token in `scripts`, classify as `[CLI_TOOL]` and preserve.

---

### Category 2: Bundler & Compiler Plugins
Packages referenced as strings or dynamic requires inside configuration files:
- **Tailwind**: `@tailwindcss/typography`, `@tailwindcss/forms` in `tailwind.config.js`
- **PostCSS**: `autoprefixer`, `postcss-preset-env` in `postcss.config.js`
- **Babel**: `@babel/plugin-transform-runtime` in `babel.config.js`
- **Webpack / Rollup / Vite**: `vite-plugin-svgr`, `terser`
- **Next.js**: `@next/bundle-analyzer` in `next.config.js`

*Audit Check*: Inspect all `*.config.{js,ts,mjs,cjs,json}` files before classifying any build tool as unused.

---

### Category 3: Ambient TypeScript Type Definitions (`@types/*`)
Packages under the `@types/` scope provide compiler-level ambient typings without any runtime imports:
- `@types/node`
- `@types/react`, `@types/react-dom`
- `@types/jest`, `@types/mocha`
- `@types/express`

*Rule*:
- Check if the corresponding base package exists (e.g. `@types/react` is valid if `react` is used).
- For global environments (`@types/node`), verify TypeScript `tsconfig.json` compiler options.

---

### Category 4: Native Mobile Platform Plugins (Flutter / React Native)
In mobile development, some packages inject native Android Gradle dependencies or iOS CocoaPods without exposing Dart or JavaScript APIs:
- Gradle plugins (e.g. `google-services`, Firebase crashlytics gradle plugin).
- Native assets or fonts declared in `pubspec.yaml` `flutter.assets` or `flutter.fonts`.

*Audit Check*: Verify `android/app/build.gradle` and `ios/Podfile` before pruning mobile plugins.

---

### Category 5: Peer Dependencies & Runtime Polyfills
Packages like `react-is`, `tslib`, or `@babel/runtime` that are required at runtime by major frameworks or libraries.
