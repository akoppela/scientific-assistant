{ craneLib, bridge, tauriBuildTools, tauriRuntimeLibs, rustBuildTools, runParallelTool, tasks }:

let
  platformSrc = ./.;

  platformCargoArtifacts = craneLib.buildDepsOnly {
    src = platformSrc;

    nativeBuildInputs = tauriBuildTools;
    buildInputs = tauriRuntimeLibs;
  };
in
craneLib.buildPackage {
  src = platformSrc;
  cargoArtifacts = platformCargoArtifacts;

  nativeBuildInputs = tauriBuildTools ++ rustBuildTools ++ runParallelTool;
  buildInputs = tauriRuntimeLibs;

  preBuild = ''
    mkdir -p ../bridge/dist
    cp -r ${bridge}/dist/* ../bridge/dist/
  '';

  buildPhaseCargoCommand = "cargo tauri build";

  # Disable automatic cargo binary installation (we install bundles manually)
  doNotPostBuildInstallCargoBinaries = true;

  checkPhase = ''
    run-parallel ${tasks}/check-platform.yaml
  '';

  installPhase = ''
    mkdir -p $out/bin
    cp target/release/scientific-assistant $out/bin/

    mkdir -p $out/bundle
    cp -r target/release/bundle/* $out/bundle/
  '';

  doCheck = true;
}
