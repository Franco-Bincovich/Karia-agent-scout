const { toolsCore } = require('./toolsCore');
const { toolsGoogle } = require('./toolsGoogle');

const TOOLS = [...toolsCore, ...toolsGoogle];

module.exports = { TOOLS };
