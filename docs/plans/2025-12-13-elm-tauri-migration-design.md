# Elm + Tauri Migration Design

Migration from Solid.js to Elm + Tauri for Scientific Assistant.

## Purpose

Replace Solid.js with Elm to eliminate runtime exceptions and timing issues. Add Tauri for native desktop features, auto-updates, and smaller binary size.

## Progress Tracking

| #  | Phase              | Status | Plan Document                 |
|----|--------------------|--------|-------------------------------|
| 1  | Bootstrap          | [x]    | `01-bootstrap-plan.md`        |
| 2  | Cloudflare Proxy   | [x]    | `02-cloudflare-proxy-plan.md` |
| 3  | Infrastructure     | [x]    | `03-infrastructure-plan.md`   |
| 4  | Re-design          | [ ]    | `04-redesign-plan.md`         |
| 5  | i18n               | [ ]    | `05-i18n-plan.md`             |
| 6  | Main Shell         | [ ]    | `06-main-shell-plan.md`       |
| 7  | Message List + LLM | [ ]    | `07-message-list-plan.md`     |
| 8  | Chat Features      | [ ]    | `08-chat-features-plan.md`    |
| 9  | Session Features   | [ ]    | `09-session-features-plan.md` |
| 10 | Tutorial           | [ ]    | `10-tutorial-plan.md`         |
| 11 | E2E Tests          | [ ]    | `11-e2e-tests-plan.md`        |

Mark `[x]` when phase complete. Each plan includes completion step that updates this table.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Tauri App                          │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐    │
│  │                   Elm (TEA)                     │    │
│  │  Model → Update → View                          │    │
│  │  - All UI logic                                 │    │
│  │  - State management                             │    │
│  │  - Type-safe, no runtime exceptions             │    │
│  └──────────────────┬──────────────────────────────┘    │
│                     │ Ports                             │
│  ┌──────────────────▼──────────────────────────────┐    │
│  │              JS Bridge Layer                    │    │
│  │  - Web APIs (localStorage, fetch, clipboard)    │    │
│  │  - Tauri invoke() for native features           │    │
│  │  - Custom elements when needed                  │    │
│  └──────────────────┬──────────────────────────────┘    │
│                     │ invoke()                          │
│  ┌──────────────────▼──────────────────────────────┐    │
│  │              Rust (Tauri)                       │    │
│  │  - File dialogs (import/export)                 │    │
│  │  - Performance-heavy operations                 │    │
│  │  - Auto-updater                                 │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼ fetch (with API key)
┌─────────────────────────────────────────────────────────┐
│              Cloudflare Proxy (authenticated)           │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                     Gemini API                          │
└─────────────────────────────────────────────────────────┘
```

## Stack

| Layer   | Technology                 | Purpose                        |
|---------|----------------------------|--------------------------------|
| UI      | Elm 0.19.1                 | Type-safe UI, TEA architecture |
| Styling | Tailwind + shadcn tokens   | Pure CSS, clean aesthetic      |
| Bridge  | TypeScript 5.9.x           | Ports ↔ Tauri, Web APIs        |
| Build   | Vite 7.x + elm-watch 1.2.x | Dev server, HMR, bundling      |
| Backend | Rust (Tauri 2.x)           | Native features, performance   |
| Proxy   | Cloudflare Worker          | Authenticated Gemini gateway   |
| DevEnv  | Nix flakes + devshell      | Reproducible builds, all deps  |
| Process | mprocs                     | Parallel dev processes         |
| CI/CD   | GitHub Actions             | Multi-platform builds          |

## Tooling

### Rust (Bootstrap)

| Tool        | Purpose                |
|-------------|------------------------|
| rustfmt     | Formatting             |
| clippy      | Linting                |
| cargo test  | Unit tests             |
| cargo-watch | Auto-rebuild on change |

### Elm (Bootstrap)

| Tool       | Purpose    |
|------------|------------|
| elm-format | Formatting |
| elm-review | Linting    |
| elm-test   | Unit tests |
| elm-watch  | Hot reload |

### TypeScript

| Tool     | Purpose           |
|----------|-------------------|
| vitest   | Testing           |
| Vite     | Build, dev server |
| eslint   | Linting           |
| prettier | Formatting        |

### Process Management

| Tool         | Purpose                                  |
|--------------|------------------------------------------|
| mprocs       | Interactive TUI for dev processes        |
| run-parallel | Parallel task runner with grouped output |

### Nix & CI/CD

| Tool        | Purpose                 |
|-------------|-------------------------|
| nixpkgs-fmt | Nix file formatting     |
| Crane       | Rust dependency caching |

**Phase 03 Complete:** eslint, prettier, elm-review, Crane, multi-platform CI/CD workflows added.

**Note:** Additional tools (elm-program-test, elm-codegen, cargo-tarpaulin, cargo-audit, Playwright) will be added in later phases.

## Elm Architecture

Feature-based modules. Each stateful feature manages its complete TEA cycle internally:

```elm
-- src/Feature/Chat.elm
module Feature.Chat exposing (Model, Msg, init, update, view, subscriptions)

