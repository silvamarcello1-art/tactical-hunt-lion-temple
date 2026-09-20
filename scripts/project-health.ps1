[CmdletBinding()]
param(
  [string]$Repository = (Get-Location).Path
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Invoke-Git {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)
  $output = & git -C $script:Root @Arguments 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "git $($Arguments -join ' ') failed:`n$($output -join "`n")"
  }
  return @($output)
}

$resolvedRepository = (Resolve-Path -LiteralPath $Repository).Path
$rootOutput = & git -C $resolvedRepository rev-parse --show-toplevel 2>&1
if ($LASTEXITCODE -ne 0) {
  throw "Not a Git repository: $resolvedRepository"
}

$script:Root = ($rootOutput | Select-Object -First 1).Trim()
$branch = (Invoke-Git branch --show-current | Select-Object -First 1).Trim()
$localHead = (Invoke-Git rev-parse HEAD | Select-Object -First 1).Trim()
$status = @(Invoke-Git status --short)
$remoteBranchRef = if ($branch) { "refs/remotes/origin/$branch" } else { $null }
$originHead = $null
$ahead = $null
$behind = $null
$originDefault = (& git -C $script:Root symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>$null)
if ($LASTEXITCODE -ne 0) { $originDefault = '(not configured)' } else { $originDefault = ($originDefault | Select-Object -First 1).Trim() }

if ($remoteBranchRef) {
  & git -C $script:Root show-ref --verify --quiet $remoteBranchRef
  if ($LASTEXITCODE -eq 0) {
    $originHead = (Invoke-Git rev-parse "origin/$branch" | Select-Object -First 1).Trim()
    $counts = (Invoke-Git rev-list --left-right --count "origin/$branch...HEAD" | Select-Object -First 1).Trim() -split '\s+'
    $behind = [int]$counts[0]
    $ahead = [int]$counts[1]
  }
}

$upstream = (& git -C $script:Root rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>$null)
if ($LASTEXITCODE -ne 0) { $upstream = '(none)' } else { $upstream = ($upstream | Select-Object -First 1).Trim() }

Write-Output 'Tactical Hunt - Project Health'
Write-Output "Repository root : $($script:Root)"
Write-Output "Current branch  : $(if ($branch) { $branch } else { '(detached HEAD)' })"
Write-Output "Upstream        : $upstream"
Write-Output "Origin default  : $originDefault"
Write-Output "Local HEAD      : $localHead"
Write-Output "Origin HEAD     : $(if ($originHead) { $originHead } else { '(branch not found on origin)' })"
Write-Output "Ahead / Behind  : $(if ($null -ne $ahead) { "$ahead / $behind" } else { '(not available)' })"
Write-Output "Worktree        : $(if ($status.Count -eq 0) { 'CLEAN' } else { 'DIRTY' })"
Write-Output 'Remotes:'
$remoteLines = @(& git -C $script:Root remote -v 2>&1)
if ($LASTEXITCODE -ne 0) { throw "git remote -v failed:`n$($remoteLines -join "`n")" }
$remoteLines | ForEach-Object { Write-Output "  $_" }
Write-Output 'Git status --short:'
if ($status.Count -eq 0) {
  Write-Output '  (clean)'
} else {
  $status | ForEach-Object { Write-Output "  $_" }
}
