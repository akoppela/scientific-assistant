# Claude Code Instructions

Scientific Assistant: Desktop chat application for scientific work. Russian UI. Outputs: tables, formulas, graphs, code, generated images.

## Documentation

| Location                                              | Purpose              |
|-------------------------------------------------------|----------------------|
| `docs/plans/2025-12-13-elm-tauri-migration-design.md` | Migration design     |
| `docs/plans/`                                         | Implementation plans |
| `docs/backlog/`                                       | Notes and ideas      |
| `docs/archive/`                                       | Completed docs       |

## License

This project is licensed under the **Mozilla Public License 2.0 (MPL-2.0)**.

**License headers:** All source files must include the MPL-2.0 license header at the top.

**Elm:**
```elm
{- This Source Code Form is subject to the terms of the Mozilla Public
   License, v. 2.0. If a copy of the MPL was not distributed with this
   file, You can obtain one at https://mozilla.org/MPL/2.0/.
-}
```

**TypeScript/JavaScript:**
```typescript
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
```

**Rust:**
```rust
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
```

**CSS:**
```css
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
```

**When creating new files:** Add the appropriate license header as the first lines of the file, before any code or imports.

## Stack

| Technology | Version | Purpose                        |
|------------|---------|--------------------------------|
| Elm        | 0.19.1  | UI, state management           |
| Tauri      | 2.x     | Desktop shell, native features |
| TypeScript | 5.x     | JS bridge layer                |
| Vite       | 7.2.x   | Build, dev server              |
| elm-watch  | 1.2.3   | Elm hot reload (dev only)      |
| vitest     | 4.x     | TypeScript testing             |
| Tailwind   | 4.x     | Styling (via @tailwindcss/vite)|
| echarts    | 6.x     | Charts and visualizations      |
| Nix        | flakes  | Dev environment, builds        |

## Project Structure

```
scientific-assistant/
├── view/                                      # Elm UI layer
│   ├── src/                                   # Elm source (UI/, Extra/ modules)
│   ├── tests/                                 # Elm tests (mirrors src/)
│   ├── review/                                # elm-review configuration
│   ├── dist/                                  # Elm output (gitignored)
│   ├── elm-watch.json                         # Two targets: dev (→ bridge/public/), build (→ dist/)
│   └── default.nix                            # Nix build definition
├── bridge/                                    # TypeScript integration layer
│   ├── src/                                   # TypeScript source
│   │   └── __tests__/                         # vitest tests
│   ├── public/                                # elm.js from view (gitignored)
│   ├── dist/                                  # Vite output (gitignored)
│   └── default.nix                            # Nix build definition
├── platform/                                  # Tauri native layer
│   ├── src/                                   # Rust source
│   ├── capabilities/                          # Tauri capabilities (permissions)
│   ├── icons/                                 # App icons (png, icns, ico)
│   ├── tauri.conf.json                        # Main config
│   ├── tauri.{linux,windows,macos}.conf.json  # Platform-specific
│   └── default.nix                            # Nix build definition (uses Crane)
├── infra/                                     # Nix infrastructure packages
│   ├── design-system/                         # Design system npm package
│   │   ├── src/styles/                        # CSS (fonts, tokens, base, markdown)
│   │   ├── src/fonts/                         # Self-hosted WOFF2 fonts
│   │   ├── src/ts/                            # TypeScript (charts, tokens, custom elements)
│   │   │   └── __tests__/                     # vitest tests
│   │   └── package.json                       # Consumed by bridge and landing
│   ├── elm-watch/                             # elm-watch packaged for Nix
│   │   └── default.nix
│   ├── run-parallel/                          # Parallel task runner
│   │   └── default.nix
│   └── tasks/                                 # Task definitions (YAML)
│       └── default.nix
├── landing/                                   # Landing site (GitHub Pages)
│   ├── src/                                   # TypeScript source (design-system.ts)
│   ├── public/                                # Static assets (favicon)
│   ├── *.html                                 # index.html, design-system.html
│   ├── styles.css                             # Imports design-system
│   ├── vite.config.ts                         # Multi-page build
│   └── default.nix                            # buildNpmPackage with formatting checks
├── proxy/                                     # Cloudflare Worker (Gemini API proxy)
│   ├── src/                                   # Worker source
│   │   └── __tests__/                         # vitest tests
│   ├── .dev.vars                              # Local secrets (gitignored)
│   └── default.nix                            # Exports wrangler tool + package (with tests)
├── docs/                                      # Documentation
│   ├── plans/                                 # Implementation plans
│   ├── backlog/                               # Notes and ideas
│   └── archive/                               # Completed docs
├── .github/workflows/                         # GitHub Actions
│   ├── ci.yml                                 # CI on push/PR
│   ├── release.yml                            # Release on version tags
│   └── deploy-landing.yml                     # Landing site deployment
└── flake.nix                                  # Main Nix configuration (imports all default.nix files)
```

## Elm Rules

1. **Feature modules** — One module per feature with complete TEA cycle (`Model`, `Msg`, `init`, `update`, `view`, `subscriptions`).
2. **No Model/View/Update splits** — All in one file per feature.
3. **Type aliases for records** — `type alias Model = { ... }`.
4. **Custom types for variants** — `type Msg = Clicked | Loaded Data`.
5. **Qualified imports only** — No `exposing`, all imports qualified. `import Html` then `Html.div`.
6. **Ports for side effects** — All JS interop via ports.
7. **Decoders fail explicitly** — No `Maybe` swallowing, surface errors.
8. **Full documentation** — All modules, types, and functions documented (enforced by elm-review).
9. **Tests mirror source** — `tests/UI/` matches `src/UI/` structure.

