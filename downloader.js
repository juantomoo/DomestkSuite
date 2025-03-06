// downloader.js
// Lógica principal de descarga en Node.js para DomestkSuite.
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
  
  ws.on('error', (err) => {
    console.error("Error en WebSocket:", err.message);
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
  try {
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => !!window.__INITIAL_PROPS__, { timeout: 30000 });
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
  } catch (err) {
    throw new Error("Error extrayendo datos iniciales: " + err.message);
  }
}

/**
 * GLOBAL: Mapa para almacenar el progreso (en bytes) de cada video en proceso.
 * La clave será una combinación única (course_unit_index).
 */
let videoProgressMap = {};

/**
 * Descarga el curso completo, max 4 descargas simultáneas, y envía progreso global cada 1s.
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
  let totalDownloadedMB = 0; // MB totales de videos completados
  const startTime = Date.now();
  const totalVideos = tasks.length;
  // Estimación total en MB: se asume 50 MB por video
  const estimatedTotalMB = totalVideos * 50;
  // Reiniciar el mapa de progreso global
  videoProgressMap = {};

  // Timer para enviar progreso cada 1 segundo (actualización en tiempo real)
  const progressTimer = setInterval(() => {
    let inProgressBytes = 0;
    for (const key in videoProgressMap) {
      inProgressBytes += videoProgressMap[key];
    }
    // total de bytes de videos completados (convertidos a bytes)
    const completedBytes = totalDownloadedMB * 1024 * 1024;
    // Suma de bytes completados y de los videos en proceso
    const globalDownloadedBytes = completedBytes + inProgressBytes;
    const globalDownloadedMB = globalDownloadedBytes / (1024 * 1024);
    const progressPercentage = (globalDownloadedMB / estimatedTotalMB) * 100;

    let elapsed = (Date.now() - startTime) / 1000; // en segundos
    let avgSpeed = elapsed > 0 ? globalDownloadedMB / elapsed : 0; // MB/s
    let remainingMB = estimatedTotalMB - globalDownloadedMB;
    let timeRemaining = avgSpeed > 0 ? remainingMB / avgSpeed : 0;

    ws.send(JSON.stringify({
      status: 'downloading',
      progress: Math.floor(progressPercentage),
      timeRemaining: `${Math.ceil(timeRemaining)}s`
    }));
  }, 1000);

  // Procesar la cola en lotes de hasta 4 descargas simultáneas
  while (tasks.length > 0) {
    let batch = tasks.splice(0, MAX_CONCURRENT_DOWNLOADS);
    await Promise.all(batch.map(async (task) => {
      try {
        // Se pasa "ws" para que la función de descarga pueda enviar notificaciones y actualizar su progreso
        let sizeMB = await downloadVideo(
          task.videoData,
          task.courseTitle,
          task.unitTitle,
          task.index,
          subtitleLang,
          ws
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

  console.log("All Videos Downloaded");
}

/**
 * Descarga un video y sus subtítulos en paralelo.
 * - Verifica si ya existe el archivo y pregunta si se desea reemplazar.
 * - Ignora errores de subtítulos para no detener la descarga de video.
 * - Retorna el tamaño del video en MB.
 * 
 * Se han incorporado:
 *   a) Envío de notificaciones (ticker) vía WebSocket con cada salida recibida.
 *   b) Actualización en tiempo real del progreso a partir de la lectura de bloques (stdout).
 * 
 * @param {object} videoData - Datos del video a descargar.
 * @param {string} courseTitle - Título del curso.
 * @param {string} unitTitle - Título de la unidad.
 * @param {number} index - Índice del video.
 * @param {string} subtitleLang - Idioma de subtítulos.
 * @param {WebSocket} ws - Conexión WebSocket para notificaciones.
 * @returns {Promise<number>} - Tamaño del video descargado en MB.
 */
async function downloadVideo(videoData, courseTitle, unitTitle, index, subtitleLang, ws) {
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

  // Definir argumentos para la descarga del video
  let videoArgs = [
    '-sv', 'res="1080*":codec=hvc1:for=best',
    `"${videoData.playbackURL}"`,
    '--save-dir', `"${saveDir}"`,
    '--save-name', `"${saveName}"`
  ];

  // Definir argumentos para la descarga de subtítulos
  let subtitleArgs = [
    '--auto-subtitle-fix',
    '--sub-format', 'SRT',
    '--select-subtitle', `lang="${subtitleLang}":for=all`,
    `"${videoData.playbackURL}"`,
    '--save-dir', `"${saveDir}"`,
    '--save-name', `"${saveName}"`
  ];

  console.log(`Descargando video: ${videoData.title}`);
  ws.send(JSON.stringify({ status: 'notification', message: `Descargando video: ${videoData.title}` })); // Ticker

  // Crear una clave única para este video y registrarla en el mapa de progreso
  const videoKey = `${courseTitle}_${unitTitle}_${index}`;
  videoProgressMap[videoKey] = 0;

  // Descarga del video con manejo robusto de errores y actualización en tiempo real
  const videoPromise = new Promise((resolve, reject) => {
    const proc = spawn(EXECUTABLE, videoArgs, { shell: true });
    let errorOutput = '';
    proc.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`stdout: ${output}`);
      // Enviar cada mensaje a la interfaz para el ticker
      ws.send(JSON.stringify({ status: 'notification', message: output.trim() }));
      // Intentar extraer el progreso descargado en bytes
      const match = output.match(/Downloaded\s+(\d+)\s+bytes/i);
      if (match) {
        const bytesDownloaded = parseInt(match[1], 10);
        videoProgressMap[videoKey] = bytesDownloaded;
      }
    });
    proc.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    proc.on('close', async (code) => {
      if (code !== 0) {
        reject(new Error(`Video falló con código ${code}. Detalles: ${errorOutput}`));
      } else {
        try {
          let stats = await fsPromises.stat(filePath);
          resolve(stats.size / (1024 * 1024)); // Retorna MB
        } catch (err) {
          resolve(0);
        }
      }
    });
    proc.on('error', (err) => {
      reject(new Error(`Fallo al iniciar proceso de video: ${err.message}`));
    });
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
