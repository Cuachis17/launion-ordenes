/**
 * @fileoverview Conjunto de datos de prueba (órdenes, empresas y recibos) para pruebas de PDF.
 */

import type { Order, Receipt, CompanyInfo } from '../../src/types'

export const companyInfo: CompanyInfo = {
  razonSocial: 'Transportes Ejecutivos y Turísticos de la Península de Yucatán S.A. de C.V.',
  direccion: 'Avenida Tulum Manzana 12 Lote 34 Supermanzana 56, Cancún Centro, Quintana Roo',
  sict: 'SICT-0987654321-EXP-2026',
  cobranza: '+52 (998) 876-5432',
}

export const ordenBase: Order = {
  id: 'ord-extrema-99',
  generatedAt: '01/10/2026 10:30',
  agency: 'Agencia de Viajes Internacionales y Excursiones del Caribe “Riviera Maya”',
  provider: 'Transportadora Turística del Caribe Mexicano S.A. de C.V. — Unidad 104',
  service: 'Servicio VIP “Exclusivo” — Especial 🚗 ✓ con todo incluido',
  date: '15/10/2026',
  time: '14:30',
  hotel: 'Hotel Riu Palace Costa Mujeres All Inclusive Adults Only',
  passengers: 8,
  room: 'Suite Presidencial 1204-B',
  flight: 'AM-1234',
  notes: 'Cliente “VIP” solicita chofer bilingüe — no olvidar'
    + ' silla de bebé 👶 ✓ ni agua fría',
  paymentType: 'credito',
}

export const ordenExtrema1: Order = {
  ...ordenBase,
  id: 'ord-extrema-01',
  service: 'Boda en Xcaret — traslado redondo',
  provider: 'Transportadora Turística del Caribe Mexicano S.A. de C.V. 🚐 — Unidad 104',
}

export const comprobanteExtremo: Receipt = {
  id: 'rec-extremo-55555555',
  voucher: 'V-99999',
  generatedAt: '2026-10-01T10:30:00.000Z',
  passenger: 'Lic. María de los Ángeles Hernández y Villalpando',
  pax: 4,
  service: 'hotel',
  date: '2026-10-15',
  time: '15:00',
  pickup: 'Hotel Riu Palace Costa Mujeres All Inclusive Adults Only',
  dropoff: 'Avenida Tulum Manzana 12 Lote 34 Supermanzana 56, Cancún Centro, Quintana Roo',
  flight: 'VB-4567',
  total: 3500,
  paid: 1000,
  currency: 'MXN',
}

export const comprobanteOtro: Receipt = {
  id: 'rec-otro-55555555',
  voucher: 'V-OTRO',
  generatedAt: '2026-10-01T10:30:00.000Z',
  passenger: 'María Hernández',
  pax: 4,
  service: 'otro',
  serviceOther: 'Boda en Xcaret',
  date: '2026-10-15',
  time: '15:00',
  pickup: 'Hotel Riu Palace',
  dropoff: 'Xcaret',
  total: 3500,
  paid: 1000,
  currency: 'MXN',
}

export const cadu: Order = {
  id: '7f0r8ugx',
  generatedAt: '27 de septiembre de 2026',
  agency: 'CADU / STAFF.',
  provider: 'TierraMar',
  service: 'Tour',
  date: '28 - septiembre - 2026',
  time: '05:00',
  hotel: 'OFICINAS CADO / Villas de Tulum Residencial',
  passengers: 17,
  room: 'PRIVADO',
  flight: 'TRASLADO CORPORATIVO STAFF',
  notes: 'Transportación corporativa precontratada CADU - TIERRAMAR',
}

export const caduCo: CompanyInfo = {
  razonSocial: 'EL CIELO Y LA SELVA DE TULUM (TierraMar)',
  direccion: 'TULUM CENTRO',
  sict: '***. ***. ***. ***',
  cobranza: '+19156136956',
}

const W = 'WWWWWWWWWW MMMMMMMMMM '

export const maxOrder: Order = {
  id: 'ABCDEFGHIJKLMNOP',
  generatedAt: '30 de septiembre de 2026 a las 23:59:59 hrs',
  agency:
    'AGENCIA DE VIAJES INTERNACIONALES Y EXCURSIONES DEL CARIBE MEXICANO RIVIERA MAYA SA DE CV',
  provider: 'TRANSPORTADORA TURÍSTICA DEL CARIBE MEXICANO S.A. DE C.V. UNIDAD 104 SPRINTER',
  service: 'TRASLADO REDONDO BODA EN XCARET CON PARADA EN PLAYA DEL CARMEN Y TULUM',
  date: '28 - septiembre - 2026',
  time: '05:00 a 23:00 hrs (con espera)',
  hotel:
    'HOTEL RIU PALACE COSTA MUJERES ALL INCLUSIVE ADULTS ONLY / VILLAS DE TULUM RESIDENCIAL',
  passengers: 99999,
  room: 'SUITE PRESIDENCIAL 1204-B TORRE NORTE PISO 12 VISTA AL MAR',
  flight: 'TRASLADO CORPORATIVO STAFF AEROMEXICO AM-1234 / VOLARIS Y4-5678 / VIVA VB-9012',
  notes: (W + 'Notas muy largas sin espacios: ' + 'X'.repeat(160) + ' ').repeat(4),
}

export const maxCo: CompanyInfo = {
  razonSocial: 'EL CIELO Y LA SELVA DE TULUM SOCIEDAD ANÓNIMA DE CAPITAL VARIABLE (TIERRAMAR)',
  direccion:
    'AVENIDA TULUM MANZANA 12 LOTE 34 SUPERMANZANA 56 TULUM CENTRO QUINTANA ROO CP 77780',
  sict: 'SICT-0987654321-EXP-2026-PERMISO-FEDERAL-AUTOTRANSPORTE-TURISMO',
  cobranza: '+52 (998) 876-5432 / +1 (915) 613-6956 WhatsApp',
}

export const recMax: Receipt = {
  id: 'rec-extremo-55555555',
  voucher: 'VCH-99999999999999',
  generatedAt: '2026-10-01T10:30:00.000Z',
  passenger: 'LIC. MARÍA DE LOS ÁNGELES HERNÁNDEZ Y VILLALPANDO DE LA CRUZ GUTIÉRREZ',
  pax: 99999,
  service: 'otro',
  serviceOther: 'TRASLADO REDONDO BODA EN XCARET CON PARADA EN PLAYA DEL CARMEN',
  date: '2026-10-15',
  time: '15:00',
  pickup: maxOrder.hotel,
  dropoff: 'AEROPUERTO INTERNACIONAL DE CANCÚN TERMINAL 4 SALIDAS INTERNACIONALES PUERTA 12',
  flight: maxOrder.flight,
  currency: 'MXN',
  total: 99999999.99,
  paid: 1.5,
}