```elm
-- Good: Feature module with qualified imports
module Feature.Chat exposing (Model, Msg, init, update, view)

import Html
import Html.Attributes as Attrs
import Html.Events as Events

type alias Model = { messages : List Message }
type Msg = Send String | Received Message

view model = Html.div [ Attrs.class "chat" ] [ ... ]

-- Bad: Exposing from imports
import Html exposing (Html, div, text)
import Html.Attributes exposing (class)
```

## TypeScript Rules

1. **Strict mode** — No `any`, no implicit `any`.
2. **Explicit types** — Function parameters and returns typed.
3. **Interfaces for objects** — Use `interface` (not `type alias`) for object shapes.
4. **Ports are typed** — Define port interfaces for Elm interop.
5. **Namespace imports** — `import * as Module from './module'`, use `Module.function()`.
6. **Tests in __tests__/** — All tests go in `__tests__/` directory next to source.
7. **Module pattern** — Export functions, import as namespace (`Theme.set`, `Theme.load`).

```typescript
// Good: Namespace import with module pattern
import * as Theme from './theme';

export function set(theme: string): void { ... }
export function load(): string { ... }

// Usage: Theme.set('dark'), Theme.load()

// Good: Interface for object shapes
interface ElmPorts {
  setTheme: { subscribe: (callback: (theme: string) => void) => void };
}

// Bad: Named imports
import { setTheme, loadTheme } from './theme';
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
# Development
setup                 # Install all npm dependencies (design-system + bridge + landing + proxy)
dev                   # Start Tauri dev mode (hot reload)
dev:landing           # Start landing site dev server
format                # Format all code (Elm + TypeScript + HTML + Rust + Nix)
clean                 # Remove build artifacts

# Build layers
build:view            # Build view layer (Elm)
build:bridge          # Build bridge layer (TypeScript + Vite)
build:platform        # Build platform layer (Rust + Tauri)
build:landing         # Build landing site (HTML + Vite)
build:design-system   # Build design system (CSS + TypeScript)

# Proxy (Cloudflare Worker)
proxy:test            # Run proxy tests
proxy:dev             # Start proxy dev server
proxy:deploy          # Deploy proxy to Cloudflare
```

## Linting Commands

From project root:

```bash
cd view && elm-review                   # Elm linting
cd bridge && eslint .                   # TypeScript linting
cd landing && eslint .                  # TypeScript linting
cd infra/design-system && eslint .      # TypeScript linting
cd proxy && eslint .                    # TypeScript linting
cd platform && cargo clippy             # Rust linting
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
- `.github/workflows/deploy-landing.yml` - Deploys landing site to GitHub Pages

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
1. Run `setup` once to install npm dependencies (design-system + bridge + landing + proxy)
2. Run `dev` to start:
   - elm-watch hot dev (view/ → bridge/public/elm.js)
   - vite dev server (bridge/ with HMR)
   - cargo tauri dev (platform/ with webview)

**Production (Nix three-layer with Crane):**
- view: elm-watch make build → dist/elm.js
- bridge: Vite bundles main.ts + elm.js → dist/
- platform: Crane builds Rust deps (cached) → cargo tauri build → bundles
  - Crane separates dependency builds for better caching
  - Outputs: .deb, .rpm (Linux), .dmg, .app (macOS)

**elm-watch targets:**
- "dev": outputs to ../bridge/public/elm.js (for development)
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

## Versioning

**Per-package versioning:** Each package maintains its own version independently in both `package.json` and `default.nix`.

**When to bump versions:**
- **Patch (1.0.0 → 1.0.1):** Bug fixes, documentation updates, internal refactoring
- **Minor (1.0.0 → 1.1.0):** New features, non-breaking API changes
- **Major (1.0.0 → 2.0.0):** Breaking changes, API redesigns

**Version bump workflow:**
1. Make code changes to a package
2. Update version in **both** files:
   - `<package>/package.json` (for npm packages: bridge, landing, proxy, design-system)
   - `<package>/default.nix` (all packages)
3. Ensure both versions match
4. Commit with message like "chore(bridge): bump version to 1.1.0"

**Why per-package versioning:**
- Nix only rebuilds packages when their inputs change
- Independent versions prevent unnecessary rebuilds
- Each package can evolve at its own pace
- Clear dependency tracking

**Note:** elm-watch (1.2.3) tracks upstream version and should not be bumped unless upgrading the external tool.

## Internationalization

Hand-written Elm module at `view/src/I18n.elm`.

**Adding translations:**
1. Add function to `I18n.elm` with `Language -> String` signature
2. Add to module's exposing list
3. Use in view: `I18n.newKey model.language`

**Interpolation (use named arguments):**
```elm
stepOf : Language -> { current : Int, total : Int } -> String
stepOf lang { current, total } =
    case lang of
        En -> "Step " ++ String.fromInt current ++ " of " ++ String.fromInt total
        Ru -> "Шаг " ++ String.fromInt current ++ " из " ++ String.fromInt total
```

**Pluralization:**
- English: `pluralEn count "file" "files"` → "1 file", "2 files"
- Russian: `pluralRu count "файл" "файла" "файлов"` → "1 файл", "2 файла", "5 файлов"

**Design:**
- Hand-written functions — only `Language` in model, no translation data
- Each layer owns its translations (no shared source)
- Missing translation = compile error
- Add translations as features are built (elm-review flags unused)
