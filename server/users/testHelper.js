/**
 * server/users/testHelper.js
 * Utilidades para pruebas de integración de usuarios y administración.
 * Levanta app Express aislada en puerto aleatorio con BD temporal sin colisiones.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

process.env.NODE_ENV = 'test';
export const SECRET_KEY = 'clave-secreta-para-pruebas-unitarias-12345';
process.env.SECRET_KEY = SECRET_KEY;
process.env.SALT_ROUNDS = '10';

export async function setupTestEnvironment() {
  // Directorio temporal exclusivo para aislar la base de datos de usuarios
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'users-test-'));
  process.env.USERS_DB_DIR = tmpDir;

  const { db } = await import('./db.js');
  const { default: verifyRoutes } = await import('../routes.js');
  const { default: adminRoutes } = await import('./adminRoutes.js');

  // App dedicada para pruebas de autenticación y administración
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use('/api', verifyRoutes);
  app.use('/api/admin', adminRoutes);

  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));

  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const cleanUp = async () => {
    if (server) {
      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections();
      }
      if (typeof server.closeIdleConnections === 'function') {
        server.closeIdleConnections();
      }
      await new Promise(resolve => server.close(resolve));
    }

    if (db?.__original?._autocompactionIntervalId) {
      clearInterval(db.__original._autocompactionIntervalId);
    }

    fs.rmSync(tmpDir, { recursive: true, force: true });
  };

  const createUser = async ({ username, phone, role, status, password }) => {
    const hashedPassword = await bcrypt.hash(password || 'password123', 10);
    return db.insert({
      username,
      phone: phone || '0000000000',
      password: hashedPassword,
      role: role || 'user',
      status: status || 'active',
      createdAt: new Date().toISOString()
    });
  };

  const createToken = user => {
    return jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      SECRET_KEY,
      { expiresIn: '1h' }
    );
  };

  const apiFetch = async (url, options = {}) => {
    const headers = {
      Connection: 'close',
      ...(options.headers || {})
    };
    return fetch(url, { ...options, headers });
  };

  return {
    baseUrl,
    db,
    cleanUp,
    createUser,
    createToken,
    apiFetch
  };
}
