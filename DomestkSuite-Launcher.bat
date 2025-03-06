@echo off
cd "%~dp0"

echo -----------------------------------------
echo DmstkSuite Launcher
echo -----------------------------------------

REM Comprobar si ya se han instalado las dependencias (verifica si existe la carpeta node_modules)
if not exist "node_modules" (
    echo Instalando dependencias...
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo Error: No se pudieron instalar las dependencias.
        echo Presiona una tecla para ver el error...
        pause
        exit /b 1
    )
)

REM Iniciar el servidor downloader (WebSocket) en una nueva ventana
echo Iniciando el Downloader (servidor WebSocket)...
start "Downloader Server" cmd /k "call npm start"

REM Iniciar el servidor para la interfaz web en una nueva ventana
echo Iniciando el servidor frontend...
start "Frontend Server" cmd /k "call npm run serve"

REM Esperar 5 segundos para que los servidores se inicien
timeout /t 5

REM Abrir el navegador predeterminado con la URL de la aplicación
echo Abriendo el navegador...
start "" "http://localhost:8080"

echo -----------------------------------------
echo DmstkSuite Launcher iniciado.
pause
exit /b 0
