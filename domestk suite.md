Este documento contiene todo el código fuente de DomestkSuite

---
index.html

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>DmstkSuite</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <!-- Enlaces a fuentes, íconos y estilos globales -->
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <!-- VIDEO DE FONDO para toda la aplicación -->
  <video
    id="video-element"
    preload="auto"
    muted
    loop
    autoplay
  >
    <!-- Podrías agregar <track> aquí si usas subtítulos globales -->
  </video>

  <!-- Barra Superior (navegación) -->
  <header>
    <!-- Nombre de la aplicación a la izquierda (clic → ir a la pantalla de inicio) -->
    <div class="app-name" id="btn-home">DmstkSuite</div>
    <!-- Íconos de navegación (sin texto, solo alt) -->
    <div class="nav-icons">
      <img
        src="icons/download.svg"
        alt="Descargar"
        id="icon-download"
      />
      <img
        src="icons/visualize.svg"
        alt="Visualizar"
        id="icon-visualize"
      />
    </div>
  </header>

  <!-- Contenido principal -->
  <main id="main-content">
    <!-- Pantalla de inicio (vacía con fondo sólido hasta que se muestre algo) -->
    <section id="home-screen" class="screen active" aria-label="Pantalla de inicio">
      <!-- Aquí puedes agregar un mensaje de bienvenida o dejarlo vacío -->
    </section>

    <!-- Pantalla de Descargar -->
    <section id="download-screen" class="screen" aria-label="Pantalla de descarga">
      <h2>Descargar Cursos</h2>
      <form id="download-form">
        <div class="form-group">
          <label for="course-url">URL del curso:</label>
          <input type="text" id="course-url" required />
        </div>
        <div class="form-group">
          <label for="subtitle-lang">Idioma de subtítulos (ej: es):</label>
          <input type="text" id="subtitle-lang" required />
        </div>
        <div class="form-group">
          <label for="session-cookie">Cookie <em>_domestika_session</em>:</label>
          <input type="text" id="session-cookie" required />
        </div>
        <div class="form-group">
          <label for="credentials">Cookie <em>_credentials_</em>:</label>
          <input type="text" id="credentials" required />
        </div>
        <button type="submit" class="download-btn">Iniciar Descarga</button>
      </form>
      <!-- Notificaciones de descarga -->
      <div class="notifications" id="download-notifications"></div>
    </section>

    <!-- Pantalla de Visualizar -->
    <section id="visualize-screen" class="screen" aria-label="Pantalla de visualización">
      <h2>Visualizar Cursos</h2>
      <!-- Selector de cursos (tarjetas) -->
      <div class="courses-grid" id="courses-grid"></div>
    </section>

    <!-- Pantalla de Módulos (unidades) -->
    <section id="modules-screen" class="screen" aria-label="Pantalla de módulos">
      <h2>Módulos del Curso</h2>
      <div id="modules-list"></div>
    </section>

    <!-- Pantalla de Lecciones -->
    <section id="lessons-screen" class="screen" aria-label="Pantalla de lecciones">
      <h2>Lecciones del Módulo</h2>
      <div id="lessons-list"></div>
    </section>

    <!-- Pantalla del Reproductor -->
    <section id="player-screen" class="screen" aria-label="Reproductor de video">
      <h2 class="player-heading">Reproductor de Video</h2>
      <p>Aquí podrías mostrar detalles del video seleccionado o controles adicionales.</p>
    </section>
  </main>

  <!-- Barra Inferior (Controles de reproducción) -->
  <footer>
    <div class="player-controls">
      <img
        src="icons/previous.svg"
        alt="Retroceder"
        id="btn-prev"
      />
      <img
        src="icons/play.svg"
        alt="Reproducir/Pausar"
        id="btn-play-pause"
      />
      <img
        src="icons/next.svg"
        alt="Avanzar"
        id="btn-next"
      />
      <!-- Barra de desplazamiento para el tiempo -->
      <input
        type="range"
        min="0"
        max="100"
        value="0"
        id="time-slider"
        class="time-slider"
        aria-label="Control de progreso"
      />
      <!-- Alternador de subtítulos -->
      <img
        src="icons/subtitles.svg"
        alt="Subtítulos"
        id="btn-subtitles"
      />
      <!-- Sonido / Silencio y volumen -->
      <div class="volume-container">
        <img
          src="icons/volume.svg"
          alt="Sonido"
          id="btn-mute"
        />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value="1"
          class="volume-slider"
          id="volume-slider"
          aria-label="Control de volumen"
        />
      </div>
      <!-- Pantalla completa -->
      <img
        src="icons/fullscreen.svg"
        alt="Pantalla completa"
        id="btn-fullscreen"
      />
    </div>
  </footer>

  <!-- Script principal (no incluir aquí el contenido) -->
  <script src="script.js"></script>
