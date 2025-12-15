# Bootstrap Implementation Plan (Revised)

**Goal:** Create working Tauri + Elm application shell with Nix-managed dependencies, proper project structure, and development tooling.

**Architecture:** Three-layer design - view (Elm UI), bridge (TypeScript integration), platform (Tauri native). elm-watch outputs to `bridge/build/elm.js`, Vite bundles to `bridge/dist/`, Tauri serves in webview. All dependencies managed by Nix.

**Tech Stack:** Tauri 2.x, Elm 0.19.1, elm-watch 1.2.x (dev), Vite 7.x, TypeScript 5.9.x, vitest 4.x, Nix flakes with devshell, mkElmDerivation

**Reference:** `docs/plans/2025-12-13-elm-tauri-migration-design.md`

---

## Key Design Decisions

1. **Three-layer architecture**: `view/` (Elm UI), `bridge/` (TS integration), `platform/` (Tauri native)
2. **Elm compilation**: elm-watch outputs to `bridge/build/elm.js` for dev, Nix copies to same location
3. **Script tag loading**: Elm loaded via `<script src="/build/elm.js">`, accessed via `window.Elm`
4. **Platform-specific configs**: `tauri.{linux,windows,macos}.conf.json` auto-merged by Tauri
5. **Dependency management**: mkElmDerivation, buildNpmPackage, buildRustPackage with 10 package groups
6. **Command interface**: `devshell` commands from project root
7. **PKG_CONFIG_PATH**: Configured via devshell env for GTK development
8. **Build/test/check**: Integrated into Nix derivation phases (elm-test, vitest, cargo test + clippy)
9. **Format**: Separate command (elm-format, rustfmt, nixpkgs-fmt)
10. **E2E tests**: Deferred to later phase

---

## Project Structure

```
scientific-assistant/
├── view/                   # Elm UI layer
│   ├── src/
│   │   └── Main.elm
│   ├── tests/
│   │   └── MainTest.elm
│   ├── dist/               # gitignored, elm output
│   │   └── elm.js
│   ├── elm.json
│   └── elm-watch.json
├── bridge/                 # TypeScript integration layer
│   ├── src/
│   │   ├── main.ts
│   │   └── __tests__/
│   │       └── main.test.ts
│   ├── build/              # gitignored, elm.js from view
│   │   └── elm.js
│   ├── dist/               # gitignored, vite output
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   └── index.html
├── platform/               # Tauri native layer
│   ├── src/
│   │   ├── main.rs
│   │   └── lib.rs
│   ├── capabilities/
│   │   └── default.json
│   ├── icons/
│   │   └── *.png, *.ico, *.icns
│   ├── Cargo.toml
│   ├── Cargo.lock
│   ├── tauri.conf.json
│   ├── tauri.linux.conf.json
│   ├── tauri.windows.conf.json
│   ├── tauri.macos.conf.json
│   └── build.rs
├── elm-watch/              # elm-watch packaged for Nix
│   ├── package.json
│   ├── package-lock.json
│   └── flake.nix           # buildNpmPackage + makeWrapper
├── run-parallel/           # Parallel task runner
│   ├── run-parallel.sh
│   └── flake.nix           # stdenv.mkDerivation
├── tasks/                  # Task configurations
│   ├── dev.yaml            # mprocs: elm-watch, vite, tauri
│   ├── format.yaml         # run-parallel: Elm, Rust, Nix formatting
│   ├── check-view.yaml     # run-parallel: elm-test, elm-format validate
│   ├── check-bridge.yaml   # run-parallel: vitest
│   ├── check-platform.yaml # run-parallel: cargo test, clippy
│   └── flake.nix           # Packages YAML configs
├── docs/
├── flake.nix
├── flake.lock
├── .envrc
├── .gitignore
├── CLAUDE.md
└── README.md
```

---

## Nix Architecture

### **Three derivations (architectural layers)**:

**1. `packages.view`** (`mkElmDerivation`)
- **Layer**: Presentation - Pure Elm UI
- Builds: `elm make --optimize` → `dist/elm.js`
- Check: `elm-test`, `elm-format --validate`
- Output: `result/dist/elm.js` (~107KB optimized)
- Source: `./view`

