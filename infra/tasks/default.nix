{ pkgs }:

pkgs.stdenv.mkDerivation {
  pname = "task-configs";
  version = "1.0.0";

  src = ./.;

  installPhase = ''
    mkdir -p $out
    cp *.yaml $out/
  '';
}
