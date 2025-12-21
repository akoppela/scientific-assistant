{ pkgs, buildNpmPackage, projectName, runParallelTool, tsLintTools, tasks }:

buildNpmPackage {
  pname = "${projectName}-design-system";
  version = "1.0.0";

  src = ./.;

  npmDepsHash = "sha256-tCLMM5zeHYHIlstAKg6PirN3iBrFudBf7tI53ST8ffI=";
  npmFlags = [ "--ignore-scripts" ];

  nativeBuildInputs = runParallelTool ++ tsLintTools;

  dontNpmBuild = true;

  checkPhase = ''
    run-parallel ${tasks}/check-design-system.yaml
  '';

  installPhase = ''
    mkdir -p $out
    cp -r src $out/
    cp package.json $out/
  '';

  doCheck = true;
}
