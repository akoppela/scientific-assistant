{ pkgs, projectName }:

pkgs.stdenv.mkDerivation {
  pname = "${projectName}-tasks";
  version = "1.0.0";

  src = ./.;

  installPhase = ''
    mkdir -p $out
    cp *.yaml $out/
  '';
}
