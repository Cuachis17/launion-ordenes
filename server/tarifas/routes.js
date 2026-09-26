import express from 'express';
import { dbZonas, dbHoteles, dbLugares, dbTarifarios, dbTours } from './db.js';
import { cotizar } from './cotizar.js';
import { verifyToken } from '../middleware.js';

const router = express.Router();

import { buscarLugares, normalizarTexto } from './buscar.js';

export { buscarLugares, normalizarTexto };

/**
 * Resuelve un identificador (lugar, zona o hotel) en orden estricto:
 * 1. Lugar por clave (tipo: 'aeropuerto' | 'centro')
 * 2. Zona por clave (tipo: 'zona')
 * 3. Hotel por _id (tipo: 'hotel')
 */
async function resolverZona(idOClave, tarifario) {
  if (!idOClave) return null;
  const limpio = String(idOClave).trim();
  const limpioLower = limpio.toLowerCase();

  // 1. Lugar por clave
  try {
    const lugar = await dbLugares.findOne({
      $or: [
        { clave: limpio },
        { clave: limpioLower },
        { _id: limpio },
        { _id: limpioLower }
      ]
    });
    if (lugar) {
      return {
        zona: lugar.zona,
        tipo: lugar.tipo, // 'aeropuerto' | 'centro'
        nombre: lugar.nombre,
        clave: lugar.clave,
        _id: lugar.clave || lugar._id
      };
    }
  } catch (err) {
    console.error('Error buscando lugar en resolverZona:', err);
  }

  // 2. Zona por clave en dbZonas
  try {
    const zonaDb = await dbZonas.findOne({
      $or: [
        { clave: limpio },
        { clave: limpioLower }
      ]
    });
    if (zonaDb) {
      return {
        zona: zonaDb.clave,
        tipo: 'zona',
        nombre: zonaDb.nombre
      };
    }
  } catch (err) {
    console.error('Error buscando zona en dbZonas en resolverZona:', err);
  }

  // Fallback de zona en tarifario activo
  if (tarifario?.zonas) {
    const zTar = tarifario.zonas.find(z => z.clave.toLowerCase() === limpioLower);
    if (zTar) {
      return {
        zona: zTar.clave,
        tipo: 'zona',
        nombre: zTar.nombre
      };
    }
  }

  if (tarifario?.tablas) {
    for (const t of tarifario.tablas) {
      if (t.origenes?.some(o => o.toLowerCase() === limpioLower)) {
        return { zona: limpioLower, tipo: 'zona', nombre: limpio };
      }
      for (const f of t.filas || []) {
        if (f.destinos?.some(d => d.toLowerCase() === limpioLower)) {
          return { zona: limpioLower, tipo: 'zona', nombre: limpio };
        }
      }
    }
  }

  // 3. Hotel por _id
  try {
    const hotel = await dbHoteles.findOne({ _id: limpio });
    if (hotel) {
      return {
        zona: hotel.zona,
        tipo: 'hotel',
        nombre: hotel.nombre,
        hotelId: hotel._id
      };
    }
  } catch (err) {
    console.error('Error buscando hotel en resolverZona:', err);
  }

  return null;
}

// Middleware de rol admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Requiere rol de administrador.' });
  }
  next();
};

/* ==========================================================================
   ENDPOINTS PÚBLICOS (SIN LOGIN)
   ========================================================================== */

// GET /api/tarifas/zonas
router.get('/zonas', async (req, res) => {
  try {
    let zonas = await dbZonas.find({});
    if (!zonas || zonas.length === 0) {
      const tarifarioActivo = await dbTarifarios.findOne({ activo: true });
      zonas = tarifarioActivo?.zonas || [];
    }
    res.json(zonas);
  } catch (error) {
    console.error('Error al obtener zonas:', error);
    res.status(500).json({ message: 'Error interno al obtener zonas' });
  }
});

// GET /api/tarifas/lugares (Público)
router.get('/lugares', async (req, res) => {
  try {
    const lugares = await dbLugares.find({});
    res.json(lugares.map(l => ({ ...l, _id: l.clave || l._id })));
  } catch (error) {
    console.error('Error al obtener lugares:', error);
    res.status(500).json({ message: 'Error interno al obtener lugares' });
  }
});

