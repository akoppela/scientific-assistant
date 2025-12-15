{
  description = "Scientific Assistant";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";

    flake-utils.url = "github:numtide/flake-utils";

    devshell.url = "github:numtide/devshell";
    devshell.inputs.nixpkgs.follows = "nixpkgs";

    mkElmDerivation.url = "github:jeslie0/mkElmDerivation";
    mkElmDerivation.inputs.nixpkgs.follows = "nixpkgs";
    mkElmDerivation.inputs.elm-watch.follows = "elm-watch";

    elm-watch.url = "path:./elm-watch";
    elm-watch.inputs.nixpkgs.follows = "nixpkgs";
    elm-watch.inputs.flake-utils.follows = "flake-utils";

    run-parallel.url = "path:./run-parallel";
    run-parallel.inputs.nixpkgs.follows = "nixpkgs";
    run-parallel.inputs.flake-utils.follows = "flake-utils";

    tasks.url = "path:./tasks";
    tasks.inputs.nixpkgs.follows = "nixpkgs";
    tasks.inputs.flake-utils.follows = "flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, devshell, mkElmDerivation, elm-watch, run-parallel, tasks }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;

          overlays = [
            devshell.overlays.default
            mkElmDerivation.overlays.mkElmDerivation
          ];

          config.allowUnfreePredicate = pkg: builtins.elem (nixpkgs.lib.getName pkg) [
            "claude-code"
          ];
        };

        # Reusable package groups (split by build vs dev)

        # Elm build tools (needed for Nix derivations)
        elmBuildTools = with pkgs.elmPackages; [ elm elm-format elm-test ];

        # Elm dev tools (dev shell only)
        elmDevTools = with pkgs.elmPackages; [ elm-json elm-review ];

        # Rust core tools (cargo/rustc - provided by buildRustPackage in builds, needed in dev shell)
        rustCoreTools = with pkgs; [ cargo rustc ];

        # Rust build tools (linters/formatters for checkPhase)
        rustBuildTools = with pkgs; [ clippy rustfmt ];

        # Rust dev tools (dev shell only)
        rustDevTools = with pkgs; [ rust-analyzer cargo-watch ];

        # Tauri build-time dependencies (run during compilation)
        tauriBuildTools = with pkgs; [ pkg-config cargo-tauri gobject-introspection ];

        # Tauri runtime libraries (linked into binary)
        tauriRuntimeLibs = with pkgs; [ at-spi2-atk atkmm cairo glib gtk3 harfbuzz librsvg libsoup_3 pango webkitgtk_4_1 openssl zlib stdenv.cc.cc.lib ];

        # Additional dev packages (for pkg-config, not linked)
        tauriDevPackages = with pkgs; [ gdk-pixbuf atk ];

        # Node.js (needed for both build and dev)
        nodeTools = with pkgs; [ nodejs_22 ];

        # elm-watch tool (packaged separately for Nix builds)
        elmWatchTool = [ elm-watch.packages.${system}.default ];

        # run-parallel tool (for checkPhase and one-shot tasks)
        runParallelTool = [ run-parallel.packages.${system}.default ];

        # Process runners (mprocs for interactive dev, run-parallel for one-shot tasks)
        processRunners = runParallelTool ++ (with pkgs; [ mprocs ]);

        # CSS/Styling (dev only)
        styleDevTools = with pkgs; [ tailwindcss_4 ];

        # Nix formatter (dev only)
        nixDevTools = with pkgs; [ nixpkgs-fmt ];

        # Git/GitHub CLI (dev only)
        gitDevTools = with pkgs; [ gh ];

        # AI assistance (dev only)
        llmDevTools = with pkgs; [ claude-code ];

        # View layer (Elm UI)
        view = pkgs.mkElmDerivation {
          name = "scientific-assistant-view";
          src = ./view;
          elmJson = ./view/elm.json;

          nativeBuildInputs = elmBuildTools ++ elmWatchTool ++ runParallelTool;

          buildPhase = ''
            mkdir -p dist
            # Build "build" target (outputs to dist/elm.js)
            elm-watch make --optimize build
          '';

          checkPhase = ''
            run-parallel ${tasks.packages.${system}.default}/check-view.yaml
          '';

          installPhase = ''
            mkdir -p $out/dist
            cp dist/elm.js $out/dist/
          '';

          doCheck = true;
        };

        # Bridge layer (TypeScript integration + bundling)
        bridge = pkgs.buildNpmPackage {
          name = "scientific-assistant-bridge";
          src = ./bridge;
          npmDepsHash = "sha256-zvfNGfj9E/HHW4rZT3nNP5mQvWbN40wb4PwMAWGgzNo=";

          nativeBuildInputs = runParallelTool;

          buildPhase = ''
            # Copy pre-compiled Elm from view layer
            mkdir -p build
            cp ${view}/dist/elm.js build/

            # Build with Vite
            npx vite build
          '';

          checkPhase = ''
            run-parallel ${tasks.packages.${system}.default}/check-bridge.yaml
          '';

          installPhase = ''
            mkdir -p $out
            cp -r dist $out/
          '';

          doCheck = true;
        };

        # Platform layer (Tauri + Rust native)
        platform = pkgs.rustPlatform.buildRustPackage {
          pname = "scientific-assistant-platform";
          version = "0.1.0";

          src = ./platform;

          cargoLock = {
            lockFile = ./platform/Cargo.lock;
          };

          nativeBuildInputs = tauriBuildTools ++ rustBuildTools ++ runParallelTool;
          buildInputs = tauriRuntimeLibs;

          buildPhase = ''
            # Copy bridge layer output
            mkdir -p ../bridge/dist
            cp -r ${bridge}/dist/* ../bridge/dist/

            # Build Tauri app
            cargo tauri build
          '';

          checkPhase = ''
            run-parallel ${tasks.packages.${system}.default}/check-platform.yaml
          '';

          installPhase = ''
            mkdir -p $out/bin
            cp -r target/release/bundle $out/
          '';

          doCheck = true;
        };

      in
      {
        packages = {
          inherit view bridge platform;
          default = platform;
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

          packages = elmBuildTools ++ elmDevTools ++ elmWatchTool
            ++ rustDevTools  # language.rust provides rustc, cargo, clippy, rustfmt
            ++ tauriBuildTools  # language.c provides tauriRuntimeLibs via libraries/includes
            ++ nodeTools
            ++ processRunners ++ styleDevTools ++ nixDevTools ++ gitDevTools ++ llmDevTools;

          env = [
            {
              name = "PKG_CONFIG_PATH";
              # language.c sets it but we need to add our packages
              prefix = "${pkgs.lib.makeSearchPathOutput "dev" "lib/pkgconfig" (tauriRuntimeLibs ++ tauriDevPackages)}:${pkgs.lib.makeSearchPathOutput "out" "lib/pkgconfig" (tauriRuntimeLibs ++ tauriDevPackages)}";
            }
            {
              name = "WEBKIT_DISABLE_DMABUF_RENDERER";
              value = 1;
            }
          ];

          commands = [
            {
              name = "setup";
              category = "development";
              help = "Install bridge dependencies";
              command = "cd bridge && npm install";
            }
            {
              name = "dev";
              category = "development";
              help = "Start Tauri dev mode (hot reload)";
              command = "mprocs --config tasks/dev.yaml";
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
              command = "run-parallel tasks/format.yaml";
            }
            {
              name = "clean";
              category = "maintenance";
              help = "Remove build artifacts";
              command = "rm -rf result view/dist view/elm-stuff bridge/build bridge/dist platform/target";
            }
          ];
        };
      }
    );
}
