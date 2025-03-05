// viewer.js
// Módulo para:
//   1) Convertir SRT → VTT cuando falte el .vtt
//   2) Listar los cursos descargados en la carpeta "cursos".

const fs = require('fs');
const path = require('path');
const srt2vtt = require('srt-to-vtt'); // Librería para la conversión

// Ajusta la ruta de la carpeta de cursos si es necesario
const COURSES_DIR = path.join(__dirname, 'cursos');

/**
 * Función auxiliar que convierte un archivo .srt a .vtt si no existe el .vtt.
 * Retorna una Promesa que se resuelve cuando termina la conversión (o si ya existe).
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

    // De lo contrario, convertimos
    srt2vtt(fs.createReadStream(srtPath))
      .pipe(fs.createWriteStream(vttPath))
      .on('finish', () => {
        console.log(`Convertido a VTT: ${vttPath}`);
        resolve();
      })
      .on('error', (err) => {
        console.warn(`Error convirtiendo ${srtPath} a VTT:`, err);
        resolve();
      });
  });
}

/**
 * Recorre recursivamente "dirPath" en busca de archivos .srt.
 * Cada vez que encuentra uno, verifica si existe el .vtt correspondiente;
 * si no existe, lo crea.
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
 *   1) Convierte todos los .srt → .vtt donde falten.
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

// Exporta ambas funciones
module.exports = {
  listDownloadedCourses,             // Función original (sin conversión)
  listDownloadedCoursesWithConversion // Función asíncrona con conversión previa
};
