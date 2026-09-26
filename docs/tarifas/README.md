# Módulo de Tarifas y Cotizador de Traslados

El módulo de tarifas (`server/tarifas/`) gestiona el tarifario de traslados, el catálogo de hoteles y zonas de Quintana Roo, tours y servicios adicionales para La Unión.

## Estructura del Módulo

- `db.js`: Datastores persistentes NeDB (`db/zonas.db`, `db/hoteles.db`, `db/lugares.db`, `db/tarifarios.db`, `db/tours.db`).
- `cotizar.js`: Lógica pura de cálculo de tarifas y resolución de asimetrías de rutas.
- `routes.js`: Router Express montado en `/api/tarifas`.
- `seed.js`: Script de inicialización de datos (`npm run seed:tarifas`).
- `cotizar.test.js`: Suite de pruebas unitarias (`npm test` en `server/`).

---

## 1. Cómo cambiar un precio de traslado

Existen dos maneras de actualizar un precio en el tarifario activo:

### Vía API (Recomendado para administradores)
Enviar una petición `PUT /api/tarifas/tarifario/precio` con un token JWT de usuario administrador:

```bash
curl -X PUT http://localhost:3000/api/tarifas/tarifario/precio \
  -H "Authorization: Bearer <TOKEN_ADMIN>" \
  -H "Content-Type: application/json" \
  -d '{
    "tablaClave": "desde_aeropuerto_cun",
    "destino": "playa_del_carmen",
    "van": 950,
    "sprinter": 1350
  }'
```

También es posible especificar `filaIndex` en lugar de `destino`.

### Vía Archivo Semilla (Para cambios globales o reinstalación)
1. Modificar `server/seed/tarifas.json` en la tabla correspondiente dentro del arreglo `tablas[].filas`.
2. Ejecutar la recarga forzada:
   ```bash
   npm run seed:tarifas -- --force
   ```

---

## 2. Cómo agregar un hotel

### Vía API (Recomendado)
Enviar una petición `POST /api/tarifas/hoteles` con token JWT de administrador:

```bash
curl -X POST http://localhost:3000/api/tarifas/hoteles \
  -H "Authorization: Bearer <TOKEN_ADMIN>" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Grand Hyatt Playa del Carmen Resort",
    "alias": ["Hyatt Playa", "Grand Hyatt PDC"],
    "zona": "playa_del_carmen",
    "ubicacion": "1a Avenida Esquina Calle 26, Playa del Carmen",
    "estado": "abierto",
    "confianza": "alta"
  }'
```

### Vía Archivo Semilla
1. Añadir el objeto hotel a `server/seed/hoteles.json`.
2. Ejecutar:
   ```bash
   npm run seed:tarifas -- --force
   ```

---

## 3. Cómo agregar un lugar (aeropuerto o centro)

Los lugares representan puntos de interés clave como aeropuertos y centros urbanos (por ejemplo, Aeropuerto Cancún, Playa del Carmen Centro, Tulum Centro).

### Vía API (Recomendado)
Enviar una petición `POST /api/tarifas/lugares` con token JWT de administrador:

```bash
curl -X POST http://localhost:3000/api/tarifas/lugares \
  -H "Authorization: Bearer <TOKEN_ADMIN>" \
  -H "Content-Type: application/json" \
  -d '{
    "clave": "estacion_tulum_tren",
    "nombre": "Estación Tren Maya Tulum",
    "tipo": "centro",
    "zona": "tulum_centro",
    "alias": ["tren maya tulum", "estacion tulum"]
  }'
```

Campos requeridos:
- `clave`: Identificador único (minúsculas, sin espacios ni caracteres especiales).
- `nombre`: Nombre legible del lugar.
- `tipo`: `'aeropuerto'` o `'centro'`.
- `zona`: Clave de la zona tarifaria a la que pertenece.
- `alias`: Arreglo de cadenas de texto alternativas para búsqueda.

Para editar o eliminar un lugar vía API:
```bash
# Actualizar
curl -X PUT http://localhost:3000/api/tarifas/lugares/estacion_tulum_tren \
  -H "Authorization: Bearer <TOKEN_ADMIN>" \
  -H "Content-Type: application/json" \
  -d '{ "nombre": "Estación Tren Maya Tulum Aeropuerto" }'

# Eliminar
curl -X DELETE http://localhost:3000/api/tarifas/lugares/estacion_tulum_tren \
  -H "Authorization: Bearer <TOKEN_ADMIN>"
```

### Vía Archivo Semilla
1. Añadir el objeto al arreglo en `server/seed/lugares.json`.
2. Ejecutar la recarga forzada:
   ```bash
   npm run seed:tarifas -- --force
   ```

---

## 4. Cómo cargar una nueva vigencia de tarifario

Al cargar un nuevo tarifario, el sistema automáticamente desactiva la vigencia anterior (`activo: false`) para conservar el historial completo de precios y auditoría.

### Vía API
Enviar el nuevo documento tarifario a `POST /api/tarifas/tarifarios`:

```bash
curl -X POST http://localhost:3000/api/tarifas/tarifarios \
  -H "Authorization: Bearer <TOKEN_ADMIN>" \
  -H "Content-Type: application/json" \
  -d '{
    "vigencia": "2026-12-31",
    "fuente": "TARIFARIO_UNION_2027.pdf",
    "notas": ["Tarifas sin casetas"],
    "unidades": [
      { "clave": "van", "nombre": "Van" },
      { "clave": "sprinter", "nombre": "Sprinter / Suburban" }
    ],
    "tablas": [ ... ],
    "tours": [ ... ],
    "extras": [ ... ]
  }'
```

Para consultar versiones y vigencias anteriores:
```bash
curl http://localhost:3000/api/tarifas/tarifarios/historial \
  -H "Authorization: Bearer <TOKEN_ADMIN>"
```

---

## 5. Endpoints de Consulta Pública

- `GET /api/tarifas/zonas`: Listado de zonas tarifarias.
- `GET /api/tarifas/lugares`: Listado público de lugares registrados (aeropuertos y centros urbanos con su clave, nombre, tipo, zona y alias).
- `GET /api/tarifas/hoteles/buscar?q=playa+centro`: Búsqueda tolerante en catálogo completo. Busca simultáneamente en lugares y hoteles. Los lugares aparecen **primero** en los resultados (`_id = clave`, e incluye `tipo: 'aeropuerto'|'centro'`).
- `GET /api/tarifas/cotizar?origen=aeropuerto_cun&destino=playa_centro`: Cotizador de traslados. Resuelve origen y destino en orden estricto de precedencia: **lugar por clave** → **zona por clave** → **hotel por _id**. Retorna `detalleOrigen` y `detalleDestino` con tipo `'aeropuerto'|'centro'|'hotel'|'zona'`.
- `GET /api/tarifas/tours`: Listado de paquetes de tours.
- `GET /api/tarifas/extras`: Servicios abiertos por hora y traslados foráneos adicionales.
