@echo off
setlocal enabledelayedexpansion

:: Definir variables
set REPO_URL=https://github.com/juantomoo/DomestkSuite/archive/refs/heads/main.zip
set TEMP_DIR=%~dp0update_tmp
set TARGET_DIR=%~dp0
set ZIP_FILE=%TEMP_DIR%\update.zip

:: Crear carpeta temporal
if exist "%TEMP_DIR%" rd /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"

:: Descargar la última versión del repositorio
powershell -Command "Invoke-WebRequest -Uri '%REPO_URL%' -OutFile '%ZIP_FILE%'"
if %errorlevel% neq 0 (
    echo Error al descargar el archivo.
    exit /b 1
)

:: Extraer el contenido del ZIP
powershell -Command "Expand-Archive -Path '%ZIP_FILE%' -DestinationPath '%TEMP_DIR%' -Force"
if %errorlevel% neq 0 (
    echo Error al extraer el archivo.
    exit /b 1
)

:: Mover archivos a la carpeta principal sin eliminar archivos no modificados
set SOURCE_DIR=
for /d %%D in ("%TEMP_DIR%\DomestkSuite-*") do set SOURCE_DIR=%%D
if not defined SOURCE_DIR (
    echo No se encontró el directorio extraído.
    exit /b 1
)

xcopy /E /Y /C /Q "%SOURCE_DIR%\*" "%TARGET_DIR%"
if %errorlevel% neq 0 (
    echo Error al actualizar los archivos.
    exit /b 1
)

:: Limpiar archivos temporales
rd /s /q "%TEMP_DIR%"
echo Actualización completada con éxito.
exit /b 0
