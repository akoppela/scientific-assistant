# Infrastructure Implementation Plan

**Goal:** Set up linting, formatting, CI/CD pipeline, and Nix-based release packaging for all languages (Elm, Rust, TypeScript, Nix).

**Architecture:** Pre-commit hooks run formatters and linters locally. GitHub Actions runs tests and builds on push. Nix flake provides reproducible builds. Release workflow builds Tauri artifacts for all platforms.

**Tech Stack:** elm-format, elm-review, rustfmt, clippy, eslint, prettier, nixfmt, GitHub Actions, Nix flakes

**Reference:** `docs/plans/2025-12-13-elm-tauri-migration-design.md`

---

## Before Execution

1. **Invoke brainstorming skill** — Review this plan and existing CI/tooling setup
2. **Analyze** — Check `legacy/package.json` for existing scripts and tooling patterns
3. **Confirm** — User confirms plan accuracy before proceeding
4. **Proceed** — Use executing-plans + test-driven-development skills

---

## Prerequisites

- Bootstrap phase complete (Task 1)
- GitHub repository created
- Nix development shell working

---

## Task 1: Configure Elm Linting

**Files:**
- Create: `review/src/ReviewConfig.elm`
- Create: `review/elm.json`

**Step 1: Create review elm.json**

```json
{
    "type": "application",
    "source-directories": [
        "src"
    ],
    "elm-version": "0.19.1",
    "dependencies": {
        "direct": {
            "elm/core": "1.0.5",
            "jfmengels/elm-review": "2.14.0",
            "jfmengels/elm-review-unused": "1.2.3",
            "jfmengels/elm-review-simplify": "2.1.1",
            "jfmengels/elm-review-common": "1.3.3"
        },
        "indirect": {
            "elm/json": "1.1.3",
            "elm/parser": "1.1.0",
            "elm/project-metadata-utils": "1.0.2",
            "elm/random": "1.0.0",
            "elm/time": "1.0.0",
            "miniBill/elm-unicode": "1.1.1",
            "pzp1997/assoc-list": "1.0.0",
            "rtfeldman/elm-hex": "1.0.0",
            "stil4m/elm-syntax": "7.3.8",
            "stil4m/structured-writer": "1.0.3"
        }
    },
    "test-dependencies": {
        "direct": {},
        "indirect": {}
    }
}
```

**Step 2: Create ReviewConfig.elm**

```elm
module ReviewConfig exposing (config)

import Review.Rule exposing (Rule)
import NoUnused.Variables
import NoUnused.CustomTypeConstructors
import NoUnused.CustomTypeConstructorArgs
import NoUnused.Dependencies
import NoUnused.Exports
import NoUnused.Modules
import NoUnused.Parameters
import NoUnused.Patterns
import Simplify


config : List Rule
config =
    [ NoUnused.Variables.rule
    , NoUnused.CustomTypeConstructors.rule []
    , NoUnused.CustomTypeConstructorArgs.rule
    , NoUnused.Dependencies.rule
    , NoUnused.Exports.rule
    , NoUnused.Modules.rule
    , NoUnused.Parameters.rule
    , NoUnused.Patterns.rule
    , Simplify.rule Simplify.defaults
    ]
```

**Step 3: Verify elm-review runs**

```bash
elm-review
```

Expected: No errors (or only fixable suggestions).

---

## Task 2: Configure TypeScript Linting

**Files:**
- Create: `eslint.config.js`
- Create: `.prettierrc`
- Modify: `package.json`

**Step 1: Create eslint.config.js**

```javascript
// eslint.config.js
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    ignores: ["dist/**", "node_modules/**", "src-tauri/**"],
  },
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/no-explicit-any": "error",
    },
  }
);
```

**Step 2: Create .prettierrc**

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

**Step 3: Update package.json with lint scripts**

Add to scripts section:

