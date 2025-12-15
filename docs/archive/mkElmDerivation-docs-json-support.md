# Request docs.json Support in jeslie0/mkElmDerivation

**Status**: Submitted
**Issue**: https://github.com/jeslie0/mkElmDerivation/issues/18
**Priority**: Medium (we have a workaround)
**Upstream**: jeslie0/mkElmDerivation

## Problem

elm-review requires `docs.json` files to run in offline mode within Nix sandboxed builds. The official jeslie0/mkElmDerivation only fetches package source code (`.tar.gz` from GitHub) but not documentation files (`docs.json` from package.elm-lang.org).

This causes elm-review to fail with:
```
I encountered a problem when solving dependencies for creating the parser application:
Because there is no version of jfmengels/elm-review in 2.15.5 and root/ 0.0.0 depends on jfmengels/elm-review 2.15.5, root/ 0.0.0 is forbidden.
```

## Existing Solution

User r-k-b created a fork with docs.json support: https://github.com/r-k-b/mkElmDerivation

**Their implementation:**
- Modified `fetchElmPkg` to also fetch `docs.json` from package.elm-lang.org
- Updated `elm-hashes.json` format to include both `archiveHash` and `docsHash`
- Added `extraDeps` parameter to `makeDotElmDirectoryCmd` for merging additional dependencies

**Discourse thread:** https://discourse.elm-lang.org/t/enabling-pure-nix-builds-including-elm-review-elm-codegen/9969

## Proposed Changes

### 1. Update fetchElmPkg

Add docs.json fetching:
```nix
fetchElmPkg = elmHashesJson: name: version:
  let
    hashes = fromJSON (readFile elmHashesJson);
    pkgHashes = hashes.${name}.${version};
  in
  stdenv.mkDerivation {
    src = fetchurl {
      url = "https://github.com/${name}/archive/${version}.tar.gz";
      sha256 = pkgHashes.archiveHash;
    };

    # NEW: Fetch docs.json
    docsJson = fetchurl {
      url = "https://package.elm-lang.org/packages/${name}/${version}/docs.json";
      sha256 = pkgHashes.docsHash;
    };

    installPhase = ''
      mkdir -p $out
      cp -r * $out
      cp ${docsJson} $out/docs.json  # NEW
    '';
  };
```

### 2. Update elm-hashes.json Format

```json
{
  "elm/json": {
    "1.1.4": {
      "archiveHash": "sha256-...",
      "docsHash": "sha256-..."
    }
  }
}
```

### 3. Add extraDeps Parameter (Optional but Useful)

```nix
makeDotElmCommand = elmHashesJson: { elmJson, extraDeps ? [] }:
  let
    dependencies =
      (fromJSON (readFile elmJson)).dependencies.direct //
      (fromJSON (readFile elmJson)).dependencies.indirect //
      # ... test deps ...

    versionsPerPkg = lib.attrsets.zipAttrs ([dependencies] ++ extraDeps);
  in
  # ... rest of implementation
```

## Benefits

1. **elm-review support** - Enables elm-review to run in Nix sandboxed builds
2. **elm-codegen support** - Also benefits from docs.json availability
3. **Complete offline builds** - No network access needed during builds
4. **Better caching** - Deterministic builds with content-addressed docs

## Workaround

Currently using r-k-b's fork:
```nix
mkElmDerivation.url = "github:r-k-b/mkElmDerivation";
```

See: `flake.nix:15`

## Action Items

- [ ] Open issue at https://github.com/jeslie0/mkElmDerivation/issues
- [ ] Reference r-k-b's implementation and Discourse thread
- [ ] Offer to submit PR if maintainer is interested
- [ ] Once merged, switch back to official repo

## References

- r-k-b's fork: https://github.com/r-k-b/mkElmDerivation
- Discourse discussion: https://discourse.elm-lang.org/t/enabling-pure-nix-builds-including-elm-review-elm-codegen/9969
- Our implementation: `view/elm-review.nix`
- Official repo: https://github.com/jeslie0/mkElmDerivation