**2. `packages.bridge`** (`buildNpmPackage`)
- **Layer**: Integration - TypeScript bridge + bundling
- Depends on: `view` (copies `elm.js` to `build/`)
- Builds: Vite bundles main.ts + elm.js → `dist/`
- Check: `vitest run` (TypeScript tests in `src/__tests__/`)
- Output: `result/dist/` (index.html, bundled assets)
- Source: `./bridge`
- Note: Elm loaded via script tag, accessed as `window.Elm`

**3. `packages.platform`** (`buildRustPackage`)
- **Layer**: Platform - Tauri + Rust native
- Depends on: `bridge` (copies `dist/` to `../bridge/dist/`)
- Builds: `cargo tauri build` → platform-specific bundles
- Check: `cargo test`, `cargo clippy`
- Output: `result/bin/bundle/` (.deb, .rpm on Linux; .msi, .nsis on Windows; .dmg, .platform on macOS)
- Source: `./platform`
- Config: Platform-specific via `tauri.{linux,windows,macos}.conf.json`

### **Package Groups** (organized by build vs dev):

**Elm:**
- `elmBuildTools`: elm, elm-format, elm-test (used in view build)
- `elmDevTools`: elm-json, elm-review (dev shell only)

**Rust:**
- `rustCoreTools`: cargo, rustc (dev shell, provided by buildRustPackage in builds)
- `rustBuildTools`: clippy, rustfmt (used in platform checkPhase)
- `rustDevTools`: rust-analyzer, cargo-watch (dev shell only)

**Tauri:**
- `tauriBuildTools`: pkg-config, cargo-tauri, gobject-introspection (nativeBuildInputs)
- `tauriRuntimeLibs`: at-spi2-atk, atkmm, cairo, glib, gtk3, harfbuzz, librsvg, libsoup_3, pango, webkitgtk_4_1, openssl (buildInputs)
- `tauriDevPackages`: gdk-pixbuf, atk (dev shell only, for pkg-config .pc files)

**Other:**
- `nodeTools`: nodejs_22 (both build and dev)
- `elmWatchTool`: elm-watch (from ./elm-watch flake)
- `runParallelTool`: run-parallel (from ./run-parallel flake, used in checkPhases)
- `processRunners`: mprocs + run-parallel (interactive TUI + one-shot tasks)
- `styleDevTools`: tailwindcss_4 (dev only)
- `nixDevTools`: nixpkgs-fmt (dev only)
- `gitDevTools`: gh (dev only)
- `llmDevTools`: claude-code (dev only)

**Packaged tools:**

**elm-watch** (`./elm-watch/`):
- Packages elm-watch npm tool using buildNpmPackage + makeWrapper
- Used in: view builds, devShell

**run-parallel** (`./run-parallel/`):
- Parallel task runner with grouped, colored output
- Reads YAML configs, runs tasks in parallel, groups output by task
- Used in: checkPhases (all layers), format command, devShell

**tasks** (`./tasks/`):
- Packages all task YAML configurations
- Used in: checkPhases reference configs via ${tasks.packages.${system}.default}/check-*.yaml

### **devshell commands**:
- `dev` - Start Tauri dev mode (elm-watch + vite hot reload)
- `build` - Build complete application (runs all tests/checks)
- `build:view` - Build view layer (Elm UI)
- `build:bridge` - Build bridge layer (TypeScript integration)
- `build:platform` - Build platform layer (Tauri + Rust)
- `format` - Format all code (Elm + Rust + Nix)
- `clean` - Remove build artifacts

---

## Task 1: Create Project Structure

**Step 1: Create directories**

```bash
mkdir -p view/src view/tests
mkdir -p bridge/src bridge/src/__tests__
mkdir -p platform/src platform/capabilities platform/icons
```

Note:
- `view/dist/` - Elm compilation output (gitignored)
- `bridge/build/` - elm.js from view (gitignored)
- `bridge/dist/` - Vite bundle output (gitignored)

---

## Task 2: Initialize View and Bridge Layers

**View layer files (Elm UI)**:
- `view/elm.json` (use `elm init`)
- `view/elm-watch.json`
- `view/src/Main.elm`
- `view/tests/MainTest.elm`

**Bridge layer files (TypeScript integration)**:
- `bridge/package.json`
- `bridge/index.html`
- `bridge/src/main.ts`
- `bridge/src/__tests__/main.test.ts`
- `bridge/tsconfig.json`
- `bridge/vite.config.ts`
- `bridge/vitest.config.ts`

