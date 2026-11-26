param(
    [string]$Container = 'gestoracad_mysql',
    [string]$Database = 'gestoracad_db',
    [string]$OutputDir = (Join-Path $PSScriptRoot '..\backups'),
    [int]$RetentionDays = 14
)

$ErrorActionPreference = 'Stop'

if (-not (docker ps --filter "name=$Container" --format '{{.Names}}')) {
    throw "El contenedor '$Container' no está en ejecución."
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$fileName = "gestoracad_$stamp.sql.gz"
$remotePath = "/tmp/$fileName"

Write-Host "Generando respaldo de '$Database'..."
docker exec $Container sh -c "mysqldump -uroot -p`"`$MYSQL_ROOT_PASSWORD`" --single-transaction --quick --routines --triggers --events $Database | gzip > $remotePath"
docker cp "${Container}:$remotePath" (Join-Path $OutputDir $fileName)
docker exec $Container rm -f $remotePath

$backup = Get-Item (Join-Path $OutputDir $fileName)
$old = Get-ChildItem $OutputDir -Filter 'gestoracad_*.sql.gz' |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays) }
$old | Remove-Item -Force

Write-Host ("Respaldo creado: {0} ({1:N1} KB)" -f $backup.FullName, ($backup.Length / 1KB))
if ($old.Count -gt 0) {
    Write-Host ("Respaldos antiguos eliminados: {0}" -f $old.Count)
}
