@echo off
REM ============================================================
REM  Servidor LOCAL de Bitácora de Cumplimiento
REM  Configura aquí tus valores antes del primer arranque:
REM ============================================================
set BACKUP_DIR=D:\RespaldosBitacora
REM ↑ Carpeta del disco del colaborador donde se guardará el
REM   respaldo automático diario (créala antes si no existe)
set BACKUP_TIME=20:00
REM ↑ Hora del respaldo diario automático (24 h)
set ADMIN_EMAIL=admin@local
set ADMIN_PASSWORD=cambiar123
REM ↑ Usuario inicial (cámbialo después desde la app)

cd /d "%~dp0"
echo ============================================
echo  Bitácora LOCAL - servidor iniciando...
echo  Al terminar, entra desde la red a:
echo  http://IP-DE-ESTA-PC:8080
echo ============================================
node server\index.js
pause
