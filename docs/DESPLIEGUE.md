# Despliegue

## Topología en producción

Front y API viven en **dominios distintos**:

- **Front:** `https://launion.kcsolutions.dev` — estáticos (el contenido de `dist/`)
  servidos por **LiteSpeed** en Hostinger.
- **API:** `https://apiunion.kcsolutions.dev` — **nginx** hace `proxy_pass` a
  `http://127.0.0.1:3021`, donde corre el proceso Node (`server/app.js`), con
  certificado de Let's Encrypt gestionado por Certbot.

Al ser dominios distintos, toda petición del front al API es **entre-orígenes**: por
eso importan tanto `CORS_ORIGIN` en el servidor como que la cookie de sesión se emita
con los atributos correctos (ver trampa 1).

## Variables de entorno

### Front (raíz del repo, archivo `.env`)

| Variable | Local | Producción |
|---|---|---|
| `VITE_API_URL` | `https://apiunion.kcsolutions.dev` (o el valor que use tu API local) | `https://apiunion.kcsolutions.dev` |

`VITE_API_URL` se lee en cada componente que llama al API (`Login.tsx`,
`Register.tsx`, `Header.tsx`, `UserProfileModal.tsx`, `ChangePasswordModal.tsx`,
`App.tsx`, `utils/receiptPdf.ts`) vía `import.meta.env.VITE_API_URL`, y se incrusta
al compilar (ver trampa 3).

### Servidor (`server/.env`, no incluido en el repo — plantilla en `server/.env.example`)

| Variable | Local | Producción |
|---|---|---|
| `PORT` | 3021 | 3021 |
| `CORS_ORIGIN` | `http://localhost:5173,http://192.168.0.14:5173` | `https://launion.kcsolutions.dev` |
| `NODE_ENV` | `development` | `production` |
| `SECRET_KEY` | cadena larga aleatoria, distinta por entorno | ídem |
| `SALT_ROUNDS` | ej. `10` | ídem |
| `ADMIN_MAIL` / `ADMIN_PASS` | credenciales del admin que se crea si `users.db` está vacío | ídem |

**Nota:** `server/.env.example` trae `PORT=3000` de plantilla genérica; el valor real
usado en este proyecto, en local y en producción, es **3021** (así lo espera nginx en
producción). Al copiar el `.env.example`, cambiar el puerto a 3021.

## Levantar todo en local

Dos terminales:

```bash
# Terminal 1 — API
cd server
cp .env.example .env        # completar SECRET_KEY, ADMIN_MAIL, ADMIN_PASS, etc.
# editar .env: PORT=3021, NODE_ENV=development,
# CORS_ORIGIN=http://localhost:5173,http://192.168.0.14:5173
npm install
npm run dev                  # node --watch app.js
```

```bash
# Terminal 2 — Front
cd launion-ordenes
echo "VITE_API_URL=http://localhost:3021" > .env
npm install
npm run dev                  # Vite en http://localhost:5173
```

Para probar desde el teléfono en la misma red, usar la IP de la máquina
(`http://192.168.0.14:5173` en el ejemplo) en vez de `localhost`, y que esa IP esté
en `CORS_ORIGIN` del servidor (ver trampa 2).

## Compilar y desplegar

```bash
npm run build     # tsc -b && vite build → genera dist/
```

Subir el contenido de `dist/` al hosting del front (Hostinger/LiteSpeed), en la raíz
que sirve `launion.kcsolutions.dev`. El servidor (`server/`) se despliega aparte,
como proceso Node persistente (por ejemplo con `pm2` o un servicio systemd) detrás
del proxy de nginx en el puerto 3021; no hay script de build para el servidor, es
JavaScript plano (`server/app.js` como entrada).

## Trampas ya conocidas

