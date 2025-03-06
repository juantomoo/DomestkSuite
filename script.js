// -------------------- Referencias a Elementos del DOM --------------------
const btnHome        = document.getElementById("btn-home");
const iconDownload   = document.getElementById("icon-download");
const iconVisualize  = document.getElementById("icon-visualize");

const homeScreen     = document.getElementById("home-screen");
const downloadScreen = document.getElementById("download-screen");
const visualizeScreen= document.getElementById("visualize-screen");
const modulesScreen  = document.getElementById("modules-screen");
const lessonsScreen  = document.getElementById("lessons-screen");
const playerScreen   = document.getElementById("player-screen");

const downloadForm   = document.getElementById("download-form");
// Se reutiliza "downloadNotifications" para contener tanto el progreso como el ticker
const downloadNotifications = document.getElementById("download-notifications");

const coursesGrid    = document.getElementById("courses-grid");
const modulesList    = document.getElementById("modules-list");
const lessonsList    = document.getElementById("lessons-list");

const videoElement   = document.getElementById("video-element");
const btnPlayPause   = document.getElementById("btn-play-pause");
const btnPrev        = document.getElementById("btn-prev");
const btnNext        = document.getElementById("btn-next");
const timeSlider     = document.getElementById("time-slider");
const btnSubtitles   = document.getElementById("btn-subtitles");
const btnMute        = document.getElementById("btn-mute");
const volumeSlider   = document.getElementById("volume-slider");
const btnFullscreen  = document.getElementById("btn-fullscreen");

// Elementos para mostrar la información en modo reproducción
const lessonTitle    = document.getElementById("lesson-title");
const moduleTitle    = document.getElementById("module-title");
const courseTitle    = document.getElementById("course-title");

// Variable para WebSocket
let socket;

// Variables globales para la navegación entre lecciones
let currentCourseName = "";
let currentModuleName = "";
let currentLessons = [];
let currentLessonIndex = 0;

// Variable global para almacenar el idioma de subtítulos seleccionado (por ejemplo, "en", "fr", "es")
let globalSubtitleLang = "es"; // Valor por defecto

// -------------------- Funciones Auxiliares --------------------
function hideAllScreens() {
  document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
}

/**
 * Detiene la reproducción del video y sale del modo "playing".
 * - Pausa el video
 * - Remueve <source> y <track> del video
 * - Quita la clase "playing" del body
 */
function stopPlayback() {
  if (document.body.classList.contains("playing")) {
    videoElement.pause();
    while (videoElement.firstChild) {
      videoElement.removeChild(videoElement.firstChild);
    }
    videoElement.load();
    document.body.classList.remove("playing");
  }
}

// -------------------- Función para verificar subtítulos disponibles --------------------
/**
 * Verifica si existe un archivo de subtítulos para el video, en el idioma indicado,
 * mediante una petición HEAD.
 * @param {string} lessonFile - Ruta del archivo de video (.mp4)
 * @param {string} lang - Código del idioma (por ejemplo, "en", "fr", "es")
 * @returns {Promise<string|null>} - Retorna la ruta del archivo de subtítulos si existe, o null si no existe.
 */
async function getAvailableSubtitle(lessonFile, lang) {
  const subtitlePath = lessonFile.replace('.mp4', `.${lang}.vtt`);
  try {
    const response = await fetch(subtitlePath, { method: "HEAD" });
    if (response.ok) {
      return subtitlePath;
    } else {
      return null;
    }
  } catch (error) {
    console.warn(`Error al verificar ${subtitlePath}:`, error);
    return null;
  }
}

