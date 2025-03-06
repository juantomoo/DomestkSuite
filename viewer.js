// viewer.js
// Módulo para:
//   1) Convertir SRT → VTT cuando falte el .vtt
//   2) Listar los cursos descargados en la carpeta "cursos".

const fs = require('fs');
const path = require('path');
// Se elimina la dependencia a srt-to-vtt ya que usaremos conversión manual

// Ajusta la ruta de la carpeta de cursos si es necesario
const COURSES_DIR = path.join(__dirname, 'cursos');

/**
 * Función auxiliar que convierte un archivo .srt a .vtt si no existe el .vtt.
 * Se realiza una conversión manual:
 *   - Se elimina cualquier línea que contenga solo números (cue numbers).
 *   - Se agrega la cabecera "WEBVTT" al inicio.
 *   - Se reemplaza la coma (,) de las marcas de tiempo por un punto (.).
 * @param {string} srtPath - Ruta del archivo .srt
 * @returns {Promise<void>}
 */
function convertSrtToVttIfNeeded(srtPath) {
  return new Promise((resolve) => {
    const base = path.basename(srtPath, '.srt');
    const dir = path.dirname(srtPath);
    const vttPath = path.join(dir, base + '.vtt');

    // Si el .vtt ya existe, no hacemos nada
    if (fs.existsSync(vttPath)) {
      return resolve();
    }

    fs.readFile(srtPath, 'utf8', (err, data) => {
      if (err) {
        console.warn(`Error leyendo ${srtPath}:`, err);
        return resolve();
      }

      // Separar líneas y eliminar aquellas que son solo números (cue numbers)
      let lines = data.split(/\r?\n/).filter(line => !/^\d+$/.test(line.trim()));

      // Reemplazar la coma en las marcas de tiempo por un punto
      let convertedData = lines.join('\n').replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');

      // Agregar la cabecera WEBVTT
      let vttData = 'WEBVTT\n\n' + convertedData;

      fs.writeFile(vttPath, vttData, 'utf8', (writeErr) => {
        if (writeErr) {
          console.warn(`Error escribiendo ${vttPath}:`, writeErr);
        } else {
          console.log(`Convertido a VTT: ${vttPath}`);
        }
        resolve();
      });
    });
  });
}

/**
 * Recorre recursivamente "dirPath" en busca de archivos .srt.
 * Cada vez que encuentra uno, verifica si existe el .vtt correspondiente;
 * si no existe, lo crea mediante convertSrtToVttIfNeeded.
 * Retorna una Promesa que se resuelve cuando todas las conversiones han terminado.
 */
async function convertAllSrtsInDir(dirPath) {
  let entries;
  try {
    // Lee los contenidos del directorio
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (err) {
    console.error(`Error leyendo el directorio ${dirPath}:`, err);
    return;
  }
  const tasks = [];

  for (const entry of entries) {
    try {
      if (entry.isDirectory()) {
        // Recorremos recursivamente la subcarpeta
        tasks.push(convertAllSrtsInDir(path.join(dirPath, entry.name)));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (ext === '.srt') {
          const srtPath = path.join(dirPath, entry.name);
          tasks.push(convertSrtToVttIfNeeded(srtPath));
        }
      }
    } catch (err) {
      console.error(`Error procesando la entrada ${entry.name} en ${dirPath}:`, err);
    }
  }

  // Esperamos a que todas las conversiones terminen
  await Promise.all(tasks);
}

/**
 * Versión original de "listar cursos" (sin cambios en la lógica).
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
  try {
    if (!fs.existsSync(COURSES_DIR)) return courses;

    // Leer directorios que representan cursos
    const courseDirs = fs.readdirSync(COURSES_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    // Para cada curso
    courseDirs.forEach(courseName => {
      const coursePath = path.join(COURSES_DIR, courseName);
      let moduleDirs = [];
      try {
        // Listar módulos (unidades)
        moduleDirs = fs.readdirSync(coursePath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);
      } catch (err) {
        console.error(`Error leyendo módulos en ${coursePath}:`, err);
      }

      const modules = [];
      moduleDirs.forEach(moduleName => {
        const modulePath = path.join(coursePath, moduleName);
        let lessonFiles = [];
        try {
          // Buscar archivos .mp4 que representan lecciones
          lessonFiles = fs.readdirSync(modulePath, { withFileTypes: true })
            .filter(dirent => dirent.isFile() && path.extname(dirent.name).toLowerCase() === '.mp4')
            .map(dirent => dirent.name);
        } catch (err) {
          console.error(`Error leyendo lecciones en ${modulePath}:`, err);
        }

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
  } catch (err) {
    console.error("Error listando cursos:", err);
  }
  return courses;
}

/**
 * Función asíncrona que:
 *   1) Convierte todos los .srt → .vtt donde falten (método manual con eliminación de cue numbers).
 *   2) Llama a listDownloadedCourses() para retornar la lista de cursos.
 * 
 * Retorna una Promesa que se resuelve con el array de cursos.
 */
async function listDownloadedCoursesWithConversion() {
  // 1) Convertir .srt a .vtt en toda la carpeta "cursos"
  await convertAllSrtsInDir(COURSES_DIR);
  // 2) Listar cursos (ya con .vtt generados)
  return listDownloadedCourses();
}

// Ejecutar la conversión de subtítulos automáticamente al abrir la aplicación
(async function initSubtitleConversion() {
  try {
    await convertAllSrtsInDir(COURSES_DIR);
    console.log("Conversión automática de subtítulos SRT a VTT completada.");
  } catch (err) {
    console.error("Error durante la conversión automática de subtítulos:", err);
  }
})();

module.exports = {
  listDownloadedCourses,
  listDownloadedCoursesWithConversion
};
