/**
 * server/app.js
 * Servidor principal de Express para la aplicación launion-ordenes.
 * Configura CORS, cookies, rutas estáticas, enrutadores de API y escucha en puerto.
 */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import verifyRoutes from './routes.js';
import adminRoutes from './users/adminRoutes.js';
import tarifasRoutes from './tarifas/routes.js';

dotenv.config();
const PORT = process.env.PORT || 3000;

const app = express();

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.replace(/['"]/g, '').split(',').map(origin => origin.trim())
  : [];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(cookieParser());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Enrutadores principales
app.use('/api', verifyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tarifas', tarifasRoutes);

// En producción, gestores de procesos (pm2, systemd) pueden invocar el script con un argv[1] distinto;
// por ello condicionamos el listen únicamente a que no sea entorno de pruebas (NODE_ENV !== 'test').
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
}

export default app;
