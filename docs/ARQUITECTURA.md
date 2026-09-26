# Arquitectura

## Visión general

El repo contiene dos aplicaciones front-end independientes que comparten un mismo
armazón (cabecera, menú, sesión) y un backend mínimo que solo resuelve autenticación.

```
┌─────────────────────────────────────────────┐
│  src/App.tsx  (sin router)                   │
│  estado appActiva: 'ordenes' | 'comprobantes'│
├───────────────────────┬───────────────────────┤
│ Órdenes de servicio   │ Comprobantes de venta │
│ ReservationForm       │ ReceiptForm           │
│ ReservationList       │ ReceiptList           │
│ EditReservationModal  │ EditReceiptModal      │
│ → cookie union_orders │ → localStorage        │
│                       │   union_receipts      │
└───────────────────────┴───────────────────────┘
                   │
                   │ fetch directo a VITE_API_URL
                   ▼
         server/ (Express 5 + nedb)
         solo usuarios + avatares
```

No existe react-router ni ningún otro enrutador. `App.tsx` decide qué bloque de JSX
mostrar según el estado `appActiva` (`'ordenes'` o `'comprobantes'`, tipo `AppId` en
`src/components/AppDrawer.tsx`). El botón hamburguesa de `Header.tsx` abre
`AppDrawer`, un panel lateral que lista las apps disponibles y llama a
`onElegir(id)` para cambiar el estado.

**Para añadir una tercera app:** agregar un objeto al arreglo `APPS` en
`src/components/AppDrawer.tsx` (id, nombre, descripción, ícono), extender el tipo
`AppId`, y añadir en `App.tsx` el bloque `{appActiva === 'nueva-app' && (...)}` con su
propio formulario/lista.

## Componentes (`src/components/`)

Hay **13** componentes (no 14):

| Componente | Rol |
|---|---|
| `AppDrawer.tsx` | Panel lateral para cambiar entre apps; define `APPS` y el tipo `AppId` |
| `Header.tsx` | Cabecera compacta: contador, avatar/login, botón de menú |
| `ReservationForm.tsx` / `ReservationList.tsx` | Alta y listado de órdenes de servicio |
| `EditReservationModal.tsx` | Edición de una orden existente |
| `ReceiptForm.tsx` / `ReceiptList.tsx` | Alta y listado de comprobantes de venta |
| `EditReceiptModal.tsx` | Edición y duplicado de un comprobante |
| `CampoFecha.tsx` | Selector de fecha propio |
| `CampoHora.tsx` | Selector de hora propio, siempre en 24 h |
| `Login.tsx` / `Register.tsx` | Inicio de sesión y alta de usuarios |
| `UserProfileModal.tsx` | Perfil del usuario: avatar, datos, logout |
| `ChangePasswordModal.tsx` | Cambio de contraseña |

## Utilidades (`src/utils/`)

| Archivo | Rol |
|---|---|
| `storage.ts` | Persistencia de órdenes y datos de empresa en **cookies** (`js-cookie`) |
| `receiptStorage.ts` | Persistencia de comprobantes en **localStorage**, y `formatMoney()` |
| `pdf.ts` | Generación del PDF de una orden de servicio (jsPDF) |
| `receiptPdf.ts` | Generación, descarga y envío del PDF de un comprobante (jsPDF) |

## Dónde viven los datos, y por qué

El servidor (`server/`) es deliberadamente delgado: **solo** persiste usuarios
(`server/db/users.db`, una base nedb en archivo) y sus avatares (`server/uploads/`).
Ningún dato de negocio (órdenes, comprobantes) toca el servidor.

- **Órdenes de servicio → cookie `union_orders`** (`src/utils/storage.ts`, vía
  `js-cookie`, expira en 30 días).
- **Comprobantes de venta → `localStorage`, clave `union_receipts`**
  (`src/utils/receiptStorage.ts`).
- **Datos de la empresa (para el membrete del PDF) → cookie `union_company`**
  (365 días).

### El techo de las cookies es un riesgo real

Una cookie tiene un tope práctico de ~4 KB. Un comprobante ocupa ~565 bytes ya
codificado en JSON, así que **caben unos 7** antes de que el navegador empiece a
descartar datos sin avisar. Una orden de servicio ocupa ~501 bytes, así que **caben
unas 8**. `localStorage` (~5 MB en la mayoría de navegadores) aguanta del orden de
14 000 registros del mismo tamaño.

