<!-- Arquitectura comprobada en código: navegación, persistencia y límites del proyecto. -->
# Arquitectura

## Navegación y componentes

React 19, TypeScript, Vite y Tailwind 4. No hay router: `src/App.tsx` mantiene
la composición de paneles y modales. `src/components/apps.tsx` define `AppId` y
`APPS`: órdenes, comprobantes, cotizador y usuarios. `AppDrawer.tsx` filtra Usuarios
por `user.role === 'admin'`. `useAppNavigation.ts` vuelve a órdenes al perder ese rol.

| Archivo en `src/` | Responsabilidad |
|---|---|
| `hooks/useAppData.ts` | Persistencia local, altas, edición y duplicado |
| `hooks/useSession.ts` | Verificar cookie al iniciar, volver a la ventana y cada 60 segundos |
| `hooks/useAppNavigation.ts` | Aplicación activa y pestaña móvil |
| `hooks/useAvisoCreado.ts` | Aviso de alta y reloj pausado durante interacción |
| `hooks/useEnfocarCreado.ts` | Scroll, foco y resaltado temporal de la tarjeta creada |
| `components/AvisoCreado.tsx` | Confirmación accesible con Ver, PDF y cierre |
| `utils/accionesPdf.ts` | PDF de orden: formato 1 sin sesión y formato 2 con sesión |
| `hooks/useUsuariosAdmin.ts` | Carga, reintento y estado optimista con reversión por fila |
| `hooks/useFormularioComprobante.ts` | Estado y validación comunes de comprobantes |
| `components/OperationalPanels.tsx` | Captura y listas de órdenes y comprobantes |
| `components/PanelHelpers.tsx` | Pestañas móviles y aviso de sesión requerida |
| `components/CompanyEditor.tsx` / `PwaInstall.tsx` | Configuración del PDF e instalación PWA |
| `components/admin/PanelUsuarios.tsx` | Buscar nombre/teléfono y contar estados |
| `components/admin/FilaUsuario.tsx` | Interruptor accesible y confirmación de suspensión |
| `components/SelectorServicio.tsx` | Llegada, Salida, InterHotel, Tour y Otro para órdenes |
| `components/CamposComprobante.tsx` | Campos compartidos para crear y editar recibos |
| `components/CampoFormulario.tsx` | Campo reutilizable con etiqueta |
| `CampoFecha.tsx` / `CampoHora.tsx` | Fecha y hora de órdenes y comprobantes (24 h) |
| `components/CotizadorTraslados.tsx` | Cotizador independiente |
| `components/Header.tsx` / `UserProfileModal.tsx` | Cabecera y perfil |
| `components/Login.tsx` / `Register.tsx` / `ChangePasswordModal.tsx` | Acceso y cuentas |

`ReservationForm`, `ReservationList` y `EditReservationModal` gestionan órdenes.
Tanto `ReservationForm` como `EditReservationModal` usan `CampoFecha` y `CampoHora`
compartidos con Comprobantes. No usar inputs nativos `date`/`time`: en iPhone se
desbordan. `CampoFecha` acepta `minimo` (ISO); al crear una orden bloquea días
anteriores. `fechaISO()` en `src/utils/fechaOrden.ts` calcula hoy en hora local;
usar UTC adelantaba el día después de las 19:00 en Cancún. Al guardar, las órdenes
conservan el formato habitual de fecha y hora; `formatDateDisplay` y `parseToIso`
adaptan la fecha entre el selector y el formato histórico.
`ReceiptForm`, `ReceiptList` y `EditReceiptModal` gestionan comprobantes.
`ReceiptCard.tsx` presenta comprobantes con Enviar y acciones de icono para editar,
duplicar, descargar y eliminar; `ReceiptIcons.tsx` contiene sus iconos SVG.
Para añadir una app se amplían `AppId`, `APPS` y su render en `App.tsx`.

`e2e/orden-fecha.spec.ts` comprueba los selectores en móvil 360/390, el formato
persistido y el día local a las 21:00 en Cancún. No reescribir `CampoFecha` ni
`CampoHora`: órdenes y comprobantes usan los mismos selectores.

## Persistencia y límites

`src/utils/storage.ts` usa `js-cookie`: `union_orders` expira en 30 días y
`union_company` en 365. `useAppData.ts` conserva las diez órdenes más recientes.
La escritura de cookies no comprueba si el navegador aceptó el valor: textos largos
pueden superar la capacidad de almacenamiento. No hay una medición reproducible en
el repo que permita afirmar cuántas órdenes caben.

`src/utils/receiptStorage.ts` guarda comprobantes en `localStorage`, clave
`union_receipts`. La lectura recupera un arreglo o devuelve vacío; la escritura
retorna `false` si hay un error. Las órdenes y comprobantes no se persisten en el servidor.
El backend sí conserva usuarios y tarifas; los avatares se guardan como archivos.

## Servicio Otro

En órdenes, `SelectorServicio` guarda el texto libre en `Order.service`; texto
vacío o espacios se normalizan a `Otro` al guardar. La edición de un valor que no
pertenece a las cuatro opciones abre Otro y conserva su texto.

