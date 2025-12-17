{ pkgs, projectName }:

pkgs.stdenv.mkDerivation {
  pname = "${projectName}-run-parallel";
  version = "1.0.0";

  src = ./.;

  installPhase = ''
    mkdir -p $out/bin
    cp run-parallel.sh $out/bin/run-parallel
    chmod +x $out/bin/run-parallel
  '';
}
