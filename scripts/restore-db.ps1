param(
    [Parameter(Mandatory = $true)]
    [string]$File,
    [string]$Container = 'gestoracad_mysql',
    [string]$Database = 'gestoracad_db',
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $File)) {
    throw "No existe el archivo indicado."
}
if (-not (docker ps --filter "name=$Container" --format '{{.Names}}')) {
    throw "El contenedor '$Container' no está en ejecución."
}

$localFile = (Get-Item -LiteralPath $File).FullName
Write-Host "ATENCIÓN: se reemplazarán las tablas de '$Database' con el respaldo:"
Write-Host "  $localFile"
if (-not $Force) {
    $confirmation = Read-Host "Escribe RESTAURAR para continuar"
    if ($confirmation -ne 'RESTAURAR') {
        Write-Host 'Restauración cancelada.'
        exit 1
    }
}

$stamp = Get-Date -Format 'yyyyMMddHHmmss'
$remotePath = '/tmp/restore_' + $stamp + '.sql.gz'
$target = $Container + ':' + $remotePath
docker cp $localFile $target
$restoreCommand = 'gunzip -c ' + $remotePath + ' | mysql -uroot -p$MYSQL_ROOT_PASSWORD ' + $Database
docker exec $Container sh -c $restoreCommand
docker exec $Container rm -f $remotePath

Write-Host 'Restauración completada.'
