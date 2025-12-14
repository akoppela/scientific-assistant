{
  description = "elm-watch packaged for Nix";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";

    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        packages.default = pkgs.buildNpmPackage {
          pname = "elm-watch-nix";
          version = "1.2.3";

          src = ./.;

          npmDepsHash = "sha256-qDiH6VtBctUKGSzXokVG0PVr/iYSKsK2mSmp/5Hocus=";

          nativeBuildInputs = [ pkgs.makeWrapper ];

          dontNpmBuild = true;

          installPhase = ''
            mkdir -p $out/bin $out/lib

            # Copy node_modules
            cp -r node_modules $out/lib/node_modules

            # Create wrappers for all binaries in node_modules/.bin
            for bin in node_modules/.bin/*; do
              if [ -f "$bin" ]; then
                tool=$(basename "$bin")
                makeWrapper ${pkgs.nodejs_22}/bin/node $out/bin/$tool \
                  --add-flags "$out/lib/node_modules/.bin/$tool" \
                  --set NODE_PATH "$out/lib/node_modules"
              fi
            done
          '';
        };
      }
    );
}