```json
{
  "scripts": {
    "lint": "eslint ts/",
    "lint:fix": "eslint ts/ --fix",
    "format": "prettier --write \"ts/**/*.ts\"",
    "format:check": "prettier --check \"ts/**/*.ts\""
  },
  "devDependencies": {
    "@eslint/js": "^9.16.0",
    "eslint": "^9.16.0",
    "prettier": "^3.4.0",
    "typescript-eslint": "^8.17.0"
  }
}
```

**Step 4: Install and verify**

```bash
npm install
npm run lint
npm run format:check
```

Expected: No errors.

---

## Task 3: Configure Rust Linting

**Files:**
- Create: `src-tauri/rustfmt.toml`
- Create: `src-tauri/.clippy.toml`

**Step 1: Create rustfmt.toml**

```toml
# src-tauri/rustfmt.toml
edition = "2021"
max_width = 100
tab_spaces = 4
use_small_heuristics = "Default"
```

**Step 2: Create .clippy.toml**

```toml
# src-tauri/.clippy.toml
cognitive-complexity-threshold = 25
```

**Step 3: Verify Rust linting**

```bash
cd src-tauri
cargo fmt --check
cargo clippy -- -D warnings
cd ..
```

Expected: No errors.

---

## Task 4: Create CI Workflow

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Create CI workflow**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  CARGO_TERM_COLOR: always

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Nix
        uses: cachix/install-nix-action@v27
        with:
          nix_path: nixpkgs=channel:nixos-unstable

      - name: Cache Nix store
        uses: actions/cache@v4
        with:
          path: /nix/store
          key: nix-${{ runner.os }}-${{ hashFiles('flake.lock') }}
          restore-keys: nix-${{ runner.os }}-

      - name: Check Elm
        run: |
          nix develop --command bash -c "
            elm make src/Main.elm --output=/dev/null
            elm-format src/ --validate
            elm-review
          "

      - name: Check TypeScript
        run: |
          nix develop --command bash -c "
            npm ci
            npm run lint
            npm run format:check
          "

      - name: Check Rust
        run: |
          nix develop --command bash -c "
            cd src-tauri
            cargo fmt --check
            cargo clippy -- -D warnings
          "

      - name: Check Nix
        run: |
          nix develop --command bash -c "
            nixfmt --check flake.nix
          "

  test:
    runs-on: ubuntu-latest
    needs: check
    steps:
      - uses: actions/checkout@v4

      - name: Install Nix
        uses: cachix/install-nix-action@v27
        with:
          nix_path: nixpkgs=channel:nixos-unstable

      - name: Cache Nix store
        uses: actions/cache@v4
        with:
          path: /nix/store
          key: nix-${{ runner.os }}-${{ hashFiles('flake.lock') }}
          restore-keys: nix-${{ runner.os }}-

      - name: Run Elm tests
        run: nix develop --command elm-test

      - name: Run Rust tests
        run: |
          nix develop --command bash -c "
            cd src-tauri
            cargo test
          "

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4

      - name: Install Nix
        uses: cachix/install-nix-action@v27
        with:
          nix_path: nixpkgs=channel:nixos-unstable

      - name: Install Tauri deps
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf

      - name: Build
        run: |
          nix develop --command bash -c "
            npm ci
            npm run tauri build
          "
```

---

## Task 5: Create Release Workflow

**Files:**
- Create: `.github/workflows/release.yml`

**Step 1: Create release workflow**

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - "v*"

jobs:
  create-release:
    runs-on: ubuntu-latest
    outputs:
      release_id: ${{ steps.create-release.outputs.id }}
    steps:
      - uses: actions/checkout@v4

      - name: Create Release
        id: create-release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref_name }}
          release_name: Release ${{ github.ref_name }}
          draft: true
          prerelease: false

  build-tauri:
    needs: create-release
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: macos-latest
            target: aarch64-apple-darwin
          - platform: ubuntu-22.04
            target: x86_64-unknown-linux-gnu
          - platform: windows-latest
            target: x86_64-pc-windows-msvc

    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install Rust
        uses: dtolnay/rust-action@stable
        with:
          targets: ${{ matrix.target }}

      - name: Install dependencies (Ubuntu)
        if: matrix.platform == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf

      - name: Install Elm
        run: npm install -g elm

      - name: Install dependencies
        run: npm ci

      - name: Build Tauri
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
        with:
          releaseId: ${{ needs.create-release.outputs.release_id }}

  publish-release:
    needs: [create-release, build-tauri]
    runs-on: ubuntu-latest
    steps:
      - name: Publish Release
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.repos.updateRelease({
              owner: context.repo.owner,
              repo: context.repo.repo,
              release_id: ${{ needs.create-release.outputs.release_id }},
              draft: false
            })
```

