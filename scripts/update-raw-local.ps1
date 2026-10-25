# Download the freeway XML and the Kaohsiung CCTV list from this PC (Taiwan IP)
# and push them to GitHub. GitHub Actions then converts them into data\*.json.
#
# Why local: both government sites time out when GitHub's servers try to connect.
#
# Run by hand:  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\update-raw-local.ps1

$ErrorActionPreference = "Stop"

$Repo = Split-Path -Parent $PSScriptRoot
Set-Location $Repo

$Sources = @(
    @{
        Name = "Freeway"
        Url  = "https://tisvcloud.freeway.gov.tw/history/motc20/CCTV.xml"
        File = "raw\CCTV.xml"
        Git  = "raw/CCTV.xml"
        Kind = "xml"
    },
    @{
        Name = "Kaohsiung"
        Url  = "https://traffic.tbkc.gov.tw/api/cctvs?neLat=23.5&neLng=121.1&swLat=22.3&swLng=120.0&language=zh-TW"
        File = "raw\kaohsiung-original.json"
        Git  = "raw/kaohsiung-original.json"
        Kind = "json"
    }
)

function Run-Git {
    & git @args
    if ($LASTEXITCODE -ne 0) { throw "git $($args -join ' ') failed (exit $LASTEXITCODE)" }
}

function Count-Xml($Path) {
    $xml = New-Object System.Xml.XmlDocument
    $xml.Load($Path)
    return $xml.SelectNodes("//*[local-name()='CCTVID']").Count
}

function Count-Json($Path) {
    $text = [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
    $data = $text | ConvertFrom-Json
    if ($data -isnot [System.Array]) { return -1 }
    $valid = @($data | Where-Object { $_.id -and $null -ne $_.position })
    return @($valid | Select-Object -ExpandProperty id -Unique).Count
}

function Count-Cameras($Kind, $Path) {
    if ($Kind -eq "xml") { return Count-Xml $Path }
    return Count-Json $Path
}

# 1. Sync with GitHub first (the bot may have pushed new commits)
Run-Git pull --rebase --autostash origin main

$Changed = @()
$Failed  = @()

foreach ($s in $Sources) {
    $Tmp = [System.IO.Path]::GetTempFileName()
    $Target = Join-Path $Repo $s.File

    try {
        Write-Host "[$($s.Name)] downloading..."
        Invoke-WebRequest -Uri $s.Url -OutFile $Tmp -UseBasicParsing -TimeoutSec 120 -Headers @{ Accept = "*/*" }

        $New = Count-Cameras $s.Kind $Tmp
        if ($New -le 0) { throw "downloaded file has no usable cameras (format changed?)" }

        $Old = 0
        if (Test-Path $Target) {
            try { $Old = Count-Cameras $s.Kind $Target } catch { $Old = 0 }
        }
        Write-Host "[$($s.Name)] downloaded: $New cameras; current file: $Old cameras"

        if ($Old -gt 0 -and ($New * 100) -lt ($Old * 70)) {
            throw "new file has more than 30% fewer cameras than the current one. Not overwriting."
        }

        New-Item -ItemType Directory -Force -Path (Split-Path $Target) | Out-Null
        Copy-Item $Tmp $Target -Force
        Run-Git add $s.Git
        $Changed += "$($s.Name) $New"
    }
    catch {
        Write-Host "[$($s.Name)] ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $Failed += $s.Name
    }
    finally {
        if (Test-Path $Tmp) { Remove-Item $Tmp -Force }
    }
}

# 2. Commit and push only if something changed
& git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "No changes. Nothing to push."
}
else {
    Run-Git commit -m "chore: update raw CCTV data ($($Changed -join ', '))"

    & git push origin HEAD:main
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Push failed. Syncing and retrying once..."
        Run-Git pull --rebase --autostash origin main
        Run-Git push origin HEAD:main
    }
    Write-Host "Pushed. GitHub Actions will convert the data in a minute or two."
}

if ($Failed.Count -gt 0) {
    Write-Host "Failed: $($Failed -join ', ')" -ForegroundColor Red
    exit 1
}
