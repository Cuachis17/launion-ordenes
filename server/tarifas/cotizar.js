/**
 * Lógica pura de cotización de traslados.
 * Sin dependencias de base de datos ni frameworks.
 */

/**
 * Cotiza un traslado entre dos zonas según las reglas del tarifario.
 *
 * @param {string} origenZona - Clave de la zona origen
 * @param {string} destinoZona - Clave de la zona destino
 * @param {object} tarifario - Objeto tarifario con tablas, notas, vigencia
 * @returns {object} Resultado de la cotización
 */
export function cotizar(origenZona, destinoZona, tarifario) {
  if (!origenZona || !destinoZona) {
    return {
      encontrado: false,
      motivo: 'Origen y destino son requeridos para cotizar'
    };
  }

  if (!tarifario || !Array.isArray(tarifario.tablas)) {
    return {
      encontrado: false,
      motivo: 'Tarifario no disponible o formato inválido'
    };
  }

  const orig = String(origenZona).trim().toLowerCase();
  const dest = String(destinoZona).trim().toLowerCase();

  // Buscar coincidencias directas: tabla cuyo origenes incluye origen y alguna fila con destino
  const directas = [];
  // Buscar coincidencias invertidas: tabla cuyo origenes incluye destino y alguna fila con origen
  const invertidas = [];

  for (const tabla of tarifario.tablas) {
    if (!Array.isArray(tabla.origenes) || !Array.isArray(tabla.filas)) {
      continue;
    }

    const coincideOrigenDirecto = tabla.origenes.some(o => String(o).trim().toLowerCase() === orig);
    if (coincideOrigenDirecto) {
      for (const fila of tabla.filas) {
        if (Array.isArray(fila.destinos) && fila.destinos.some(d => String(d).trim().toLowerCase() === dest)) {
          directas.push({
            tabla,
            fila,
            invertido: false
          });
        }
      }
    }

    const coincideOrigenInvertido = tabla.origenes.some(o => String(o).trim().toLowerCase() === dest);
    if (coincideOrigenInvertido) {
      for (const fila of tabla.filas) {
        if (Array.isArray(fila.destinos) && fila.destinos.some(d => String(d).trim().toLowerCase() === orig)) {
          invertidas.push({
            tabla,
            fila,
            invertido: true
          });
        }
      }
    }
  }

  // Regla de decisión:
  // 1. El origen manda: si hay coincidencia directa, se toma la primera según el orden de tablas.
  // 2. Si no hay directa, se prueba invertido: el viaje vale igual en ambos sentidos.
  // 3. Si existen alternativas en tablas distintas, se listan en 'alternativas'.
  let seleccionada = null;
  const todasAlternativas = [];

  if (directas.length > 0) {
    seleccionada = directas[0];
    // Otras directas en tablas distintas
    for (let i = 1; i < directas.length; i++) {
      if (directas[i].tabla.clave !== seleccionada.tabla.clave) {
        todasAlternativas.push(directas[i]);
      }
    }
    // Invertidas en tablas distintas
    for (const inv of invertidas) {
      if (inv.tabla.clave !== seleccionada.tabla.clave) {
        todasAlternativas.push(inv);
      }
    }
  } else if (invertidas.length > 0) {
    seleccionada = invertidas[0];
    for (let i = 1; i < invertidas.length; i++) {
      if (invertidas[i].tabla.clave !== seleccionada.tabla.clave) {
        todasAlternativas.push(invertidas[i]);
      }
    }
  }

  if (!seleccionada) {
    return {
      encontrado: false,
      motivo: `No se encontró tarifa para la ruta ${orig} -> ${dest}`
    };
  }

  const respuesta = {
    encontrado: true,
    tabla: seleccionada.tabla.clave,
    nombreTabla: seleccionada.tabla.nombre,
    origen: orig,
    destino: dest,
    invertido: seleccionada.invertido,
    van: seleccionada.fila.van,
    sprinter: seleccionada.fila.sprinter,
    cargos: Array.isArray(seleccionada.tabla.cargos) ? seleccionada.tabla.cargos : [],
    notas: Array.isArray(tarifario.notas) ? tarifario.notas : ['Tarifas sin casetas'],
    vigencia: tarifario.vigencia || null
  };

  if (todasAlternativas.length > 0) {
    respuesta.alternativas = todasAlternativas.map(alt => ({
      tabla: alt.tabla.clave,
      nombreTabla: alt.tabla.nombre,
      van: alt.fila.van,
      sprinter: alt.fila.sprinter,
      cargos: Array.isArray(alt.tabla.cargos) ? alt.tabla.cargos : [],
      invertido: alt.invertido
    }));
  }

  return respuesta;
}
