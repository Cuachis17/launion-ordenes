import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Directorio temporal aislado para pruebas
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tarifas-test-'));
process.env.TARIFAS_DB_DIR = tmpDir;

// Cargar módulos después de configurar TARIFAS_DB_DIR
const { runSeed } = await import('./seed.js');
const { dbHoteles, dbTarifarios, dbLugares, dbZonas, dbTours } = await import('./db.js');
const { default: tarifasRoutes } = await import('./routes.js');

const PORT = 3995; // Puerto de pruebas estricto (NUNCA 3021)
const BASE_URL = `http://127.0.0.1:${PORT}/api/tarifas`;
const SECRET_KEY = process.env.SECRET_KEY || 'union-ordenes-aaoibfioansdoiñ';

// Tokens JWT para pruebas
const tokenAdmin = jwt.sign(
  { id: 'admin_test_id', username: 'admin@union.com', role: 'admin' },
  SECRET_KEY,
  { expiresIn: '1h' }
);
const tokenUser = jwt.sign(
  { id: 'user_test_id', username: 'chofer@union.com', role: 'user' },
  SECRET_KEY,
  { expiresIn: '1h' }
);

// Helper para peticiones HTTP con Connection: close (sin sockets huérfanos)
async function apiRequest(endpoint, options = {}) {
  const headers = {
    Connection: 'close',
    ...(options.headers || {})
  };
  return fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });
}

