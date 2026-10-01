/**
 * server/users/db.js
 * Capa de persistencia para la colección de usuarios con NeDB.
 * Exporta la instancia de Datastore y la función para sembrar el usuario administrador inicial.
 */

import Datastore from 'nedb-promises';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Directorio parametrizable para permitir aislamiento en pruebas unitarias
const dbDir = process.env.USERS_DB_DIR
  ? path.resolve(process.env.USERS_DB_DIR)
  : path.resolve(__dirname, '../db');

// Garantizamos existencia del directorio antes de inicializar Datastore
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export let db = Datastore.create({
  filename: path.join(dbDir, 'users.db'),
  autoload: true
});

// Permite inyectar una base de datos alternativa (ej. en memoria) durante tests
export function setDb(customDb) {
  db = customDb;
}

// Detectamos si el proceso actual se ejecuta en contexto de pruebas
const isTestEnv = process.env.NODE_ENV === 'test' ||
  process.env.npm_lifecycle_event === 'test' ||
  process.argv.some(arg => typeof arg === 'string' && arg.includes('test'));

const hasAutocompaction = db.persistence &&
  typeof db.persistence.setAutocompactionInterval === 'function';

if (!isTestEnv && hasAutocompaction) {
  db.persistence.setAutocompactionInterval(1000 * 60 * 60);
  if (db.__original?._autocompactionIntervalId?.unref) {
    db.__original._autocompactionIntervalId.unref();
  }
}

// Función auxiliar para detener autocompactación si fuera necesario
export function stopAutocompaction(targetDb = db) {
  if (targetDb?.__original?._autocompactionIntervalId) {
    clearInterval(targetDb.__original._autocompactionIntervalId);
  }
  if (targetDb?.stopAutocompaction) {
    targetDb.stopAutocompaction();
  }
}

/**
 * Si la base de datos de usuarios está vacía, crea el usuario administrador por defecto
 * utilizando las credenciales provistas en las variables de entorno.
 */
export async function seedDefaultAdmin(targetDb = db) {
  const adminUser = process.env.ADMIN_MAIL;
  const adminPass = process.env.ADMIN_PASS;

  if (!adminUser || !adminPass) {
    return;
  }

  const count = await targetDb.count({});
  if (count === 0) {
    const saltRounds = parseInt(process.env.SALT_ROUNDS, 10) || 10;
    const hashedPassword = await bcrypt.hash(adminPass, saltRounds);

    await targetDb.insert({
      username: adminUser,
      phone: '0000000000',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString()
    });

    console.log(`Default admin user created. Username: ${adminUser}`);
  }
}

// Inicialización automática del seed al arrancar el módulo
seedDefaultAdmin().catch(error => {
  console.error('Error al sembrar admin por defecto:', error);
});

export default db;
