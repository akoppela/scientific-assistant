# DevShell Configuration Notes

**Date:** 2025-12-14
**Status:** Working but needs optimization

## Current Configuration

We use `devshell.mkShell` with language modules for Rust/C development. The configuration works but required manual intervention to resolve library linking issues.

## What Works

**Language Modules:**
```nix
imports = [
  "${devshell}/extra/language/rust.nix"
  "${devshell}/extra/language/c.nix"
];

language.rust.enableDefaultToolchain = true;

language.c = {
  libraries = tauriRuntimeLibs;
  includes = tauriRuntimeLibs ++ tauriDevPackages;
};
```

**Manual Environment Variables:**
```nix
env = [
  {
    name = "PKG_CONFIG_PATH";
    prefix = "${pkgs.lib.makeSearchPathOutput "dev" "lib/pkgconfig" ...}";
  }
];
```

## Issues Encountered

### 1. Missing gdk-pixbuf Conflict

**Problem:**
- `gdk-pixbuf` and `librsvg` both provide `lib/gdk-pixbuf-2.0/2.10.0/loaders.cache`
- Including both in `language.c.libraries` causes buildEnv conflict

**Current Solution:**
- Only include `librsvg` in libraries (provides gdk-pixbuf transitively)
- Include `gdk-pixbuf` in includes only (for .pc files)

**Why This Matters:**
- `libraries`: Used for LD_LIBRARY_PATH (runtime linking)
- `includes`: Used for PKG_CONFIG_PATH (compile-time pkg-config)

### 2. PKG_CONFIG_PATH Not Set Correctly by language.c

**Problem:**
- language.c sets `PKG_CONFIG_PATH.prefix = "$DEVSHELL_DIR/lib/pkgconfig"`
- But actual .pc files are in individual package store paths, not merged $DEVSHELL_DIR
- Cargo build scripts fail to find gdk-3.0.pc, gdk-pixbuf-2.0.pc, etc.

**Current Solution:**
- Manually set PKG_CONFIG_PATH with `makeSearchPathOutput` to point to actual .pc file locations
- This works but duplicates what language.c should do

**Root Cause:**
- devshell merges packages into $DEVSHELL_DIR, but .pc files might not get copied
- Or language.c doesn't properly set up the merged environment

### 3. Missing C++ Standard Library

**Problem:**
- ICU library (used by webkit/harfbuzz) needs libstdc++ (`__cxa_call_terminate` symbol)
- `ld: undefined reference to '__cxa_call_terminate@CXXABI_1.3.15'`

**Current Solution:**
- Add `stdenv.cc.cc.lib` to tauriRuntimeLibs (provides libstdc++)
- language.c.libraries includes it, making libstdc++ available

### 4. LIBRARY_PATH for Linking

**Problem:**
- Linker needs to find libraries during compilation (not just runtime)
- LIBRARY_PATH must include all C/C++ libraries

**Current Solution:**
- language.c sets LIBRARY_PATH automatically from `libraries` parameter
- Includes libz, libstdc++, all GTK libraries

## Package Groups

**tauriRuntimeLibs** (linked into binary):
- at-spi2-atk, atkmm, cairo, glib, gtk3, harfbuzz, librsvg, libsoup_3, pango, webkitgtk_4_1
- openssl, zlib
- stdenv.cc.cc.lib (provides libstdc++)

**tauriDevPackages** (dev only, for pkg-config):
- gdk-pixbuf (for .pc files only, not linked)
- atk (for .pc files)

## Questions for Later Investigation

1. **Why doesn't language.c PKG_CONFIG_PATH work?**
   - Should point to merged $DEVSHELL_DIR/lib/pkgconfig
   - But .pc files aren't there
   - Need to understand devshell's package merging mechanism

2. **Can we avoid gdk-pixbuf/librsvg conflict?**
   - Is there a way to tell devshell to prefer one over the other?
   - Or exclude specific files from merge?

3. **Is there a simpler approach?**
   - Consider switching to `pkgs.mkShell` which handles this automatically
   - Trade-off: Lose devshell's nice commands UI
   - But gain automatic buildInputs handling

## Alternative: pkgs.mkShell

From Tauri NixOS Wiki:
```nix
pkgs.mkShell {
  nativeBuildInputs = [ pkg-config cargo nodejs ];
  buildInputs = [ gtk3 webkitgtk_4_1 openssl ... ];
}
```

**Pros:**
- Automatic PKG_CONFIG_PATH, LD_LIBRARY_PATH, LIBRARY_PATH
- No manual configuration needed
- No gdk-pixbuf conflicts

**Cons:**
- No devshell commands UI
- Less explicit about what's configured

## Recommendation

For future optimization:
1. Try `pkgs.mkShell` to compare developer experience
2. If commands UI is valuable, debug why language.c PKG_CONFIG_PATH doesn't work
3. Consider hybrid: mkShell with manual commands attribute

## What We Learned

- **devshell language modules**: Good for simple cases, need manual help for complex C/C++ dependencies
- **makeSearchPathOutput**: Essential for finding .dev outputs with .pc files
- **makeLibraryPath**: Essential for runtime library paths
- **C++ dependencies**: Must include stdenv.cc.cc.lib for libstdc++
- **Conflicts**: Be careful with transitive dependencies (librsvg includes gdk-pixbuf)

---

**Version**: 1.0
**Last Updated:** 2025-12-14