En comprobantes, `ServiceKind` permite `llegada`, `salida`, `hotel` y `otro`.
`Receipt.serviceOther` es opcional. `etiquetaServicio()` devuelve ese texto si existe
para Otro; de lo contrario usa `ETIQUETAS_SERVICIO`. Lo comparten formulario, edición,
lista y PDF. `requiereVuelo()` solo exige vuelo en llegada; cambiar de servicio borra
el vuelo al guardar y limpia `serviceOther` si ya no corresponde a Otro.

El saldo se calcula con `pendingAmount()`, nunca se guarda. El voucher vacío en un
alta normal recibe el siguiente folio de `siguienteVoucher()`. La moneda es MXN o USD.

## Sesión y administración

Crear, editar y duplicar comprobantes exige una sesión. Descargar, reenviar y borrar
comprobantes existentes permanecen disponibles sin sesión. Las órdenes siguen siendo
públicas. La base API de los hooks nuevos y Login es `VITE_API_URL ?? ''`: la cadena
vacía usa el mismo origen; las peticiones incluyen `credentials: 'include'`.

`PanelUsuarios` cuenta activos y suspendidos sobre todos los registros y busca por
nombre o teléfono. La propia cuenta se marca Tú sin interruptor. Suspender requiere
confirmación en línea; activar es inmediato. Un error revierte solo la fila afectada.
Los 403 del panel revalidan la sesión. `useSession` detecta `403 {code: 'INACTIVE'}`
y conserva el banner de suspensión hasta una verificación exitosa; Login explica
cualquier 403 como cuenta suspendida. Esto no bloquea la captura de órdenes.

## Autenticación

- Login: `POST /api/login` con `username`/`phone` (el front manda el mismo valor
  ingresado como ambos campos — `src/components/Login.tsx` — así se puede entrar
  con teléfono o correo indistintamente) y `password`. Devuelve un JWT que además se
  fija como cookie `launion`.
- La cookie `launion` se crea con `httpOnly: false` (el front puede leerla si hace
  falta) y con `secure`/`sameSite` que dependen de `NODE_ENV` (ver
  `docs/DESPLIEGUE.md`, es la fuente más común de fallos de login).
- `server/middleware.js`:
  - `verifyToken`: valida firma y vigencia del JWT provisto por header `Authorization: Bearer
<token>` o cookie `launion`.
  - `requireActive`: verifica en la base de datos que el usuario exista y tenga `status ===
'active'`. Si está inactivo o dado de baja, expira de inmediato la cookie `launion` y responde
HTTP 403 con `{ message: 'Cuenta desactivada', code: 'INACTIVE' }`, impidiendo que el JWT siga
funcionando durante su vigencia de 24 horas.
  - `requireAdmin`: valida que el rol del usuario sea estrictamente `'admin'` consultando
directamente el registro en la base de datos (no del token).
- **No existe alta pública de usuarios.** `POST /api/register` exige `verifyToken`,
`requireActive` y `requireAdmin` (`server/routes.js`). Solo un admin ya autenticado y activo puede
crear usuarios nuevos.
- El primer arranque del servidor, si `users.db` está vacío, crea un usuario admin con
`ADMIN_MAIL`/`ADMIN_PASS` del `.env` (`server/users/db.js`).

### Endpoints de Administración (`/api/admin`)

Montados desde `server/users/adminRoutes.js` y protegidos por la terna `verifyToken +
requireActive + requireAdmin`:

- `GET /api/admin/users`: lista de todos los usuarios sin contraseñas (`_id`, `username`, `phone`,
`role`, `status`, `createdAt`, `avatar`).
- `PATCH /api/admin/users/:id/status`: activa o desactiva una cuenta (`{ status: 'active' |
'inactive' }`). Retorna 400 si el valor es inválido, 404 si no existe y 409 Conflict si un
administrador intenta desactivar su propia cuenta.

### Endpoints de Usuarios (`/api/users`)

Montados desde `server/users/userRoutes.js`:

- `POST /api/users/change-password`: cambio de contraseña del usuario activo autenticado
(`verifyToken + requireActive`).
- `GET /api/users`: lista general de usuarios, restringida exclusivamente a administradores
(`verifyToken + requireActive + requireAdmin`).
- `GET /api/users/:id`: consulta de usuario individual (`verifyToken + requireActive`).
- `GET /api/users/:id/avatar`: entrega el archivo de avatar. Endpoint público para inserción de
imágenes en PDFs y comprobantes.
- `PUT /api/users/:id`: edición de datos (`verifyToken + requireActive`). Solo permitido para el
propio usuario o administradores. Los campos `status` y `role` son ignorados aquí (solo alterables
mediante la ruta de admin).
- `DELETE /api/users/:id`: eliminación de cuentas, restringido exclusivamente a administradores
(`verifyToken + requireActive + requireAdmin`).

## PDF y diseño móvil

