import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cotizar } from './cotizar.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tarifasSeed = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../seed/tarifas.json'), 'utf8')
);

// Helper para encontrar ruta directa en las tablas del tarifario
function obtenerDirecta(orig, dest, tarifario) {
  for (const tabla of tarifario.tablas) {
    if (tabla.origenes?.some(o => String(o).trim().toLowerCase() === orig.toLowerCase())) {
      for (const fila of tabla.filas) {
        if (fila.destinos?.some(d => String(d).trim().toLowerCase() === dest.toLowerCase())) {
          return { tabla, fila };
        }
      }
    }
  }
  return null;
}

/* ==========================================================================
   1. TESTS FUNDAMENTALES Y CASOS LÍMITE (BASE)
   ========================================================================== */

test('base: aeropuerto_cun -> playa_del_carmen = 900/1300 con recepcion 50', () => {
  const res = cotizar('aeropuerto_cun', 'playa_del_carmen', tarifasSeed);
  assert.equal(res.encontrado, true);
  assert.equal(res.tabla, 'desde_aeropuerto_cun');
  assert.equal(res.van, 900);
  assert.equal(res.sprinter, 1300);
  assert.deepEqual(res.cargos, [{ concepto: 'Recepción', monto: 50 }]);
  assert.equal(res.invertido, false);
});

test('base: playa_del_carmen -> aeropuerto_cun (tabla PDC) = 900/1300 sin cargo de recepcion', () => {
  const res = cotizar('playa_del_carmen', 'aeropuerto_cun', tarifasSeed);
  assert.equal(res.encontrado, true);
  assert.equal(res.tabla, 'desde_playa_del_carmen');
  assert.equal(res.van, 900);
  assert.equal(res.sprinter, 1300);
  assert.deepEqual(res.cargos, []);
  assert.equal(res.invertido, false);
});

test('base: tulum_zh -> zh_cancun = 1800/2100', () => {
  const res = cotizar('tulum_zh', 'zh_cancun', tarifasSeed);
  assert.equal(res.encontrado, true);
  assert.equal(res.tabla, 'desde_tulum');
  assert.equal(res.van, 1800);
  assert.equal(res.sprinter, 2100);
});

test('base: zh_cancun -> tulum_zh = 2000/2500 (asimetria real del PDF, el origen manda)', () => {
  const res = cotizar('zh_cancun', 'tulum_zh', tarifasSeed);
  assert.equal(res.encontrado, true);
  assert.equal(res.tabla, 'desde_zh_cancun');
  assert.equal(res.van, 2000);
  assert.equal(res.sprinter, 2500);
});

test('base: puerto_morelos -> tulum_centro -> encontrado: true via inversion (tabla tulum: 1200/1500)', () => {
  const res = cotizar('puerto_morelos', 'tulum_centro', tarifasSeed);
  assert.equal(res.encontrado, true);
  assert.equal(res.tabla, 'desde_tulum');
  assert.equal(res.van, 1200);
  assert.equal(res.sprinter, 1500);
  assert.equal(res.invertido, true);
});

test('base: petempich -> aeropuerto_tqo -> encontrado: false', () => {
  const res = cotizar('petempich', 'aeropuerto_tqo', tarifasSeed);
  assert.equal(res.encontrado, false);
  assert.ok(res.motivo);
});

test('base: limites origen o destino vacio', () => {
  assert.equal(cotizar('', 'zh_cancun', tarifasSeed).encontrado, false);
  assert.equal(cotizar('zh_cancun', null, tarifasSeed).encontrado, false);
});

test('base: limites tarifario nulo o invalido', () => {
  assert.equal(cotizar('zh_cancun', 'playa_del_carmen', null).encontrado, false);
  assert.equal(cotizar('zh_cancun', 'playa_del_carmen', {}).encontrado, false);
});

/* ==========================================================================
   2. REQUERIMIENTO 1: TABLA COMPLETA (BUCLE PARA CADA TABLA, FILA Y DESTINO)
   ========================================================================== */

for (const tabla of tarifasSeed.tablas) {
  for (const origen of tabla.origenes) {
    for (const fila of tabla.filas) {
      for (const destino of fila.destinos) {
        test(`tabla [${tabla.clave}] ${origen} -> ${destino} = ${fila.van}/${fila.sprinter}`, () => {
          const res = cotizar(origen, destino, tarifasSeed);
          assert.equal(res.encontrado, true, `Debe encontrar ruta para ${origen} -> ${destino}`);
          assert.equal(res.tabla, tabla.clave, `Tabla debe ser ${tabla.clave}`);
          assert.equal(res.van, fila.van, `Precio van incorrecto en ${origen} -> ${destino}`);
          assert.equal(res.sprinter, fila.sprinter, `Precio sprinter incorrecto en ${origen} -> ${destino}`);
          assert.equal(res.invertido, false, `Ruta directa no debe ser marcada como invertida`);

          // Cargo de recepción: $50 ÚNICAMENTE en la tabla desde_aeropuerto_cun
          if (tabla.clave === 'desde_aeropuerto_cun') {
            assert.deepEqual(
              res.cargos,
              [{ concepto: 'Recepción', monto: 50 }],
              `Tabla desde_aeropuerto_cun debe incluir cargo de recepción de $50`
            );
          } else {
            assert.deepEqual(
              res.cargos,
              [],
              `Tabla ${tabla.clave} no debe tener cargos adicionales de recepción`
            );
          }
        });
      }
    }
  }
}