type alias Model = { ... }

type Msg = ...

init : Model

update : Msg -> Model -> ( Model, Cmd Msg )

view : Model -> Html Msg

subscriptions : Model -> Sub Msg
```

No splitting into separate Model.elm, View.elm, Update.elm files. One module = one feature = complete encapsulation.

### Parent-Child Communication

```elm
-- Main.elm composes features
type Model =
    { chat : Chat.Model
    , header : Header.Model
    , tutorial : Tutorial.Model
    }

type Msg
    = ChatMsg Chat.Msg
    | HeaderMsg Header.Msg
    | TutorialMsg Tutorial.Msg

update msg model =
    case msg of
        ChatMsg subMsg ->
            let
                ( chatModel, chatCmd ) = Chat.update subMsg model.chat
            in
            ( { model | chat = chatModel }, Cmd.map ChatMsg chatCmd )
```

## Communication Patterns

### Elm ↔ JavaScript

Ports for Tauri commands and complex interactions:

```elm
port saveFile : { name : String, content : String } -> Cmd msg
port fileSaved : (Result String ()) -> Sub msg
```

Web APIs used directly via ports for:
- localStorage (theme, session persistence)
- fetch (API calls to Cloudflare proxy)
- navigator.clipboard (copy functionality)

Custom elements for complex widgets when encapsulation benefits outweigh port complexity.

### JavaScript ↔ Rust

Tauri invoke for native features:

```typescript
import { invoke } from '@tauri-apps/api/core';

const result = await invoke('save_file', { path, content });
```

## Secrets Management

Build-time injection via environment variables:

1. `PROXY_API_KEY` set in CI/CD environment
2. Injected at build time into Rust binary
3. Sent with requests to Cloudflare proxy
4. Proxy validates key before forwarding to Gemini

Flow:
```
Tauri App (compiled PROXY_API_KEY) → Cloudflare Proxy (validates) → Gemini API
```

## Internationalization

Single YAML source of truth:

```yaml
# translations/translations.yaml
greeting:
  en: "Hello"
  ru: "Привет"
stepOf:
  en: "Step {current} of {total}"
  ru: "Шаг {current} из {total}"
models:
  fast:
    en: "Fast"
    ru: "Быстрая"
```

Build generates:
- `src/I18n.elm` via elm-codegen (type-safe)
- `ts/i18n.ts` via custom script (if needed)
- `src-tauri/src/i18n.rs` via custom script (if needed)

Missing translation key = compile error in Elm.

## LLM Types

Provider-agnostic types, Gemini-only implementation:

```elm
type Role
    = User
    | Assistant

type ContentPart
    = Text String
    | Image ImageData
    | Thought String