// -------------------- Inicialización del WebSocket --------------------
function initWebSocket() {
  socket = new WebSocket('ws://localhost:8090');

  socket.onopen = () => {
    console.log("WebSocket conectado");
    // Inicializar contenedores internos en el área de notificaciones (si no existen)
    if (downloadNotifications) {
      if (!document.getElementById("progress-info")) {
        const progressInfo = document.createElement("div");
        progressInfo.id = "progress-info";
        downloadNotifications.appendChild(progressInfo);
      }
      if (!document.getElementById("ticker-container")) {
        const tickerContainer = document.createElement("div");
        tickerContainer.id = "ticker-container";
        downloadNotifications.appendChild(tickerContainer);
      }
    }
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("Mensaje recibido:", data);

      if (data.status === "courses_list") {
        renderCourses(data.courses);
      }
      if (data.status === "error") {
        console.error("Error desde el servidor:", data.message);
      }
      if (data.status === "downloading") {
        // Actualiza la información de progreso en el contenedor "progress-info"
        const progressInfo = document.getElementById("progress-info");
        if (progressInfo) {
          progressInfo.textContent = `Descargando... ${data.progress}% completado. Tiempo restante: ${data.timeRemaining}`;
        }
      }
      if (data.status === "completed") {
        const progressInfo = document.getElementById("progress-info");
        if (progressInfo) {
          progressInfo.textContent = "Descarga completada.";
        }
      }
      // Nuevo: Mostrar cada notificación en el ticker
      if (data.status === "notification") {
        addTickerMessage(data.message);
      }
    } catch (error) {
      console.error("Error al parsear el mensaje:", error);
    }
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  socket.onclose = () => {
    console.warn("WebSocket cerrado. Intentando reconectar en 3 segundos...");
    setTimeout(initWebSocket, 3000);
  };
}

/**
 * Agrega un mensaje al ticker de notificaciones.
 * Cada mensaje se muestra y se elimina después de 10 segundos.
 * @param {string} message - Mensaje a mostrar.
 */
function addTickerMessage(message) {
  const tickerContainer = document.getElementById("ticker-container");
  if (!tickerContainer) return;
  const tickerMessage = document.createElement("span");
  tickerMessage.className = "ticker-message";
  tickerMessage.textContent = message + "   "; // Espaciado adicional
  tickerContainer.appendChild(tickerMessage);
  // Se asume que mediante CSS se define la animación de desplazamiento para la clase "ticker-message"
  setTimeout(() => {
    tickerMessage.remove();
  }, 10000);
}

// -------------------- Modo Streaming: Auto-ocultación de Controles --------------------
let controlsTimeout;
function setupAutoHideControls() {
  const header = document.querySelector("header");
  const footer = document.querySelector("footer");
  const playerInfo = document.querySelector("#player-info");

  header.classList.remove("hide-controls");
  footer.classList.remove("hide-controls");
  playerInfo.classList.remove("hide-controls");

  clearTimeout(controlsTimeout);
  controlsTimeout = setTimeout(hideControls, 3000);
}

function hideControls() {
  document.querySelector("header").classList.add("hide-controls");
  document.querySelector("footer").classList.add("hide-controls");
  document.querySelector("#player-info").classList.add("hide-controls");
}

function showControlsOnInteraction() {
  document.querySelector("header").classList.remove("hide-controls");
  document.querySelector("footer").classList.remove("hide-controls");
  document.querySelector("#player-info").classList.remove("hide-controls");

  clearTimeout(controlsTimeout);
  controlsTimeout = setTimeout(hideControls, 3000);
}

document.addEventListener("mousemove", () => {
  if (document.body.classList.contains("playing")) {
    showControlsOnInteraction();
  }
});
document.addEventListener("touchstart", () => {
  if (document.body.classList.contains("playing")) {
    showControlsOnInteraction();
  }
});

window.addEventListener("beforeunload", () => {
  clearTimeout(controlsTimeout);
});

// -------------------- Navegación entre Pantallas --------------------
btnHome.addEventListener("click", () => {
  stopPlayback();
  hideAllScreens();
  homeScreen.classList.add("active");
});

iconDownload.addEventListener("click", () => {
  stopPlayback();
  hideAllScreens();
  downloadScreen.classList.add("active");
});

iconVisualize.addEventListener("click", () => {
  stopPlayback();
  hideAllScreens();
  visualizeScreen.classList.add("active");
  requestCoursesList();
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
    const subtitleLang  = document.getElementById("subtitle-lang").value.trim() || "es";
    const sessionCookie = document.getElementById("session-cookie").value;
    const credentials   = document.getElementById("credentials").value;

    // Guarda el idioma seleccionado en la variable global
    globalSubtitleLang = subtitleLang;

    const message = {
      action: "download",
      courseUrl,
      subtitleLang,
      sessionCookie,
      credentials,
    };
    socket.send(JSON.stringify(message));

    downloadNotifications.classList.add("active");
    // Se actualiza el contenedor de progreso (dentro de downloadNotifications)
    const progressInfo = document.getElementById("progress-info");
    if (progressInfo) {
      progressInfo.textContent = "Iniciando descarga...";
    }
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
      renderLessons(mod, course.name);
    });
    modulesList.appendChild(modItem);
  });
}

