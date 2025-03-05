# DomestkSuite
<<<<<<< HEAD
Descargar y ver mis cursos offline


DomestkSuite es una herramienta desarrollada en Node.js que permite descargar cursos completos de Domestika para visualizarlos sin conexión. La aplicación utiliza Puppeteer para la automatización del navegador, Cheerio para el scraping de datos, y un ejecutable externo (N_m3u8DL-RE o N_m3u8DL-RE.exe) para descargar videos y sus subtítulos. Además, se establece una comunicación en tiempo real mediante WebSockets para informar el progreso global de la descarga a la interfaz web.

## Funcionalidades

- **Descarga de Cursos:**
  - **Extracción de Contenido:** Utiliza Puppeteer y Cheerio para navegar y extraer el título del curso, módulos (unidades) y la lista de videos de cada unidad a partir de la URL proporcionada.
  - **Autenticación:** Requiere que el usuario ingrese las cookies `domestika_session` y `credentials` para autenticar la sesión en Domestika.
  - **Descarga de Video y Subtítulos:** Ejecuta el descargador N_m3u8DL-RE para bajar en paralelo el archivo de video y los subtítulos (en el idioma seleccionado). Se realiza un manejo “suave” de errores para los subtítulos, de forma que, si fallan, no interrumpan la descarga del video.
  - **Pool de Descargas:** La descarga de videos se optimiza ejecutando hasta 4 tareas simultáneas, aprovechando al máximo el ancho de banda.
  - **Progreso Global:** Se calcula y envía el progreso global (porcentaje completado) y el tiempo restante estimado a la interfaz en intervalos regulares mediante WebSockets.

- **Interfaz de Usuario:**
  - **Pantalla Inicial:** Permite elegir entre iniciar una descarga o visualizar los cursos descargados.
  - **Formulario de Descarga:** Permite ingresar la URL del curso, el idioma de subtítulos y las cookies de autenticación.
  - **Visualización de Progreso:** Una barra de progreso y un texto muestran el avance global de la descarga y el tiempo restante estimado.
  - **Listado de Cursos Descargados:** Muestra los cursos que se han descargado, permitiendo al usuario ver detalles o abrir el reproductor.
  - **Reproductor de Video:** Incorpora controles básicos (play, pause, anterior, siguiente, volumen, subtítulos y pantalla completa) y una lista de reproducción para navegar entre los videos.

- **Comunicación en Tiempo Real:**
  - Se utiliza un servidor WebSocket para enviar mensajes de progreso y estado (por ejemplo, “downloading”, “completed”, “error”) desde el backend (descargador) a la interfaz.

## Procesos y Flujo de Trabajo

1. **Extracción y Descarga:**
   - Al enviar el formulario de descarga, la aplicación utiliza Puppeteer para abrir la URL del curso y extraer la información necesaria.
   - Se construye una cola de tareas con todos los videos a descargar.
   - La cola se procesa en lotes de hasta 4 descargas simultáneas. Por cada video, se ejecutan en paralelo los procesos de descarga de video y subtítulos.
   - Se calculan, de forma global, el porcentaje de videos completados y el tiempo restante estimado basado en la velocidad promedio y el tamaño promedio de los videos.

2. **Actualización de Progreso:**
   - Durante el proceso de descarga, el backend envía mensajes periódicos (cada 2 segundos) vía WebSocket con el estado global: porcentaje completado y tiempo restante.
   - La interfaz web recibe estos mensajes y actualiza la barra de progreso y el texto correspondiente.

3. **Visualización y Reproducción:**
   - Una vez finalizada la descarga, se pueden listar los cursos descargados en la interfaz.
   - La aplicación incluye un reproductor de video con lista de reproducción y controles, permitiendo al usuario ver el contenido descargado sin conexión.

## Instalación

Siga estos pasos para instalar y configurar la aplicación:

1. **Requisitos Previos:**
   - [Node.js](https://nodejs.org/) (versión 12 o superior) y npm instalados.
   - El ejecutable `N_m3u8DL-RE` (o `N_m3u8DL-RE.exe` en Windows) debe estar presente en el directorio raíz. Descárguelo desde: [N_m3u8DL-RE Releases](https://github.com/nilaoda/N_m3u8DL-RE/releases).

2. **Clonar el Repositorio:**
   ```bash
   git clone <URL_del_repositorio>
   cd domestika-offline
   ```

3. **Instalación Automática:**
   - En entornos Unix/Linux o compatibles con bash:
     ```bash
     bash install.sh
     ```
   - En Windows (nativo), ejecute:
     ```cmd
     install.bat
     ```
     
   Estos scripts comprobarán que Node.js y npm estén instalados, instalarán todas las dependencias y verificarán la existencia del ejecutable requerido.

## Uso

### Iniciar la Aplicación

La aplicación consta de dos componentes principales: el servidor web (que sirve la interfaz) y el servidor de descargas (WebSocket).

#### Opción 1: Usando npm

- **Interfaz de Usuario:**  
  Inicia el servidor web que sirve la interfaz:
  ```bash
  npm run serve
  ```
  La aplicación estará disponible en `http://localhost:8080`.

- **Descarga de Cursos:**  
  Inicia el servidor de descargas:
  ```bash
  npm start
  ```
  Luego, utiliza la interfaz para ingresar la URL del curso, el idioma de subtítulos y las cookies, y comienza la descarga.

#### Opción 2: Usando el Launcher (Windows)

Ejecute el archivo **DomestkSuite Launcher.bat** (ubicado en la raíz del proyecto). Este archivo batch:
- Verifica e instala las dependencias (si es necesario).
- Inicia el servidor de descargas y el servidor web en ventanas separadas.
- Abre la aplicación en el navegador predeterminado.

Para ejecutarlo, haga doble clic en **DomestkSuite Launcher.bat** o, desde la línea de comandos:
```cmd
DomestkSuite Launcher.bat
```

## Actualización

Para actualizar la aplicación, simplemente:
1. Realice un pull o vuelva a clonar el repositorio.
2. Ejecute nuevamente el script de instalación:
   - En Unix/Linux:
     ```bash
     bash install.sh
     ```
   - En Windows:
     ```cmd
     install.bat
     ```

## Notas

- La aplicación utiliza Puppeteer para automatizar la navegación, Cheerio para extraer datos, y WebSockets para comunicar el progreso en tiempo real.
- Se recomienda ejecutar la aplicación en un entorno que permita la automatización (por ejemplo, una máquina con permisos para ejecutar Puppeteer).
- La descarga se optimiza con un pool de hasta 4 descargas simultáneas y se actualiza el progreso global en la interfaz.
- La instalación está diseñada para entornos Unix/Linux, pero se incluye compatibilidad nativa con Windows mediante scripts batch y un launcher.

## Licencia

MIT.
Desarrollado por Tomoo.
```