</body>
</html>

---

script.js


// Ícono de Descargar → pantalla de descarga
iconDownload.addEventListener("click", () => {
  hideAllScreens();
  downloadScreen.classList.add("active");
});

// Ícono de Visualizar → pantalla de cursos
iconVisualize.addEventListener("click", () => {
  hideAllScreens();
  visualizeScreen.classList.add("active");
  requestCoursesList(); // Pedir al servidor la lista de cursos
});

// -------------------- Lógica de Descarga --------------------
if (downloadForm) {
  downloadForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      alert("WebSocket no conectado. Asegúrate de que el servidor está activo.");
      return;
    }
    const courseUrl     = document.getElementById("course-url").value;
    const subtitleLang  = document.getElementById("subtitle-lang").value;
    const sessionCookie = document.getElementById("session-cookie").value;
    const credentials   = document.getElementById("credentials").value;

    // Enviamos al servidor la acción "download"
    const message = {
      action: "download",
      courseUrl,
      subtitleLang,
      sessionCookie,
      credentials,
    };
    socket.send(JSON.stringify(message));

    downloadNotifications.classList.add("active");
    downloadNotifications.textContent = "Iniciando descarga...";
  });
}

// -------------------- Solicitar y Renderizar Cursos --------------------
function requestCoursesList() {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn("WebSocket no conectado. No se puede solicitar lista de cursos.");
    return;
  }
  socket.send(JSON.stringify({ action: "list_courses" }));
}

/**
 * Muestra los cursos disponibles en la pantalla "visualize-screen".
 */
function renderCourses(courses) {
  if (!coursesGrid) return;
  coursesGrid.innerHTML = "";
  if (!courses || courses.length === 0) {
    coursesGrid.innerHTML = "<p>No hay cursos descargados.</p>";
    return;
  }

  courses.forEach((course) => {
    const card = document.createElement("div");
    card.className = "course-card";
    card.addEventListener("click", () => {
      renderModules(course);
    });

    // Miniatura (ficticia o real)
    const thumb = document.createElement("img");
    thumb.className = "course-thumb";
    thumb.src = "https://picsum.photos/200/100?random=" + Math.floor(Math.random() * 1000);
    thumb.alt = `Miniatura de ${course.name}`;

    const info = document.createElement("div");
    info.className = "course-info";

    const h3 = document.createElement("h3");
    h3.textContent = course.name;

    info.appendChild(h3);
    card.appendChild(thumb);
    card.appendChild(info);
    coursesGrid.appendChild(card);
  });
}

/**
 * Muestra los módulos de un curso en la pantalla "modules-screen".
 */
function renderModules(course) {
  hideAllScreens();
  modulesScreen.classList.add("active");

  modulesList.innerHTML = "";
  if (!course.modules || course.modules.length === 0) {
    modulesList.innerHTML = "<p>Este curso no tiene módulos.</p>";
    return;
  }

  course.modules.forEach((mod) => {
    const modItem = document.createElement("div");
    modItem.className = "playlist-item";
    modItem.textContent = mod.name;
    modItem.addEventListener("click", () => {
      renderLessons(mod);
    });
    modulesList.appendChild(modItem);
  });
}

/**
 * Muestra las lecciones de un módulo en la pantalla "lessons-screen".
 */
function renderLessons(module) {
  hideAllScreens();
  lessonsScreen.classList.add("active");

  lessonsList.innerHTML = "";
  if (!module.lessons || module.lessons.length === 0) {
    lessonsList.innerHTML = "<p>Este módulo no tiene lecciones.</p>";
    return;
  }

  module.lessons.forEach((lesson) => {
    const lessonItem = document.createElement("div");
    lessonItem.className = "playlist-item";
    lessonItem.textContent = lesson.name;
    lessonItem.addEventListener("click", () => {
      playLesson(lesson);
    });
    lessonsList.appendChild(lessonItem);
  });
}

/**
 * Reproduce una lección (asigna el archivo al video y muestra la pantalla del reproductor).
 */
function playLesson(lesson) {
  hideAllScreens();
  playerScreen.classList.add("active");

  videoElement.src = lesson.file;
  videoElement.load();
  videoElement.play().catch(err => {
    console.warn("No se pudo reproducir automáticamente:", err);
  });
}

// -------------------- Controles de Reproducción (Barra Inferior) --------------------
let isPlaying = false;

btnPlayPause.addEventListener("click", () => {
  if (isPlaying) {
    videoElement.pause();
  } else {
    videoElement.play().catch(err => {
      console.warn("No se pudo reproducir automáticamente:", err);
    });
  }
});

videoElement.addEventListener("play", () => {
  isPlaying = true;
  if (btnPlayPause.tagName === "IMG") {
    btnPlayPause.src = "icons/pause.svg";
  }
});

