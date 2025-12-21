{ pkgs, buildNpmPackage, projectName, view, runParallelTool, tsLintTools, tasks }:

buildNpmPackage {
  pname = "${projectName}-bridge";
  version = "0.1.0";

  src = ./.;

  npmDepsHash = "sha256-KRtSYIBdmHZw2mfpM7Vut5+ClO/wxrC1xZKtsX4GfpY=";
  npmFlags = [ "--ignore-scripts" ];

  nativeBuildInputs = runParallelTool ++ tsLintTools;

  postPatch = ''
    # Make design-system available for npm install
    mkdir -p ../infra/design-system
    cp -r ${../infra/design-system}/* ../infra/design-system/
  '';

  dontNpmBuild = true;

  buildPhase = ''
    # Copy pre-compiled Elm from view layer
    mkdir -p public
    cp ${view}/dist/elm.js public/

    # Build
    npm run build
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
