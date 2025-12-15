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

## Project Structure

```
scientific-assistant/
├── view/             # Elm UI layer
│   ├── src/          # Elm source
│   ├── tests/        # Elm tests
│   └── ...
├── bridge/           # TypeScript integration layer
│   ├── src/          # TypeScript source
│   ├── build/        # elm.js from view (gitignored)
│   ├── dist/         # Vite output (gitignored)
│   └── ...
├── platform/         # Tauri native layer
│   ├── src/          # Rust source
│   └── ...
├── docs/             # Documentation
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