videoElement.addEventListener("pause", () => {
  isPlaying = false;
  if (btnPlayPause.tagName === "IMG") {
    btnPlayPause.src = "icons/play.svg";
  }
});

// Botones anterior / siguiente (ajusta tu propia lógica)
btnPrev.addEventListener("click", () => {
  alert("Retroceder al video anterior (lógica personalizada)");
});
btnNext.addEventListener("click", () => {
  alert("Avanzar al siguiente video (lógica personalizada)");
});

// Barra de progreso
timeSlider.addEventListener("input", () => {
  if (videoElement.duration) {
    const pct = parseFloat(timeSlider.value) / 100;
    videoElement.currentTime = pct * videoElement.duration;
  }
});

videoElement.addEventListener("timeupdate", () => {
  if (videoElement.duration) {
    const pct = (videoElement.currentTime / videoElement.duration) * 100;
    timeSlider.value = pct;
  }
});

// Subtítulos
btnSubtitles.addEventListener("click", () => {
  if (videoElement.textTracks && videoElement.textTracks.length > 0) {
    const track = videoElement.textTracks[0];
    track.mode = (track.mode === "showing") ? "disabled" : "showing";
    alert(`Subtítulos: ${track.mode === "showing" ? "Activados" : "Desactivados"}`);
  }
});

// Sonido / silencio
let isMuted = false;
btnMute.addEventListener("click", () => {
  isMuted = !isMuted;
  videoElement.muted = isMuted;
  if (btnMute.tagName === "IMG") {
    btnMute.src = isMuted ? "icons/mute.svg" : "icons/volume.svg";
  }
});

// Volumen
volumeSlider.addEventListener("input", () => {
  videoElement.volume = parseFloat(volumeSlider.value);
  if (videoElement.volume === 0) {
    isMuted = true;
    if (btnMute.tagName === "IMG") btnMute.src = "icons/mute.svg";
  } else {
    isMuted = false;
    if (btnMute.tagName === "IMG") btnMute.src = "icons/volume.svg";
  }
});

// Pantalla completa
btnFullscreen.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// -------------------- Inicialización --------------------
document.addEventListener("DOMContentLoaded", () => {
  // Por defecto, solo home-screen está activo
  hideAllScreens();
  homeScreen.classList.add("active");
  // Iniciar WebSocket
  initWebSocket();
});

---

downloader.js

// downloader.js
// Lógica principal de descarga en Node.js para DmstkSuite.
// Incluye:
//   - WebSocket server (acciones: check_dependencies, install_dependencies, install_ffmpeg, download, list_courses)
//   - Extracción de datos con Puppeteer + Cheerio
//   - Descarga de videos y subtítulos con N_m3u8DL-RE
//   - Manejo de duplicados (pregunta al usuario si desea reemplazar archivos existentes)

const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const { spawn } = require('child_process');
const util = require('util');
const execAsync = util.promisify(require('child_process').exec);
const WebSocket = require('ws');
const fetch = require('node-fetch');  // si Node no lo tiene de forma nativa
const readline = require('readline'); // Se utiliza para preguntar al usuario
const { listDownloadedCourses } = require('./viewer');

// Variable global para almacenar la decisión del usuario sobre archivos duplicados.
// undefined: aún no se preguntó; true: reemplazar; false: omitir descarga.
let globalReplaceDecision = undefined;

const MAX_CONCURRENT_DOWNLOADS = 4; // Máximo de descargas simultáneas

// Determinar el ejecutable según el sistema operativo
const machine_os = process.platform === 'win32' ? 'win' : 'linux';
const EXECUTABLE = (machine_os === 'win') ? 'N_m3u8DL-RE.exe' : 'N_m3u8DL-RE';

// Verificar si el ejecutable existe (opcional)
if (!fs.existsSync(EXECUTABLE)) {
  console.warn(`Advertencia: No se encontró el ejecutable ${EXECUTABLE}. Debes descargarlo de https://github.com/nilaoda/N_m3u8DL-RE/releases`);
}

// Carpeta donde se guardan los cursos
const COURSES_DIR = path.join(__dirname, 'cursos');
fsPromises.mkdir(COURSES_DIR, { recursive: true }).catch(err => {
  console.error("Error creando el directorio de cursos:", err);
});

// Puerto para el servidor WebSocket
const WS_PORT = 8090;
const wss = new WebSocket.Server({ port: WS_PORT });