### **view/elm-watch.json**

```json
{
  "targets": {
    "Main": {
      "inputs": [
        "src/Main.elm"
      ],
      "output": "../bridge/build/elm.js"
    }
  }
}
```

Note: Outputs to bridge layer for both dev (elm-watch) and build (Nix copies).

### **bridge/package.json**

```json
{
  "name": "scientific-assistant-bridge",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "@tauri-apps/api": "^2.9.1"
  },
  "devDependencies": {
    "elm-watch": "^1.2.3",
    "typescript": "^5.9.3",
    "vite": "^7.2.7",
    "vitest": "^4.0.15"
  }
}
```

### **view/elm.json**

```json
{
    "type": "application",
    "source-directories": [
        "src"
    ],
    "elm-version": "0.19.1",
    "dependencies": {
        "direct": {
            "elm/browser": "1.0.2",
            "elm/core": "1.0.5",
            "elm/html": "1.0.1"
        },
        "indirect": {
            "elm/json": "1.1.4",
            "elm/time": "1.0.0",
            "elm/url": "1.0.0",
            "elm/virtual-dom": "1.0.5"
        }
    },
    "test-dependencies": {
        "direct": {},
        "indirect": {}
    }
}
```

Note: Empty test-dependencies required for mkElmDerivation compatibility. Use `elm init` to generate.

### **bridge/elm-watch.json**

```json
{
  "targets": {
    "Main": {
      "inputs": [
        "src/Main.elm"
      ],
      "output": "build/elm.js"
    }
  }
}
```

### **view/src/Main.elm**

```elm
module Main exposing (Model, init, main)

import Browser
import Html exposing (Html, div, h1, p, text)
import Html.Attributes exposing (class)


main : Program () Model Msg
main =
    Browser.element
        { init = init
        , update = update
        , subscriptions = subscriptions
        , view = view
        }



-- MODEL


type alias Model =
    { message : String
    }


init : () -> ( Model, Cmd Msg )
init _ =
    ( { message = "Scientific Assistant" }
    , Cmd.none
    )



-- UPDATE


type Msg
    = NoOp


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        NoOp ->
            ( model, Cmd.none )



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.none



-- VIEW


view : Model -> Html Msg
view model =
    div [ class "flex flex-col items-center justify-center h-screen" ]
        [ h1 [ class "text-4xl font-bold mb-4" ] [ text model.message ]
        ]
```

### **bridge/src/main.ts**

```typescript
import { invoke } from "@tauri-apps/api/core";

declare global {
  interface Window {
    Elm: {
      Main: {
        init: (options: { node: HTMLElement }) => ElmApp;
      };
    };
  }
}

interface ElmApp {
  ports: Record<string, unknown>;
}

async function initApp(): Promise<void> {
  const root = document.getElementById("app");
  if (!root) {
    throw new Error("Root element #app not found");
  }

  // Initialize Elm (loaded via script tag)
  const app: ElmApp = window.Elm.Main.init({ node: root });

  // Test Tauri command
  const greeting = await invoke<string>("greet", { name: "Elm" });
  console.log(greeting);
}

document.addEventListener("DOMContentLoaded", initApp);
```

### **bridge/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

### **bridge/vite.config.ts**

```typescript
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ["**/platform/**"],
    },
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: "esnext",
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_DEBUG,
    outDir: "dist",
  },
});
```

Note: No Elm plugin needed - elm-watch compiles Elm to build/elm.js, Vite just bundles.

### **bridge/vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/__tests__/**/*.test.ts"],
  },
});
```

### **bridge/src/__tests__/main.test.ts**

```typescript
import { describe, it, expect } from "vitest";

describe("main", () => {
  it("basic smoke test", () => {
    expect(1 + 1).toBe(2);
  });
});
```

### **bridge/index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Scientific Assistant</title>
    <script src="/build/elm.js"></script>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

Note: Elm loaded via script tag, accessed as `window.Elm` in main.ts.

### **view/tests/MainTest.elm**

```elm
module MainTest exposing (..)

import Expect
import Main
import Test exposing (Test, describe, test)


suite : Test
suite =
    describe "Main"
        [ test "init creates model with correct message" <|
            \_ ->
                let
                    ( model, _ ) =
                        Main.init ()
                in
                Expect.equal model.message "Scientific Assistant"
        ]