function renderLessons(module, courseName) {
  hideAllScreens();
  lessonsScreen.classList.add("active");
  lessonsList.innerHTML = "";
  if (!module.lessons || module.lessons.length === 0) {
    lessonsList.innerHTML = "<p>Este módulo no tiene lecciones.</p>";
    return;
  }
  module.lessons.forEach((lesson, index) => {
    const lessonItem = document.createElement("div");
    lessonItem.className = "playlist-item";
    lessonItem.textContent = lesson.name;
    lessonItem.addEventListener("click", async () => {
      currentCourseName = courseName;
      currentModuleName = module.name;
      currentLessons = module.lessons;
      currentLessonIndex = index;
      await playLesson(lesson, module.name, courseName);
    });
    lessonsList.appendChild(lessonItem);
  });
}

/**
 * Reproduce una lección en modo streaming con subtítulos seleccionados dinámicamente.
 * Verifica mediante una petición HEAD si existe el archivo de subtítulos para el idioma global.
 * @param {Object} lesson - Objeto con 'name' y 'file' del video.
 * @param {string} moduleName - Nombre del módulo.
 * @param {string} courseName - Nombre del curso.
 */
async function playLesson(lesson, moduleName, courseName) {
  hideAllScreens();
  playerScreen.classList.add("active");
  document.body.classList.add("playing");

  if (lessonTitle) lessonTitle.textContent = lesson.name;
  if (moduleTitle) moduleTitle.textContent = moduleName;
  if (courseTitle) courseTitle.textContent = courseName;

  // Elimina cualquier <source> o <track> previo
  while (videoElement.firstChild) {
    videoElement.removeChild(videoElement.firstChild);
  }

  // Crear <source> para el video
  const source = document.createElement("source");
  source.src = lesson.file;
  source.type = "video/mp4";
  videoElement.appendChild(source);

  // Verificar de forma dinámica si existe el archivo de subtítulos para el idioma seleccionado
  const availableSubtitle = await getAvailableSubtitle(lesson.file, globalSubtitleLang);
  if (availableSubtitle) {
    const track = document.createElement("track");
    track.src = availableSubtitle;
    track.kind = "subtitles";
    track.label = globalSubtitleLang.toUpperCase();
    track.srclang = globalSubtitleLang;
    track.default = true;
    videoElement.appendChild(track);
  } else {
    console.warn(`No se encontró archivo de subtítulos para ${lesson.file} con idioma ${globalSubtitleLang}`);
  }

  videoElement.load();
  videoElement.muted = false;
  isMuted = false;
  volumeSlider.value = 1;

  videoElement.play().catch(err => {
    console.warn("No se pudo reproducir automáticamente:", err);
  });

  setupAutoHideControls();
}

// -------------------- Función para verificar la existencia del archivo de subtítulos --------------------
async function getAvailableSubtitle(lessonFile, lang) {
  const subtitlePath = lessonFile.replace('.mp4', `.${lang}.vtt`);
  try {
    const response = await fetch(subtitlePath, { method: 'HEAD' });
    if (response.ok) {
      return subtitlePath;
    } else {
      return null;
    }
  } catch (error) {
    console.warn(`Error al verificar ${subtitlePath}:`, error);
    return null;
  }
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

btnPrev.addEventListener("click", () => {
  if (currentLessonIndex > 0) {
    currentLessonIndex--;
    const prevLesson = currentLessons[currentLessonIndex];
    playLesson(prevLesson, currentModuleName, currentCourseName);
  } else {
    alert("No hay lección anterior en este módulo.");
  }
});

btnNext.addEventListener("click", () => {
  if (currentLessonIndex < currentLessons.length - 1) {
    currentLessonIndex++;
    const nextLesson = currentLessons[currentLessonIndex];
    playLesson(nextLesson, currentModuleName, currentCourseName);
  } else {
    alert("No hay más lecciones en este módulo.");
  }
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

// Botón de subtítulos (alternar estado del primer track)
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

// Control de volumen
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
  hideAllScreens();
  homeScreen.classList.add("active");
  initWebSocket();
});
