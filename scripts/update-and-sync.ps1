$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
node (Join-Path $ScriptDir "update-and-sync.mjs") @args