type alias Message =
    { role : Role
    , content : List ContentPart
    }

type alias GroundingChunk =
    { title : String
    , url : String
    }

-- Provider-specific config isolated
type alias GeminiConfig =
    { model : GeminiModel
    , searchGrounding : Bool
    }

type GeminiModel
    = Fast
    | Thinking
    | Creative
```

Adding new provider: implement same `Message` interface, add config type.

## Error Handling

| Error Type             | Display           | Action       |
|------------------------|-------------------|--------------|
| API/Message failure    | Inline in message | Retry button |
| Session import failure | Alert             | Dismiss      |
| File operation failure | Alert             | Dismiss      |
| Network error          | Alert             | Dismiss      |

Offline mode: Not supported. App requires internet connection.

## Loading States

- Spinners for all loading states
- Streaming responses: render as plain text during stream, format on completion
- Skeleton screens: not used (spinners only)

## Accessibility

Full accessibility support:
- Keyboard navigation for all interactive elements
- ARIA labels and roles
- Focus management (modals, dialogs)
- Screen reader compatibility
- Sufficient color contrast (shadcn tokens provide this)

## Performance

- Lazy load images in message history
- Offload heavy operations to Rust (parsing, file operations)
- Virtual scrolling for large conversation histories (if needed)
- Bundle size monitored via Vite build output

## Testing Strategy

| Level       | Tool             | What to Test                                   |
|-------------|------------------|------------------------------------------------|
| Unit        | elm-test         | Pure functions, decoders, i18n, business logic |
| Integration | elm-program-test | Full TEA flows, user scenarios                 |
| E2E         | Playwright       | Critical paths, real API, Tauri features       |
| Rust        | cargo test       | Tauri commands, file operations                |

Coverage priority: Elm unit tests > elm-program-test > Playwright > Rust tests.

Fast feedback loop: most bugs caught at Elm compile time or unit test level.

## Release & Distribution

### Platforms

| Platform              | Format         |
|-----------------------|----------------|
| macOS (Apple Silicon) | .dmg           |
| Windows               | .msi           |
| Linux                 | AppImage, .deb |

### Pipeline

1. Nix builds release artifacts (deterministic)
2. GitHub Actions runs on tag push
3. Artifacts uploaded to GitHub Releases
4. Tauri auto-updater checks GitHub Releases
5. Users notified of updates, install with one click

## Migration Phases

Each phase produces a deployable application. Each plan marks completion in Progress Tracking table above.

### Execution Process for Each Phase

1. **Invoke brainstorming skill** — Analyze existing legacy implementation
2. **Review and confirm** — User confirms plan accuracy before proceeding
3. **Invoke writing-plans skill** — Update plan if needed based on brainstorming
4. **Invoke executing-plans + test-driven-development** — Implement the phase
5. **Update CLAUDE.md** — Add relevant guidelines for the feature
6. **Mark complete** — Update progress tracking table

| #  | Phase              | Description                                                                                     | Output             |
|----|--------------------|-------------------------------------------------------------------------------------------------|--------------------|
| 1  | Bootstrap          | Three-layer architecture, Nix builds, parallel task runner (run-parallel), unified check output | Working shell app  |
| 2  | Cloudflare Proxy   | Deploy authenticated proxy via Wrangler                                                         | Secure API gateway |
| 3  | Infrastructure     | Linting, formatting, CI/CD, Nix packaging                                                       | Complete toolchain |
| 4  | Re-design          | Tailwind + shadcn design tokens                                                                 | Styled shell       |
| 5  | i18n               | YAML → codegen pipeline, En/Ru                                                                  | Translation system |
| 6  | Main Shell         | Header, theme toggle, language toggle, input area                                               | Basic UI           |
| 7  | Message List + LLM | Chat display, Gemini integration, streaming                                                     | Core feature       |
| 8  | Chat Features      | Attachments, model selector, search grounding                                                   | Full input         |
| 9  | Session Features   | Export, import, clear                                                                           | Data management    |
| 10 | Tutorial           | Interactive walkthrough                                                                         | Onboarding         |
| 11 | E2E Tests          | Playwright test suite                                                                           | Quality assurance  |

### Phase Dependencies

```
1. Bootstrap
     │
     ├─→ 2. Cloudflare Proxy (independent after bootstrap)
     │
     └─→ 3. Infrastructure
           │
           └─→ 4. Re-design
                 │
                 └─→ 5. i18n
                       │
                       └─→ 6. Main Shell
                             │
                             └─→ 7. Message List + LLM
                                   │
                                   ├─→ 8. Chat Features
                                   │
                                   ├─→ 9. Session Features
                                   │
                                   └─→ 10. Tutorial
                                          │
                                          └─→ 11. E2E Tests
