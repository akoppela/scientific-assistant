{ pkgs, buildNpmPackage, projectName, runParallelTool, tsLintTools, tasks, design-system }:

buildNpmPackage {
  pname = "${projectName}-landing";
  version = "1.0.0";

  src = ./.;

  postPatch = ''
    mkdir -p ../infra
    cp -r ${design-system} ../infra/design-system
  '';

  npmDepsHash = "sha256-Km8xf9h4vXUU42/MmomN4eEZduQG7paZ/Q4I2aS0iXE=";
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
