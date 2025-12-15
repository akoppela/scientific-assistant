# Infrastructure Implementation Plan

**Goal:** Add elm-review configuration, ESLint/Prettier for TypeScript, and CI/CD workflows.

**Architecture:** Pre-commit via `format` command. CI runs format checks, linting, tests, and builds on push. Release workflow builds Tauri artifacts for all platforms.

**Tech Stack:** elm-review, ESLint 9.x, Prettier 3.x, typescript-eslint, GitHub Actions, Crane

**Reference:** `docs/plans/2025-12-13-elm-tauri-migration-design.md`

**Status:** ✅ Complete - All tasks finished. Phase 03 marked complete in migration design doc.

---

## Before Execution

1. **Invoke brainstorming skill** — Review this plan and existing CI/tooling setup
2. **Analyze** — Check `../legacy/package.json` for existing scripts and tooling patterns
3. **Confirm** — User confirms plan accuracy before proceeding
4. **Proceed** — Use executing-plans + test-driven-development skills

---

## Already Done (Phase 01)

- Three-layer structure: `view/`, `bridge/`, `platform/`
- Nix flake with devshell, all tools available
- `tasks/format.yaml` — elm-format, rustfmt, nixpkgs-fmt
- `tasks/check-view.yaml` — elm-test, elm-format validate
- `tasks/check-bridge.yaml` — vitest
- `tasks/check-platform.yaml` — cargo test, clippy
- Tools in devShell: elm-review, clippy, rustfmt, nixpkgs-fmt

---

## Task 1: Configure Elm Review ✅

**Files:**
- Create: `view/review/src/ReviewConfig.elm`
- Create: `view/review/elm.json`
- Modify: `tasks/check-view.yaml`

**Note:** Used `elm-review init` instead of manual creation, then customized the generated files.

**Step 1: Initialize elm-review configuration**

```bash
cd view && elm-review init
```

This generates elm.json with elm-review 2.15.5 (latest compatible with nixpkgs CLI 2.13.4).

**Step 2: Add rule packages to view/review/elm.json**

Manually edit to add rule packages:

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
            "jfmengels/elm-review": "2.15.5",
            "jfmengels/elm-review-unused": "1.2.4",
            "jfmengels/elm-review-simplify": "2.1.5",
            "jfmengels/elm-review-common": "1.3.3",
            "stil4m/elm-syntax": "7.3.9"
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

**Step 3: Update view/review/src/ReviewConfig.elm**

```elm
module ReviewConfig exposing (config)

import NoUnused.CustomTypeConstructorArgs
import NoUnused.CustomTypeConstructors
import NoUnused.Dependencies
import NoUnused.Exports
import NoUnused.Modules
import NoUnused.Parameters
import NoUnused.Patterns
import NoUnused.Variables
import Review.Rule exposing (Rule)
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

**Step 4: Update tasks/check-view.yaml**

```yaml
tasks:
  - name: Elm tests
    cmd: elm-test
  - name: Elm format validation
    cmd: elm-format --validate src/
  - name: Elm review
    cmd: elm-review
```

**Step 5: Create view/review/default.nix for Nix builds**

elm-review requires additional setup to work in Nix sandbox (no network access):

```nix
{ pkgs, elmVersion ? "0.19.1", elmReviewVersion ? "2.13.3" }:

let
  # Read elm-review's internal dependencies from bundled elm.json files
  elmReviewLib = "${pkgs.elmPackages.elm-review}/lib/node_modules/elm-review";
  parserDeps = builtins.fromJSON (builtins.readFile "${elmReviewLib}/parseElm/elm.json");
  codecDeps = builtins.fromJSON (builtins.readFile "${elmReviewLib}/ast-codec/elm.json");
