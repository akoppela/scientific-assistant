# Bootstrap Implementation Plan

**Goal:** Create working Tauri + Elm application shell with proper project structure, LLM guidelines, and documentation.

**Architecture:** Tauri wraps an Elm frontend. Elm compiles to JavaScript, loaded by Vite, served in Tauri webview. TypeScript bridge connects Elm ports to Tauri commands.

**Tech Stack:** Tauri 2.x, Elm 0.19.1, Vite 6.x, TypeScript 5.x, Nix flakes

**Reference:** `.claude/docs/plans/2025-12-13-elm-tauri-migration-design.md`

---

## Before Execution

1. **Invoke brainstorming skill** — Review this plan and the design document
2. **Analyze** — Check existing `flake.nix` and project structure
3. **Confirm** — User confirms plan accuracy before proceeding
4. **Proceed** — Use executing-plans + test-driven-development skills

---

## Prerequisites

Nix development shell provides all tools. Enter shell before executing tasks:

```bash
cd scientific-assistant
direnv allow  # or: nix develop
```

---

## Task 1: Initialize Tauri Project

**Files:**
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/src/main.rs`
- Create: `src-tauri/src/lib.rs`
- Create: `src-tauri/capabilities/default.json`
- Create: `src-tauri/build.rs`

**Step 1: Create Tauri Cargo.toml**

```toml
# src-tauri/Cargo.toml
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

**Step 2: Create Tauri config**

```json
// src-tauri/tauri.conf.json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Scientific Assistant",
  "version": "0.1.0",
  "identifier": "com.akoppela.scientific-assistant",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:5173",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
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

**Step 3: Create Rust main.rs**

```rust
// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    scientific_assistant_lib::run()
}
```

**Step 4: Create Rust lib.rs**

```rust
// src-tauri/src/lib.rs
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

**Step 5: Create capabilities**

```json
// src-tauri/capabilities/default.json
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

**Step 6: Create build.rs**

```rust
// src-tauri/build.rs
fn main() {
    tauri_build::build()
}
```

**Step 7: Create placeholder icons directory**

```bash
mkdir -p src-tauri/icons
```

**Step 8: Verify Rust compiles**

```bash
cd src-tauri && cargo check
```

Expected: Compilation succeeds with no errors.

---

## Task 2: Initialize Elm Application

**Files:**
- Create: `elm.json`
- Create: `src/Main.elm`

**Step 1: Create elm.json**

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

**Step 2: Create Main.elm**

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

**Step 3: Verify Elm compiles**

```bash
elm make src/Main.elm --output=/dev/null
```

Expected: Compilation succeeds with "Success!" message.

---

## Task 3: Initialize TypeScript Bridge

**Files:**
- Create: `package.json`
- Create: `ts/main.ts`
- Create: `tsconfig.json`
- Create: `index.html`

**Step 1: Create package.json**

```json
{
  "name": "scientific-assistant",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "elm make src/Main.elm --optimize --output=dist/elm.js && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "elm:build": "elm make src/Main.elm --output=dist/elm.js",
    "elm:watch": "elm make src/Main.elm --output=dist/elm.js --debug",
    "test": "elm-test"
  },
  "dependencies": {
    "@tauri-apps/api": "^2"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2",
    "typescript": "^5.7.0",
    "vite": "^6.0.0"
  }
}
```

**Step 2: Create tsconfig.json**

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

**Step 3: Create main.ts**

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

**Step 4: Create index.html**

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

**Step 5: Install dependencies**

```bash
npm install
```

Expected: Dependencies installed successfully.

---

## Task 4: Configure Vite

**Files:**
- Create: `vite.config.ts`

**Step 1: Create Vite config**

```typescript
// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: "esnext",
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_DEBUG,
    outDir: "dist",
    emptyDirOnFirstBuild: false,
  },
});
```

**Step 2: Create dist directory and build Elm**

```bash
mkdir -p dist
elm make src/Main.elm --output=dist/elm.js
```

Expected: `dist/elm.js` created successfully.

**Step 3: Verify Vite starts**

```bash
npm run dev &
sleep 3
curl -s http://localhost:5173 | head -20
pkill -f "vite"
```

Expected: HTML response containing `<div id="app">`.

---

## Task 5: Update Nix Flake

**Files:**
- Modify: `flake.nix`

**Step 1: Update flake.nix with complete tooling**

```nix
{
  description = "Scientific Assistant - Elm + Tauri";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfreePredicate = pkg: builtins.elem (nixpkgs.lib.getName pkg) [
            "claude-code"
          ];
        };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = [
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
            pkgs.cargo-tarpaulin
            pkgs.cargo-audit

            # Tauri dependencies (Linux)
            pkgs.pkg-config
            pkgs.openssl
            pkgs.webkitgtk_4_1
            pkgs.gtk3
            pkgs.libsoup_3
            pkgs.librsvg

            # Styling
            pkgs.tailwindcss

            # E2E Testing
            pkgs.playwright-driver.browsers

            # Nix
            pkgs.nixfmt-classic

            # LLM
            pkgs.claude-code
          ];

          shellHook = ''
            export PATH="$PWD/node_modules/.bin:$PATH"
            export PLAYWRIGHT_BROWSERS_PATH="${pkgs.playwright-driver.browsers}"
            export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
          '';
        };
      }
    );
}
```

**Step 2: Update flake.lock**

```bash
nix flake update
```

**Step 3: Verify shell enters**

```bash
nix develop --command echo "Shell works"
```

Expected: "Shell works" printed.

---

## Task 6: Create CLAUDE.md Guidelines

**Files:**
- Create: `CLAUDE.md`

**Step 1: Write LLM guidelines**

```markdown
# Claude Code Instructions