wss.on('connection', (ws) => {
  ws.on('message', async (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (err) {
      ws.send(JSON.stringify({ status: 'error', message: 'JSON inválido' }));
      return;
    }

    // Acciones recibidas
    if (data.action === 'check_dependencies') {
      checkDependencies(ws);
    } else if (data.action === 'install_dependencies') {
      await installDependencies(ws);
    } else if (data.action === 'install_ffmpeg') {
      await installFFmpeg(ws);
    } else if (data.action === 'download') {
      // Descargar un curso
      const { courseUrl, subtitleLang, sessionCookie, credentials } = data;
      try {
        await downloadCourse(courseUrl, subtitleLang, sessionCookie, credentials, ws);
        ws.send(JSON.stringify({ status: 'completed', progress: 100 }));
      } catch (err) {
        ws.send(JSON.stringify({ status: 'error', message: err.message }));
      }
    } else if (data.action === 'list_courses') {
      // Listar cursos descargados
      const courses = listDownloadedCourses();
      ws.send(JSON.stringify({ status: 'courses_list', courses }));
    } else {
      ws.send(JSON.stringify({ status: 'error', message: 'Acción desconocida' }));
    }
  });
});

// -------------------- Funciones de Dependencias --------------------

function checkDependencies(ws) {
  try {
    require.resolve('puppeteer');
    ws.send(JSON.stringify({ status: 'dependencies_ok' }));
  } catch (e) {
    ws.send(JSON.stringify({ status: 'missing_dependencies' }));
  }
}

async function installDependencies(ws) {
  try {
    ws.send(JSON.stringify({ status: 'installing_dependencies' }));
    const { stdout, stderr } = await execAsync('npm install', { maxBuffer: 1024 * 1024 });
    console.log(stdout);
    if (stderr) console.error(stderr);
    ws.send(JSON.stringify({ status: 'dependencies_installed' }));
  } catch (error) {
    ws.send(JSON.stringify({ status: 'error', message: 'Error al instalar dependencias: ' + error.message }));
  }
}

function ffmpegIsInstalled() {
  try {
    const ffmpegPath = require('ffmpeg-static');
    return !!ffmpegPath;
  } catch (e) {
    return false;
  }
}

async function installFFmpeg(ws) {
  try {
    ws.send(JSON.stringify({ status: 'installing_ffmpeg' }));
    const { stdout, stderr } = await execAsync('npm install ffmpeg-static', { maxBuffer: 1024 * 1024 });
    console.log(stdout);
    if (stderr) console.error(stderr);
    ws.send(JSON.stringify({ status: 'ffmpeg_installed' }));
  } catch (error) {
    ws.send(JSON.stringify({ status: 'error', message: 'Error al instalar ffmpeg: ' + error.message }));
  }
}

// -------------------- Funciones de Descarga --------------------

/**
 * Función auxiliar para preguntar al usuario por consola.
 * @param {string} question - Pregunta a mostrar.
 * @returns {Promise<string>} - Resolución con la respuesta del usuario.
 */
function askUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Extrae datos iniciales de una lección.
 * Se visita la URL de la unidad y se espera a que __INITIAL_PROPS__ esté definido,
 * para luego extraer el array de videos.
 */
async function getInitialProps(url, page) {
  await page.goto(url, { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => !!window.__INITIAL_PROPS__);
  const data = await page.evaluate(() => window.__INITIAL_PROPS__);
  const html = await page.content();
  const $ = cheerio.load(html);

  let section = $('h2.h3.course-header-new__subtitle')
    .text()
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '-');

  let videoData = [];
  if (data && data.videos && data.videos.length > 0) {
    for (let i = 0; i < data.videos.length; i++) {
      const el = data.videos[i];
      videoData.push({
        playbackURL: el.video.playbackURL,
        title: el.video.title.replace(/\./g, '').trim(),
        section: section,
      });
      console.log('Video Found:', el.video.title);
    }
  }
  return videoData;
}

/**
 * Descarga el curso completo, max 4 descargas simultáneas, y envía progreso global cada 2s.
 * @param {string} courseUrl - URL del curso.
 * @param {string} subtitleLang - Idioma de subtítulos (ej: 'es').
 * @param {string} sessionCookie - Cookie _domestika_session.
 * @param {string} credentials - Cookie _credentials_.
 * @param {WebSocket} ws - Conexión WebSocket para enviar actualizaciones.
 */
