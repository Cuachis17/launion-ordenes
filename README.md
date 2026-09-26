# La Union - Reservas

Aplicación web (PWA) para La Unión, transportación turística en Cancún. Bajo un mismo
armazón conviven **dos aplicaciones**, alternables desde un botón de menú (hamburguesa)
que abre un panel lateral:

1. **Órdenes de servicio** — reservas y vouchers de transportación (la app original).
2. **Comprobantes de venta** — el recibo que se entrega al pasajero (la app nueva).

No hay router: `src/App.tsx` guarda cuál app está activa en un estado (`appActiva`) y
muestra un bloque u otro. Añadir una tercera app se hace agregando un objeto al arreglo
`APPS` de `src/components/AppDrawer.tsx`.

Documentación ampliada:

- [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) — cómo está armado el proyecto, dónde
  vive cada dato y las reglas de negocio de comprobantes.
- [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md) — cómo correrlo en local, cómo compilarlo,
  la topología real de producción y las trampas ya conocidas.

## Stack

- **Front:** React 19 + TypeScript, Vite 7, Tailwind CSS 4, `vite-plugin-pwa`.
- **Back:** Express 5, `nedb-promises` (base de datos embebida en archivo, no
  Prisma ni MySQL), JWT (`jsonwebtoken`), `bcryptjs`, `multer` + `sharp` para avatares.
- PDF de comprobantes: `jsPDF`, generado en el cliente.

## Estructura del repo

```
launion-ordenes/
├── src/                  # Front (React + TS)
│   ├── components/       # 14 componentes (formularios, listas, modales, selectores)
│   ├── utils/            # Persistencia (cookies/localStorage) y generación de PDF
│   ├── types.ts          # Tipos de dominio: Order, Receipt, CompanyInfo
│   └── App.tsx           # Alterna entre las dos apps, sin router
├── server/               # API (Express 5)
│   ├── app.js            # Arranque, CORS, montaje de rutas
│   ├── routes.js         # Login, registro, usuarios, avatares
│   ├── middleware.js     # verifyToken (JWT) y resizeImage (sharp → webp)
│   └── db/users.db       # Base nedb: solo usuarios, nada de negocio
└── docs/
    ├── ARQUITECTURA.md
    └── DESPLIEGUE.md
```

## Dónde viven los datos

El servidor **solo** guarda usuarios y sus avatares. Todo lo demás vive en el navegador:

| Dato | Dónde | Archivo | Límite práctico |
|---|---|---|---|
| Órdenes de servicio | Cookie `union_orders` (30 días) | `src/utils/storage.ts` | ~8 registros antes de perder datos en silencio |
| Comprobantes de venta | `localStorage` (`union_receipts`) | `src/utils/receiptStorage.ts` | ~14 000 registros |
| Datos de la empresa (para el PDF) | Cookie `union_company` (365 días) | `src/utils/storage.ts` | — |
| Usuarios y avatares | `server/db/users.db` + `server/uploads/` | `server/routes.js` | — |

Detalle y motivo medido de estos límites en `docs/ARQUITECTURA.md`.

## Arrancar en local

Dos terminales: una para el servidor (`server/`, puerto 3021) y otra para el front
(raíz, Vite en `5173`). Comandos exactos, variables de entorno y diagnóstico en
[`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md).

```bash
# terminal 1
cd server && npm install && npm run dev

# terminal 2
npm install && npm run dev
```

## Scripts

| Comando (raíz) | Qué hace |
|---|---|
| `npm run dev` | Levanta Vite en modo desarrollo (`5173`) |
| `npm run build` | `tsc -b` + `vite build`, genera `dist/` |
| `npm run lint` | ESLint sobre todo el proyecto |
| `npm run preview` | Sirve `dist/` para probar el build localmente |

| Comando (`server/`) | Qué hace |
|---|---|
| `npm run dev` | `node --watch app.js` |

## Limitaciones conocidas

- Las **órdenes de servicio siguen guardándose en una cookie** (techo real de ~8
  registros codificados en ~4 KB). Es un riesgo de pérdida silenciosa de datos y está
  pendiente de migrar a un almacenamiento con más capacidad (ver `docs/ARQUITECTURA.md`).
- No hay endpoint público de registro: `/api/register` exige un JWT de un usuario con
  rol `admin` (`server/routes.js`). Un usuario nuevo solo puede darlo de alta otro ya
  autenticado como admin, no existe alta propia.