---

## Task 6: Add Format Scripts

**Files:**
- Modify: `package.json`

**Step 1: Update package.json with all format/lint commands**

Complete scripts section:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "elm make src/Main.elm --optimize --output=dist/elm.js && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "elm:build": "elm make src/Main.elm --output=dist/elm.js",
    "elm:watch": "elm make src/Main.elm --output=dist/elm.js --debug",
    "test": "elm-test",
    "test:rust": "cd src-tauri && cargo test",
    "lint": "eslint ts/",
    "lint:fix": "eslint ts/ --fix",
    "lint:elm": "elm-review",
    "lint:elm:fix": "elm-review --fix",
    "lint:rust": "cd src-tauri && cargo clippy -- -D warnings",
    "format": "prettier --write \"ts/**/*.ts\" && elm-format src/ --yes",
    "format:check": "prettier --check \"ts/**/*.ts\" && elm-format src/ --validate",
    "format:rust": "cd src-tauri && cargo fmt",
    "format:nix": "nixfmt flake.nix",
    "check": "npm run format:check && npm run lint && npm run lint:elm && npm run lint:rust"
  }
}
```

**Step 2: Verify all checks pass**

```bash
npm run check
```

Expected: All checks pass.

---

## Task 7: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Add infrastructure commands section**

Add/update Commands section:

```markdown
## Commands

```bash
# Development
npm run dev          # Vite dev server
npm run tauri dev    # Tauri dev mode

# Build
npm run build        # Production build
npm run tauri build  # Tauri production build

# Test
npm run test         # Elm tests
npm run test:rust    # Rust tests
npx playwright test  # E2E tests

# Lint
npm run lint         # TypeScript lint
npm run lint:elm     # Elm review
npm run lint:rust    # Rust clippy

# Format
npm run format       # Format TS + Elm
npm run format:rust  # Format Rust
npm run format:nix   # Format Nix

# All checks
npm run check        # Run all linting and format checks
```

## CI/CD

- Push to `main`: Runs lint, format check, tests, build
- Push tag `v*`: Creates GitHub Release with Tauri binaries
- Platforms: macOS (ARM), Linux, Windows
```

---

## Task 8: Commit and Mark Complete

**Step 1: Commit**

```bash
git add -A
git commit -m "feat: add infrastructure (linting, formatting, CI/CD)

- Add elm-review with unused/simplify rules
- Add ESLint + Prettier for TypeScript
- Add rustfmt + clippy for Rust
- Add nixfmt for Nix
- Create CI workflow (lint, test, build)
- Create Release workflow (multi-platform Tauri builds)
- Add npm scripts for all checks

🤖 Generated with Claude Code"
```

**Step 2: Mark phase complete**

Edit `docs/plans/2025-12-13-elm-tauri-migration-design.md`:

Change line 15 from:
```
| 3 | Infrastructure | [ ] | `03-infrastructure-plan.md` |
```
To:
```
| 3 | Infrastructure | [x] | `03-infrastructure-plan.md` |
```

---

## Verification Checklist

- [ ] `elm-format src/ --validate` passes
- [ ] `elm-review` passes
- [ ] `npm run lint` passes
- [ ] `npm run format:check` passes
- [ ] `cargo fmt --check` passes
- [ ] `cargo clippy -- -D warnings` passes
- [ ] `nixfmt --check flake.nix` passes
- [ ] `npm run check` runs all checks
- [ ] CI workflow file valid (check with `act` or push to test branch)
- [ ] Release workflow file valid