async function downloadCourse(courseUrl, subtitleLang, sessionCookie, credentials, ws) {
  console.log("Iniciando descarga para:", courseUrl);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(0);

  // Establecer cookies para autenticación
  await page.setCookie({ name: '_domestika_session', value: sessionCookie, domain: 'www.domestika.org' });
  await page.setCookie({ name: '_credentials_', value: credentials, domain: 'www.domestika.org' });

  // Cargar la página del curso
  await page.goto(courseUrl, { waitUntil: 'networkidle2' });
  const html = await page.content();
  const $ = cheerio.load(html);

  // Obtener título del curso
  let courseTitle = $('h1.course-header-new__title')
    .text()
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '-') || 'Curso_Desconocido';
  console.log("Título del curso:", courseTitle);

  // Detectar unidades
  let units = $('h4.h2.unit-item__title a');
  console.log(`${units.length} Units Detected`);

  // Aplanar la cola de descargas
  let tasks = [];
  for (let i = 0; i < units.length; i++) {
    let unitUrl = $(units[i]).attr('href');
    if (!unitUrl.startsWith('http')) {
      unitUrl = 'https://www.domestika.org' + unitUrl;
    }
    let videoData = await getInitialProps(unitUrl, page);
    let unitTitle = $(units[i])
      .text()
      .replace(/\./g, '')
      .trim()
      .replace(/[/\\?%*:|"<>]/g, '-');

    for (let j = 0; j < videoData.length; j++) {
      tasks.push({
        videoData: videoData[j],
        courseTitle,
        unitTitle,
        index: j
      });
    }
  }

  await page.close();
  await browser.close();

  if (tasks.length === 0) {
    throw new Error("No se encontraron videos para descargar.");
  }
  console.log(`Total Videos: ${tasks.length}`);

  let downloadedCount = 0;   // videos completados
  let totalDownloadedMB = 0; // MB totales descargados
  const startTime = Date.now();
  const totalVideos = tasks.length;
  let isRunning = true;

  // Timer para enviar progreso cada 2s
  const progressTimer = setInterval(() => {
    if (!isRunning) return;
    let progress = Math.floor((downloadedCount / totalVideos) * 100);
    let elapsed = (Date.now() - startTime) / 1000;
    let avgSpeed = elapsed > 0 ? totalDownloadedMB / elapsed : 0; // MB/s
    let avgSize = downloadedCount > 0 ? totalDownloadedMB / downloadedCount : 0;
    let remaining = totalVideos - downloadedCount;
    let timeRemaining = avgSpeed > 0 ? (remaining * avgSize) / avgSpeed : 0;

    ws.send(JSON.stringify({
      status: 'downloading',
      progress,
      timeRemaining: `${Math.ceil(timeRemaining)}s`
    }));
  }, 2000);

  // Procesar la cola en lotes de hasta 4 descargas simultáneas
  while (tasks.length > 0) {
    let batch = tasks.splice(0, MAX_CONCURRENT_DOWNLOADS);
    await Promise.all(batch.map(async (task) => {
      try {
        let sizeMB = await downloadVideo(
          task.videoData,
          task.courseTitle,
          task.unitTitle,
          task.index,
          subtitleLang
        );
        downloadedCount++;
        totalDownloadedMB += sizeMB;
      } catch (err) {
        console.error("Error en descarga:", err.message);
        ws.send(JSON.stringify({ status: 'error', message: err.message }));
      }
    }));
  }

  clearInterval(progressTimer);
  isRunning = false;

  console.log("All Videos Downloaded");
}

/**
 * Descarga un video y sus subtítulos en paralelo.
 * - Verifica si ya existe el archivo y pregunta si se desea reemplazar.
 * - Ignora errores de subtítulos para no detener la descarga de video.
 * - Retorna el tamaño del video en MB.
 */
async function downloadVideo(videoData, courseTitle, unitTitle, index, subtitleLang) {
  const saveDir = path.join(COURSES_DIR, courseTitle, videoData.section || unitTitle);
  await fsPromises.mkdir(saveDir, { recursive: true }).catch(err => {
    console.error("Error creando el directorio:", err);
  });

  const saveName = `${index}_${videoData.title.trim()}`;
  const filePath = path.join(saveDir, saveName + ".mp4");

  // Verificar si el archivo ya existe
  if (fs.existsSync(filePath)) {
    if (globalReplaceDecision === undefined) {
      const answer = await askUser(`El archivo "${filePath}" ya existe. ¿Desea reemplazar todos los archivos existentes? (S/n): `);
      // Interpreta "S" o respuesta vacía como afirmativo
      globalReplaceDecision = (answer.trim().toLowerCase() === 's' || answer.trim() === '');
    }
    if (!globalReplaceDecision) {
      console.log(`Omitiendo la descarga del video: ${videoData.title}`);
      try {
        let stats = await fsPromises.stat(filePath);
        return stats.size / (1024 * 1024); // Tamaño existente en MB
      } catch {
        return 0;
      }
    } else {
      try {
        await fsPromises.unlink(filePath);
      } catch (err) {
        console.error("Error al eliminar archivo existente:", err);
      }
    }
  }

  // Argumentos para el video
  let videoArgs = [
    '-sv', 'res="1080*":codec=hvc1:for=best',
    `"${videoData.playbackURL}"`,
    '--save-dir', `"${saveDir}"`,
    '--save-name', `"${saveName}"`
  ];

  // Argumentos para subtítulos
  let subtitleArgs = [
    '--auto-subtitle-fix',
    '--sub-format', 'SRT',
    '--select-subtitle', `lang="${subtitleLang}":for=all`,
    `"${videoData.playbackURL}"`,
    '--save-dir', `"${saveDir}"`,
    '--save-name', `"${saveName}"`
  ];

  console.log(`Descargando video: ${videoData.title}`);

  // Descarga del video
  const videoPromise = new Promise((resolve, reject) => {
    const proc = spawn(EXECUTABLE, videoArgs, { shell: true });
    proc.on('close', async (code) => {
      if (code !== 0) {
        reject(new Error(`Video falló con código ${code}`));
      } else {
        try {
          let stats = await fsPromises.stat(filePath);
          resolve(stats.size / (1024 * 1024)); // Retorna MB
        } catch {
          resolve(0);
        }
      }
    });
    proc.on('error', reject);
  });

  // Descarga de subtítulos (manejo suave de error)
  const subtitlePromise = new Promise((resolve) => {
    const proc = spawn(EXECUTABLE, subtitleArgs, { shell: true });
    proc.on('close', (code) => {
      if (code !== 0) {
        console.warn(`Subtítulos fallaron con código ${code} (pero se ignora)`);
      }
      resolve(); // No se rechaza para no romper el flujo
    });
    proc.on('error', (err) => {
      console.warn(`Error en subtítulos: ${err.message} (pero se ignora)`);
      resolve();
    });
  });

  // Ejecutar ambas descargas en paralelo
  let [videoMB] = await Promise.all([videoPromise, subtitlePromise]);
  return videoMB;
}

console.log(`Downloader server running on ws://localhost:${WS_PORT}`);

module.exports = {
  downloadCourse
};


---

viewer.js

// viewer.js
// Módulo para listar los cursos descargados en la carpeta "cursos".
// Retorna una estructura jerárquica:
//   { name: <curso>, modules: [ { name: <módulo>, lessons: [ { name: <lección>, file: <ruta> } ] } ] }

const fs = require('fs');
const path = require('path');

// Ajusta la ruta de la carpeta de cursos si es necesario
const COURSES_DIR = path.join(__dirname, 'cursos');

/**
 * Lista los cursos descargados en COURSES_DIR.
 * Retorna un arreglo de objetos con la forma:
 * [
 *   {
 *     name: "NombreDelCurso",
 *     modules: [
 *       {
 *         name: "NombreDelModulo",
 *         lessons: [
 *           {
 *             name: "NombreDeLaLeccion",
 *             file: "ruta/al/archivo.mp4"
 *           },
 *           ...
 *         ]
 *       },
 *       ...
 *     ]
 *   },
 *   ...
 * ]
 */
function listDownloadedCourses() {
  const courses = [];

  // Verificar si existe la carpeta "cursos"
  if (!fs.existsSync(COURSES_DIR)) return courses;

  // Leer directorios que representan cursos
  const courseDirs = fs.readdirSync(COURSES_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  // Para cada curso
  courseDirs.forEach(courseName => {
    const coursePath = path.join(COURSES_DIR, courseName);

    // Listar módulos (unidades)
    const moduleDirs = fs.readdirSync(coursePath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    const modules = [];
    moduleDirs.forEach(moduleName => {
      const modulePath = path.join(coursePath, moduleName);

      // Buscar archivos .mp4 que representan lecciones
      const lessonFiles = fs.readdirSync(modulePath, { withFileTypes: true })
        .filter(dirent => dirent.isFile() && path.extname(dirent.name).toLowerCase() === '.mp4')
        .map(dirent => dirent.name);

      // Construir la lista de lecciones
      const lessons = lessonFiles.map(fileName => {
        // Nombre base sin extensión
        let baseName = path.basename(fileName, '.mp4');
        // Si hay un índice inicial (ej: "0_Introducción"), lo quitamos
        let lessonName = baseName.replace(/^\d+_/, '');

        return {
          name: lessonName,
          // La ruta es relativa a "cursos", para que el frontend pueda cargar el video
          file: path.join('cursos', courseName, moduleName, fileName)
        };
      });

      modules.push({ name: moduleName, lessons });
    });

    courses.push({ name: courseName, modules });
  });

  return courses;
}

module.exports = { listDownloadedCourses };


---

utils.js

// utils.js
const { spawn } = require('child_process');

/**
 * Ejecuta un comando usando spawn y retorna una promesa.
 * Permite ejecutar comandos externos y capturar su salida.
 * @param {string} command - Comando a ejecutar.
 * @param {Array<string>} args - Argumentos del comando.
 * @returns {Promise<void>}
 */
function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`Ejecutando: ${command} ${args.join(' ')}`);
    const proc = spawn(command, args, { shell: true });
    proc.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
    proc.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`El comando finalizó con el código ${code}`));
      }
    });
  });
}