in
pkgs.stdenv.mkDerivation {
  name = "elm-review-cache";
  src = ./.;

  buildInputs = with pkgs.elmPackages; [ elm elm-review ];

  installPhase = ''
    ${pkgs.makeDotElmDirectoryCmd {
      elmJson = ./elm.json;
      extraDeps = [
        parserDeps.dependencies.direct
        parserDeps.dependencies.indirect
        codecDeps.dependencies.direct
        codecDeps.dependencies.indirect
      ];
    }}

    set -e
    mkdir -p .elm/elm-review/${elmReviewVersion}
    ln -s ../../${elmVersion} .elm/elm-review/${elmReviewVersion}/${elmVersion}

    mkdir -p $out
    cp -r .elm $out/
  '';
}
```

This builds a cache with:
- Review rule packages (from review/elm.json)
- elm-review parser dependencies (parseElm/elm.json)
- elm-review codec dependencies (ast-codec/elm.json)
- Version symlinks for offline operation

**Step 6: Update flake.nix for elm-review**

Add to inputs (using rkb's fork for docs.json support):

```nix
# Using rkb's fork for docs.json + extraDeps support (required for elm-review)
# Official jeslie0/mkElmDerivation lacks these features
# Issue filed: https://github.com/jeslie0/mkElmDerivation/issues/18
mkElmDerivation.url = "github:r-k-b/mkElmDerivation";
```

Add overlay:

```nix
overlays = [
  devshell.overlays.default
  mkElmDerivation.overlays.mkElmDerivation
  mkElmDerivation.overlays.makeDotElmDirectoryCmd
];
```

Add cache derivation:

```nix
elmReviewCache = pkgs.callPackage ./view/review { };
```

Update view's checkPhase:

```nix
checkPhase = ''
  # Merge review packages into view's .elm directory
  mkdir -p .elm/0.19.1
  cp -r ${elmReviewCache}/.elm/0.19.1/* .elm/0.19.1/
  chmod -R u+w .elm

  # Copy review config
  cp -r ${elmReviewCache}/review review

  # Run all checks
  run-parallel ${tasks.packages.${system}.default}/check-view.yaml
'';
```

Move elm-review from elmDevTools to elmBuildTools:

```nix
elmBuildTools = with pkgs.elmPackages; [ elm elm-format elm-test elm-review ];
elmDevTools = with pkgs.elmPackages; [ elm-json ];
```

**Step 7: Verify elm-review runs**

```bash
nix build .#view
```

Expected: Build succeeds, elm-review runs offline in checkPhase.

**Note:** elm-review in Nix builds requires rkb's mkElmDerivation fork which adds:
- docs.json fetching from package.elm-lang.org
- extraDeps parameter for additional dependencies
- See: https://discourse.elm-lang.org/t/enabling-pure-nix-builds-including-elm-review-elm-codegen/9969

---

## Task 2: Configure TypeScript Linting ✅

**Files:**
- Create: `bridge/eslint.config.js`
- Create: `bridge/.prettierrc`
- Modify: `bridge/package.json` (config packages only, not binaries)
- Modify: `bridge/tsconfig.json`
- Modify: `tasks/check-bridge.yaml`
- Modify: `tasks/format.yaml`
- Modify: `flake.nix` (add ESLint/Prettier from Nix + wrangler override)

**Note:** ESLint and Prettier **binaries** come from Nix packages, not npm. Only configuration packages remain in package.json.

**Step 1: Create bridge/eslint.config.js**

Based on legacy settings - uses `eslint-config-prettier`, enforces namespace imports, prevents type assertions:

```javascript
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    rules: {
      '@typescript-eslint/no-shadow': 'error',
      'no-shadow': 'off',
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/**/*.ts'],
    ignores: ['src/**/*.test.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ImportSpecifier',
          message: 'Use namespace imports: `import * as Name from "module"`',
        },
      ],
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'build/**'],
  }
);
```

**Step 2: Create bridge/.prettierrc**

Based on legacy settings:

```json
{
  "printWidth": 120,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

**Step 3: Update bridge/tsconfig.json**

Add stricter type-checking options from legacy (Elm-like guarantees):

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "types": ["vite/client"],

    // Strict Type-Checking (Elm-like guarantees)
    "strict": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "forceConsistentCasingInFileNames": true,

    // Module Resolution
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,

    // Output
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "build"]
}
```

**Step 4: Update bridge/package.json**

Add configuration packages only (binaries come from Nix):

```json
{
  "devDependencies": {
    "@eslint/js": "^9.16.0",
    "eslint-config-prettier": "^10.1.0",
    "typescript-eslint": "^8.17.0"
  }
}
```

**Step 4b: Add ESLint/Prettier to flake.nix**

Add TypeScript linting tools from Nix:

```nix
# TypeScript linting tools (for checkPhase and dev)
# wrangler removes its bundled prettier/eslint during build, so no conflict
tsLintTools = with pkgs; [ eslint prettier ];
```

Add to bridge derivation:

```nix
nativeBuildInputs = runParallelTool ++ tsLintTools;
```

Add to devShell:

```nix
packages = ... ++ tsLintTools ...
```

**Step 4c: Override wrangler to avoid conflicts**

```nix
# Override wrangler to fully remove prettier/eslint to avoid conflicts
wrangler-patched = pkgs.wrangler.overrideAttrs (oldAttrs: {
  postInstall = (oldAttrs.postInstall or "") + ''
    # Remove prettier/eslint directories completely, not just binaries
    rm -rf $out/lib/node_modules/prettier
    rm -rf $out/lib/node_modules/eslint
    rm -rf $out/lib/node_modules/typescript
    rm -rf $out/lib/packages/wrangler/node_modules/prettier
    rm -rf $out/lib/packages/wrangler/node_modules/eslint
    rm -rf $out/lib/packages/wrangler/node_modules/typescript
  '';
});
cloudflareDevTools = [ wrangler-patched ];
```

**Step 5: Update tasks/check-bridge.yaml**

```yaml
tasks:
  - name: TypeScript tests
    cmd: npx vitest run
  - name: TypeScript lint
    cmd: eslint src/
  - name: TypeScript format check
    cmd: prettier --check "src/**/*.ts"
