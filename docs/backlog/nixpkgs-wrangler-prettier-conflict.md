# nixpkgs: Fix wrangler prettier/eslint incomplete removal

**Status**: Backlog
**Priority**: Low (we have a workaround)
**Upstream**: nixpkgs

## Problem

The wrangler package in nixpkgs attempts to remove prettier/eslint/typescript from its bundled node_modules to avoid conflicts, but only removes binaries and `.bin` directories, not the complete package directories.

This leaves files like `README.md`, causing `buildEnv` conflicts when wrangler is used alongside standalone prettier/eslint packages:

```
pkgs.buildEnv error: two given paths contain a conflicting subpath:
  `/nix/store/w5qn80abgpazfgp0zmf3kba556j9vgim-wrangler-4.50.0/lib/node_modules/prettier/README.md' and
  `/nix/store/88n0qkaqkcnpcb73niscwgnlbvmy956i-prettier-3.6.2/lib/node_modules/prettier/README.md'
```

## Current Code

Location: `pkgs/by-name/wr/wrangler/package.nix`

Line in installPhase:
```nix
rm -rf node_modules/typescript node_modules/eslint node_modules/prettier node_modules/bin node_modules/.bin node_modules/**/bin node_modules/**/.bin
```

This removes binaries but not the complete directories.

## Proposed Fix

Update the installPhase to completely remove these directories:

```nix
rm -rf $out/lib/node_modules/{prettier,eslint,typescript}
rm -rf $out/lib/packages/wrangler/node_modules/{prettier,eslint,typescript}
rm -rf $out/lib/**/bin $out/lib/**/.bin
```

## Workaround

In our project, we override wrangler with:

```nix
wrangler-patched = pkgs.wrangler.overrideAttrs (oldAttrs: {
  postInstall = (oldAttrs.postInstall or "") + ''
    # Remove prettier/eslint directories completely, not just binaries
    rm -rf $out/lib/node_modules/prettier
    rm -rf $out/lib/node_modules/eslint
    rm -rf $out/lib/node_modules/typescript
    rm -rf $out/lib/packages/wrangler/node_modules/prettier
    rm -rf $out/lib/packages/wrangler/node_modules/eslint
    rm -rf $out/lib/packages/wrangler/node_modules/typescript
  '';
});
```

See: `flake.nix:98-109`

## Action Items

- [ ] Search nixpkgs issues for existing reports about wrangler conflicts
- [ ] If not reported, create issue at https://github.com/NixOS/nixpkgs/issues
- [ ] Consider submitting PR with the fix
- [ ] Once merged upstream, remove our workaround override

## References

- wrangler package: https://github.com/NixOS/nixpkgs/blob/master/pkgs/by-name/wr/wrangler/package.nix
- Our workaround: `flake.nix:98-109`
