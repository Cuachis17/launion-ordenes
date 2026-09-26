# Hallazgos pendientes — app de comprobantes

Auditoría del 30 de agosto de 2026 sobre el frente de comprobantes. Tres
revisiones independientes y sin solapamiento: una leyendo el código, otra sobre
oficio y salud del build, y otra ejecutando la app y maltratándola.

**Nada de esto está corregido, y es una decisión consciente.** El usuario revisó
el inventario y prefirió dejarlo anotado. No son sorpresas: son deuda conocida.

---

## Aceptado como correcto, no tocar

**Eliminar un comprobante no exige sesión.** Marcado por la auditoría como fallo
de seguridad. **No lo es.** Ver el porqué en `ARQUITECTURA.md`, sección "Qué exige
sesión y qué no". Editar sí la exige, y la asimetría es deliberada.

---

## Graves

| # | Dónde | Qué pasa |
|---|---|---|
| 1 | `src/App.tsx:179` | **Duplicar y guardar sin folio deja el voucher vacío.** `handleAddReceipt` autogenera el folio si va vacío; `handleSaveEditedReceipt` —que usan Editar y Duplicar— no. El comprobante queda sin número que darle al pasajero, y como el voucher ya no es obligatorio, nada avisa. |
| 2 | `ReceiptForm.tsx:16` | **Se aceptan folios duplicados.** `validateReceiptFields` no compara contra los existentes. Dos comprobantes con el mismo folio son indistinguibles cuando alguien reclama por teléfono. |
| 3 | `src/App.tsx:183,190` | **Pérdida silenciosa al editar y borrar.** Solo `handleAddReceipt` comprueba el retorno de `saveReceipts`. Con el almacenamiento lleno o en navegación privada, el cambio se ve en pantalla pero no se guarda; se descubre al recargar. |
| 4 | `src/types.ts:66` | **Un folio manual con números rompe la serie.** `siguienteVoucher` toma cualquier dígito final: con `FOLIO-2026` capturado a mano, el siguiente automático sale `VCH-02027`. |
| 5 | `ReceiptForm.tsx:35` | **Montos negativos pasan la validación.** Solo se comprueba `pagado > total`. Con total 1 000 000 000 y anticipo −500, el saldo sale mayor que el total y el PDF se emite igual. |
| 6 | `ReceiptForm.tsx:166` | **Pax en 0: el botón no reacciona y no se explica.** El `min={1}` nativo bloquea el envío antes de que React lo vea; no hay validación propia. En teléfono no aparece ni el aviso del navegador: el usuario toca "Generar" y no pasa nada. |
| 7 | `receiptPdf.ts:197` | **"Hotel a hotel" se comparte como "Salida".** El PDF usa `ETIQUETAS_SERVICIO` y está bien; el texto que acompaña al archivo al compartirlo solo contempla dos servicios. |

## Medios

| # | Dónde | Qué pasa |
|---|---|---|
| 8 | `Header.tsx:6` | **El avatar se redescarga en cada render.** `Date.now()` se calcula en el cuerpo del componente, así que la URL cambia en cada repintado. Tráfico constante contra el servidor. |
| 9 | `receiptStorage.ts:13` | **No se valida la forma de cada registro** al cargar, solo que sea un arreglo. Un registro parcial se pinta en blanco en la lista. |
| 10 | `CampoFecha` / `CampoHora` | **Los dos paneles se abren a la vez** y se superponen. |
| 11 | `CampoHora.tsx:38` | **Elegir solo el minuto fija la hora en 00** sin avisar, y la resalta como si se hubiera elegido. Relevante porque confundir la hora le cuesta el vuelo al pasajero. |

## Deuda

| # | Qué |
|---|---|
| 12 | `ReceiptForm` y `EditReceiptModal` duplican ~200 líneas de marcado, y **ya divergieron**: "Anticipo recibido" contra "Depósito recibido" para el mismo campo, e interruptor MXN/USD contra desplegable. |
| 13 | **`CampoFecha` y `CampoHora` nunca llegaron a Órdenes.** `EditReservationModal` sigue con el `input type="time"` nativo: el problema de las 12 h que se resolvió aquí sigue vivo allá. |
| 14 | **19 avisos del linter**, casi todos por `user: any` viajando sin tipo por medio árbol. No existe un tipo `User` en `types.ts`. |
| 15 | `App.css` repite el bloque de estilos de inputs dos veces con selectores de distinta especificidad, y hackea el espaciado de un modal desde un `#id` global. |
| 16 | En `ReceiptList`, los botones de editar y duplicar se muestran solo si **ambos** callbacks existen. Hoy funciona; el día que se quiera uno sin el otro, desaparecen los dos sin aviso. |
| 17 | Las dos listas no se sienten la misma app: distinta elevación de tarjeta, "Editar" en índigo aquí y azul allá, fechas formateadas aquí y crudas allá, buscador y filtros solo en comprobantes. |

---

## Lo que se intentó romper y aguantó

Acota dónde no hace falta mirar. Todo comprobado ejecutando:

- JSON inválido o un objeto en vez de un arreglo en `localStorage` caen limpio a lista vacía.
- `<script>` en el nombre del pasajero se guarda tal cual y React lo escapa: no hay XSS.
- Doble clic rápido en "Generar comprobante" guarda **uno**, no dos.
- 400 meses de navegación en el calendario, fin de mes y febrero bisiesto: sin descuadres.
- Búsqueda ignorando acentos y mayúsculas: correcta, incluido el caso sin resultados.
- Cambiar de servicio con el formulario lleno no truena, y el vuelo se omite del objeto guardado cuando no es llegada.
