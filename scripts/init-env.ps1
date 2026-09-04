$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $root '.env'
$values = [ordered]@{
    POSTGRES_PASSWORD = ''
    ERP_COMPANY_ID = ''
    ERP_TENANT = ''
    COMPOSE_PROJECT_NAME = ''
    ERP_LICENSE_TOKEN = ''
    ERP_PORT = '8080'
    TRIAL_DAYS = '30'
    VENDOR_LICENSE_URL = ''
    VENDOR_AGENT_KEY = ''
    VENDOR_LICENSE_CHECK_MINUTES = '5'
    LICENSE_GRACE_HOURS = '72'
    ERP_PUBLIC_URL = ''
    RESEND_API_KEY = ''
    EMAIL_FROM = ''
    EMAIL_REPLY_TO = ''
    SESSION_HOURS = '12'
    ALLOW_FACTORY_RESET = 'false'
    WHATSAPP_PHONE_NUMBER_ID = ''
    WHATSAPP_ACCESS_TOKEN = ''
    WHATSAPP_GRAPH_VERSION = 'v23.0'
}
if (Test-Path $envPath) {
    foreach ($line in Get-Content -LiteralPath $envPath) {
        if ($line -match '^\s*([^#=]+)=(.*)$') {
            $key=$matches[1].Trim(); $value=$matches[2].Trim()
            if ($values.Contains($key)) { $values[$key]=$value }
        }
    }
}
if ([string]::IsNullOrWhiteSpace($values.POSTGRES_PASSWORD)) { $values.POSTGRES_PASSWORD=[Guid]::NewGuid().ToString('N') }
if ([string]::IsNullOrWhiteSpace($values.ERP_COMPANY_ID)) { $values.ERP_COMPANY_ID=('C'+[Guid]::NewGuid().ToString('N').Substring(0,10)).ToUpperInvariant() }
if ([string]::IsNullOrWhiteSpace($values.ERP_TENANT)) { $values.ERP_TENANT=('company_'+$values.ERP_COMPANY_ID.ToLowerInvariant()) }
if ([string]::IsNullOrWhiteSpace($values.COMPOSE_PROJECT_NAME)) { $values.COMPOSE_PROJECT_NAME=('erp_'+$values.ERP_COMPANY_ID.ToLowerInvariant()) }
$vendorKeyPath = Join-Path $root 'vendor-private\license-private.pem'
$lines=@(); foreach($k in $values.Keys){$lines += "$k=$($values[$k])"}
[System.IO.File]::WriteAllLines($envPath,$lines,[System.Text.Encoding]::ASCII)
Write-Host "Environment ready for company $($values.ERP_COMPANY_ID)"
Write-Host "Docker project: $($values.COMPOSE_PROJECT_NAME)"