// GET /api/tarifas/hoteles/buscar?q=
router.get('/hoteles/buscar', async (req, res) => {
  try {
    const q = req.query.q || '';
    const [todosLugares, todosHoteles] = await Promise.all([
      dbLugares.find({}),
      dbHoteles.find({})
    ]);
    const resultados = buscarLugares(q, todosLugares, todosHoteles);
    res.json(resultados);
  } catch (error) {
    console.error('Error al buscar hoteles:', error);
    res.status(500).json({ message: 'Error interno al buscar hoteles' });
  }
});

// GET /api/tarifas/cotizar?origen=<zona|hotelId>&destino=<zona|hotelId>
router.get('/cotizar', async (req, res) => {
  try {
    const { origen, destino } = req.query;

    if (!origen || !destino) {
      return res.status(400).json({
        encontrado: false,
        motivo: 'Parámetros origen y destino son requeridos'
      });
    }

    const tarifarioActivo = await dbTarifarios.findOne({ activo: true });
    if (!tarifarioActivo) {
      return res.status(404).json({
        encontrado: false,
        motivo: 'No se encontró un tarifario activo en el sistema'
      });
    }

    const origenResuelto = await resolverZona(origen, tarifarioActivo);
    if (!origenResuelto) {
      return res.status(400).json({
        encontrado: false,
        motivo: `Origen no reconocido: ${origen}`
      });
    }

    const destinoResuelto = await resolverZona(destino, tarifarioActivo);
    if (!destinoResuelto) {
      return res.status(400).json({
        encontrado: false,
        motivo: `Destino no reconocido: ${destino}`
      });
    }

    const cotizacion = cotizar(origenResuelto.zona, destinoResuelto.zona, tarifarioActivo);

    res.json({
      ...cotizacion,
      detalleOrigen: origenResuelto,
      detalleDestino: destinoResuelto
    });
  } catch (error) {
    console.error('Error al cotizar traslado:', error);
    res.status(500).json({ message: 'Error interno al cotizar traslado' });
  }
});

// GET /api/tarifas/tours
router.get('/tours', async (req, res) => {
  try {
    let tours = await dbTours.find({});
    if (!tours || tours.length === 0) {
      const tarifarioActivo = await dbTarifarios.findOne({ activo: true });
      tours = tarifarioActivo?.tours || [];
    }
    res.json(tours);
  } catch (error) {
    console.error('Error al obtener tours:', error);
    res.status(500).json({ message: 'Error interno al obtener tours' });
  }
});

// GET /api/tarifas/extras
router.get('/extras', async (req, res) => {
  try {
    const tarifarioActivo = await dbTarifarios.findOne({ activo: true });
    res.json(tarifarioActivo?.extras || []);
  } catch (error) {
    console.error('Error al obtener extras:', error);
    res.status(500).json({ message: 'Error interno al obtener extras' });
  }
});

/* ==========================================================================
   ENDPOINTS ADMIN (REQUIEREN JWT Y ROL ADMIN)
   ========================================================================== */

// POST /api/tarifas/hoteles: Crear un nuevo hotel
router.post('/hoteles', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { nombre, alias, zona, ubicacion, km_carretera, estado, fuente, confianza } = req.body;

    if (!nombre || !zona) {
      return res.status(400).json({ message: 'Nombre y zona son campos requeridos' });
    }

    const nuevoHotel = {
      nombre: String(nombre).trim(),
      alias: Array.isArray(alias) ? alias : (alias ? [String(alias).trim()] : []),
      zona: String(zona).trim(),
      ubicacion: ubicacion ? String(ubicacion).trim() : '',
      km_carretera: km_carretera !== undefined ? km_carretera : null,
      estado: estado || 'abierto',
      fuente: fuente || 'admin',
      confianza: confianza || 'alta',
      createdAt: new Date().toISOString()
    };

    const doc = await dbHoteles.insert(nuevoHotel);
    res.status(201).json(doc);
  } catch (error) {
    console.error('Error al crear hotel:', error);
    res.status(500).json({ message: 'Error interno al crear hotel' });
  }
});

