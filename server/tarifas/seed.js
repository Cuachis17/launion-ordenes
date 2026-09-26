import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbZonas as defaultZonas, dbHoteles as defaultHoteles, dbLugares as defaultLugares, dbTarifarios as defaultTarifarios, dbTours as defaultTours } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function runSeed({ force = false, dbs = null, seedDir = null } = {}) {
  console.log(`[SEED:TARIFAS] Iniciando carga de datos semilla (force: ${force})...`);

  const dbZonas = dbs?.dbZonas || defaultZonas;
  const dbHoteles = dbs?.dbHoteles || defaultHoteles;
  const dbLugares = dbs?.dbLugares || defaultLugares;
  const dbTarifarios = dbs?.dbTarifarios || defaultTarifarios;
  const dbTours = dbs?.dbTours || defaultTours;

  const baseDir = seedDir || path.resolve(__dirname, '../seed');
  const tarifasPath = path.join(baseDir, 'tarifas.json');
  const hotelesPath = path.join(baseDir, 'hoteles.json');
  const lugaresPath = path.join(baseDir, 'lugares.json');

  if (!fs.existsSync(tarifasPath) || !fs.existsSync(hotelesPath) || !fs.existsSync(lugaresPath)) {
    throw new Error('No se encontraron los archivos seed en server/seed/');
  }

  const tarifasData = JSON.parse(fs.readFileSync(tarifasPath, 'utf8'));
  const hotelesData = JSON.parse(fs.readFileSync(hotelesPath, 'utf8'));
  const lugaresData = JSON.parse(fs.readFileSync(lugaresPath, 'utf8'));

  // 1. ZONAS
  const countZonas = await dbZonas.count({});
  if (force && countZonas > 0) {
    await dbZonas.remove({}, { multi: true });
    console.log('[SEED:TARIFAS] Zonas existentes eliminadas por --force');
  }
  if (force || countZonas === 0) {
    if (Array.isArray(tarifasData.zonas) && tarifasData.zonas.length > 0) {
      await dbZonas.insert(tarifasData.zonas);
      console.log(`[SEED:TARIFAS] Insertadas ${tarifasData.zonas.length} zonas.`);
    }
  } else {
    console.log(`[SEED:TARIFAS] Colección zonas ya contiene ${countZonas} registros. Se omite.`);
  }

  // 2. HOTELES
  const countHoteles = await dbHoteles.count({});
  if (force && countHoteles > 0) {
    await dbHoteles.remove({}, { multi: true });
    console.log('[SEED:TARIFAS] Hoteles existentes eliminados por --force');
  }
  if (force || countHoteles === 0) {
    if (Array.isArray(hotelesData) && hotelesData.length > 0) {
      await dbHoteles.insert(hotelesData);
      console.log(`[SEED:TARIFAS] Insertados ${hotelesData.length} hoteles.`);
    }
  } else {
    console.log(`[SEED:TARIFAS] Colección hoteles ya contiene ${countHoteles} registros. Se omite.`);
  }

  // 3. TARIFARIOS (guarda el tarifario completo como UN documento con vigencia y activo:true)
  const countTarifarios = await dbTarifarios.count({});
  if (force && countTarifarios > 0) {
    await dbTarifarios.remove({}, { multi: true });
    console.log('[SEED:TARIFAS] Tarifarios existentes eliminados por --force');
  }
  if (force || countTarifarios === 0) {
    // Si hubiera otro activo, marcar como inactivo
    await dbTarifarios.update({ activo: true }, { $set: { activo: false } }, { multi: true });

    const docTarifario = {
      vigencia: tarifasData.vigencia,
      fuente: tarifasData.fuente,
      notas: tarifasData.notas || ['Tarifas sin casetas'],
      unidades: tarifasData.unidades || [],
      zonas: tarifasData.zonas || [],
      tablas: tarifasData.tablas || [],
      extras: tarifasData.extras || [],
      activo: true,
      createdAt: new Date().toISOString()
    };
    await dbTarifarios.insert(docTarifario);
    console.log(`[SEED:TARIFAS] Tarifario vigencia ${tarifasData.vigencia} insertado como activo.`);
  } else {
    console.log(`[SEED:TARIFAS] Colección tarifarios ya contiene ${countTarifarios} registros. Se omite.`);
  }

  // 4. TOURS
  const countTours = await dbTours.count({});
  if (force && countTours > 0) {
    await dbTours.remove({}, { multi: true });
    console.log('[SEED:TARIFAS] Tours existentes eliminados por --force');
  }
  if (force || countTours === 0) {
    if (Array.isArray(tarifasData.tours) && tarifasData.tours.length > 0) {
      await dbTours.insert(tarifasData.tours);
      console.log(`[SEED:TARIFAS] Insertados ${tarifasData.tours.length} bloques de tours.`);
    }
  } else {
    console.log(`[SEED:TARIFAS] Colección tours ya contiene ${countTours} registros. Se omite.`);
  }

  // 5. LUGARES
  const countLugares = await dbLugares.count({});
  if (force && countLugares > 0) {
    await dbLugares.remove({}, { multi: true });
    console.log('[SEED:TARIFAS] Lugares existentes eliminados por --force');
  }
  if (force || countLugares === 0) {
    if (Array.isArray(lugaresData) && lugaresData.length > 0) {
      const docsLugares = lugaresData.map(l => ({ _id: l.clave, ...l }));
      await dbLugares.insert(docsLugares);
      console.log(`[SEED:TARIFAS] Insertados ${docsLugares.length} lugares.`);
    }
  } else {
    console.log(`[SEED:TARIFAS] Colección lugares ya contiene ${countLugares} registros. Se omite.`);
  }

  console.log('[SEED:TARIFAS] Proceso de inicialización finalizado.');
}

export async function seed(optionsOrDirOrDbs = {}) {
  if (typeof optionsOrDirOrDbs === 'string') {
    return runSeed({ force: true, seedDir: optionsOrDirOrDbs });
  }
  if (optionsOrDirOrDbs && (optionsOrDirOrDbs.dbZonas || optionsOrDirOrDbs.dbHoteles)) {
    return runSeed({ force: true, dbs: optionsOrDirOrDbs });
  }
  return runSeed(optionsOrDirOrDbs);
}

// Ejecución directa si se invoca por CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const force = process.argv.includes('--force');
  runSeed({ force })
    .then(() => process.exit(0))
    .catch(err => {
      console.error('[SEED:TARIFAS] Error al ejecutar seed:', err);
      process.exit(1);
    });
}
