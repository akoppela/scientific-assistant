{ pkgs, view, runParallelTool, tsLintTools, tasks }:

pkgs.buildNpmPackage {
  name = "scientific-assistant-bridge";
  src = ./.;
  npmDepsHash = "sha256-OinNutTEXVwTu1VQaMwaCD1TdSOFdO6NeacjzZILXwE=";

  nativeBuildInputs = runParallelTool ++ tsLintTools;

  dontNpmBuild = true;

  buildPhase = ''
    # Copy pre-compiled Elm from view layer
    mkdir -p build
    cp ${view}/dist/elm.js build/

    # Build with Vite
    npx vite build
  '';

  checkPhase = ''
    run-parallel ${tasks}/check-bridge.yaml
  '';

  installPhase = ''
    mkdir -p $out
    cp -r dist $out/
  '';

  doCheck = true;
}