```

**Step 6: Update tasks/format.yaml**

```yaml
tasks:
  - name: Elm formatting
    cmd: elm-format view/src/ --yes
  - name: TypeScript formatting
    cmd: cd bridge && prettier --write "src/**/*.ts"
  - name: Rust formatting
    cmd: find platform/src -name '*.rs' -exec rustfmt {} +
  - name: Nix formatting
    cmd: find . -name '*.nix' -not -path '*/.*' -exec nixpkgs-fmt {} +
```

**Step 7: Regenerate package-lock.json and verify**

```bash
cd bridge && npm install
nix build .#bridge  # Verifies linting passes in Nix build
```

Expected: Build succeeds with no linting errors.

---

## Task 3: Configure Rust Linting ✅

**Files:**
- Create: `platform/rustfmt.toml`
- Create: `platform/.clippy.toml`
- Modify: `tasks/check-platform.yaml`

**Step 1: Create platform/rustfmt.toml**

```toml
edition = "2021"
max_width = 120
tab_spaces = 4
use_small_heuristics = "Default"
```

**Step 2: Create platform/.clippy.toml**

```toml
cognitive-complexity-threshold = 25
```

**Step 3: Update tasks/check-platform.yaml**

Add format check:

```yaml
tasks:
  - name: Rust format check
    cmd: cargo fmt --check
  - name: Rust tests
    cmd: cargo test
  - name: Rust lints
    cmd: cargo clippy --all-targets -- -D warnings
