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
| TypeScript | 5.9.x   | JS bridge layer                |
| Vite       | 7.x     | Build, dev server              |
| elm-watch  | 1.2.x   | Elm hot reload (dev only)      |
| vitest     | 4.x     | TypeScript testing             |
| Tailwind   | 4.x     | Styling                        |
| Nix        | flakes  | Dev environment, builds        |

## Project Structure

```
scientific-assistant/
├── view/             # Elm UI layer
│   ├── src/          # Elm source
│   ├── tests/        # Elm tests
│   ├── dist/         # Elm output (gitignored)
│   └── elm-watch.json  # Two targets: dev (→ bridge/build/), build (→ dist/)
├── bridge/           # TypeScript integration layer
│   ├── src/          # TypeScript source
│   │   └── __tests__/  # vitest tests
│   ├── build/        # elm.js from view (gitignored)
│   ├── dist/         # Vite output (gitignored)
│   └── ...
├── platform/         # Tauri native layer
│   ├── src/          # Rust source
│   ├── tauri.conf.json  # Main config
│   ├── tauri.{linux,windows,macos}.conf.json  # Platform-specific
│   └── ...
├── elm-watch/        # elm-watch packaged for Nix
│   ├── package.json  # elm-watch dependency
│   └── flake.nix     # buildNpmPackage + makeWrapper
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
4. **Tests in __tests__/** — All tests go in `__tests__/` directory next to source.

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
dev             # Start Tauri dev mode (hot reload)
build:view      # Build view layer (Elm UI)
build:bridge    # Build bridge layer (TypeScript integration)
build:platform  # Build platform layer (Tauri + Rust)
format          # Format all code
clean           # Remove build artifacts
```

## Build Architecture

**Development workflow:**
1. Run `setup` once to install bridge/node_modules (vite, vitest, typescript)
2. Run `dev` to start:
   - elm-watch hot dev (view/ → bridge/build/elm.js)
   - vite dev server (bridge/ with HMR)
   - cargo tauri dev (platform/ with webview)

**Production (Nix three-layer):**
- view: elm-watch make build → dist/elm.js
- bridge: Vite bundles main.ts + elm.js → dist/
- platform: Cargo tauri build → .deb, .rpm (Linux), .msi, .nsis (Windows), .dmg, .app (macOS)

**elm-watch targets:**
- "dev": outputs to ../bridge/build/elm.js (for development)
- "build": outputs to dist/elm.js (for Nix builds)

## Testing

| Level     | Tool       | When                    |
|-----------|------------|-------------------------|
| Elm unit  | elm-test   | During `build:view`     |
| TS unit   | vitest     | During `build:bridge`   |
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
