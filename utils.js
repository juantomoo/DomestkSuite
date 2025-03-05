// utils.js
const { spawn } = require('child_process');

/**
 * Ejecuta un comando usando spawn y retorna una promesa.
 * Permite ejecutar comandos externos y capturar su salida.
 * @param {string} command - Comando a ejecutar.
 * @param {Array<string>} args - Argumentos del comando.
 * @returns {Promise<string>} - Retorna la salida estándar acumulada.
 */
function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`Ejecutando: ${command} ${args.join(' ')}`);
    const proc = spawn(command, args, { shell: true });
    
    let output = '';
    let errorOutput = '';

    proc.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.log(`stdout: ${text}`);
    });

    proc.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      console.error(`stderr: ${text}`);
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`El comando finalizó con el código ${code}. Error: ${errorOutput}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Fallo al iniciar el comando: ${err.message}`));
    });
  });
}

module.exports = { runCommand };