// PUT /api/tarifas/hoteles/:id: Actualizar un hotel existente
router.put('/hoteles/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { nombre, alias, zona, ubicacion, km_carretera, estado, fuente, confianza } = req.body;
    const updateData = {};

    if (nombre !== undefined) updateData.nombre = String(nombre).trim();
    if (alias !== undefined) updateData.alias = Array.isArray(alias) ? alias : [String(alias).trim()];
    if (zona !== undefined) updateData.zona = String(zona).trim();
    if (ubicacion !== undefined) updateData.ubicacion = String(ubicacion).trim();
    if (km_carretera !== undefined) updateData.km_carretera = km_carretera;
    if (estado !== undefined) updateData.estado = estado;
    if (fuente !== undefined) updateData.fuente = fuente;
    if (confianza !== undefined) updateData.confianza = confianza;
    updateData.updatedAt = new Date().toISOString();

    const numReplaced = await dbHoteles.update({ _id: req.params.id }, { $set: updateData });
    if (numReplaced === 0) {
      return res.status(404).json({ message: 'Hotel no encontrado' });
    }

    const hotelActualizado = await dbHoteles.findOne({ _id: req.params.id });
    res.json(hotelActualizado);
  } catch (error) {
    console.error('Error al actualizar hotel:', error);
    res.status(500).json({ message: 'Error interno al actualizar hotel' });
  }
});

// DELETE /api/tarifas/hoteles/:id: Eliminar un hotel
router.delete('/hoteles/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const numRemoved = await dbHoteles.remove({ _id: req.params.id }, {});
    if (numRemoved === 0) {
      return res.status(404).json({ message: 'Hotel no encontrado' });
    }
    res.json({ message: 'Hotel eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar hotel:', error);
    res.status(500).json({ message: 'Error interno al eliminar hotel' });
  }
});

// POST /api/tarifas/lugares: Crear un nuevo lugar (aeropuerto o centro)
router.post('/lugares', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { clave, nombre, tipo, zona, alias } = req.body;

    if (!clave || !nombre || !tipo || !zona) {
      return res.status(400).json({ message: 'clave, nombre, tipo y zona son campos requeridos' });
    }

    const tipoLower = String(tipo).trim().toLowerCase();
    if (!['aeropuerto', 'centro'].includes(tipoLower)) {
      return res.status(400).json({ message: "tipo debe ser 'aeropuerto' o 'centro'" });
    }

    const claveLimpia = String(clave).trim().toLowerCase();
    const existente = await dbLugares.findOne({
      $or: [{ clave: claveLimpia }, { _id: claveLimpia }]
    });
    if (existente) {
      return res.status(400).json({ message: `Ya existe un lugar con la clave: ${claveLimpia}` });
    }

    const nuevoLugar = {
      _id: claveLimpia,
      clave: claveLimpia,
      nombre: String(nombre).trim(),
      tipo: tipoLower,
      zona: String(zona).trim().toLowerCase(),
      alias: Array.isArray(alias) ? alias.map(a => String(a).trim()) : (alias ? [String(alias).trim()] : []),
      createdAt: new Date().toISOString()
    };

    const doc = await dbLugares.insert(nuevoLugar);
    res.status(201).json(doc);
  } catch (error) {
    console.error('Error al crear lugar:', error);
    res.status(500).json({ message: 'Error interno al crear lugar' });
  }
});

// PUT /api/tarifas/lugares/:id: Actualizar un lugar existente
router.put('/lugares/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const idParam = String(req.params.id).trim();
    const { clave, nombre, tipo, zona, alias } = req.body;
    const updateData = {};

    if (clave !== undefined) updateData.clave = String(clave).trim().toLowerCase();
    if (nombre !== undefined) updateData.nombre = String(nombre).trim();
    if (tipo !== undefined) {
      const tipoLower = String(tipo).trim().toLowerCase();
      if (!['aeropuerto', 'centro'].includes(tipoLower)) {
        return res.status(400).json({ message: "tipo debe ser 'aeropuerto' o 'centro'" });
      }
      updateData.tipo = tipoLower;
    }
    if (zona !== undefined) updateData.zona = String(zona).trim().toLowerCase();
    if (alias !== undefined) {
      updateData.alias = Array.isArray(alias) ? alias.map(a => String(a).trim()) : [String(alias).trim()];
    }
    updateData.updatedAt = new Date().toISOString();

    const numReplaced = await dbLugares.update(
      { $or: [{ _id: idParam }, { clave: idParam }, { clave: idParam.toLowerCase() }] },
      { $set: updateData }
    );
    if (numReplaced === 0) {
      return res.status(404).json({ message: 'Lugar no encontrado' });
    }

    const lugarActualizado = await dbLugares.findOne({
      $or: [{ _id: idParam }, { clave: idParam }, { clave: idParam.toLowerCase() }]
    });
    res.json({ ...lugarActualizado, _id: lugarActualizado.clave || lugarActualizado._id });
  } catch (error) {
    console.error('Error al actualizar lugar:', error);
    res.status(500).json({ message: 'Error interno al actualizar lugar' });
  }
});

