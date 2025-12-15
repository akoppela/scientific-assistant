{ pkgs, elmBuildTools, runParallelTool, tasks }:

let
  elmReviewCache = pkgs.callPackage ./review { };
in
pkgs.mkElmDerivation {
  name = "scientific-assistant-view";
  src = ./.;
  elmJson = ./elm.json;

  nativeBuildInputs = elmBuildTools ++ runParallelTool;

  buildPhase = ''
    mkdir -p dist
    # Build "build" target (outputs to dist/elm.js)
    elm-watch make --optimize build
  '';

  checkPhase = ''
    mkdir -p .elm/0.19.1
    cp -r ${elmReviewCache}/.elm/0.19.1/* .elm/0.19.1/
    chmod -R u+w .elm

    run-parallel ${tasks}/check-view.yaml
  '';

  installPhase = ''
    mkdir -p $out/dist
    cp dist/elm.js $out/dist/
  '';

  doCheck = true;
}
