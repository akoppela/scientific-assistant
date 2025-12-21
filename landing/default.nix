{ pkgs, buildNpmPackage, projectName, runParallelTool, tsLintTools, tasks, design-system }:

buildNpmPackage {
  pname = "${projectName}-landing";
  version = "1.0.0";

  src = ./.;

  postPatch = ''
    mkdir -p ../infra
    cp -r ${design-system} ../infra/design-system
  '';

  npmDepsHash = "sha256-UL07K6kF48i2u6qAAGHeu7RdMe8g6Aqp1ZAR+/bCf9o=";
  npmFlags = [ "--ignore-scripts" ];

  nativeBuildInputs = runParallelTool ++ tsLintTools;

  dontNpmBuild = true;

  buildPhase = ''
    npm run build
  '';

  checkPhase = ''
    run-parallel ${tasks}/check-landing.yaml
  '';

  installPhase = ''
    mkdir -p $out
    cp -r dist/* $out/
  '';

  doCheck = true;
}
