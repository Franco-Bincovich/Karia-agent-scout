// app.js
// Configura Express: middlewares globales y rutas.
// No contiene lógica de negocio ni lectura de process.env.

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config');
const { errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const { chatRouter, conversacionesRouter } = require('./routes/chatRoutes');
const filesRoutes = require('./routes/filesRoutes');
const documentoRoutes = require('./routes/documentoRoutes');
const integracionRoutes = require('./routes/integracionRoutes');
const funcionalidadRoutes = require('./routes/funcionalidadRoutes');

const app = express();

// CORS antes que helmet para que los headers Access-Control-* no sean pisados.
// app.options responde el preflight sin llegar a rutas ni al 404 handler.
const corsOptions = {
  origin: config.allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// Seguridad de cabeceras HTTP (crossOriginResourcePolicy en cross-origin para APIs)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Parseo de JSON con límite de 10kb
app.use(express.json({ limit: '10kb' }));

// Health check — Base 8: Run & See inmediato
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRouter);
app.use('/api/conversaciones', conversacionesRouter);
app.use('/api/files', filesRoutes);
app.use('/api/documentos', documentoRoutes);
app.use('/api/integraciones', integracionRoutes);
app.use('/api/funcionalidades', funcionalidadRoutes);

// 404 — ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ error: true, message: 'Ruta no encontrada', code: 'NOT_FOUND' });
});

// Error handler global — debe ir al final, después de todas las rutas
app.use(errorHandler);

module.exports = app;
