// tools/toolDefinitions/index.js
// Ensambla todos los schemas de tools del agente.

const { toolsDocumentos } = require('./toolsDocumentos');
const { toolsBusqueda } = require('./toolsBusqueda');
const { toolsPresentaciones } = require('./toolsPresentaciones');
const { toolsGoogle } = require('./toolsGoogle');

const TOOLS = [...toolsDocumentos, ...toolsBusqueda, ...toolsPresentaciones, ...toolsGoogle];

module.exports = { TOOLS };
