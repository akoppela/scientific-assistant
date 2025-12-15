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

| Command          | Purpose                             |
|------------------|-------------------------------------|
| `setup`          | Install bridge dependencies         |
| `dev`            | Start dev mode (hot reload)         |
| `build:view`     | Build view layer (Elm UI)           |
| `build:bridge`   | Build bridge layer (TS integration) |
| `build:platform` | Build platform layer (Tauri)        |
| `format`         | Format all code                     |
| `clean`          | Remove build artifacts              |

## Linting

All linting runs during Nix builds and in CI:

```bash
cd view && elm-review           # Elm linting
cd bridge && eslint src/        # TypeScript linting
cd platform && cargo clippy     # Rust linting
```

## Project Structure

```
scientific-assistant/
├── view/             # Elm UI layer
│   ├── src/          # Elm source
│   ├── tests/        # Elm tests
│   └── default.nix   # Nix build definition
├── bridge/           # TypeScript integration layer
│   ├── src/          # TypeScript source
│   └── default.nix   # Nix build definition
├── platform/         # Tauri native layer
│   ├── src/          # Rust source
│   └── default.nix   # Nix build definition (Crane)
├── infra/            # Nix infrastructure
│   ├── elm-watch/default.nix
│   ├── run-parallel/default.nix
│   └── tasks/default.nix
├── proxy/            # Cloudflare Worker (Gemini API proxy)
│   ├── src/          # Worker source
│   └── default.nix   # Wrangler tool + tests
├── docs/             # Documentation
└── flake.nix         # Main config (imports all default.nix)
```

## Architecture

```
Elm (UI) ←→ Ports ←→ TypeScript ←→ Tauri (Rust)
                          ↓
                        Proxy
                          ↓
                     Gemini API
```

## CI/CD

- **CI**: Runs on push/PR to main - linting, tests, builds (Linux, macOS via Nix)
- **Release**: Tag `v*` triggers builds for Linux and macOS
- **Platforms**: Linux x86_64, macOS ARM (Windows cross-compilation to be added)
- **Outputs**: `.deb`, `.rpm` (Linux), `.dmg`, `.app` (macOS)

---

**Version**: 0.1.0
