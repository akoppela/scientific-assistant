{
  description = "Scientific Assistant";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";

    flake-utils.url = "github:numtide/flake-utils";

    devshell.url = "github:numtide/devshell";
    devshell.inputs.nixpkgs.follows = "nixpkgs";

    # Using rkb's fork for docs.json + extraDeps support (required for elm-review)
    # Official jeslie0/mkElmDerivation lacks these features
    # TODO: Contribute docs.json support upstream or wait for merge
    mkElmDerivation.url = "github:r-k-b/mkElmDerivation";
    mkElmDerivation.inputs.nixpkgs.follows = "nixpkgs";

    crane.url = "github:ipetkov/crane";
  };

  outputs = { self, nixpkgs, flake-utils, devshell, mkElmDerivation, crane }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;

          overlays = [
            devshell.overlays.default
            mkElmDerivation.overlays.mkElmDerivation
            mkElmDerivation.overlays.makeDotElmDirectoryCmd
          ];

          config.allowUnfreePredicate = pkg: builtins.elem (nixpkgs.lib.getName pkg) [
            "claude-code"
          ];
        };

        craneLib = crane.mkLib pkgs;

        # Infrastructure packages (imported from infra/)
        elm-watch = import ./infra/elm-watch { inherit pkgs; };
        run-parallel = import ./infra/run-parallel { inherit pkgs; };
        tasks = import ./infra/tasks { inherit pkgs; };

        # Proxy (Cloudflare Worker with tests)
        proxy = import ./proxy { inherit pkgs; };

        # Build tools (used in nativeBuildInputs for layer builds)
        elmBuildTools = (with pkgs.elmPackages; [ elm elm-format elm-test elm-review ]) ++ [ elm-watch ];
        runParallelTool = [ run-parallel ];
        tsLintTools = with pkgs; [ eslint prettier ];
        rustBuildTools = with pkgs; [ clippy rustfmt ];
        tauriBuildTools = with pkgs; if pkgs.stdenv.isLinux then
          [ pkg-config cargo-tauri gobject-introspection ]
        else
          [ cargo-tauri ];

        # Runtime libraries (used in buildInputs for platform builds)
        # Linux-specific GTK/WebKit libraries (macOS uses system frameworks)
        tauriRuntimeLibs = with pkgs; if pkgs.stdenv.isLinux then
          [ at-spi2-atk atkmm cairo glib gtk3 harfbuzz librsvg libsoup_3 pango webkitgtk_4_1 openssl zlib stdenv.cc.cc.lib ]
        else
          [ openssl zlib stdenv.cc.cc.lib ];
        tauriDevPackages = with pkgs; if pkgs.stdenv.isLinux then [ gdk-pixbuf ] else [ ];

        # Dev shell tools (development only, not used in builds)
        devTools = with pkgs; [
          # Elm
          pkgs.elmPackages.elm-json

          # Rust
          rust-analyzer
          cargo-watch

          # Node/TypeScript
          nodejs_22

          # Process management
          mprocs

          # Styling
          tailwindcss_4

          # Nix
          nixpkgs-fmt

          # Git
          gh

          # AI
          claude-code
        ] ++ [ proxy.wrangler ];

        # Application layers (each has its own default.nix)
        view = pkgs.callPackage ./view {
          inherit elmBuildTools runParallelTool tasks;
        };

        bridge = pkgs.callPackage ./bridge {
          inherit view runParallelTool tsLintTools tasks;
        };

        platform = pkgs.callPackage ./platform {
          inherit craneLib bridge tauriBuildTools tauriRuntimeLibs rustBuildTools runParallelTool tasks;
        };
      in
      {
        packages = {
          inherit view bridge platform;
          default = platform;
        };

        checks = {
          inherit view bridge platform;
          proxy = proxy.package;
          nix-fmt = pkgs.runCommand "check-nix-fmt" { nativeBuildInputs = [ pkgs.nixpkgs-fmt pkgs.findutils ]; } ''
            find ${./.} -name '*.nix' -not -path '*/.*' -exec nixpkgs-fmt --check {} +
            touch $out
          '';
        };

        devShells.default = pkgs.devshell.mkShell {
          name = "scientific-assistant";

          imports = [
            "${devshell}/extra/language/rust.nix"
            "${devshell}/extra/language/c.nix"
          ];

          language.rust.enableDefaultToolchain = true;

          language.c = {
            libraries = tauriRuntimeLibs; # Don't include tauriDevPackages (causes gdk-pixbuf conflict)
            includes = tauriRuntimeLibs ++ tauriDevPackages;
          };

          packages = elmBuildTools ++ runParallelTool ++ tsLintTools ++ tauriBuildTools ++ devTools;

          env = [
            {
              name = "WEBKIT_DISABLE_DMABUF_RENDERER";
              value = 1;
            }
          ];

          commands = [
            {
              name = "setup";
              category = "development";
              help = "Install all npm dependencies (bridge + cloudflare)";
              command = "run-parallel infra/tasks/setup.yaml";
            }
            {
              name = "dev";
              category = "development";
              help = "Start Tauri dev mode (hot reload)";
              command = "mprocs --config infra/tasks/dev.yaml";
            }
            {
              name = "build:view";
              category = "build";
              help = "Build view layer (Elm UI)";
              command = "nix build .#view";
            }
            {
              name = "build:bridge";
              category = "build";
              help = "Build bridge layer (TS integration)";
              command = "nix build .#bridge";
            }
            {
              name = "build:platform";
              category = "build";
              help = "Build platform layer (Tauri + Rust)";
              command = "nix build .#platform";
            }
            {
              name = "format";
              category = "code quality";
              help = "Format all code (Elm + Rust + Nix)";
              command = "run-parallel infra/tasks/format.yaml";
            }
            {
              name = "clean";
              category = "maintenance";
              help = "Remove build artifacts";
              command = "rm -rf result view/dist view/elm-stuff bridge/build bridge/dist platform/target";
            }
            {
              name = "proxy:test";
              category = "proxy";
              help = "Run proxy tests";
              command = "cd proxy && npm test";
            }
            {
              name = "proxy:dev";
              category = "proxy";
              help = "Start proxy dev server";
              command = "cd proxy && wrangler dev";
            }
            {
              name = "proxy:deploy";
              category = "proxy";
              help = "Deploy proxy to Cloudflare";
              command = "cd proxy && wrangler deploy";
            }
          ];
        };
      }
    );
}
