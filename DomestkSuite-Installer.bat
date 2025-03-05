@echo off
echo -----------------------------------------
echo Instalacion de Domestika Offline
echo -----------------------------------------

REM Forzar la carpeta de trabajo al directorio del propio .bat
cd /d "%~dp0"

REM Verificar que Node.js esté instalado
node -v >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js no esta instalado. Por favor instale Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar que npm esté instalado
npm -v >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: npm no esta instalado.
    pause
    exit /b 1
)

echo Instalando dependencias de Node.js...
npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error: No se pudieron instalar las dependencias de Node.js.
    pause
    exit /b 1
)

REM Determinar el ejecutable requerido para Windows
set EXECUTABLE=N_m3u8DL-RE.exe
if not exist "%EXECUTABLE%" (
    echo Advertencia: El ejecutable %EXECUTABLE% no se encontro.
    echo Por favor descargue el ejecutable desde: https://github.com/nilaoda/N_m3u8DL-RE/releases
) else (
    echo Ejecutable %EXECUTABLE% encontrado.
)

echo -----------------------------------------
echo Instalacion completada.
echo Para iniciar la aplicacion:
echo   * Ejecute "npm run serve" para iniciar la interfaz web.
echo   * Ejecute "npm start" para iniciar el downloader (servidor WebSocket).
echo -----------------------------------------
pause
exit /b 0