// DELETE /api/tarifas/lugares/:id: Eliminar un lugar
router.delete('/lugares/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const idParam = String(req.params.id).trim();
    const numRemoved = await dbLugares.remove(
      { $or: [{ _id: idParam }, { clave: idParam }, { clave: idParam.toLowerCase() }] },
      {}
    );
    if (numRemoved === 0) {
      return res.status(404).json({ message: 'Lugar no encontrado' });
    }
    res.json({ message: 'Lugar eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar lugar:', error);
    res.status(500).json({ message: 'Error interno al eliminar lugar' });
  }
});

// PUT /api/tarifas/tarifario/precio: Actualizar precio de una fila en el tarifario activo
router.put('/tarifario/precio', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { tablaClave, destino, filaIndex, van, sprinter } = req.body;

    if (!tablaClave || (destino === undefined && filaIndex === undefined)) {
      return res.status(400).json({ message: 'tablaClave y (destino o filaIndex) son requeridos' });
    }

    const tarifario = await dbTarifarios.findOne({ activo: true });
    if (!tarifario) {
      return res.status(404).json({ message: 'No hay tarifario activo' });
    }

    const tabla = tarifario.tablas.find(t => t.clave === tablaClave);
    if (!tabla) {
      return res.status(404).json({ message: `Tabla ${tablaClave} no encontrada en tarifario` });
    }

    let fila = null;
    if (filaIndex !== undefined && tabla.filas[filaIndex]) {
      fila = tabla.filas[filaIndex];
    } else if (destino) {
      fila = tabla.filas.find(f => f.destinos?.some(d => d.toLowerCase() === String(destino).toLowerCase()));
    }

    if (!fila) {
      return res.status(404).json({ message: 'Fila de destino no encontrada en la tabla' });
    }

    if (van !== undefined) fila.van = Number(van);
    if (sprinter !== undefined) fila.sprinter = Number(sprinter);

    await dbTarifarios.update({ _id: tarifario._id }, { $set: { tablas: tarifario.tablas } });

    res.json({
      message: 'Precio actualizado correctamente',
      tabla: tabla.clave,
      fila
    });
  } catch (error) {
    console.error('Error al actualizar precio:', error);
    res.status(500).json({ message: 'Error interno al actualizar precio' });
  }
});

// POST /api/tarifas/tarifarios: Crear nuevo tarifario (nueva vigencia)
router.post('/tarifarios', verifyToken, requireAdmin, async (req, res) => {
  try {
    const nuevoTarifario = req.body;

    if (!nuevoTarifario || !nuevoTarifario.vigencia || !Array.isArray(nuevoTarifario.tablas)) {
      return res.status(400).json({ message: 'El tarifario requiere al menos vigencia y tablas' });
    }

    // Desactivar el tarifario activo anterior
    await dbTarifarios.update({ activo: true }, { $set: { activo: false } }, { multi: true });

    const docInsertar = {
      ...nuevoTarifario,
      activo: true,
      createdAt: new Date().toISOString()
    };

    const doc = await dbTarifarios.insert(docInsertar);
    res.status(201).json(doc);
  } catch (error) {
    console.error('Error al registrar nuevo tarifario:', error);
    res.status(500).json({ message: 'Error interno al registrar nuevo tarifario' });
  }
});

// GET /api/tarifas/tarifarios/historial: Consultar historial de tarifarios
router.get('/tarifarios/historial', verifyToken, requireAdmin, async (req, res) => {
  try {
    const historial = await dbTarifarios.find({}).sort({ createdAt: -1 });
    res.json(historial);
  } catch (error) {
    console.error('Error al obtener historial de tarifarios:', error);
    res.status(500).json({ message: 'Error interno al obtener historial' });
  }
});

export default router;