/* ==========================================================================
   3. REQUERIMIENTO 2: REGLA INVERSA Y PRECEDENCIA DIRECTA
   ========================================================================== */

const zonasClaves = tarifasSeed.zonas.map(z => z.clave);

// 3.1. Pares sin directa pero con inversa: deben devolver invertida con invertido: true
for (const origen of zonasClaves) {
  for (const destino of zonasClaves) {
    const direct = obtenerDirecta(origen, destino, tarifasSeed);
    const inverse = obtenerDirecta(destino, origen, tarifasSeed);

    if (!direct && inverse) {
      test(`inversa: ${origen} -> ${destino} resuelta vía ${inverse.tabla.clave} (invertido: true)`, () => {
        const res = cotizar(origen, destino, tarifasSeed);
        assert.equal(res.encontrado, true, `Ruta inversa debe ser encontrada para ${origen} -> ${destino}`);
        assert.equal(res.invertido, true, `Debe marcarse con invertido: true`);
        assert.equal(res.tabla, inverse.tabla.clave, `Debe usar la tabla de la ruta origen invertida`);
        assert.equal(res.van, inverse.fila.van, `Debe cobrar tarifa van de la ruta inversa`);
        assert.equal(res.sprinter, inverse.fila.sprinter, `Debe cobrar tarifa sprinter de la ruta inversa`);
      });
    }
  }
}

// 3.2. Precedencia: Directa siempre gana sobre invertida
for (const origen of zonasClaves) {
  for (const destino of zonasClaves) {
    const direct = obtenerDirecta(origen, destino, tarifasSeed);
    const inverse = obtenerDirecta(destino, origen, tarifasSeed);

    if (direct && inverse) {
      test(`precedencia directa: ${origen} -> ${destino} debe preferir tabla directa ${direct.tabla.clave}`, () => {
        const res = cotizar(origen, destino, tarifasSeed);
        assert.equal(res.encontrado, true);
        assert.equal(res.invertido, false, `Ruta directa debe ganar y tener invertido: false`);
        assert.equal(res.tabla, direct.tabla.clave, `Debe elegir tabla directa sobre la inversa`);
        assert.equal(res.van, direct.fila.van);
        assert.equal(res.sprinter, direct.fila.sprinter);
      });
    }
  }
}

/* ==========================================================================
   4. REQUERIMIENTO 3: MATRIZ TOTAL ZONA X ZONA (400 COMBINACIONES)
   ========================================================================== */

test('matriz total: validación completa de 400 combinaciones zona x zona y detección de huecos', () => {
  let totalCombinaciones = 0;
  let totalEncontrados = 0;
  const huecosPdf = [];

  for (const origen of zonasClaves) {
    for (const destino of zonasClaves) {
      totalCombinaciones++;
      const res = cotizar(origen, destino, tarifasSeed);

      if (res.encontrado) {
        totalEncontrados++;
        // Verificaciones de precios: nunca inventado, NaN, 0, negativo o undefined
        assert.equal(typeof res.van, 'number', `van debe ser number en ${origen} -> ${destino}`);
        assert.ok(!isNaN(res.van), `van no puede ser NaN en ${origen} -> ${destino}`);
        assert.ok(res.van > 0, `van debe ser positivo en ${origen} -> ${destino}`);

        assert.equal(typeof res.sprinter, 'number', `sprinter debe ser number en ${origen} -> ${destino}`);
        assert.ok(!isNaN(res.sprinter), `sprinter no puede ser NaN en ${origen} -> ${destino}`);
        assert.ok(res.sprinter > 0, `sprinter debe ser positivo en ${origen} -> ${destino}`);

        assert.ok(typeof res.tabla === 'string' && res.tabla.length > 0, `tabla requerida en ${origen} -> ${destino}`);
      } else {
        assert.equal(res.encontrado, false);
        assert.ok(res.motivo, `Todo hueco debe retornar un motivo claro`);
        huecosPdf.push({ origen, destino });
      }
    }
  }

  assert.equal(totalCombinaciones, 400, 'Debe evaluar exactamente 20x20 = 400 combinaciones');
  assert.equal(totalEncontrados, 238, 'El tarifario oficial cubre 238 rutas');
  assert.equal(huecosPdf.length, 162, 'El tarifario oficial tiene exactamente 162 huecos asimétricos no cubiertos');
});
