# Scientific Assistant

Desktop chat application for scientific work.

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
setup         # Install bridge dependencies (npm install)
```

## Development

```bash
dev  # Start Tauri app in dev mode (hot reload)
```

Starts elm-watch (hot reload), Vite dev server (http://localhost:5173), and Tauri window.

## Build

```bash
build:platform  # Build production app (runs all tests/checks)
```

Output: `result/bundle/`

## Commands

All commands run from project root inside `nix develop`:

### Development
| Command       | Purpose                                                 |
|---------------|---------------------------------------------------------|
| `setup`       | Install all npm dependencies (design-system + bridge + landing + proxy) |
| `dev`         | Start Tauri dev mode (hot reload)                       |
| `dev:landing` | Start landing site dev server                           |

### Build Layers
| Command              | Purpose                                |
|----------------------|----------------------------------------|
| `build:view`         | Build view layer (Elm)                 |
| `build:bridge`       | Build bridge layer (TypeScript + Vite) |
| `build:platform`     | Build platform layer (Rust + Tauri)    |
| `build:landing`      | Build landing site (HTML + Vite)       |
| `build:design-system`| Build design system (CSS + TypeScript) |

### Code Quality
| Command  | Purpose                                                |
|----------|--------------------------------------------------------|
| `format` | Format all code (Elm + TypeScript + HTML + Rust + Nix) |
| `clean`  | Remove build artifacts                                 |

### Proxy (Cloudflare Worker)
| Command        | Purpose                    |
|----------------|----------------------------|
| `proxy:test`   | Run proxy tests            |
| `proxy:dev`    | Start proxy dev server     |
| `proxy:deploy` | Deploy proxy to Cloudflare |

## Design System

Nature/Calm palette with teal accent, Nunito typography, and Tailwind CSS 4.

**Package:** `infra/design-system/` (npm package consumed by bridge and landing)
- Self-hosted fonts (Nunito + JetBrains Mono, Cyrillic support)
- CSS tokens, base styles, and component classes
- Light/dark themes via `data-theme` attribute

**Documentation:**
- Design guidelines: `.claude/skills/design-system/SKILL.md` (authoritative source)
- Visual showcase: `landing/design-system.html`

**Testing:** `cd landing && npm run dev` to preview design system locally.

## Linting

All linting runs during Nix builds and in CI:

```bash
cd view && elm-review              # Elm linting
cd bridge && eslint .              # TypeScript linting
cd landing && eslint .             # TypeScript linting
cd infra/design-system && eslint . # TypeScript linting
cd proxy && eslint .               # TypeScript linting
cd platform && cargo clippy        # Rust linting
```

## Project Structure

```
scientific-assistant/
├── view/                       # Elm UI layer
│   ├── src/                    # Elm source (UI/, Extra/ modules)
│   ├── tests/                  # Elm tests (mirrors src/ structure)
│   ├── review/                 # elm-review configuration
│   └── default.nix             # Nix build definition
├── bridge/                     # TypeScript integration layer
│   ├── src/                    # TypeScript source
│   │   └── __tests__/          # vitest tests
│   ├── public/                 # elm.js from view (gitignored)
│   └── default.nix             # Nix build definition
├── platform/                   # Tauri native layer
│   ├── src/                    # Rust source
│   ├── capabilities/           # Tauri capabilities (permissions)
│   ├── icons/                  # App icons (png, icns, ico)
│   └── default.nix             # Nix build definition (Crane)
├── infra/                      # Nix infrastructure
│   ├── design-system/          # Design system npm package
│   │   ├── src/styles/         # CSS (tokens, base, fonts, markdown)
│   │   ├── src/fonts/          # Self-hosted fonts (WOFF2)
│   │   └── src/ts/             # TypeScript (charts, tokens, elements)
│   ├── elm-watch/default.nix
│   ├── run-parallel/default.nix
│   └── tasks/default.nix
├── landing/                    # Landing site (GitHub Pages)
│   ├── src/                    # TypeScript source
│   ├── public/                 # Static assets (favicon)
│   └── default.nix             # Nix build (buildNpmPackage)
├── proxy/                      # Cloudflare Worker (Gemini API proxy)
│   ├── src/                    # Worker source
│   │   └── __tests__/          # vitest tests
│   └── default.nix             # Wrangler tool + tests
├── docs/                       # Documentation & plans
└── flake.nix                   # Main config (imports all default.nix)
```

## Architecture

```
Elm (UI) ←→ Ports ←→ TypeScript ←→ Tauri (Rust)
                          ↕
                        Proxy
                          ↕
                     Gemini API
```

## CI/CD

- **CI**: Runs on push/PR to main - linting, tests, builds (NixOS container with Cachix)
- **Release**: Tag `v*` triggers Linux build
- **Landing**: Deploys landing site to GitHub Pages
- **Platforms**: Linux x86_64 (macOS and Windows to be added)
- **Outputs**: `.deb`, `.rpm` (Linux)

## License

This project is licensed under the **Mozilla Public License 2.0 (MPL-2.0)**.

See [LICENSE](LICENSE) file for full text.

---

**Version**: 0.1.0
