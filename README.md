# Scientific Assistant - Elm + Tauri

Fresh rewrite in Elm with Tauri backend.

## Why Elm?

- No runtime exceptions
- Predictable behavior (no SolidJS timing issues)
- Simple mental model
- Guaranteed correctness

## Why Tauri?

- Lightweight (~5 MB vs Electron's ~120 MB)
- Secure Rust backend
- Built-in auto-updater
- Cross-platform

## Setup

Coming soon - will be initialized in fresh session.

## Architecture

```
Frontend: Elm (pure functions, TEA architecture)
Backend: Tauri (Rust commands)
Bridge: Ports (Elm ←→ JS ←→ Tauri)
```

---

Previous Solid.js implementation: See `../legacy/`
