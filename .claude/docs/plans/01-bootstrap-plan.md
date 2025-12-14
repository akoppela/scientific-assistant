# Bootstrap Implementation Plan (Revised)

**Goal:** Create working Tauri + Elm application shell with Nix-managed dependencies, proper project structure, and development tooling.

**Architecture:** Tauri wraps Elm frontend. Elm compiles to JavaScript, bundled by Vite, served in Tauri webview. All dependencies managed by Nix.

**Tech Stack:** Tauri 2.x, Elm 0.19.1, Vite 6.x, TypeScript 5.x, Nix flakes with devshell

**Reference:** `.claude/docs/plans/2025-12-13-elm-tauri-migration-design.md`

---

## Key Design Decisions

1. **Directory structure**: `frontend/` and `backend/` separation (not `src-tauri/`)
2. **Dependency management**: All deps via Nix (`buildNpmPackage` + `buildRustPackage`)
3. **Command interface**: `devshell` commands from project root
4. **Build/test/check**: Integrated into Nix derivation phases
5. **Format**: Separate command (formatting changes code)
6. **E2E tests**: Deferred to later phase

---

## Project Structure

```
scientific-assistant/
├── frontend/
│   ├── src/
│   │   └── Main.elm
│   ├── ts/
│   │   └── main.ts
│   ├── tests/
│   │   └── MainTest.elm
│   ├── elm.json
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── index.html
├── backend/
│   ├── src/
│   │   ├── main.rs
│   │   └── lib.rs
│   ├── capabilities/
│   │   └── default.json
│   ├── icons/           # placeholder
│   ├── Cargo.toml
│   ├── Cargo.lock
│   ├── tauri.conf.json
│   └── build.rs
├── .claude/docs/
├── flake.nix
├── flake.lock
├── .envrc
├── .gitignore
├── CLAUDE.md
└── README.md
```

---

## Nix Architecture

### **Three derivations**:

**1. `packages.frontend`** (`buildNpmPackage`)
- Builds: `elm make` → `vite build` → `dist/`
- Check phase: `elm-test`
- Output: `result/dist/` with bundled frontend

**2. `packages.backend`** (`buildRustPackage`)
- Builds: `cargo build --release`
- Check phase: `cargo test`, `cargo clippy`
- Output: `result/bin/scientific-assistant`

**3. `packages.app`** (combines both)
- Builds: Full Tauri bundle with frontend embedded
- Output: `.AppImage`, `.deb`, etc.

### **devshell commands**:
- `dev` - Start Tauri dev mode (hot reload)
- `build` - Build all packages (runs tests/checks)
- `build:frontend` - Build frontend only
- `build:backend` - Build backend only
- `format` - Format all code
- `clean` - Remove build artifacts

---

## Task 1: Create Project Structure

**Step 1: Create directories**

```bash
mkdir -p frontend/src frontend/ts frontend/tests
mkdir -p backend/src backend/capabilities backend/icons
```

---

## Task 2: Initialize Frontend (Minimal)

**Files to create**:
- `frontend/package.json`
- `frontend/elm.json`
- `frontend/src/Main.elm`
- `frontend/ts/main.ts`
- `frontend/tsconfig.json`
- `frontend/vite.config.ts`
- `frontend/index.html`
- `frontend/tests/MainTest.elm`

### **frontend/package.json**

```json
{
  "name": "scientific-assistant-frontend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "@tauri-apps/api": "^2.1.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vite": "^6.0.0"
  }
}
```

### **frontend/elm.json**

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
            "elm/html": "1.0.0",
            "elm/json": "1.1.3"
        },
        "indirect": {
            "elm/time": "1.0.0",
            "elm/url": "1.0.0",
            "elm/virtual-dom": "1.0.3"
        }
    },
    "test-dependencies": {
        "direct": {
            "elm-explorations/test": "2.2.0"
        },
        "indirect": {
            "elm/random": "1.0.0"
        }
    }
}
```

### **frontend/src/Main.elm**

```elm
module Main exposing (main)

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
        , p [ class "text-gray-600" ] [ text "Elm + Tauri" ]
        ]
