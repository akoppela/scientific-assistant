{ pkgs }:

pkgs.buildNpmPackage {
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

    # Create wrapper for elm-watch
    makeWrapper ${pkgs.nodejs_22}/bin/node $out/bin/elm-watch \
      --add-flags "$out/lib/node_modules/.bin/elm-watch" \
      --set NODE_PATH "$out/lib/node_modules"
  '';
}
