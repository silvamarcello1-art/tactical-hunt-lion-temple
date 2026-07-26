$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$gameUrl = 'http://127.0.0.1:5173/'
$viteScript = Join-Path $projectDirectory 'node_modules\vite\bin\vite.js'

function Test-GameServer {
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $gameUrl -TimeoutSec 1
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

if (-not (Test-Path -LiteralPath $viteScript)) {
    Write-Host 'As dependencias do projeto ainda nao estao instaladas.'
    Write-Host 'Abra o projeto pelo Codex e solicite a instalacao das dependencias.'
    exit 1
}

if (-not (Test-GameServer)) {
    $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
    if ($nodeCommand) {
        $nodeExecutable = $nodeCommand.Source
    }
    else {
        $nodeExecutable = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
    }

    if (-not (Test-Path -LiteralPath $nodeExecutable)) {
        Write-Host 'Nao foi possivel localizar o Node.js.'
        exit 1
    }

    $arguments = @(
        $viteScript,
        '--host',
        '127.0.0.1',
        '--port',
        '5173'
    )

    Start-Process `
        -FilePath $nodeExecutable `
        -ArgumentList $arguments `
        -WorkingDirectory $projectDirectory `
        -WindowStyle Hidden

    $serverReady = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        Start-Sleep -Milliseconds 300
        if (Test-GameServer) {
            $serverReady = $true
            break
        }
    }

    if (-not $serverReady) {
        Write-Host 'O servidor nao iniciou dentro do tempo esperado.'
        exit 1
    }
}

Start-Process $gameUrl
exit 0