Por eso los comprobantes se guardaron en `localStorage` desde el principio. **Las
órdenes de servicio, en cambio, siguen en cookie** — es la app original y no se ha
migrado. Esto es una limitación conocida y pendiente, no una decisión de diseño: el
techo de ~8 órdenes es un riesgo real de pérdida silenciosa de datos y debería
migrarse a `localStorage` (o a un backend) antes de que el volumen de reservas lo
alcance.

**Inconsistencia encontrada en el código, sin corregir.** `src/App.tsx:115`
(`handleAddReservation`) recorta la lista a `.slice(0, 10)`: el propio código asume
que caben diez órdenes. La medición dice otra cosa, con una orden típica de Cancún
(hotel, proveedor, vuelo y una nota breve):

| Órdenes | Tamaño codificado | ¿Cabe en la cookie? |
|---|---|---|
| 8 | 3 987 bytes | Sí |
| 9 | 4 485 bytes | **No** |
| 10 | 4 983 bytes | **No** |

El límite de una cookie es de ~4 096 bytes. A partir de la **novena** orden el
navegador **descarta la escritura entera y en silencio**: `Cookies.set` no lanza
ningún error, la interfaz sigue mostrando las diez, pero la cookie conserva su
contenido anterior. Al recargar, las órdenes recientes desaparecen.

No se pierde una orden: se pierden **todas las nuevas desde la última escritura que
sí cupo**. Es el defecto más serio que queda vivo en el proyecto, y la migración de
las órdenes a `localStorage` —donde caben del orden de 14 000— es lo primero que
habría que hacer.

## Qué exige sesión y qué no (decisión deliberada)

| Acción | ¿Necesita sesión? |
|---|---|
| Emitir un comprobante | Sí |
| Editar o duplicar | Sí |
| **Eliminar** | **No** |
| Reenviar o descargar uno ya emitido | No |

**Que se pueda eliminar sin sesión no es un descuido: es intencional.** Los
comprobantes viven en el navegador del usuario y son su trabajo, no de la cuenta.
La sesión gobierna la **emisión**, porque el documento lleva el logo del usuario y
queda a su nombre; no gobierna la propiedad de lo ya hecho. Si alguien deja de
pagar el servicio, pierde la cuenta, no su historial de comprobantes.

**Por qué eliminar no y editar sí**, que parece contradictorio y no lo es: un
comprobante ya circuló con el pasajero. Descartarlo del historial propio es
administrar lo tuyo; cambiarle el monto, la fecha o el nombre después de haberlo
entregado es **rehacer un documento que alguien ya tiene en la mano**, y eso debe
quedar a nombre de quien lo hace. Por eso se puede borrar sin sesión pero no
enmendar.

Una auditoría marcó lo de eliminar como fallo de seguridad. **No lo es, y no debe
"corregirse"** sin hablarlo antes con el dueño del producto.

## Autenticación

- Login: `POST /api/login` con `username`/`phone` (el front manda el mismo valor
  ingresado como ambos campos — `src/components/Login.tsx` — así se puede entrar
  con teléfono o correo indistintamente) y `password`. Devuelve un JWT que además se
  fija como cookie `launion`.
- La cookie `launion` se crea con `httpOnly: false` (el front puede leerla si hace
  falta) y con `secure`/`sameSite` que dependen de `NODE_ENV` (ver
  `docs/DESPLIEGUE.md`, es la fuente más común de fallos de login).
- `server/middleware.js` (`verifyToken`) acepta el token por header
  `Authorization: Bearer <token>` o, si no viene, por la cookie `launion`.
- **No existe alta pública de usuarios.** `POST /api/register` exige `verifyToken` y
  `role === 'admin'` (`server/routes.js`). Solo un admin ya autenticado puede crear
  usuarios nuevos, incluido el primer usuario extra (el admin inicial se crea solo,
  ver más abajo).
- El primer arranque del servidor, si `users.db` está vacío, crea un usuario admin con
  `ADMIN_MAIL`/`ADMIN_PASS` del `.env` (`server/routes.js`, al cargar el módulo).

## Reglas de negocio de comprobantes de venta

