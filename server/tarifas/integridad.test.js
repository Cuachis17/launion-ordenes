import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const tarifasSeed = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../seed/tarifas.json'), 'utf8')
);
const hotelesSeed = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../seed/hoteles.json'), 'utf8')
);
const lugaresSeed = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../seed/lugares.json'), 'utf8')
);

function normalizar(texto) {
  if (!texto) return '';
  return texto
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/* ==========================================================================
   REQUERIMIENTO 4: INTEGRIDAD DE DATOS SEMILLA
   ========================================================================== */

test('integridad: cada hotel tiene una zona existente en el catálogo oficial de zonas', () => {
  const zonasValidas = new Set(tarifasSeed.zonas.map(z => z.clave));
  const invalidos = [];

  for (const hotel of hotelesSeed) {
    if (!zonasValidas.has(hotel.zona)) {
      invalidos.push({ nombre: hotel.nombre, zona: hotel.zona });
    }
  }

  assert.equal(invalidos.length, 0, `Hoteles con zona inválida: ${JSON.stringify(invalidos)}`);
});

test('integridad: cada lugar tiene una zona existente en el catálogo oficial de zonas', () => {
  const zonasValidas = new Set(tarifasSeed.zonas.map(z => z.clave));
  const invalidos = [];

  for (const lugar of lugaresSeed) {
    if (!zonasValidas.has(lugar.zona)) {
      invalidos.push({ nombre: lugar.nombre, clave: lugar.clave, zona: lugar.zona });
    }
  }

  assert.equal(invalidos.length, 0, `Lugares con zona inválida: ${JSON.stringify(invalidos)}`);
});

test('integridad: claves de lugares son estrictamente únicas', () => {
  const claves = new Map();
  const duplicados = [];

  for (const lugar of lugaresSeed) {
    const clave = String(lugar.clave).trim().toLowerCase();
    if (claves.has(clave)) {
      duplicados.push({ clave, lugar1: claves.get(clave), lugar2: lugar });
    } else {
      claves.set(clave, lugar);
    }
  }

  assert.equal(duplicados.length, 0, `Claves de lugares duplicadas: ${JSON.stringify(duplicados)}`);
});

test('integridad: ningún campo requerido está vacío en lugares, hoteles ni zonas', () => {
  // 1. Zonas
  for (const zona of tarifasSeed.zonas) {
    assert.ok(zona.clave && String(zona.clave).trim().length > 0, `Zona sin clave: ${JSON.stringify(zona)}`);
    assert.ok(zona.nombre && String(zona.nombre).trim().length > 0, `Zona sin nombre: ${JSON.stringify(zona)}`);
  }

  // 2. Lugares
  for (const lugar of lugaresSeed) {
    assert.ok(lugar.clave && String(lugar.clave).trim().length > 0, `Lugar sin clave: ${JSON.stringify(lugar)}`);
    assert.ok(lugar.nombre && String(lugar.nombre).trim().length > 0, `Lugar sin nombre: ${JSON.stringify(lugar)}`);
    assert.ok(
      ['aeropuerto', 'centro'].includes(String(lugar.tipo).trim().toLowerCase()),
      `Lugar con tipo inválido: ${lugar.tipo} en ${lugar.clave}`
    );
    assert.ok(lugar.zona && String(lugar.zona).trim().length > 0, `Lugar sin zona: ${JSON.stringify(lugar)}`);
  }

  // 3. Hoteles
  for (const hotel of hotelesSeed) {
    assert.ok(hotel.nombre && String(hotel.nombre).trim().length > 0, `Hotel sin nombre: ${JSON.stringify(hotel)}`);
    assert.ok(hotel.zona && String(hotel.zona).trim().length > 0, `Hotel sin zona: ${JSON.stringify(hotel)}`);
  }

  // 4. Tablas tarifario
  for (const tabla of tarifasSeed.tablas) {
    assert.ok(tabla.clave && tabla.clave.trim().length > 0, `Tabla sin clave`);
    assert.ok(tabla.nombre && tabla.nombre.trim().length > 0, `Tabla sin nombre`);
    assert.ok(Array.isArray(tabla.origenes) && tabla.origenes.length > 0, `Tabla sin orígenes`);
    assert.ok(Array.isArray(tabla.filas) && tabla.filas.length > 0, `Tabla sin filas`);

    for (const fila of tabla.filas) {
      assert.ok(Array.isArray(fila.destinos) && fila.destinos.length > 0, `Fila sin destinos en tabla ${tabla.clave}`);
      assert.ok(typeof fila.van === 'number' && fila.van > 0, `Fila con precio van inválido en ${tabla.clave}`);
      assert.ok(typeof fila.sprinter === 'number' && fila.sprinter > 0, `Fila con precio sprinter inválido en ${tabla.clave}`);
    }
  }
});

test('integridad: sin duplicados por nombre normalizado en catálogo de hoteles', () => {
  const nombres = new Map();
  const duplicados = [];

  for (const hotel of hotelesSeed) {
    const norm = normalizar(hotel.nombre);
    if (!norm) continue;

    if (nombres.has(norm)) {
      duplicados.push({
        nombreActual: hotel.nombre,
        nombrePrevio: nombres.get(norm).nombre,
        zonaActual: hotel.zona,
        zonaPrevia: nombres.get(norm).zona
      });
    } else {
      nombres.set(norm, hotel);
    }
  }

  assert.equal(duplicados.length, 0, `Hoteles duplicados por nombre normalizado: ${JSON.stringify(duplicados)}`);
});

test('integridad: sin duplicados por nombre normalizado en catálogo de lugares', () => {
  const nombres = new Map();
  const duplicados = [];

  for (const lugar of lugaresSeed) {
    const norm = normalizar(lugar.nombre);
    if (!norm) continue;

    if (nombres.has(norm)) {
      duplicados.push({
        nombreActual: lugar.nombre,
        nombrePrevio: nombres.get(norm).nombre
      });
    } else {
      nombres.set(norm, lugar);
    }
  }

  assert.equal(duplicados.length, 0, `Lugares duplicados por nombre normalizado: ${JSON.stringify(duplicados)}`);
});

test('integridad: sin alias ni nombres que choquen entre zonas distintas', () => {
  const asignaciones = new Map(); // normalizado -> { zona, origen, entidad }
  const colisiones = [];

  // Registrar lugares
  for (const lugar of lugaresSeed) {
    const terms = [lugar.nombre, ...(Array.isArray(lugar.alias) ? lugar.alias : [])];
    for (const term of terms) {
      const norm = normalizar(term);
      if (!norm) continue;

      if (asignaciones.has(norm)) {
        const previo = asignaciones.get(norm);
        if (previo.zona !== lugar.zona) {
          colisiones.push({
            termino: term,
            norm,
            zona1: previo.zona,
            origen1: previo.entidad,
            zona2: lugar.zona,
            origen2: lugar.nombre
          });
        }
      } else {
        asignaciones.set(norm, { zona: lugar.zona, entidad: lugar.nombre });
      }
    }
  }

  // Registrar hoteles
  for (const hotel of hotelesSeed) {
    const terms = [hotel.nombre, ...(Array.isArray(hotel.alias) ? hotel.alias : [])];
    for (const term of terms) {
      const norm = normalizar(term);
      if (!norm) continue;

      if (asignaciones.has(norm)) {
        const previo = asignaciones.get(norm);
        if (previo.zona !== hotel.zona) {
          colisiones.push({
            termino: term,
            norm,
            zona1: previo.zona,
            origen1: previo.entidad,
            zona2: hotel.zona,
            origen2: hotel.nombre
          });
        }
      } else {
        asignaciones.set(norm, { zona: hotel.zona, entidad: hotel.nombre });
      }
    }
  }

  assert.equal(
    colisiones.length,
    0,
    `Colisiones de nombres/alias entre zonas distintas: ${JSON.stringify(colisiones)}`
  );
});