1. **`NODE_ENV=production` sobre http rompe el login sin dar ningún error visible.**
   En `server/routes.js`, el login fija la cookie `launion` con
   `secure: isProduction` y `sameSite: isProduction ? 'none' : 'lax'`. Con
   `NODE_ENV=production` pero sirviendo por http (no https), el navegador descarta
   una cookie `Secure` sobre una conexión insegura. El `POST /api/login` responde
   `200` con el token en el body, pero la cookie nunca queda guardada, así que
   `GET /api/verify` (que `App.tsx` llama en `checkAuth()`) sigue devolviendo sin
   sesión y el botón de la cabecera sigue diciendo "Iniciar sesión" pese a que el
   login "funcionó". En local usar `NODE_ENV=development`; en producción, que ya
   sirve por HTTPS, `NODE_ENV=production`.

2. **Chromium trata `localhost` como contexto seguro, una IP de red no.** Un
   navegador basado en Chromium acepta cookies `Secure` sobre `http://localhost`
   aunque no haya TLS, pero las rechaza sobre `http://192.168.0.14:5173`. Por eso un
   problema de cookies puede no reproducirse probando desde `localhost` y sí aparecer
   en el teléfono. **Para probar login y sesión, hacerlo desde la IP de la red local,
   no desde `localhost`.**

3. **`VITE_API_URL` se incrusta al compilar, no se lee en tiempo de ejecución.** Si
   `npm run build` corre con esa variable vacía o sin definir, el front termina
   pidiéndose el API a sí mismo (a su propio origen, `launion.kcsolutions.dev`), que
   no tiene esas rutas y devuelve la página 404 en HTML de Hostinger/LiteSpeed.
   `res.json()` revienta al intentar parsear HTML como JSON, y la interfaz solo
   muestra "Error al iniciar sesión" sin más detalle. Para comprobar qué quedó
   incrustado en un build ya generado:

   ```bash
   grep -o "https://apiunion[^\"]*" dist/assets/*.js
   ```

   Si no aparece nada, el build se hizo sin `VITE_API_URL` y hay que recompilar.

4. **`node --watch app.js` no vigila el archivo `.env`.** Cambiar una variable en
   `server/.env` no reinicia el proceso solo: hay que parar y volver a correr
   `npm run dev` a mano para que `dotenv` la recargue.

5. **Sin `CORS_ORIGIN` definido, `server/app.js` deja la lista de orígenes permitidos
   vacía** (`corsOrigins = process.env.CORS_ORIGIN ? [...] : []`), y el navegador
   bloquea todas las peticiones del front por CORS, incluso si el propio dominio
   parece correcto a simple vista.

6. **El login acepta usuario o teléfono indistintamente.** `Login.tsx` manda el mismo
   valor que el usuario escribió como `username` y como `phone` en el mismo
   `POST /api/login`; el servidor busca por cualquiera de los dos
   (`server/routes.js`). No es necesario distinguir si la persona escribió su correo
   o su teléfono.

## Diagnóstico rápido

```bash
# ¿El API está vivo?
curl -i https://apiunion.kcsolutions.dev/api/verify
# Sin cookie ni token debe responder 401, no un timeout ni un 502.

# ¿CORS responde para el origen del front?
curl -i -X OPTIONS https://apiunion.kcsolutions.dev/api/login \
  -H "Origin: https://launion.kcsolutions.dev" \
  -H "Access-Control-Request-Method: POST"
# Buscar Access-Control-Allow-Origin: https://launion.kcsolutions.dev en la respuesta.

# ¿El bundle ya compilado apunta al dominio correcto?
grep -o "https://apiunion[^\"]*" dist/assets/*.js

# ¿El login realmente deja cookie de sesión?
curl -i -c - https://apiunion.kcsolutions.dev/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"<correo-o-telefono>","phone":"<correo-o-telefono>","password":"<password>"}'
# Revisar en la salida que aparezca Set-Cookie: launion=... con Secure y SameSite=None.
```

## Limitaciones conocidas

- No hay script de build ni de despliegue automatizado para `server/`: es Node plano,
  se sube y se corre manualmente (o con el gestor de procesos que ya esté en el VPS).
- `server/.env.example` no está actualizado al puerto real (trae `3000`, se usa
  `3021`); revisar antes de copiarlo.
- No hay `.env.example` en la raíz del repo para el front; la única variable
  necesaria es `VITE_API_URL`.