Scientific Assistant: Chat for forester/scientist. Russian UI. Outputs: tables, formulas, graphs, code, generated images.

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
| Playwright | latest  | E2E tests                      |
| Nix        | flakes  | Dev environment                |

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

## Testing

| Level     | Tool       | Run                   |
|-----------|------------|-----------------------|
| Elm unit  | elm-test   | `elm-test`            |
| Rust unit | cargo test | `cargo test`          |
| E2E       | Playwright | `npx playwright test` |

## Commands

```bash
npm run dev          # Vite dev server
npm run build        # Production build
npm run tauri dev    # Tauri dev mode
npm run tauri build  # Tauri production build
elm-test             # Run Elm tests
cargo test           # Run Rust tests
elm-format src/      # Format Elm
rustfmt src-tauri/   # Format Rust
```

## TDD Workflow

Every feature follows test-driven development:

1. Write failing test
2. Verify test fails for expected reason
3. Implement minimal code to pass
4. Verify test passes
5. Refactor if needed
6. Commit

---

**Version**: 1.0
```

---

## Task 7: Update README.md

**Files:**
- Modify: `README.md`

**Step 1: Rewrite README**

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

## Setup

```bash
git clone <repo>
cd scientific-assistant
direnv allow  # or: nix develop
npm install
```

## Development

```bash
# Start Vite dev server
npm run dev

# Start Tauri dev mode (in another terminal)
npm run tauri dev
```

## Build

```bash
npm run tauri build
```

Output: `src-tauri/target/release/bundle/`

## Test

```bash
elm-test           # Elm unit tests
cargo test         # Rust unit tests
npx playwright test  # E2E tests
```

## Project Structure

```
scientific-assistant/
├── src/              # Elm source
├── ts/               # TypeScript bridge
├── src-tauri/        # Rust backend
├── styles/           # Tailwind CSS
├── tests/            # Elm tests
├── e2e/              # Playwright tests
├── .claude/docs/     # Design and plans
├── flake.nix         # Nix dev environment
└── CLAUDE.md         # LLM guidelines
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

## Task 8: Create Test Infrastructure

**Files:**
- Create: `tests/MainTest.elm`

**Step 1: Create test file**

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

**Step 2: Verify test passes**

```bash
elm-test
```

Expected: "TEST RUN PASSED" with 1 passing test.

---

## Task 9: Verify Full Stack

**Step 1: Build Elm**

```bash
elm make src/Main.elm --output=dist/elm.js
```

Expected: Success.

**Step 2: Check Rust**

```bash
cd src-tauri && cargo check && cd ..
```

Expected: Success.

**Step 3: Run Elm tests**

```bash
elm-test
```

Expected: All tests pass.

**Step 4: Start dev server**

```bash
npm run dev &
DEV_PID=$!
sleep 3
curl -s http://localhost:5173 | grep -q "app" && echo "Dev server OK"
kill $DEV_PID
```

Expected: "Dev server OK".

---

## Task 10: Commit and Mark Complete

**Step 1: Create .gitignore updates**

```gitignore
# Dependencies
node_modules/
elm-stuff/

# Build
dist/
src-tauri/target/

# Environment
.direnv/
.env

# IDE
.idea/
*.swp

# OS
.DS_Store
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: bootstrap Elm + Tauri application

- Initialize Tauri 2.x with Rust backend
- Initialize Elm 0.19.1 with basic Main module
- Configure Vite for development
- Set up TypeScript bridge layer
- Update Nix flake with full tooling
- Add CLAUDE.md LLM guidelines
- Add test infrastructure

🤖 Generated with Claude Code"
```

**Step 3: Mark phase complete**

Edit `.claude/docs/plans/2025-12-13-elm-tauri-migration-design.md`:

Change line 13 from:
```
| 1 | Bootstrap | [ ] | `01-bootstrap-plan.md` |
```
To:
```
| 1 | Bootstrap | [x] | `01-bootstrap-plan.md` |
```

---

## Verification Checklist

- [ ] `nix develop` enters shell without errors
- [ ] `elm make src/Main.elm` compiles
- [ ] `cargo check` in src-tauri succeeds
- [ ] `npm run dev` starts Vite server
- [ ] `elm-test` passes
- [ ] All files created per file structure
- [ ] CLAUDE.md contains all guidelines
- [ ] README.md documents setup and usage
