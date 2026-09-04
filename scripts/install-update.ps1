param([string]$TargetPath='')
$ErrorActionPreference='Stop'
trap { Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red; exit 1 }
$source=(Resolve-Path (Split-Path -Parent $PSScriptRoot)).Path

function Select-ErpFolder {
    Add-Type -AssemblyName System.Windows.Forms
    $dialog=New-Object System.Windows.Forms.FolderBrowserDialog
    $dialog.Description='Select the current ERP folder containing .env and docker-compose.yml'
    $dialog.ShowNewFolderButton=$false
    if($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK){throw 'No ERP folder was selected.'}
    return $dialog.SelectedPath
}

if([string]::IsNullOrWhiteSpace($TargetPath)){
    if((Test-Path (Join-Path $source '.env')) -and (Test-Path (Join-Path $source 'docker-compose.yml'))){$TargetPath=$source}
    else{$TargetPath=Select-ErpFolder}
}
$target=(Resolve-Path $TargetPath).Path
foreach($required in @('.env','docker-compose.yml','package.json')){if(!(Test-Path (Join-Path $target $required))){throw "The selected ERP folder is missing $required."}}

docker info *> $null
if($LASTEXITCODE -ne 0){throw 'Docker Desktop is not running. Start Docker Desktop and try again.'}

$backupDir=Join-Path $target 'backups'
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
$stamp=Get-Date -Format 'yyyyMMdd_HHmmss'
$backupFile=Join-Path $backupDir "pre_update_$stamp.dump"
Push-Location $target
try{
    Write-Host '[1/6] Creating a PostgreSQL backup before updating...'
    docker compose --env-file '.env' exec -T db pg_dump -U tourism_erp -d tourism_erp -Fc -f /tmp/erp_pre_update.dump
    if($LASTEXITCODE -ne 0){throw 'Backup creation failed. The update stopped before replacing any file.'}
    docker compose --env-file '.env' cp db:/tmp/erp_pre_update.dump $backupFile
    if($LASTEXITCODE -ne 0){throw 'Could not copy the backup file. The update stopped.'}
    docker compose --env-file '.env' exec -T db sh -c 'rm -f /tmp/erp_pre_update.dump' *> $null

    if($source -ne $target){
        Write-Host '[2/6] Copying application code and preserving company data...'
        robocopy $source $target /E /R:2 /W:1 /XD node_modules release backups licenses vendor-private /XF .env | Out-Host
        if($LASTEXITCODE -ge 8){throw "Robocopy failed with code $LASTEXITCODE."}
    }else{Write-Host '[2/6] Update files are already inside the ERP folder.'}

    Write-Host '[3/6] Removing only obsolete iframe integration files...'
    $deleteManifest=Join-Path $source 'UPDATE_DELETE_MANIFEST.txt'
    if(Test-Path $deleteManifest){
        foreach($relative in Get-Content $deleteManifest){
            $relative=$relative.Trim()
            if([string]::IsNullOrWhiteSpace($relative)){continue}
            $obsolete=Join-Path $target $relative
            if(Test-Path $obsolete){Remove-Item $obsolete -Force -ErrorAction Stop}
        }
    }

    Write-Host '[4/6] Building the new application image...'
    docker compose --env-file '.env' build --pull --no-cache app
    if($LASTEXITCODE -ne 0){throw 'Docker build failed. The database and .env were not changed.'}

    Write-Host '[5/6] Starting the new version without deleting Docker volumes...'
    docker compose --env-file '.env' up -d
    if($LASTEXITCODE -ne 0){throw 'The new application could not start.'}

    Write-Host '[6/6] Checking server health and version...'
    $port='8080';foreach($line in Get-Content '.env'){if($line -match '^ERP_PORT=(.+)$'){$port=$matches[1].Trim()}}
    $health=$null;for($i=0;$i -lt 20;$i++){try{$health=Invoke-RestMethod -Uri "http://localhost:$port/api/health" -TimeoutSec 4;break}catch{Start-Sleep -Seconds 2}}
    if(!$health -or $health.ok -ne $true){throw 'The app started but /api/health did not respond successfully.'}
    $expected=(Get-Content 'package.json' -Raw | ConvertFrom-Json).version
    if([string]$health.version -ne [string]$expected){throw "Running version $($health.version) does not match expected version $expected."}
    Write-Host "Update to v$expected completed. Backup: $backupFile" -ForegroundColor Green
}finally{Pop-Location}
