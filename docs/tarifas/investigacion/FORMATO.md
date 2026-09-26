# Formato de investigación de hoteles

Cada agente escribe `investigacion/<region>.json`: un arreglo de objetos:

```json
{
  "nombre": "Riu Palace Riviera Maya",
  "alias": ["riu palace", "riu playacar palace"],
  "zona": "playacar",
  "ubicacion": "Playacar Fase II, Playa del Carmen",
  "km_carretera": null,
  "estado": "abierto",
  "fuente": "https://...",
  "confianza": "alta"
}
```

- `zona`: una clave de la lista de abajo. Si no encaja, usa `"revisar"` y explica en `ubicacion`.
- `estado`: abierto | cerrado | renombrado (poner nombre nuevo en `nombre` y el viejo en `alias`).
- `confianza`: alta (fuente oficial/mapa) | media | baja.
- Incluir hoteles, resorts all-inclusive, boutiques conocidos y complejos de condominios/villas
  que usan traslados. No inventar: si no hay fuente, no entra.

## Zonas (derivadas del tarifario 2026, de norte a sur)
- isla_blanca
- costa_mujeres (Riu Dunamar, Atelier, Secrets/Dreams/Breathless/Impression Isla Mujeres, Finest...)
- playa_mujeres (Excellence, Beloved, Majestic Elegance CM, Grand Palladium Costa Mujeres...)
- puerto_juarez (Puerto Juárez, Hacienda del Mar)
- cancun_centro
- zh_cancun (Zona Hotelera km 0-25)
- moon_hilton_desatadora (Moon Palace, Hilton Cancún, Haven, zona hasta La Desatadora / Nizuc sur)
- petempich (Royalton, Royalton Splash, Bahía Petempich)
- ocean_turquesa (Ocean Turquesa, Dreams Sapphire, Excellence Riviera Cancún — sur de Petempich, norte de PM)
- puerto_morelos (Puerto Morelos, CID, Grand Residences PM, Desire...)
- maroma (Nickelodeon, Dorado Royale, Maroma, Playa del Secreto)
- kanai (Kanai, BB Esmeralda/Ceiba, Corasol, Punta Esmeralda, Playa del Carmen norte extremo)
- playa_del_carmen (PDC centro, Playacar, Xcaret, Paradisus, Coco Beach, Tren Maya PDC)
- puerto_aventuras (Puerto Aventuras, Punta Venado, Esencia, Xpu-Há, Barceló Maya)
- akumal (Seaside, Sirenis, Unico, Conrad Tulum, Bahía Príncipe, Akumal)
- xelha_soliman (Xel-Há, Dreams Tulum, Bahía Solimán, Tankah)
- tulum_centro (Tulum pueblo, Aldea Zama, La Veleta)
- tulum_zh (Zona Hotelera de Tulum, Kore, hasta el Arco)
