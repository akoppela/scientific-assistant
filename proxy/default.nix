{ pkgs, projectName, runParallelTool, tsLintTools, tasks }:

let
  # Override wrangler to fully remove prettier/eslint to avoid conflicts with our standalone versions
  wrangler-patched = pkgs.wrangler.overrideAttrs (oldAttrs: {
    postInstall = (oldAttrs.postInstall or "") + ''
      # Remove prettier/eslint directories completely, not just binaries
      rm -rf $out/lib/node_modules/prettier
      rm -rf $out/lib/node_modules/eslint
      rm -rf $out/lib/node_modules/typescript
      rm -rf $out/lib/packages/wrangler/node_modules/prettier
      rm -rf $out/lib/packages/wrangler/node_modules/eslint
      rm -rf $out/lib/packages/wrangler/node_modules/typescript
    '';
  });
in
{
  # Proxy package (runs tests in checkPhase)
  package = pkgs.buildNpmPackage {
    pname = "${projectName}-proxy";
    version = "1.0.0";

    src = ./.;

    npmDepsHash = "sha256-h0OEztkZj9rEUeJ3BCCycQ0swDZ8rnMQSgeGhFKvV0o=";
    npmFlags = [ "--ignore-scripts" ];

    nativeBuildInputs = runParallelTool ++ tsLintTools;

    dontNpmBuild = true;

    checkPhase = ''
      run-parallel ${tasks}/check-proxy.yaml
    '';

    installPhase = ''
      mkdir -p $out
      cp -r . $out/
    '';

    doCheck = true;
  };

  # Wrangler CLI tool (for dev commands)
  wrangler = wrangler-patched;
}