describe('Pruebas de Integración de Endpoints /api/tarifas', () => {
  let server = null;

  before(async () => {
    // 1. Sembrar base de datos en el directorio temporal
    await runSeed({ force: true, dbs: { dbHoteles, dbTarifarios, dbLugares, dbZonas, dbTours } });

    // 2. Levantar servidor temporal Express en puerto 3995
    const app = express();
    app.use((req, res, next) => {
      res.setHeader('Connection', 'close');
      next();
    });
    app.use(cookieParser());
    app.use(express.json({ limit: '10mb' }));
    app.use('/api/tarifas', tarifasRoutes);

    await new Promise((resolve) => {
      server = app.listen(PORT, '127.0.0.1', () => {
        resolve();
      });
    });
  });

  after(async () => {
    // 1. Apagar servidor temporal y cerrar conexiones
    if (server) {
      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections();
      }
      await new Promise((resolve) => server.close(resolve));
    }

    // 2. Detener timers de autocompactación de NeDB para liberar el event loop
    for (const ds of [dbZonas, dbHoteles, dbLugares, dbTarifarios, dbTours]) {
      if (ds?.__original?._autocompactionIntervalId) {
        clearInterval(ds.__original._autocompactionIntervalId);
      }
    }

    // 3. Eliminar directorio temporal
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  /* ==========================================================================
     1. ENDPOINT GET /hoteles/buscar (CASOS BORDE Y SEGURIDAD)
     ========================================================================== */

  test('buscar: con acentos encuentra resultados normalizados', async () => {
    const res = await apiRequest(`/hoteles/buscar?q=${encodeURIComponent('cancún')}`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data) && data.length > 0);
    assert.ok(data.some(item => item.nombre.toLowerCase().includes('cancun') || item.nombre.toLowerCase().includes('cancún')));
  });

  test('buscar: con mayúsculas es insensible a caja', async () => {
    const res = await apiRequest('/hoteles/buscar?q=CANCUN');
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data) && data.length > 0);
  });

  test('buscar: con signos y puntuación los normaliza correctamente', async () => {
    const res = await apiRequest(`/hoteles/buscar?q=${encodeURIComponent('cancun!!!')}`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data) && data.length > 0);
  });

  test('buscar: vacío retorna hasta 15 elementos priorizando lugares', async () => {
    const res = await apiRequest('/hoteles/buscar?q=');
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
    assert.ok(data.length > 0 && data.length <= 15);
    // Los primeros resultados deben ser lugares (aeropuertos o centros)
    assert.ok(['aeropuerto', 'centro'].includes(data[0].tipo));
  });

  test('buscar: 1 sola letra retorna coincidencias', async () => {
    const res = await apiRequest('/hoteles/buscar?q=c');
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data) && data.length > 0);
  });

  test('buscar: inyección tipo {"$ne":null} no vulnera ni rompe el endpoint', async () => {
    const res = await apiRequest('/hoteles/buscar?q[%24ne]=null');
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
  });

  test('buscar: strings enormes se procesan sin colgar el servidor', async () => {
    const hugeQuery = 'a'.repeat(5000);
    const res = await apiRequest(`/hoteles/buscar?q=${encodeURIComponent(hugeQuery)}`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
    assert.equal(data.length, 0);
  });

  test('buscar: tolerancia a typos leves (e.g. "aeropurto") y ranking', async () => {
    // 1. "aeropurto" -> Aeropuerto Cancún primero
    const resAero = await apiRequest('/hoteles/buscar?q=aeropurto');
    assert.equal(resAero.status, 200);
    const dataAero = await resAero.json();
    assert.ok(Array.isArray(dataAero) && dataAero.length > 0, 'Búsqueda debería tolerar typos leves como aeropurto');
    assert.equal(dataAero[0].nombre, 'Aeropuerto Cancún', 'aeropurto debe retornar Aeropuerto Cancún primero');

    // 2. "playa centro" -> Playa del Carmen Centro primero
    const resPlaya = await apiRequest(`/hoteles/buscar?q=${encodeURIComponent('playa centro')}`);
    assert.equal(resPlaya.status, 200);
    const dataPlaya = await resPlaya.json();
    assert.ok(Array.isArray(dataPlaya) && dataPlaya.length > 0);
    assert.equal(dataPlaya[0].nombre, 'Playa del Carmen Centro', 'playa centro debe retornar Playa del Carmen Centro primero');

    // 3. "riu palce riviera" -> Riu Palace Riviera Maya en top 3
    const resRiu = await apiRequest(`/hoteles/buscar?q=${encodeURIComponent('riu palce riviera')}`);
    assert.equal(resRiu.status, 200);
    const dataRiu = await resRiu.json();
    assert.ok(Array.isArray(dataRiu) && dataRiu.length > 0);
    const top3Nombres = dataRiu.slice(0, 3).map(x => x.nombre);
    assert.ok(top3Nombres.includes('Riu Palace Riviera Maya'), 'riu palce riviera debe retornar Riu Palace Riviera Maya en top 3');

    // 4. "zz" no revienta
    const resZz = await apiRequest('/hoteles/buscar?q=zz');
    assert.equal(resZz.status, 200);
    const dataZz = await resZz.json();
    assert.ok(Array.isArray(dataZz), 'zz debe retornar un arreglo sin reventar el servidor');
  });

  /* ==========================================================================
     2. ENDPOINT GET /cotizar (RESOLUCIÓN DE IDS Y PRECIOS)
     ========================================================================== */

  test('cotizar: id de origen inexistente retorna HTTP 400', async () => {
    const res = await apiRequest('/cotizar?origen=zona_falsa_999&destino=playa_centro');
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.encontrado, false);
    assert.match(data.motivo, /Origen no reconocido/);
  });

  test('cotizar: parámetros faltantes retorna HTTP 400', async () => {
    const resSinDestino = await apiRequest('/cotizar?origen=aeropuerto_cun');
    assert.equal(resSinDestino.status, 400);

    const resVacio = await apiRequest('/cotizar?origen=&destino=');
    assert.equal(resVacio.status, 400);
    const data = await resVacio.json();
    assert.equal(data.encontrado, false);
  });

  test('cotizar: ids iguales (origen = destino)', async () => {
    // Caso A: centro con tarifa local en su zona (Playa del Carmen)
    const resPdc = await apiRequest('/cotizar?origen=playa_centro&destino=playa_centro');
    assert.equal(resPdc.status, 200);
    const dataPdc = await resPdc.json();
    assert.equal(dataPdc.encontrado, true);
    assert.equal(dataPdc.van, 450);

    // Caso B: aeropuerto a aeropuerto no tiene tarifa
    const resAero = await apiRequest('/cotizar?origen=aeropuerto_cun&destino=aeropuerto_cun');
    assert.equal(resAero.status, 200);
    const dataAero = await resAero.json();
    assert.equal(dataAero.encontrado, false);
  });

  test('cotizar: con hotelId válido resuelve zona del hotel y cotiza', async () => {
    const hotel = await dbHoteles.findOne({ zona: 'playa_del_carmen' });
    assert.ok(hotel, 'Debe existir hotel en playa_del_carmen');

    const res = await apiRequest(`/cotizar?origen=${hotel._id}&destino=aeropuerto_cun`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.encontrado, true);
    assert.equal(data.van, 900);
    assert.equal(data.sprinter, 1300);
    assert.equal(data.detalleOrigen.tipo, 'hotel');
    assert.equal(data.detalleOrigen.hotelId, hotel._id);
    assert.equal(data.detalleOrigen.zona, 'playa_del_carmen');
    assert.equal(data.detalleDestino.tipo, 'aeropuerto');
  });

  /* ==========================================================================
     3. AUTORIZACIÓN ADMIN (401 SIN TOKEN / 403 NO-ADMIN)
     ========================================================================== */

  const endpointsAdmin = [
    { method: 'POST', path: '/hoteles', body: { nombre: 'Hotel X', zona: 'zh_cancun' } },
    { method: 'PUT', path: '/hoteles/dummy_id', body: { nombre: 'Hotel X' } },
    { method: 'DELETE', path: '/hoteles/dummy_id' },
    { method: 'POST', path: '/lugares', body: { clave: 'lugar_x', nombre: 'X', tipo: 'centro', zona: 'zh_cancun' } },
    { method: 'PUT', path: '/lugares/dummy_id', body: { nombre: 'X' } },
    { method: 'DELETE', path: '/lugares/dummy_id' },
    { method: 'PUT', path: '/tarifario/precio', body: { tablaClave: 'desde_aeropuerto_cun', destino: 'playa_del_carmen', van: 950 } },
    { method: 'POST', path: '/tarifarios', body: { vigencia: '2028-01-01', tablas: [] } },
    { method: 'GET', path: '/tarifarios/historial' }
  ];

  for (const ep of endpointsAdmin) {
    test(`auth: ${ep.method} ${ep.path} sin token retorna HTTP 401`, async () => {
      const opts = {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (ep.body) opts.body = JSON.stringify(ep.body);

      const res = await apiRequest(ep.path, opts);
      assert.equal(res.status, 401, `Debe retornar 401 sin token`);
    });

    test(`auth: ${ep.method} ${ep.path} con token no-admin retorna HTTP 403`, async () => {
      const opts = {
        method: ep.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenUser}`
        }
      };
      if (ep.body) opts.body = JSON.stringify(ep.body);

      const res = await apiRequest(ep.path, opts);
      assert.equal(res.status, 403, `Debe retornar 403 para usuarios sin rol admin`);
    });
  }

  /* ==========================================================================
     4. MODIFICACIÓN DE PRECIOS Y NUEVO TARIFARIO ACTIVO
     ========================================================================== */

  test('admin: editar precio actualiza el tarifario activo y cotizar refleja el cambio', async () => {
    const nuevoVan = 999;
    const nuevoSprinter = 1444;

    const resPut = await apiRequest('/tarifario/precio', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenAdmin}`
      },
      body: JSON.stringify({
        tablaClave: 'desde_aeropuerto_cun',
        destino: 'playa_del_carmen',
        van: nuevoVan,
        sprinter: nuevoSprinter
      })
    });
    assert.equal(resPut.status, 200);

    // Verificar cotización inmediata con nuevo precio
    const resCotizar = await apiRequest('/cotizar?origen=aeropuerto_cun&destino=playa_del_carmen');
    assert.equal(resCotizar.status, 200);
    const dataCotizar = await resCotizar.json();
    assert.equal(dataCotizar.van, nuevoVan);
    assert.equal(dataCotizar.sprinter, nuevoSprinter);
  });

  test('admin: registrar nuevo tarifario desactiva el anterior y cotizar usa el nuevo', async () => {
    // Consultar tarifario previo activo
    const tarifarioAnterior = await dbTarifarios.findOne({ activo: true });
    assert.ok(tarifarioAnterior, 'Debe haber un tarifario activo inicial');

    // Insertar nueva vigencia de tarifario
    const vigenciaNueva = '2030-12-31';
    const nuevoTarifarioPayload = {
      vigencia: vigenciaNueva,
      fuente: 'TARIFARIO_FUTURO_2031.pdf',
      notas: ['Tarifario nuevo de prueba QA'],
      unidades: [{ clave: 'van', nombre: 'Van' }, { clave: 'sprinter', nombre: 'Sprinter' }],
      zonas: tarifarioAnterior.zonas,
      tablas: [
        {
          clave: 'desde_aeropuerto_cun',
          nombre: 'Aeropuerto Cancún 2031',
          origenes: ['aeropuerto_cun'],
          cargos: [{ concepto: 'Recepción', monto: 75 }],
          filas: [
            { destinos: ['playa_del_carmen'], van: 1250, sprinter: 1850 }
          ]
        }
      ]
    };

    const resPost = await apiRequest('/tarifarios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenAdmin}`
      },
      body: JSON.stringify(nuevoTarifarioPayload)
    });
    assert.equal(resPost.status, 201);
    const dataNuevo = await resPost.json();
    assert.equal(dataNuevo.activo, true);

    // Verificar que el tarifario anterior ahora tiene activo: false
    const tarifarioAnteriorActualizado = await dbTarifarios.findOne({ _id: tarifarioAnterior._id });
    assert.equal(tarifarioAnteriorActualizado.activo, false, 'Tarifario previo debe quedar desactivado');

    // Cotizar debe usar el nuevo tarifario
    const resCotizar = await apiRequest('/cotizar?origen=aeropuerto_cun&destino=playa_del_carmen');
    assert.equal(resCotizar.status, 200);
    const dataCotizar = await resCotizar.json();
    assert.equal(dataCotizar.vigencia, vigenciaNueva);
    assert.equal(dataCotizar.van, 1250);
    assert.equal(dataCotizar.sprinter, 1850);
    assert.deepEqual(dataCotizar.cargos, [{ concepto: 'Recepción', monto: 75 }]);
  });
});