```

### **frontend/ts/main.ts**

```typescript
// ts/main.ts
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

  // Initialize Elm
  const app = window.Elm.Main.init({ node: root });

  // Test Tauri command
  const greeting = await invoke<string>("greet", { name: "Elm" });
  console.log(greeting);
}

document.addEventListener("DOMContentLoaded", initApp);
```

### **frontend/tsconfig.json**

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
  "include": ["ts"]
}
```

### **frontend/vite.config.ts**

```typescript
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ["**/backend/**"],
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

### **frontend/index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Scientific Assistant</title>
    <script src="/dist/elm.js"></script>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/ts/main.ts"></script>
  </body>
</html>
```

### **frontend/tests/MainTest.elm**

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

**Step 2: Generate package-lock.json**

```bash
cd frontend && npm install && cd ..
```

---

## Task 3: Initialize Backend (Minimal)

**Files to create**:
- `backend/Cargo.toml`
- `backend/src/main.rs`
- `backend/src/lib.rs`
- `backend/tauri.conf.json`
- `backend/capabilities/default.json`
- `backend/build.rs`

### **backend/Cargo.toml**

```toml
[package]
name = "scientific-assistant"
version = "0.1.0"
description = "Scientific Assistant - Elm + Tauri"
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
strip = true
```

### **backend/src/main.rs**

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    scientific_assistant_lib::run()
}
```

### **backend/src/lib.rs**

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

### **backend/tauri.conf.json**

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Scientific Assistant",
  "version": "0.1.0",
  "identifier": "com.akoppela.scientific-assistant",
  "build": {
    "beforeDevCommand": "cd ../frontend && vite",
    "devUrl": "http://localhost:5173",
    "beforeBuildCommand": "cd ../frontend && elm make src/Main.elm --optimize --output=dist/elm.js && vite build",
    "frontendDist": "../frontend/dist"
  },
  "app": {
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

### **backend/capabilities/default.json**

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "identifier": "default",
  "description": "Default capabilities for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "opener:default"
  ]
}
```

### **backend/build.rs**

```rust
fn main() {
    tauri_build::build()
}
```

**Step 2: Create placeholder icons directory**

```bash
mkdir -p backend/icons
```

Note: Icons directory is required by `tauri.conf.json` but will remain empty during bootstrap. Actual icons will be added in later phases.

**Step 3: Generate Cargo.lock**

```bash
cd backend && cargo generate-lockfile && cd ..
```

---

## Task 4: Create Nix Flake (Phase 1 - Structure)

### **flake.nix**