```

**Step 4: Verify Rust linting**

```bash
cd platform && run-parallel ../tasks/check-platform.yaml
```

Expected: No errors.

---

## Task 4: Migrate to Crane for Rust Builds

**Goal:** Replace `buildRustPackage` with Crane for better caching. Dependencies cached separately from project code.

**Files:**
- Modify: `flake.nix`

**Step 1: Add crane input to flake.nix**

```nix
inputs = {
  # ... existing inputs ...

  crane.url = "github:ipetkov/crane";
  crane.inputs.nixpkgs.follows = "nixpkgs";
};
```

**Step 2: Update outputs to use crane**

```nix
outputs = { self, nixpkgs, flake-utils, devshell, mkElmDerivation, crane }:
  flake-utils.lib.eachDefaultSystem (system:
    let
      pkgs = import nixpkgs { /* ... */ };

      craneLib = crane.lib.${system};

      # ... other definitions ...
```

**Step 3: Update platform derivation**

Replace `rustPlatform.buildRustPackage` with Crane's two-step build:

```nix
# Platform layer (Tauri + Rust native) - using Crane for caching
platformSrc = ./platform;

# Step 1: Build dependencies only (cached separately)
platformCargoArtifacts = craneLib.buildDepsOnly {
  src = platformSrc;

  nativeBuildInputs = tauriBuildTools;
  buildInputs = tauriRuntimeLibs;

  # Tauri needs bridge output for build.rs
  preBuild = ''
    mkdir -p ../bridge/dist
    cp -r ${bridge}/dist/* ../bridge/dist/
  '';
};

# Step 2: Build project using cached artifacts
platform = craneLib.buildPackage {
  src = platformSrc;
  cargoArtifacts = platformCargoArtifacts;

  nativeBuildInputs = tauriBuildTools ++ rustBuildTools ++ [ run-parallel ];
  buildInputs = tauriRuntimeLibs;

  preBuild = ''
    mkdir -p ../bridge/dist
    cp -r ${bridge}/dist/* ../bridge/dist/
  '';

  buildPhaseCargoCommand = "cargo tauri build";

  checkPhase = ''
    run-parallel ${tasks}/check-platform.yaml
  '';

  installPhase = ''
    mkdir -p $out
    cp -r target/release/bundle $out/
  '';

  doCheck = true;
};
```

**Caching benefit:**
- `platformCargoArtifacts`: Rebuilds only when `Cargo.lock` changes
- `platform`: Rebuilds only when `src/` changes, uses cached deps
- Significantly faster CI builds after initial dependency compilation

**Step 4: Update flake.lock**

```bash
nix flake update
```

---

## Task 5: ~~Setup Cachix~~ (Removed - too expensive for pet project)

**Note:** Cachix support removed to reduce costs. CI builds from scratch each time. Crane still provides Rust dependency caching within each build.

---

## Task 6: Create CI Workflow

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify: `flake.nix` (add checks output)

**Step 1: Add checks output to flake.nix**

Add after `devShells.default`:

```nix
checks = {
  inherit view bridge platform;
  nix-fmt = pkgs.runCommand "check-nix-fmt" { nativeBuildInputs = [ pkgs.nixpkgs-fmt pkgs.findutils ]; } ''
    find ${./.} -name '*.nix' -not -path '*/.*' -exec nixpkgs-fmt --check {} +
    touch $out
  '';
};
```

**Step 2: Create CI workflow**

Leverages Nix for reproducible builds on all platforms:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    strategy:
      matrix:
        include:
          - os: ubuntu-latest
            system: x86_64-linux
          - os: macos-latest
            system: aarch64-darwin
          - os: windows-latest
            system: x86_64-windows

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4

      - name: Install Nix
        uses: cachix/install-nix-action@v31
        with:
          extra_nix_config: |
            experimental-features = nix-command flakes

      - name: Run all checks
        run: nix flake check
```

Note:
- Runs on all target platforms: Linux x86_64, macOS ARM, Windows x86_64
- `nix flake check` runs all checks: view, bridge, platform, proxy, nix-fmt
- Crane provides Rust dependency caching within each build
- Platform-specific issues caught early in CI

---

## Task 7: Create Release Workflow

**Files:**
- Create: `.github/workflows/release.yml`

**Step 1: Create release workflow**

Uses Nix + Cachix for all platforms:

```yaml
name: Release

on:
  push:
    tags:
      - "v*"

jobs:
  build:
    strategy:
      matrix:
        include:
          - os: ubuntu-latest
            system: x86_64-linux
          - os: macos-latest
            system: aarch64-darwin
          - os: windows-latest
            system: x86_64-windows

    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4

      - name: Install Nix
        uses: cachix/install-nix-action@v31
        with:
          extra_nix_config: |
            experimental-features = nix-command flakes

      - name: Build platform
        run: nix build .#platform

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: bundle-${{ matrix.os }}
          path: result/bundle/

  release:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Download all artifacts
        uses: actions/download-artifact@v4
        with:
          path: artifacts/

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          draft: true
          files: artifacts/**/*
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Note:
- Builds on all target platforms: Linux x86_64, macOS ARM (Apple Silicon), Windows x86_64
- Nix handles cross-platform builds consistently
- Crane caches Rust dependencies within each build
- Artifacts: .deb, .rpm (Linux), .dmg, .app (macOS), .msi, .exe (Windows)
- Draft releases allow manual review before publishing

---

## Task 8: Reorganize Infrastructure Directory

**Goal:** Group all auxiliary stuff under `infra/`, consolidate sub-flakes into main flake.

**Current structure:**
```
scientific-assistant/
├── view/
├── bridge/
├── platform/
├── elm-watch/       # has its own flake.nix
├── run-parallel/    # has its own flake.nix
├── tasks/           # has its own flake.nix
├── cloudflare/
├── docs/
└── flake.nix        # imports sub-flakes as inputs
```

**New structure:**
```
scientific-assistant/
├── view/            # main package
├── bridge/          # main package
├── platform/        # main package
├── infra/           # infrastructure & tooling
│   ├── elm-watch/   # elm-watch packaged for Nix
│   ├── run-parallel/ # parallel task runner
│   └── tasks/       # task definitions (YAML)
├── proxy/           # Cloudflare Worker (Gemini API proxy)
├── docs/
└── flake.nix        # main flake with path inputs to infra/
```

**Note:** Proxy (Cloudflare Worker) kept in root directory as a separate deployment target.

**Step 1: Move directories**

```bash
mkdir -p infra
git mv elm-watch run-parallel tasks infra/
```

Note: proxy (Cloudflare Worker) kept in root as separate deployment.

**Step 2: Convert flake.nix to default.nix**

Each sub-flake becomes a `default.nix` that takes `pkgs` as argument:

**infra/elm-watch/default.nix:**
```nix
{ pkgs }:

pkgs.buildNpmPackage {
  pname = "elm-watch-nix";
  version = "1.2.3";

  src = ./.;

  npmDepsHash = "sha256-qDiH6VtBctUKGSzXokVG0PVr/iYSKsK2mSmp/5Hocus=";

  nativeBuildInputs = [ pkgs.makeWrapper ];

  dontNpmBuild = true;

  installPhase = ''
    mkdir -p $out/bin $out/lib

    # Copy node_modules
    cp -r node_modules $out/lib/node_modules

    # Create wrapper for elm-watch
    makeWrapper ${pkgs.nodejs_22}/bin/node $out/bin/elm-watch \
      --add-flags "$out/lib/node_modules/.bin/elm-watch" \
      --set NODE_PATH "$out/lib/node_modules"
  '';
}
```

**infra/run-parallel/default.nix:**
```nix
{ pkgs }:

pkgs.stdenv.mkDerivation {
  pname = "run-parallel";
  version = "1.0.0";

  src = ./.;

  installPhase = ''
    mkdir -p $out/bin
    cp run-parallel.sh $out/bin/run-parallel
    chmod +x $out/bin/run-parallel
  '';
}
```

**infra/tasks/default.nix:**
```nix
{ pkgs }:

pkgs.stdenv.mkDerivation {
  pname = "task-configs";
  version = "1.0.0";

  src = ./.;

  installPhase = ''
    mkdir -p $out
    cp *.yaml $out/
  '';
}
```

**Step 3: Remove old flake files**

```bash
rm infra/elm-watch/flake.nix infra/elm-watch/flake.lock
rm infra/run-parallel/flake.nix infra/run-parallel/flake.lock
rm infra/tasks/flake.nix infra/tasks/flake.lock
```

**Step 4: Update main flake.nix - remove path inputs**

Remove these inputs:
```nix
# DELETE these
elm-watch.url = "path:./infra/elm-watch";
run-parallel.url = "path:./infra/run-parallel";
tasks.url = "path:./infra/tasks";
```

**Step 5: Update main flake.nix - import default.nix**

Add to the `let` block:

```nix
elm-watch = import ./infra/elm-watch { inherit pkgs; };
run-parallel = import ./infra/run-parallel { inherit pkgs; };
tasks = import ./infra/tasks { inherit pkgs; };
```

**Step 6: Update checkPhase references**

Update all references from `${tasks.packages.${system}.default}/` to `${tasks}/`:

```nix
# view derivation
checkPhase = ''
  run-parallel ${tasks}/check-view.yaml
'';

# bridge derivation
checkPhase = ''
  run-parallel ${tasks}/check-bridge.yaml
'';

# platform derivation
checkPhase = ''
  run-parallel ${tasks}/check-platform.yaml
'';
```

Similarly update `elmWatchTool` and `runParallelTool` to use direct imports instead of `.packages.${system}.default`.

**Step 7: Update devShell commands**

Update task file paths from `tasks/` to `infra/tasks/`:

```nix
{
  name = "setup";
  command = "run-parallel infra/tasks/setup.yaml";
}
{
  name = "dev";
  command = "mprocs --config infra/tasks/dev.yaml";
}
{
  name = "format";
  command = "run-parallel infra/tasks/format.yaml";
}
```

**Step 8: Extract layer builds to default.nix files**

Create default.nix for each main layer to keep flake.nix clean:

**view/default.nix:**
```nix
{ pkgs, elmBuildTools, elmWatchTool, runParallelTool, tasks }:

let
  elmReviewCache = pkgs.callPackage ./review { };
in
pkgs.mkElmDerivation {
  name = "scientific-assistant-view";
  src = ./.;
  elmJson = ./elm.json;

  nativeBuildInputs = elmBuildTools ++ elmWatchTool ++ runParallelTool;

  buildPhase = ''
    mkdir -p dist
    elm-watch make --optimize build
  '';

  checkPhase = ''
    mkdir -p .elm/0.19.1
    cp -r ${elmReviewCache}/.elm/0.19.1/* .elm/0.19.1/
    chmod -R u+w .elm

    run-parallel ${tasks}/check-view.yaml
  '';

  installPhase = ''
    mkdir -p $out/dist
    cp dist/elm.js $out/dist/
  '';

  doCheck = true;
}
```

**bridge/default.nix:**
```nix
{ pkgs, view, runParallelTool, tsLintTools, tasks }:

pkgs.buildNpmPackage {
  name = "scientific-assistant-bridge";
  src = ./.;
  npmDepsHash = "sha256-OinNutTEXVwTu1VQaMwaCD1TdSOFdO6NeacjzZILXwE=";

  nativeBuildInputs = runParallelTool ++ tsLintTools;

  dontNpmBuild = true;

  buildPhase = ''
    mkdir -p build
    cp ${view}/dist/elm.js build/
    npx vite build
  '';

  checkPhase = ''
    run-parallel ${tasks}/check-bridge.yaml
  '';

  installPhase = ''
    mkdir -p $out
    cp -r dist $out/
  '';

  doCheck = true;
}
```

**platform/default.nix:**
```nix
{ craneLib, bridge, tauriBuildTools, tauriRuntimeLibs, rustBuildTools, runParallelTool, tasks }:

let
  platformSrc = ./.;

  platformCargoArtifacts = craneLib.buildDepsOnly {
    src = platformSrc;
    nativeBuildInputs = tauriBuildTools;
    buildInputs = tauriRuntimeLibs;
  };
in
craneLib.buildPackage {
  src = platformSrc;
  cargoArtifacts = platformCargoArtifacts;

  nativeBuildInputs = tauriBuildTools ++ rustBuildTools ++ runParallelTool;
  buildInputs = tauriRuntimeLibs;

  preBuild = ''
    mkdir -p ../bridge/dist
    cp -r ${bridge}/dist/* ../bridge/dist/
  '';

  buildPhaseCargoCommand = "cargo tauri build";
  doNotPostBuildInstallCargoBinaries = true;

  checkPhase = ''
    run-parallel ${tasks}/check-platform.yaml
  '';

  installPhase = ''
    mkdir -p $out
    cp -r target/release/bundle $out/
  '';

  doCheck = true;
}
```

**Step 9: Rename cloudflare → proxy and extract wrangler**

Rename directory and update commands:

```bash
git mv cloudflare proxy
```

Create **proxy/default.nix:**
```nix
{ pkgs }:

let
  wrangler-patched = pkgs.wrangler.overrideAttrs (oldAttrs: {
    postInstall = (oldAttrs.postInstall or "") + ''
      rm -rf $out/lib/node_modules/prettier
      rm -rf $out/lib/node_modules/eslint
      rm -rf $out/lib/node_modules/typescript
      rm -rf $out/lib/packages/wrangler/node_modules/prettier
      rm -rf $out/lib/packages/wrangler/node_modules/eslint
      rm -rf $out/lib/packages/wrangler/node_modules/typescript
    '';
  });
in
{
  package = pkgs.buildNpmPackage {
    pname = "gemini-proxy";
    version = "1.0.0";
    src = ./.;
    npmDepsHash = "sha256-...";

    dontNpmBuild = true;

    checkPhase = ''
      npm test
    '';

    installPhase = ''
      mkdir -p $out
      cp -r . $out/
    '';

    doCheck = true;
  };

  wrangler = wrangler-patched;
}
```

Update main flake.nix to call packages:

```nix
# Import proxy
proxy = import ./proxy { inherit pkgs; };

# Application layers
view = pkgs.callPackage ./view {
  inherit elmBuildTools elmWatchTool runParallelTool tasks;
};

bridge = pkgs.callPackage ./bridge {
  inherit view runParallelTool tsLintTools tasks;
};

platform = pkgs.callPackage ./platform {
  inherit craneLib bridge tauriBuildTools tauriRuntimeLibs rustBuildTools runParallelTool tasks;
};

# Dev tools
proxyDevTools = [ proxy.wrangler ];
```

Update checks:

```nix
checks = {
  inherit view bridge platform;
  proxy = proxy.package;
  nix-fmt = ...;
};
```

Update devShell commands from `cf:*` to `proxy:*`:

```nix
{
  name = "proxy:test";
  command = "cd proxy && npm test";
}
{
  name = "proxy:dev";
  command = "cd proxy && wrangler dev";
}
{
  name = "proxy:deploy";
  command = "cd proxy && wrangler deploy";
}
```

Update infra/tasks/setup.yaml:

```yaml
tasks:
  - name: Bridge dependencies
    cmd: cd bridge && npm install
  - name: Proxy dependencies
    cmd: cd proxy && npm install
```

**Step 10: Update flake.lock**

```bash
nix flake update
```

---

## Task 9: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Add lint commands to Development Commands section**

Add after existing commands:

```markdown
## Linting Commands

```bash
# From project root (inside nix develop)
cd view && elm-review           # Elm linting
cd bridge && eslint src/        # TypeScript linting
cd platform && cargo clippy     # Rust linting
```

## CI/CD

- Push to `main`: Runs lint, format check, tests, build
- Push tag `v*`: Creates GitHub Release with Tauri binaries
- Platforms: macOS (ARM), Linux, Windows
```

---

## Task 10: Verify Design Document Alignment

**Goal:** Ensure main design document reflects infrastructure changes.

**Files:**
- Review/Update: `docs/plans/2025-12-13-elm-tauri-migration-design.md`

**Step 1: Verify Stack section**

Ensure these are documented:
- Crane for Rust builds (caching)
- Cachix for binary cache
- GitHub Actions for CI/CD

**Step 2: Verify Architecture section**

Ensure `infra/` directory structure is reflected.

**Step 3: Verify any new tooling**

- elm-review
- ESLint + Prettier (legacy settings)
- Cachix

**Step 4: Update if needed**

If design doc is outdated, update it to match implementation.

---

## Task 11: Commit and Mark Complete

**Step 1: Commit**

```bash
git add -A
git commit -m "feat: add infrastructure (linting, CI/CD)

- Add elm-review with unused/simplify rules
- Add ESLint + Prettier for TypeScript
- Add rustfmt.toml + .clippy.toml for Rust
- Create CI workflow (lint, test, build)
- Create Release workflow (multi-platform Tauri builds)
- Update check tasks with new linting

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Step 2: Mark phase complete**

Edit `docs/plans/2025-12-13-elm-tauri-migration-design.md`:

Change line 15 from:
```
| 3  | Infrastructure     | [ ]    | `03-infrastructure-plan.md`   |
```
To:
```
| 3  | Infrastructure     | [x]    | `03-infrastructure-plan.md`   |
```

---

## Verification Checklist

- [x] `nix flake check` passes (runs all checks: view, bridge, platform, proxy, nix-fmt)
- [x] `run-parallel infra/tasks/format.yaml` formats all code
- [x] Crane builds platform with cached dependencies
- [x] CI workflow runs on all platforms (Linux, macOS ARM, Windows)
- [x] Release workflow builds for all platforms
- [x] CI workflow file `.github/workflows/ci.yml` exists
- [x] Release workflow file `.github/workflows/release.yml` exists
- [x] flake.nix has `checks` output with view, bridge, platform, proxy, nix-fmt
- [x] flake.nix uses Crane for Rust builds
- [x] Infrastructure reorganized under `infra/` (elm-watch, run-parallel, tasks)
- [x] cloudflare renamed to proxy with proxy:* commands
- [x] Each layer has default.nix (view, bridge, platform, proxy)
- [x] proxy/default.nix exports package (with tests) and wrangler tool
- [x] Package groups consolidated into logical build/runtime/dev categories
- [x] Main design document updated (Phase 03 marked complete)
- [x] CLAUDE.md updated with linting, CI/CD, Crane, modular structure, proxy rename
- [x] README.md updated with linting, CI/CD, modular structure, proxy rename
- [x] .gitignore updated for proxy and infra paths

---

**Version**: 2.6 (Added Cachix, design doc verification)