```

**Step 2: Initialize Elm tests**

```bash
cd view && elm-test init
```

Note: Sets up test-dependencies in elm.json properly.

**Step 3: Generate package-lock.json**

```bash
cd bridge && npm install --package-lock-only
```

Note: Uses `--package-lock-only` to avoid creating node_modules/ directory.

---

## Task 3: Initialize Platform Layer (Tauri + Rust)

**Files to create**:
- `platform/Cargo.toml`
- `platform/src/main.rs`
- `platform/src/lib.rs`
- `platform/tauri.conf.json`
- `platform/tauri.linux.conf.json`
- `platform/tauri.windows.conf.json`
- `platform/tauri.macos.conf.json`
- `platform/capabilities/default.json`
- `platform/build.rs`
- `platform/icons/*.png, *.ico, *.icns`

### **platform/Cargo.toml**

```toml
[package]
name = "scientific-assistant"
version = "0.1.0"
description = "Scientific Assistant"
authors = ["Andrey Koppel"]
edition = "2021"

[lib]
name = "scientific_assistant_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-opener = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"

[profile.release]
panic = "abort"
codegen-units = 1
lto = true
opt-level = "s"
strip = "debuginfo"
```

### **platform/src/main.rs**

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    scientific_assistant_lib::run()
}
```

### **platform/src/lib.rs**

```rust
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### **platform/tauri.conf.json**

```json
{
  "$schema": "https://schema.tauri.platform/config/2",
  "productName": "Scientific Assistant",
  "version": "0.1.0",
  "identifier": "com.akoppela.scientific-assistant",
  "build": {
    "beforeDevCommand": "",
    "devUrl": "http://localhost:5173",
    "beforeBuildCommand": "",
    "frontendDist": "../bridge/dist"
  },
  "platform": {
    "withGlobalTauri": true,
    "windows": [
      {
        "title": "Scientific Assistant",
        "width": 1024,
        "height": 768,
        "resizable": true,
        "fullscreen": false
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

Note: beforeDevCommand and beforeBuildCommand are empty - workflow orchestrated via devshell commands.

### **platform/tauri.linux.conf.json**

```json
{
  "bundle": {
    "targets": ["deb", "rpm"]
  }
}
```

### **platform/tauri.windows.conf.json**

```json
{
  "bundle": {
    "targets": ["msi", "nsis"]
  }
}
```

### **platform/tauri.macos.conf.json**

```json
{
  "bundle": {
    "targets": ["dmg", "platform"]
  }
}
```

Note: Platform-specific configs auto-merge with main tauri.conf.json.

### **platform/capabilities/default.json**

```json
{
  "$schema": "https://schema.tauri.platform/config/2",
  "identifier": "default",
  "description": "Default capabilities for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "opener:default"
  ]
}
```

### **platform/build.rs**

```rust
fn main() {
    tauri_build::build()
}
```

**Step 2: Create placeholder icons**

```bash
cd platform/icons
nix-shell -p 'python3.withPackages(ps: [ps.pillow])' --run 'python3 << EOF
from PIL import Image

# Create RGBA icons (Tauri requires alpha channel)
for size in [32, 128]:
    img = Image.new("RGBA", (size, size), (0, 0, 255, 255))
    img.save(f"{size}x{size}.png")

img128 = Image.new("RGBA", (128, 128), (0, 0, 255, 255))
img128.save("128x128@2x.png")

img32 = Image.new("RGBA", (32, 32), (0, 0, 255, 255))
img32.save("icon.ico")
img128.save("icon.icns")
EOF
'
cd ../..
```

Note: Tauri requires RGBA PNG icons. These are blue placeholders. Replace with actual icons later.

**Step 3: Generate Cargo.lock**

```bash
cd platform && cargo generate-lockfile && cd ..
```

---

## Task 4: Create Nix Flake (Phase 1 - Structure)

### **flake.nix**

```nix
{
  description = "Scientific Assistant";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
    flake-utils.url = "github:numtide/flake-utils";
    devshell.url = "github:numtide/devshell";
    devshell.inputs.nixpkgs.follows = "nixpkgs";
    mkElmDerivation.url = "github:jeslie0/mkElmDerivation";
    mkElmDerivation.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs = { self, nixpkgs, flake-utils, devshell, mkElmDerivation }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [
            devshell.overlays.default
            mkElmDerivation.overlays.mkElmDerivation
          ];
          config.allowUnfreePredicate = pkg: builtins.elem (nixpkgs.lib.getName pkg) [
            "claude-code"
          ];
        };

        # Reusable package groups (split by build vs dev)

        # Elm build tools (needed for Nix derivations)
        elmBuildTools = with pkgs.elmPackages; [ elm elm-format elm-test ];

        # Elm dev tools (dev shell only)
        elmDevTools = with pkgs.elmPackages; [ elm-json elm-review ];

        # Rust core tools (cargo/rustc - provided by buildRustPackage in builds, needed in dev shell)
        rustCoreTools = with pkgs; [ cargo rustc ];

        # Rust build tools (linters/formatters for checkPhase)
        rustBuildTools = with pkgs; [ clippy rustfmt ];

        # Rust dev tools (dev shell only)
        rustDevTools = with pkgs; [ rust-analyzer cargo-watch ];

        # Tauri build-time dependencies (run during compilation)
        tauriBuildTools = with pkgs; [ pkg-config cargo-tauri gobject-introspection ];

        # Tauri runtime libraries (linked into binary)
        tauriRuntimeLibs = with pkgs; [ at-spi2-atk atkmm cairo glib gtk3 harfbuzz librsvg libsoup_3 pango webkitgtk_4_1 openssl ];

        # Additional dev packages (for pkg-config, not linked)
        tauriDevPackages = with pkgs; [ gdk-pixbuf atk ];

        # Node.js (needed for both build and dev)
        nodeTools = with pkgs; [ nodejs_22 ];

        # CSS/Styling (dev only)
        styleDevTools = with pkgs; [ tailwindcss_4 ];

        # Nix formatter (dev only)
        nixDevTools = with pkgs; [ nixpkgs-fmt ];

        # Git/GitHub CLI (dev only)
        gitDevTools = with pkgs; [ gh ];

        # AI assistance (dev only)
        llmDevTools = with pkgs; [ claude-code ];

        # View layer (Elm UI)
        view = pkgs.mkElmDerivation {
          name = "scientific-assistant-view";
          src = ./view;
          elmJson = ./view/elm.json;

          nativeBuildInputs = elmBuildTools;

          buildPhase = ''
            mkdir -p dist
            elm make src/Main.elm --optimize --output=dist/elm.js
          '';

          checkPhase = ''
            elm-test
            elm-format --validate src/
          '';

          installPhase = ''
            mkdir -p $out/dist
            cp dist/elm.js $out/dist/
          '';

          doCheck = true;
        };

        # Bridge layer (TypeScript integration + bundling)
        bridge = pkgs.buildNpmPackage {
          name = "scientific-assistant-bridge";
          src = ./bridge;
          npmDepsHash = "sha256-tWXiWnfJdRAgH/0EzJe5O/8B8iblTPYTHHD1nqHJkuc=";

          buildPhase = ''
            # Copy pre-compiled Elm from view layer
            mkdir -p build
            cp ${view}/dist/elm.js build/

            # Build with Vite
            npx vite build
          '';

          checkPhase = ''
            npx vitest run
          '';

          installPhase = ''
            mkdir -p $out
            cp -r dist $out/
          '';

          doCheck = true;
        };

        # Platform layer (Tauri + Rust native)
        platform = pkgs.rustPlatform.buildRustPackage {
          pname = "scientific-assistant";
          version = "0.1.0";

          src = ./platform;

          cargoLock = {
            lockFile = ./platform/Cargo.lock;
          };

          nativeBuildInputs = tauriBuildTools ++ rustBuildTools;
          buildInputs = tauriRuntimeLibs;

          buildPhase = ''
            # Copy bridge layer output
            mkdir -p ../bridge/dist
            cp -r ${bridge}/dist/* ../bridge/dist/

            # Build Tauri app
            cargo tauri build
          '';

          checkPhase = ''
            cargo test
            cargo clippy --all-targets -- -D warnings
          '';

          installPhase = ''
            mkdir -p $out/bin
            cp -r target/release/bundle $out/
          '';

          doCheck = true;
        };

      in
      {
        packages = {
          inherit view bridge platform;
          default = platform;
        };

        devShells.default = pkgs.devshell.mkShell {
          name = "scientific-assistant";

          packages = elmBuildTools ++ elmDevTools
                  ++ rustCoreTools ++ rustBuildTools ++ rustDevTools
                  ++ tauriBuildTools ++ tauriRuntimeLibs
                  ++ nodeTools
                  ++ styleDevTools ++ nixDevTools ++ gitDevTools ++ llmDevTools;

          env = [
            {
              name = "PKG_CONFIG_PATH";
              eval = "${pkgs.lib.makeSearchPathOutput "dev" "lib/pkgconfig" (tauriRuntimeLibs ++ tauriDevPackages)}:${pkgs.lib.makeSearchPathOutput "out" "lib/pkgconfig" (tauriRuntimeLibs ++ tauriDevPackages)}";
            }
          ];

          commands = [
            {
              name = "dev";
              category = "development";
              help = "Start Tauri dev mode (hot reload)";
              command = "(cd bridge && npx elm-watch hot --cwd ../view) & (cd bridge && npx vite) & (cd platform && cargo tauri dev)";
            }
            {
              name = "build";
              category = "build";
              help = "Build all packages (runs tests/checks)";
              command = "nix build .#platform";
            }
            {
              name = "build:view";
              category = "build";
              help = "Build Elm only";
              command = "nix build .#view";
            }
            {
              name = "build:bridge";
              category = "build";
              help = "Build bridge package only";
              command = "nix build .#bridge";
            }
            {
              name = "build:platform";
              category = "build";
              help = "Build platform package only";
              command = "nix build .#platform";
            }
            {
              name = "format";
              category = "code quality";
              help = "Format all code (Elm + Rust + Nix)";
              command = "elm-format view/src/ --yes && find platform/src -name '*.rs' -exec rustfmt {} + ; nixpkgs-fmt flake.nix";
            }
            {
              name = "clean";
              category = "maintenance";
              help = "Remove build artifacts";
              command = "rm -rf result view/dist view/elm-stuff bridge/build bridge/dist platform/target";
            }
          ];

          env = [
            {
              name = "PKG_CONFIG_PATH";
              eval = "${pkgs.lib.makeSearchPathOutput "dev" "lib/pkgconfig" (tauriRuntimeLibs ++ tauriDevPackages)}:${pkgs.lib.makeSearchPathOutput "out" "lib/pkgconfig" (tauriRuntimeLibs ++ tauriDevPackages)}";
            }
          ];
        };
      }
    );
}
```

**Step 2: Update flake.lock**

```bash
nix flake update
```

---

## Task 5: Get Nix Hashes and Verify Builds

**Step 1: Build view (no hash needed)**

```bash
nix build .#view
ls -la result/dist/elm.js
```

Expected: Build succeeds, `result/dist/elm.js` exists (~107KB optimized).

**Step 2: Get npmDepsHash for bridge**

```bash
nix build .#bridge 2>&1 | grep "got:" | awk '{print $2}'
```

Copy the hash and update `flake.nix` bridge package with `npmDepsHash = "sha256-...";`

**Step 3: Rebuild bridge to verify**

```bash
nix build .#bridge
ls -la result/dist/
```

Expected: Build succeeds, `result/dist/` contains bundled files (index.html, assets/).

**Step 4: Build platform**

```bash
nix build .#platform
```

Expected: Build succeeds, tests and clippy pass (cargoLock handles dependencies automatically).

---

## Task 6: Create Documentation

### **CLAUDE.md**

```markdown
# Claude Code Instructions

Scientific Assistant: Desktop chat application for scientific work. Russian UI. Outputs: tables, formulas, graphs, code, generated images.

## Documentation

| Location                                              | Purpose              |
|-------------------------------------------------------|----------------------|
| `docs/plans/2025-12-13-elm-tauri-migration-design.md` | Migration design     |
| `docs/plans/`                                         | Implementation plans |

## Stack

| Technology | Version | Purpose                        |
|------------|---------|--------------------------------|
| Elm        | 0.19.1  | UI, state management           |
| Tauri      | 2.x     | Desktop shell, native features |
| TypeScript | 5.x     | JS bridge layer                |
| Vite       | 6.x     | Build, dev server              |
| Tailwind   | 4.x     | Styling                        |
| Nix        | flakes  | Dev environment, builds        |

## Project Structure

```
scientific-assistant/
├── bridge/           # Elm + TypeScript + Vite
│   ├── src/          # Elm and TypeScript source
│   ├── tests/        # Elm tests
│   └── ...
├── platform/         # Rust + Tauri
│   ├── src/          # Rust source
│   └── ...
├── docs/             # Design documents
└── flake.nix         # Nix configuration
```

## Elm Rules

1. **Feature modules** — One module per feature with complete TEA cycle (`Model`, `Msg`, `init`, `update`, `view`, `subscriptions`).
2. **No Model/View/Update splits** — All in one file per feature.
3. **Type aliases for records** — `type alias Model = { ... }`.
4. **Custom types for variants** — `type Msg = Clicked | Loaded Data`.
5. **Namespace imports** — `import Feature.Chat as Chat` then `Chat.Model`.
6. **Ports for side effects** — All JS interop via ports.
7. **Decoders fail explicitly** — No `Maybe` swallowing, surface errors.

```elm
-- Good: Feature module
module Feature.Chat exposing (Model, Msg, init, update, view, subscriptions)

type alias Model = { messages : List Message }
type Msg = Send String | Received Message

-- Bad: Split across files
module Feature.Chat.Model exposing (..)
module Feature.Chat.View exposing (..)
```

## TypeScript Rules

1. **Strict mode** — No `any`, no implicit `any`.
2. **Explicit types** — Function parameters and returns typed.
3. **Ports are typed** — Define port interfaces.

```typescript
// Good: Typed port interface
interface ElmApp {
  ports: {
    sendMessage: { subscribe: (callback: (msg: string) => void) => void };
    receiveMessage: { send: (msg: Message) => void };
  };
}

// Bad: Untyped
const app = window.Elm.Main.init({ node: root });
app.ports.sendMessage.subscribe((msg: any) => {});
```

## Rust Rules

1. **Commands return Result** — `Result<T, String>` for Tauri commands.
2. **Serde for serialization** — `#[derive(Serialize, Deserialize)]`.
3. **No unwrap in commands** — Use `?` operator or explicit error handling.

```rust
// Good: Result return
#[tauri::command]
fn save_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, &content).map_err(|e| e.to_string())
}

// Bad: Panics
#[tauri::command]
fn save_file(path: String, content: String) {
    std::fs::write(&path, &content).unwrap();
}
```

## Development Commands

From project root (inside `nix develop`):

```bash
dev               # Start Tauri dev mode (hot reload)
build             # Build all packages (runs tests/checks)
build:bridge    # Build bridge only
build:platform     # Build platform only
format            # Format all code
clean             # Remove build artifacts
```

## Testing

| Level     | Tool       | When                    |
|-----------|------------|-------------------------|
| Elm unit  | elm-test   | During `build:bridge`   |
| Rust unit | cargo test | During `build:platform` |

Tests run automatically during Nix builds.

## TDD Workflow

Every feature follows test-driven development:

1. Write failing test
2. Verify test fails for expected reason
3. Implement minimal code to pass
4. Verify test passes (via `build` command)
5. Refactor if needed
6. Commit

---

**Version**: 1.0
```

### **README.md**

```markdown
# Scientific Assistant

Desktop chat application for scientific work. Built with Elm + Tauri.

## Features

- Chat with AI models (Gemini)
- Image attachments and generation
- Search grounding
- Session export/import
- Russian/English interface
- Light/dark theme

## Requirements

- Nix with flakes enabled
- direnv (recommended)

## Setup

```bash
git clone <repo>
cd scientific-assistant
direnv allow  # or: nix develop
```

## Development

```bash
dev    # Start Tauri platform in dev mode (hot reload)
```

Browser opens at http://localhost:5173, Tauri window appears.

## Build

```bash
build  # Build production platform (runs all tests/checks)
```

Output: `result/bundle/`

## Commands

All commands run from project root inside `nix develop`:

| Command          | Purpose                       |
|------------------|-------------------------------|
| `dev`            | Start dev mode (hot reload)   |
| `build`          | Build all (runs tests/checks) |
| `build:bridge`   | Build bridge only             |
| `build:platform` | Build platform only           |
| `format`         | Format all code               |
| `clean`          | Remove build artifacts        |

## Project Structure

```
scientific-assistant/
├── bridge/           # Elm + TypeScript + Vite
│   ├── src/          # Elm and TypeScript source
│   ├── tests/        # Elm tests
│   └── ...
├── platform/         # Rust + Tauri
│   ├── src/          # Rust source
│   └── ...
├── docs/             # Design documents
└── flake.nix         # Nix configuration
```

## Architecture

```
Elm (UI) ←→ Ports ←→ TypeScript ←→ Tauri (Rust)
                          ↓
                    Cloudflare Proxy
                          ↓
                      Gemini API
```

---

**Version**: 0.1.0
```

---

## Task 7: Update .gitignore

### **.gitignore**

```gitignore
# Nix
result
result-*

# View layer
view/elm-stuff/
view/dist/

# Bridge layer
bridge/node_modules/
bridge/build/
bridge/dist/

# Platform layer
platform/target/

# Environment
.direnv/
.env

# IDE
.idea/
*.swp
.vscode/

# OS
.DS_Store
```

---

## Task 8: Verify Full Stack

**Step 1: Verify Elm compiles with elm-watch**

```bash
cd view && elm-watch make
ls -la ../bridge/build/elm.js
```

Expected: "Success!", `../bridge/build/elm.js` exists.

**Step 2: Verify Rust compiles**

```bash
cd platform && cargo check
```

Expected: No errors.

**Step 3: Build view package**

```bash
nix build .#view
ls -la result/dist/elm.js
```

Expected: Contains optimized `elm.js` (~107KB).

**Step 4: Build bridge package**

```bash
nix build .#bridge
ls -la result/dist/
```

Expected: Contains `index.html`, bundled assets in `assets/`.

**Step 5: Build platform package**

```bash
nix build .#platform
```

Expected: Build succeeds, tests and clippy pass.

**Step 5: Enter dev shell**

```bash
nix develop
```

Expected: Shell enters, devshell menu displays commands.

**Step 6: Test dev mode**

```bash
dev
```

Expected: Vite starts, Tauri window opens showing "Scientific Assistant".

---

## Task 9: Commit and Mark Complete

**Step 1: Stage all files**

```bash
git add -A
```

**Step 2: Commit**

```bash
git commit -m "feat: bootstrap Elm + Tauri application with Nix

- Initialize Tauri 2.x platform with Rust
- Initialize Elm 0.19.1 bridge with TypeScript bridge
- Configure Vite 6.x for development
- Set up Nix flake with buildNpmPackage + buildRustPackage
- Add devshell commands (dev, build, format, clean)
- Integrate tests/checks into Nix build phases
- Add CLAUDE.md and README.md documentation
- Frontend/platform directory structure

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Step 3: Mark phase complete**

Update `docs/plans/2025-12-13-elm-tauri-migration-design.md`:

Change:
```
| 1 | Bootstrap | [ ] | `01-bootstrap-plan.md` |
```

To:
```
| 1 | Bootstrap | [x] | `01-bootstrap-plan.md` |
```

---

## Verification Checklist

After execution, verify:

- [ ] `view/`, `bridge/`, `platform/` directories created with subdirectories
- [ ] `bridge/build/` directory exists (gitignored)
- [ ] `platform/icons/` RGBA icons created
- [ ] All source files in place (Main.elm, main.ts, lib.rs, etc.)
- [ ] `view/elm-watch.json` exists (outputs to ../bridge/build/elm.js)
- [ ] `view/elm.json` created with `elm init` + `elm-test init`
- [ ] `bridge/package-lock.json` exists
- [ ] `platform/Cargo.lock` exists
- [ ] `platform/tauri.{linux,windows,macos}.conf.json` exist
- [ ] `flake.nix` has valid `npmDepsHash`
- [ ] `flake.nix` uses mkElmDerivation with proper overlays
- [ ] `flake.nix` has 10 package groups (build vs dev split)
- [ ] `flake.nix` PKG_CONFIG_PATH configured via env
- [ ] `nix build .#view` succeeds (elm.js ~107KB)
- [ ] `nix build .#bridge` succeeds (dist/ with bundled assets)
- [ ] `nix build .#platform` succeeds (.deb, .rpm created, tests + clippy pass)
- [ ] `nix develop` enters shell without errors
- [ ] `cargo check` works in dev shell
- [ ] CLAUDE.md and README.md created
- [ ] .gitignore updated for three-layer structure
- [ ] Git commit created
- [ ] Design doc marked complete

---

**Version**: 4.0 (Implemented with three-layer architecture: view, bridge, platform)
