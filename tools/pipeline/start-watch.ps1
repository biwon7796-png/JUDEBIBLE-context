param([switch]$InitialRun)
$ErrorActionPreference = "Stop"
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$Watch = Join-Path $Here "watch.js"

if (-not $env:JBC_VAULT) {
  Write-Error "JBC_VAULT is not set. Watcher startup refused."
  exit 2
}

& node $Watch --status *> $null
if ($LASTEXITCODE -eq 0) {
  & node $Watch --status
  exit 0
}

$args = @($Watch)
if ($InitialRun) { $args += "--initial-run" }
$proc = Start-Process -FilePath "node" -ArgumentList $args -WorkingDirectory (Resolve-Path (Join-Path $Here "..\..")) -WindowStyle Hidden -PassThru

for ($i=0; $i -lt 20; $i++) {
  Start-Sleep -Milliseconds 250
  & node $Watch --status *> $null
  if ($LASTEXITCODE -eq 0) {
    & node $Watch --status
    exit 0
  }
  if ($proc.HasExited) { break }
}

Write-Error "Watcher failed to become ACTIVE. Run: node tools/pipeline/watch.js --status"
exit 5