```

## File Structure

Feature-based organization. Each feature is fully encapsulated.

```
scientific-assistant/
├── src/                          # Elm source
│   ├── Main.elm                  # App composition
│   ├── Feature/                  # Feature modules (complete TEA each)
│   │   ├── Chat.elm              # Message list + input
│   │   ├── Header.elm            # Title, toggles, actions
│   │   ├── Tutorial.elm          # Interactive tutorial
│   │   ├── Lightbox.elm          # Image viewer
│   │   └── Session.elm           # Export/import/clear
│   ├── Api/                      # External communication
│   │   └── Gemini.elm            # Gemini API types + requests
│   ├── I18n.elm                  # Generated translations
│   └── Shared/                   # Shared types (no logic)
│       ├── Message.elm           # Message types
│       └── Theme.elm             # Theme types
├── ts/                           # TypeScript bridge
│   ├── main.ts                   # Elm init + port wiring
│   ├── ports.ts                  # Port handlers
│   └── tauri.ts                  # Tauri invoke wrappers
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands.rs           # Tauri commands
│   │   └── i18n.rs               # Generated (if needed)
│   ├── Cargo.toml
│   └── tauri.conf.json
├── proxy/                        # Cloudflare Worker (Gemini API proxy)
│   ├── src/
│   │   └── index.ts              # Proxy worker
│   ├── wrangler.toml             # Wrangler config
│   ├── package.json
│   └── default.nix               # Wrangler tool + tests
├── styles/
│   ├── main.css                  # Tailwind imports
│   └── tokens.css                # shadcn design tokens
├── translations/
│   └── translations.yaml         # i18n source of truth
├── tests/                        # Elm tests
│   ├── Feature/                  # Feature tests mirror src/Feature/
│   │   ├── ChatTest.elm
│   │   ├── HeaderTest.elm
│   │   └── ...
│   └── Api/
│       └── GeminiTest.elm
├── e2e/                          # Playwright
│   ├── specs/
│   │   ├── chat.spec.ts
│   │   ├── session.spec.ts
│   │   └── ...
│   └── helpers.ts
├── .claude/
│   └── docs/
│       └── plans/                # Design + implementation plans
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
├── flake.nix                     # Nix dev environment
├── elm.json
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── CLAUDE.md                     # LLM guidelines
└── README.md
```

## Documentation Standards

All documentation follows the writing-standard skill:
- README.md — project overview, setup, usage
- CLAUDE.md — LLM guidelines for development
- Plan documents — implementation plans

Writing-standard requirements:
- Linear structure (no forward references)
- Falsifiable constraints (testable statements)
- Clear voice (direct, no hedging)
- No redundancy

## Success Criteria

1. No runtime exceptions (Elm guarantee)
2. All existing features working
3. Auto-updater functional on all platforms
4. Lighthouse accessibility score > 90
5. E2E tests passing
6. Build size < 20MB (Tauri target)

## Open Questions

None at this time. All decisions made during brainstorming.

---

**Version**: 1.0
**Date**: 2025-12-13
**Authors**: Andrey Koppel, Claude
