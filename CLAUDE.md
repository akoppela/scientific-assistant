# Claude Code Instructions

Scientific Assistant: Desktop chat application for scientific work. Russian UI. Outputs: tables, formulas, graphs, code, generated images.

## Documentation

| Location                                              | Purpose              |
|-------------------------------------------------------|----------------------|
| `docs/plans/2025-12-13-elm-tauri-migration-design.md` | Migration design     |
| `docs/plans/`                                         | Implementation plans |
| `docs/backlog/`                                       | Notes and ideas      |
| `docs/archive/`                                       | Completed docs       |

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
│   ├── review/       # elm-review configuration
│   ├── dist/         # Elm output (gitignored)
│   ├── elm-watch.json  # Two targets: dev (→ bridge/build/), build (→ dist/)
│   └── default.nix   # Nix build definition
├── bridge/           # TypeScript integration layer
│   ├── src/          # TypeScript source
│   │   └── __tests__/  # vitest tests
│   ├── build/        # elm.js from view (gitignored)
│   ├── dist/         # Vite output (gitignored)
│   └── default.nix   # Nix build definition
├── platform/         # Tauri native layer
│   ├── src/          # Rust source
│   ├── tauri.conf.json  # Main config
│   ├── tauri.{linux,windows,macos}.conf.json  # Platform-specific
│   └── default.nix   # Nix build definition (uses Crane)
├── infra/            # Nix infrastructure packages
│   ├── elm-watch/    # elm-watch packaged for Nix
│   │   └── default.nix
│   ├── run-parallel/ # Parallel task runner
│   │   └── default.nix
│   └── tasks/        # Task definitions (YAML)
│       └── default.nix
├── proxy/            # Cloudflare Worker (Gemini API proxy)
│   ├── src/          # Worker source
│   │   └── __tests__/  # vitest tests
│   ├── .dev.vars     # Local secrets (gitignored)
│   └── default.nix   # Exports wrangler tool + package (with tests)
├── docs/             # Documentation
│   ├── plans/        # Implementation plans
│   ├── backlog/      # Notes and ideas
│   └── archive/      # Completed docs
└── flake.nix         # Main Nix configuration (imports all default.nix files)
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
proxy:test      # Run proxy tests
proxy:dev       # Start proxy dev server
proxy:deploy    # Deploy proxy to Cloudflare
```

## Linting Commands

From project root (inside `nix develop`):

```bash
cd view && elm-review           # Elm linting
cd bridge && eslint src/        # TypeScript linting
cd platform && cargo clippy     # Rust linting
```

## Proxy

Cloudflare Worker at `proxy/` proxies Gemini API calls with authentication.

**Local development:**
1. Run `setup` (installs dependencies)
2. Copy `proxy/.dev.vars.example` to `proxy/.dev.vars`
3. Fill in `GEMINI_API_KEY` and `PROXY_API_KEY`
4. Run `proxy:dev`

**Production deployment (once):**
```bash
wrangler login
cd proxy
wrangler secret put GEMINI_API_KEY
wrangler secret put PROXY_API_KEY
proxy:deploy
```

**Usage from client:**
```typescript
fetch("https://gemini-proxy.xxx.workers.dev/?model=gemini-2.5-flash", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${PROXY_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ contents: [...] })
});
```

## CI/CD

**GitHub Actions workflows:**
- `.github/workflows/ci.yml` - Runs on push/PR in NixOS container with Cachix
- `.github/workflows/release.yml` - Runs on version tags, builds Linux packages

**Binary cache (public repos only):**
- Cachix cache: `scientific-assistant` (free for public repos)
- Setup locally: `cachix use scientific-assistant`
- CI automatically uses cache (no auth needed for public caches)

**Release process:**
1. Tag version: `git tag v0.1.0 && git push --tags`
2. GitHub Actions builds for Linux (x86_64)
3. Artifacts uploaded as draft release
4. Review and publish release manually

**Note:** macOS and Windows builds to be added in future phase.

## Build Architecture

**Development workflow:**
1. Run `setup` once to install npm dependencies (bridge + proxy)
2. Run `dev` to start:
   - elm-watch hot dev (view/ → bridge/build/elm.js)
   - vite dev server (bridge/ with HMR)
   - cargo tauri dev (platform/ with webview)

**Production (Nix three-layer with Crane):**
- view: elm-watch make build → dist/elm.js
- bridge: Vite bundles main.ts + elm.js → dist/
- platform: Crane builds Rust deps (cached) → cargo tauri build → bundles
  - Crane separates dependency builds for better caching
  - Outputs: .deb, .rpm (Linux), .dmg, .app (macOS)

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
