{ pkgs, buildNpmPackage, projectName, runParallelTool, tsLintTools, tasks }:

buildNpmPackage {
  pname = "${projectName}-design-system";
  version = "1.0.0";

  src = ./.;

  npmDepsHash = "sha256-lX0z/i1+eeGrxeddH2Vn0F3gRaAojWYsacSl6Td7I0M=";
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