module.exports = { runCommand };


---

styles.css

/* ----------------------------------------------------------
   CITYPOP/VAPORWAVE VARIABLES
----------------------------------------------------------- */
:root {
  --bg-color: #0a0c1f;         /* Fondo oscuro principal */
  --accent-color: #ff80d5;     /* Rosa neón */
  --accent-color-2: #80ffe8;   /* Cian neón */
  --text-color: #ffffff;       /* Texto base */
  --control-bg: #1a1a2f;       /* Fondos de barras y paneles */
  --control-hover: #2d2d4f;    /* Hover en controles */
  --border-radius: 8px;
  --transition-speed: 0.3s;
  --font-family: 'Poppins', sans-serif;
}

/* ----------------------------------------------------------
   RESETEO Y CONFIGURACIÓN BÁSICA
----------------------------------------------------------- */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  background: var(--bg-color);
  color: var(--text-color);
  font-family: var(--font-family), sans-serif;
  overflow-x: hidden; /* Evitar scroll horizontal */
}

/* ----------------------------------------------------------
   VIDEO DE FONDO (GLOBAL)
----------------------------------------------------------- */
#video-element {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  object-fit: cover;
  z-index: -1;
  pointer-events: none; /* Deshabilita la interacción con controles nativos */
}

/* Ocultar controles nativos en navegadores WebKit/Mozilla */
#video-element::-webkit-media-controls,
#video-element::-moz-media-controls {
  display: none !important;
}

