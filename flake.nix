{
  description = "Scientific Assistant - Elm + Tauri";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfreePredicate = pkg: builtins.elem (nixpkgs.lib.getName pkg) [
            "claude-code"
          ];
        };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = [
            # Node.js for Tauri frontend tooling
            pkgs.nodejs_22

            # Elm
            pkgs.elmPackages.elm
            pkgs.elmPackages.elm-format
            pkgs.elmPackages.elm-test
            pkgs.elmPackages.elm-json
            pkgs.elm2nix

            # Tauri
            pkgs.cargo
            pkgs.rustc
            pkgs.rust-analyzer
            pkgs.pkg-config
            pkgs.openssl
            pkgs.webkitgtk_6_0
            pkgs.gtk4
            pkgs.libsoup_3

            # Styling
            pkgs.tailwindcss_4

            # LLM
            pkgs.claude-code
          ];

          shellHook = ''
            export PATH="$PWD/node_modules/.bin:$PATH"
          '';
        };
      }
    );
}