```nix
{
  description = "Scientific Assistant - Elm + Tauri";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
    flake-utils.url = "github:numtide/flake-utils";
    devshell.url = "github:numtide/devshell";
    devshell.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs = { self, nixpkgs, flake-utils, devshell }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ devshell.overlays.default ];
          config.allowUnfreePredicate = pkg: builtins.elem (nixpkgs.lib.getName pkg) [
            "claude-code"
          ];
        };

        # Frontend package
        frontend = pkgs.buildNpmPackage {
          name = "scientific-assistant-frontend";
          src = ./frontend;
          npmDepsHash = "";  # Will be filled in Task 5

          nativeBuildInputs = [
            pkgs.elmPackages.elm
            pkgs.elmPackages.elm-test
          ];

          buildPhase = ''
            # Build Elm
            elm make src/Main.elm --optimize --output=dist/elm.js

            # Build with Vite
            npx vite build
          '';

          checkPhase = ''
            elm-test
          '';

          installPhase = ''
            mkdir -p $out
            cp -r dist $out/
          '';

          doCheck = true;
        };

        # Backend package
        backend = pkgs.rustPlatform.buildRustPackage {
          name = "scientific-assistant-backend";
          src = ./backend;

          cargoLock = {
            lockFile = ./backend/Cargo.lock;
          };

          nativeBuildInputs = [
            pkgs.pkg-config
            pkgs.cargo-tauri
          ];

          buildInputs = [
            pkgs.openssl
            pkgs.webkitgtk_6_0
            pkgs.gtk4
            pkgs.libsoup_3
            pkgs.librsvg
          ];

          checkPhase = ''
            cargo test
            cargo clippy -- -D warnings
          '';

          doCheck = true;
        };

        # Full application
        app = pkgs.stdenv.mkDerivation {
          name = "scientific-assistant";
          version = "0.1.0";

          src = ./.;

          nativeBuildInputs = [
            pkgs.cargo-tauri
            pkgs.pkg-config
          ];

          buildInputs = [
            pkgs.openssl
            pkgs.webkitgtk_6_0
            pkgs.gtk4
            pkgs.libsoup_3
            pkgs.librsvg
          ];

          buildPhase = ''
            # Copy frontend dist
            mkdir -p frontend/dist
            cp -r ${frontend}/dist/* frontend/dist/

            # Build Tauri app
            cd backend
            cargo tauri build
          '';

          installPhase = ''
            mkdir -p $out/bin
            cp -r target/release/bundle $out/
          '';
        };

      in
      {
        packages = {
          inherit frontend backend app;
          default = app;
        };

        devShells.default = pkgs.devshell.mkShell {
          name = "scientific-assistant";

          packages = [
            # Node.js
            pkgs.nodejs_22

            # Elm
            pkgs.elmPackages.elm
            pkgs.elmPackages.elm-format
            pkgs.elmPackages.elm-test
            pkgs.elmPackages.elm-json
            pkgs.elmPackages.elm-review

            # Rust
            pkgs.cargo
            pkgs.rustc
            pkgs.rustfmt
            pkgs.clippy
            pkgs.rust-analyzer
            pkgs.cargo-watch
            pkgs.cargo-tauri

            # Tauri dependencies
            pkgs.pkg-config
            pkgs.openssl
            pkgs.webkitgtk_6_0
            pkgs.gtk4
            pkgs.libsoup_3
            pkgs.librsvg

            # Styling
            pkgs.tailwindcss_4

            # Nix
            pkgs.nixfmt-classic

            # LLM
            pkgs.claude-code
          ];

          commands = [
            {
              name = "dev";
              category = "development";
              help = "Start Tauri dev mode (hot reload)";
              command = "cd backend && cargo tauri dev";
            }
            {
              name = "build";
              category = "build";
              help = "Build all packages (runs tests/checks)";
              command = "nix build .#app";
            }
            {
              name = "build:frontend";
              category = "build";
              help = "Build frontend package only";
              command = "nix build .#frontend";
            }
            {
              name = "build:backend";
              category = "build";
              help = "Build backend package only";
              command = "nix build .#backend";
            }
            {
              name = "format";
              category = "code quality";
              help = "Format all code (Elm + Rust + Nix)";
              command = "elm-format frontend/src/ --yes && rustfmt backend/src/**/*.rs && nixfmt-classic flake.nix";
            }
            {
              name = "clean";
              category = "maintenance";
              help = "Remove build artifacts";
              command = "rm -rf result frontend/dist frontend/elm-stuff backend/target";
            }
          ];

          env = [
            {
              name = "PATH";
              prefix = "${frontend}/node_modules/.bin";
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

## Task 5: Get Nix Hashes

**Step 1: Get npmDepsHash**

```bash
nix build .#frontend 2>&1 | grep "got:" | awk '{print $2}'
```

Copy the hash and update `flake.nix` line with `npmDepsHash = "sha256-...";`

**Step 2: Rebuild to verify**

```bash
nix build .#frontend
```

Expected: Build succeeds, `result/dist/` contains bundled files.

**Step 3: Build backend**

```bash
nix build .#backend
```

Expected: Build succeeds (cargoLock handles dependencies automatically).

---

## Task 6: Create Documentation

### **CLAUDE.md**

```markdown
# Claude Code Instructions