/* ----------------------------------------------------------
   BARRA SUPERIOR
----------------------------------------------------------- */
header {
  width: 100%;
  height: 60px;
  background: var(--control-bg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  box-shadow: 0 0 10px rgba(0,0,0,0.5);
}

.app-name {
  font-size: 1.2rem;
  font-weight: 600;
  text-transform: uppercase;
  cursor: pointer;
  transition: color var(--transition-speed);
}

.app-name:hover {
  color: var(--accent-color);
}

.nav-icons {
  display: flex;
  gap: 1rem;
}

.nav-icons img {
  width: 32px;
  height: 32px;
  cursor: pointer;
  transition: transform var(--transition-speed);
}

.nav-icons img:hover {
  transform: scale(1.1);
}

/* ----------------------------------------------------------
   CONTENIDO PRINCIPAL
----------------------------------------------------------- */
main {
  width: 100%;
  min-height: calc(100% - 120px); /* Resta header(60px) + footer(60px) */
  padding-top: 60px;   /* Evita que el contenido quede debajo del header */
  padding-bottom: 60px;/* Evita que el contenido quede debajo del footer */
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: var(--bg-color);
  transition: background var(--transition-speed);
}

/* Las pantallas (componentes) que se van ocultando/mostrando */
.screen {
  display: none;
  width: 90%;
  max-width: 1000px;
  margin-top: 2rem;
}

.screen.active {
  display: block;
}

/* Pantalla de inicio (por defecto vacía) */
#home-screen {
  background: var(--control-bg);
  border-radius: var(--border-radius);
  min-height: 200px; /* Ejemplo de altura mínima */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ----------------------------------------------------------
   PANTALLA DE DESCARGA
----------------------------------------------------------- */
#download-screen {
  background: var(--control-bg);
  border-radius: var(--border-radius);
  padding: 1rem;
  box-shadow: 0 0 10px rgba(0,0,0,0.4);
}

#download-screen h2 {
  margin-bottom: 1rem;
  color: var(--accent-color);
  text-transform: uppercase;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.5rem;
  border-radius: var(--border-radius);
  border: none;
  outline: none;
  background: var(--control-hover);
  color: var(--text-color);
}

.download-btn {
  background: var(--accent-color);
  color: #000;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 600;
  transition: background var(--transition-speed);
}

.download-btn:hover {
  background: var(--accent-color-2);
}

/* Notificaciones de descarga */
.notifications {
  margin-top: 1rem;
  min-height: 40px;
  background: #222;
  border-radius: var(--border-radius);
  padding: 0.5rem;
  display: none;
}

.notifications.active {
  display: block;
}

/* ----------------------------------------------------------
   PANTALLA DE VISUALIZACIÓN
----------------------------------------------------------- */
#visualize-screen {
  background: var(--control-bg);
  border-radius: var(--border-radius);
  padding: 1rem;
  box-shadow: 0 0 10px rgba(0,0,0,0.4);
}

#visualize-screen h2 {
  margin-bottom: 1rem;
  color: var(--accent-color);
  text-transform: uppercase;
}

.courses-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
}

.course-card {
  width: 180px;
  background: var(--control-hover);
  border-radius: var(--border-radius);
  overflow: hidden;
  cursor: pointer;
  transition: transform var(--transition-speed);
}