Tipo `Receipt` en `src/types.ts`. Campos: voucher (opcional), pasajero, tipo de
servicio, pax, origen (`pickup`), destino (`dropoff`), fecha, hora (24 h), vuelo
(solo si el servicio lo requiere), moneda, monto total y anticipo pagado (`paid`).

- **El saldo nunca se guarda, se calcula:** `pendingAmount()` en `src/types.ts` hace
  `Math.max(0, total - paid)`. Así no puede haber una cifra guardada que no cuadre
  con el total si alguno de los dos se edita después.
- **Voucher opcional:** si se deja vacío al capturar, `siguienteVoucher()` (también en
  `types.ts`) busca el número más alto entre los vouchers existentes y asigna el
  siguiente de la serie `VCH-00001`, `VCH-00002`, etc. (`App.tsx`,
  `handleAddReceipt`).
- **Tres tipos de servicio** (`ServiceKind`): `'llegada'`, `'salida'`, `'hotel'` (hotel
  a hotel). `ETIQUETAS_SERVICIO` trae la etiqueta visible de cada uno y
  `requiereVuelo(servicio)` es `true` solo para `'llegada'` — el campo de vuelo del
  formulario aparece únicamente en ese caso.
- **Emitir, editar y duplicar exigen sesión iniciada.** Sin usuario (`user` es
  `null`), `App.tsx` muestra `SesionRequerida` en vez del formulario, y en
  `ReceiptList` los botones de editar/duplicar no se pasan (quedan `undefined`).
  Reenviar (`Enviar`, vía `navigator.share`) o descargar el PDF de un comprobante ya
  emitido **no** requieren sesión — están siempre disponibles en `ReceiptList.tsx`.
- **Nunca se muestra la palabra "depósito faltante" en la interfaz.** El texto es
  siempre *"Saldo a pagar al abordar"* (`ReceiptForm.tsx`, `EditReceiptModal.tsx`, y
  el propio PDF en `receiptPdf.ts`: *"El saldo pendiente, si lo hubiera, se liquida
  directamente con el operador al abordar la unidad."*). Es una regla de negocio, no
  una preferencia de redacción: al pasajero "depósito" le suena a fianza reembolsable
  y genera reclamos en destino cuando se le cobra el resto.
- **El logo principal del PDF es el avatar de la sesión que lo emite**
  (`receiptPdf.ts`, función `logoDelUsuario`): se descarga desde
  `/api/users/:id/avatar` y se convierte a data URI porque jsPDF necesita los bytes,
  no una URL. La Unión queda como sello secundario al pie del documento. Si no hay
  sesión, no hay avatar, o falla la descarga (servidor caído, etc.), el PDF cae al
  logo de La Unión como principal — el comprobante siempre se genera, nunca se
  bloquea por esto.
- **Enviar usa `navigator.share`** con el PDF como archivo adjunto (pensado para
  mandarlo por WhatsApp desde el teléfono). Si el navegador no soporta compartir
  archivos (`navigator.canShare({ files: [...] })` es `false` o la API no existe), el
  botón descarga el PDF en su lugar (`src/utils/receiptPdf.ts`).

## Selectores de fecha y hora propios

`CampoFecha.tsx` y `CampoHora.tsx` reemplazan a los `<input type="date">` y
`<input type="time">` nativos. Motivo (comentado en `CampoHora.tsx`): el
`<input type="time">` nativo pinta 12 h o 24 h según el idioma configurado en el
propio teléfono, y **eso no se puede forzar desde el código**. Confundir 04:00 con
16:00 en un traslado al aeropuerto le cuesta el vuelo al pasajero, así que se optó
por un selector propio, siempre en 24 h, con atajos frecuentes (`ACCESOS_RAPIDOS`:
04:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00).

## Diseño para móvil

El uso principal es desde el teléfono. `App.tsx` define `panelMovil` (`'form'` o
`'lista'`) y el componente interno `PestanasMovil` alterna entre el formulario y la
lista con pestañas por debajo del breakpoint `lg` de Tailwind; a partir de `lg` ambos
paneles se muestran uno al lado del otro y las pestañas desaparecen. La cabecera
(`Header.tsx`) se mantiene compacta y el formulario de comprobantes está pensado para
caber casi entero en una pantalla de teléfono sin scroll.