Scientific Assistant: Desktop chat application for scientific work. Russian UI. Outputs: tables, formulas, graphs, code, generated images.

## Documentation

| Location                                                      | Purpose              |
|---------------------------------------------------------------|----------------------|
| `.claude/docs/plans/2025-12-13-elm-tauri-migration-design.md` | Migration design     |
| `.claude/docs/plans/`                                         | Implementation plans |

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
├── frontend/         # Elm + TypeScript + Vite
│   ├── src/          # Elm modules
│   ├── ts/           # TypeScript bridge
│   ├── tests/        # Elm tests
│   └── ...
├── backend/          # Rust + Tauri
│   ├── src/          # Rust source
│   └── ...
├── .claude/docs/     # Design documents
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
build:frontend    # Build frontend only
build:backend     # Build backend only
format            # Format all code
clean             # Remove build artifacts
```

## Testing

| Level     | Tool       | When                     |
|-----------|------------|--------------------------|
| Elm unit  | elm-test   | During `build:frontend`  |
| Rust unit | cargo test | During `build:backend`   |

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
dev    # Start Tauri app in dev mode (hot reload)
```

Browser opens at http://localhost:5173, Tauri window appears.

## Build

```bash
build  # Build production app (runs all tests/checks)
```

Output: `result/bundle/`

## Commands

All commands run from project root inside `nix develop`:

| Command          | Purpose                           |
|------------------|-----------------------------------|
| `dev`            | Start dev mode (hot reload)       |
| `build`          | Build all (runs tests/checks)     |
| `build:frontend` | Build frontend only               |
| `build:backend`  | Build backend only                |
| `format`         | Format all code                   |
| `clean`          | Remove build artifacts            |

## Project Structure

```
scientific-assistant/
├── frontend/         # Elm + TypeScript + Vite
│   ├── src/          # Elm source
│   ├── ts/           # TypeScript bridge
│   ├── tests/        # Elm tests
│   └── ...
├── backend/          # Rust + Tauri
│   ├── src/          # Rust source
│   └── ...
├── .claude/docs/     # Design documents
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

# Frontend
frontend/node_modules/
frontend/elm-stuff/
frontend/dist/

# Backend
backend/target/

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

**Step 1: Verify Elm compiles**

```bash
cd frontend && elm make src/Main.elm --output=/dev/null
```

Expected: "Success!"

**Step 2: Verify Rust compiles**

```bash
cd backend && cargo check
```

Expected: No errors.

**Step 3: Build frontend package**

```bash
nix build .#frontend
ls -la result/dist/
```

Expected: Contains `elm.js`, `index.html`, bundled assets.

**Step 4: Build backend package**

```bash
nix build .#backend
```

Expected: Build succeeds, tests pass.

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

- Initialize Tauri 2.x backend with Rust
- Initialize Elm 0.19.1 frontend with TypeScript bridge
- Configure Vite 6.x for development
- Set up Nix flake with buildNpmPackage + buildRustPackage
- Add devshell commands (dev, build, format, clean)
- Integrate tests/checks into Nix build phases
- Add CLAUDE.md and README.md documentation
- Frontend/backend directory structure

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Step 3: Mark phase complete**

Update `.claude/docs/plans/2025-12-13-elm-tauri-migration-design.md`:

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

- [ ] `frontend/` and `backend/` directories created with subdirectories
- [ ] `backend/icons/` placeholder directory exists
- [ ] All source files in place (Main.elm, lib.rs, etc.)
- [ ] `frontend/package-lock.json` exists
- [ ] `backend/Cargo.lock` exists
- [ ] `flake.nix` has valid `npmDepsHash`
- [ ] `nix build .#frontend` succeeds
- [ ] `nix build .#backend` succeeds
- [ ] `nix develop` enters shell without errors
- [ ] `dev` command starts Tauri window
- [ ] CLAUDE.md and README.md created
- [ ] .gitignore updated
- [ ] Git commit created
- [ ] Design doc marked complete

---

**Version**: 2.0 (Revised with Nix-managed dependencies)
