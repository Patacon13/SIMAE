const vscode = require('vscode');
const { mostrarMarcas, armarMultimap, moverCursor } = require('./functions.js');
const { msg, getLocale } = require('./locale.js');
const i18next = require('i18next');
const path = require('path');

let ultimoContenido = null;
let ultimasMarcas = null;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

/**
 * Muestra una hint con las marcas de SIMAE en la linea que se encuentra el usuario.
 * @function leerMarca
 */
  let leerMarca = vscode.commands.registerCommand('extension.leerMarca', () => {
    ejecutar(mostrarMarcas);
  });

/**
 * Mueve el cursor a la siguiente marca y muestra una hint con la información de la marca.
 * @function irDerecha
 */
  let irDerecha = vscode.commands.registerCommand('extension.irDerecha', () => {
   ejecutar((marcas, editor) => {
      moverCursor(marcas, editor, 1);
    });
  });

/**
 * Mueve el cursor a la marca anterior y muestra una hint con la información de la marca.
 * @function irIzquierda
 */
  let irIzquierda = vscode.commands.registerCommand('extension.irIzquierda', () => {
    ejecutar((marcas, editor) => {
      moverCursor(marcas, editor, -1);
    });
  });

  /**
 * Abre la ventana de configuración de SIMAE.
 * @function abrirConf
 */
  let abrirConf = vscode.commands.registerCommand('extension.abrirConf', () => {
    vscode.commands.executeCommand('workbench.action.openSettings', 'SIMAE');
  });


/**
 * Cambia el idioma de los mensajes de la hint al definido por el usuario en la configuración.
 * Si se cambió el idioma, detecta el evento y vuelve a generar el multimap con las marcas en el nuevo idioma.
 * @function cambiaLenguaje
 **/

  function cambiaLenguaje() {
    i18next.changeLanguage(getLocale());
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('SIMAE.idioma')) {
          ultimoContenido= null;
      }}));
  }

  
  /**
   * Controla que el plugin se pueda ejecutar. Ejecuta una acción
   * en caso de que se pueda, e informa errores en caso contrario. 
   * @param {*} accion - Funcion que se va a ejecutar en caso de que no existan errores.
   * @returns 
   */
  function ejecutar(accion) {
    cambiaLenguaje();
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage(msg("soloEditor"));
      return;
    }
    const filePath = editor.document.uri.fsPath;
    const fileExt = path.extname(filePath);
    if (![".java", ".cpp", ".py"].includes(fileExt)) {
      vscode.window.showInformationMessage(msg("lenguajesDisponibles"));
      return;
    }
    const contenido = editor.document.getText();
    if (ultimoContenido == null || contenido != ultimoContenido) {
      armarMultimap(filePath, context, editor)
        .then((marcas) => {
          ultimasMarcas = marcas;
          ultimoContenido = contenido;
          accion(ultimasMarcas, editor);
        })
        .catch(() => {
          vscode.window.showInformationMessage(msg("errorEjecucion"));
        });
    } else {
      accion(ultimasMarcas, editor);
    }
  }

  
 
  context.subscriptions.push(leerMarca, irDerecha, irIzquierda, abrirConf);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