.course-card:hover {
  transform: scale(1.02);
}

.course-thumb {
  width: 100%;
  height: 100px;
  object-fit: cover;
  background: #444;
}

.course-info {
  padding: 0.5rem;
  text-align: center;
}

.course-info h3 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
  color: var(--accent-color-2);
}

/* ----------------------------------------------------------
   PANTALLA DE MÓDULOS
----------------------------------------------------------- */
#modules-screen {
  background: var(--control-bg);
  border-radius: var(--border-radius);
  padding: 1rem;
  box-shadow: 0 0 10px rgba(0,0,0,0.4);
}

#modules-screen h2 {
  margin-bottom: 1rem;
  color: var(--accent-color);
  text-transform: uppercase;
}

#modules-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.playlist-item {
  background: var(--control-hover);
  padding: 0.5rem;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background var(--transition-speed);
}

.playlist-item:hover {
  background: var(--accent-color-2);
  color: #000;
}

/* ----------------------------------------------------------
   PANTALLA DE LECCIONES
----------------------------------------------------------- */
#lessons-screen {
  background: var(--control-bg);
  border-radius: var(--border-radius);
  padding: 1rem;
  box-shadow: 0 0 10px rgba(0,0,0,0.4);
}

#lessons-screen h2 {
  margin-bottom: 1rem;
  color: var(--accent-color);
  text-transform: uppercase;
}

#lessons-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* ----------------------------------------------------------
   PANTALLA DEL REPRODUCTOR
----------------------------------------------------------- */
#player-screen {
  background: var(--control-bg);
  border-radius: var(--border-radius);
  padding: 1rem;
  box-shadow: 0 0 10px rgba(0,0,0,0.4);
}

.player-heading {
  margin-bottom: 1rem;
  color: var(--accent-color);
  text-transform: uppercase;
}

/* ----------------------------------------------------------
   BARRA INFERIOR (Controles de reproducción)
----------------------------------------------------------- */
footer {
  width: 100%;
  height: 60px;
  background: var(--control-bg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 1000;
  padding: 0 1rem;
  box-shadow: 0 0 10px rgba(0,0,0,0.5);
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.player-controls img {
  width: 28px;
  height: 28px;
  cursor: pointer;
  transition: transform var(--transition-speed);
}

.player-controls img:hover {
  transform: scale(1.1);
}

.time-slider {
  width: 200px;
  cursor: pointer;
}

.volume-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.volume-slider {
  width: 80px;
  cursor: pointer;
}

/* ----------------------------------------------------------
   RESPONSIVE
----------------------------------------------------------- */
@media (max-width: 768px) {
  .time-slider {
    width: 120px;
  }
  .courses-grid {
    justify-content: flex-start;
  }
  .course-card {
    width: 140px;
  }
  .course-info h3 {
    font-size: 0.9rem;
  }
}


---

package.json

{
  "name": "domestika-offline",
  "version": "1.0.0",
  "description": "Herramienta Node.js para descargar cursos completos de Domestika.",
  "main": "downloader.js",
  "scripts": {
    "start": "node downloader.js",
    "serve": "http-server -p 8080"
  },
  "author": "Juan Gómez (Tomoo)",
  "license": "MIT",
  "dependencies": {
    "cheerio": "^1.0.0-rc.12",
    "node-fetch": "^3.3.2",
    "puppeteer": "^20.7.2",
    "ws": "^8.13.0",
    "ffmpeg-static": "^4.4.0"
  },
  "devDependencies": {
    "http-server": "^14.1.1"
  }
}


---

DomestkSuite-Launcher.bat

@echo off
echo -----------------------------------------
echo DmstkSuite Launcher
echo -----------------------------------------

REM Comprobar si ya se han instalado las dependencias (verifica si existe la carpeta node_modules)
if not exist "node_modules" (
    echo Instalando dependencias...
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo Error: No se pudieron instalar las dependencias.
        pause
        exit /b 1
    )
)

REM Iniciar el servidor downloader (WebSocket) en una nueva ventana
echo Iniciando el Downloader (servidor WebSocket)...
start "Downloader Server" cmd /k "npm start"

REM Iniciar el servidor para la interfaz web en una nueva ventana
echo Iniciando el servidor frontend...
start "Frontend Server" cmd /k "npm run serve"

REM Esperar 5 segundos para que los servidores se inicien
timeout /t 5

REM Abrir el navegador predeterminado con la URL de la aplicación
echo Abriendo el navegador...
start "" "http://localhost:8080"

echo -----------------------------------------
echo DmstkSuite Launcher iniciado.
pause
exit /b 0


---

DomestkSuite-Installer.bat

@echo off
echo -----------------------------------------
echo Instalacion de Domestika Offline
echo -----------------------------------------

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


---

README.md

# DomestkSuite

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