{
  description = "Parallel task runner with grouped output";

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
        packages.default = pkgs.stdenv.mkDerivation {
          pname = "run-parallel";
          version = "1.0.0";

          src = ./.;

          installPhase = ''
            mkdir -p $out/bin
            cp run-parallel.sh $out/bin/run-parallel
            chmod +x $out/bin/run-parallel
          '';
        };
      }
    );
}