`src/utils/pdf.ts` reexporta `pdfFormato1.ts` (orden sin sesión) y `pdfFormato2.ts`
(orden con sesión). `pdfBloques.ts` dibuja cajas y calcula alturas; `pdfNotas.ts`
divide notas largas, añade página y titula la segunda «NOTAS IMPORTANTES
(continuación)». `pdfTexto.ts`: `textoSeguro` normaliza caracteres a WinAnsi, quita
emojis y colapsa espacios; `textoEnCaja` envuelve texto, limita líneas si se pide
y devuelve la altura usada. jsPDF con fuente Helvetica usa WinAnsi: emojis y ✓
pueden salir como basura. No fijar coordenadas Y para valores de texto libre;
usar alturas calculadas para evitar solapamientos.

`receiptPdf.ts` construye, descarga o comparte el comprobante; `receiptPdfPartes.ts`
dibuja encabezado y pie, y `receiptPdfLogo.ts` recupera el avatar con fallback al
logo de La Unión. `imagenPngParaPdf` en `pdfTexto.ts` convierte imágenes a PNG con
canvas, preserva transparencia y limita el lado mayor a 512 px. Los avatares se
guardan en WebP; jsPDF no soporta ese formato y su conversión interna a JPEG volvía
negro el fondo transparente. `cargarImagenPdf` (formatos 1 y 2) y `logoDelUsuario`
(comprobante) usan el helper. En encabezado, el voucher largo reduce su fuente y
estrecha el bloque izquierdo. Compartir usa `navigator.share` si acepta archivos;
si no, descarga el PDF. También descarga si compartir falla; cancelar (`AbortError`)
no descarga.

Las pruebas están repartidas: `e2e/pdf.spec.ts` cubre casos normales;
`e2e/pdf-max.spec.ts` prueba datos máximos y exige 2 páginas con notas largas;
`e2e/pdf-logo.spec.ts` comprueba que la esquina de un logo WebP transparente no sea
negra. Comparten `e2e/helpers/pdfRender.ts` (descarga, render y captura) y
`e2e/helpers/pdfDatos.ts` (datos de prueba).

`OperationalPanels` alterna formulario/lista mediante `PanelHelpers` por debajo de
`lg`; en escritorio muestra ambos. Los hijos de los grids tienen `min-w-0`.
`src/index.css` importa los tokens de `src/styles/theme.css`; los componentes nuevos
usan sus colores semánticos. Los interruptores y acciones del panel admin miden al
menos 44 px. Las confirmaciones y errores se muestran dentro del panel.

## Aviso después de crear

`OperationalPanels` muestra `AvisoCreado` tras el alta: «✓ Orden creada» o
«✓ Comprobante emitido». El mensaje usa `role="status"` y `aria-live="polite"`.
Ver vuelve a la aplicación del registro; en móvil abre su pestaña Lista y en escritorio
conserva los dos paneles. Localiza `orden-{id}` o `comprobante-{id}` tras dos frames,
hace scroll y da foco a la tarjeta. `data-recien-creado="true"` aplica
un contorno durante dos segundos. El movimiento reducido elimina el scroll suave
y la animación de entrada; `avisoCreado.css` posiciona el aviso sobre la zona segura.

El alta de comprobantes guarda primero en `localStorage`: si falla, mantiene el
formulario, muestra el aviso nativo de almacenamiento y no añade tarjeta ni toast.
Ver limpia los filtros del historial para revelar el registro aunque otra búsqueda
lo ocultara. El aviso dura ocho segundos; su reloj conserva el tiempo restante mientras
recibe foco, puntero, contacto táctil o prepara el PDF. Ver conserva el aviso y Cerrar lo
retira. PDF reutiliza `accionesPdf` para órdenes y `shareReceiptPdf` para comprobantes;
si falla, muestra un error recuperable dentro del aviso. `e2e/aviso.spec.ts` cubre
creación, Ver y descarga en móvil 390 y escritorio 1280; desactiva la API nativa
para comprobar el fallback de compartir sin abrir diálogos del sistema operativo.

## Verificación y pendientes comprobados

Desde la raíz: `npx tsc -b`, `npx eslint <archivos tocados>`, `npm run build`,
`npx playwright test e2e/pdf.spec.ts`, `npx playwright test e2e/admin.spec.ts` y
`npx playwright test e2e/aviso.spec.ts --project=movil-390 --project=escritorio-1280`.
La configuración Playwright usa puerto 5175 y proyectos móvil 360/390 y escritorio.
Los servidores persistentes deben iniciarse en Terminal.app según las reglas del equipo.

- `src/hooks/useAppData.ts:64`: duplicar deja `voucher` vacío y guardar la edición no
  asigna `siguienteVoucher`; ese camino puede guardar un comprobante sin folio.
- `src/hooks/useAppData.ts:74`: guardar edición o borrar ignora el retorno de
  `saveReceipts`; un fallo de almacenamiento no muestra aviso en esos caminos.
- `index.html:9`: enlaza `/src/style.css`, que no existe; el build emite un aviso.
- `src/utils/storage.ts:18`: no verifica la escritura de cookies. No se migró persistencia.
