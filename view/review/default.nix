{ pkgs, elmVersion ? "0.19.1", elmReviewVersion ? "2.13.3" }:

let
  # Read elm-review's internal dependencies from bundled elm.json files
  elmReviewLib = "${pkgs.elmPackages.elm-review}/lib/node_modules/elm-review";
  parserDeps = builtins.fromJSON (builtins.readFile "${elmReviewLib}/parseElm/elm.json");
  codecDeps = builtins.fromJSON (builtins.readFile "${elmReviewLib}/ast-codec/elm.json");
in
pkgs.stdenv.mkDerivation {
  name = "elm-review-cache";
  src = ./.;

  buildInputs = with pkgs.elmPackages; [ elm elm-review ];

  installPhase = ''
    ${pkgs.makeDotElmDirectoryCmd {
      elmJson = ./elm.json;
      extraDeps = [
        parserDeps.dependencies.direct
        parserDeps.dependencies.indirect
        codecDeps.dependencies.direct
        codecDeps.dependencies.indirect
      ];
    }}

    set -e
    mkdir -p .elm/elm-review/${elmReviewVersion}
    ln -s ../../${elmVersion} .elm/elm-review/${elmReviewVersion}/${elmVersion}

    mkdir -p $out
    cp -r .elm $out/
  '';
}
