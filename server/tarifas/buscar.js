/**
 * Módulo puro de búsqueda y scoring con tolerancia a typos para hoteles y lugares.
 * Sin dependencias externas ni estado mutable compartido.
 */

/**
 * Normaliza cadenas de texto para búsqueda insensible a acentos, signos y mayúsculas.
 */
export function normalizarTexto(texto) {
  if (!texto || typeof texto !== 'string') return '';
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Distancia Levenshtein entre dos cadenas de texto.
 */
export function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    const aChar = a.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const cost = aChar === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,       // deletion
        curr[j - 1] + 1,   // insertion
        prev[j - 1] + cost // substitution
      );
    }
    const temp = prev;
    prev = curr;
    curr = temp;
  }
  return prev[n];
}

/**
 * Evalúa si un item coincide con todos los tokens de la consulta y calcula su puntaje.
 * Regla:
 * - Coincide si el token es substring del texto normalizado (nombre + alias).
 * - O si hay alguna palabra del nombre/alias con distancia Levenshtein <= 1 (tokens 4-6 letras) o <= 2 (7+ letras).
 * - Tokens < 4 letras: solo prefijo/substring.
 * Ranking:
 * - Coincidencia exacta/prefijo primero, luego fuzzy.
 * - Retorna score numérico o null si no coincide algún token.
 */
export function evaluarCoincidencia(item, qNorm, tokens) {
  const nombreNorm = normalizarTexto(item?.nombre);
  const aliasNorms = Array.isArray(item?.alias)
    ? item.alias.map(normalizarTexto).filter(Boolean)
    : [];
  const todoTexto = [nombreNorm, ...aliasNorms].join(' ');
  const palabras = Array.from(new Set(todoTexto.split(' ').filter(Boolean)));

  let huboFuzzy = false;
  let sumaPuntosTokens = 0;

  for (const token of tokens) {
    // 1. Substring o coincidencia directa
    if (todoTexto.includes(token)) {
      if (palabras.includes(token)) {
        sumaPuntosTokens += 40; // Palabra exacta
      } else if (palabras.some(p => p.startsWith(token))) {
        sumaPuntosTokens += 30; // Prefijo de palabra
      } else {
        sumaPuntosTokens += 20; // Substring
      }
      continue;
    }

    // 2. Tokens < 4 letras: solo prefijo/substring (sin Levenshtein)
    if (token.length < 4) {
      return null;
    }

    // 3. Tolerancia Levenshtein:
    // tokens de 4-6 letras: <= 1
    // tokens de 7+ letras: <= 2
    const maxDist = token.length <= 6 ? 1 : 2;
    let mejorDist = Infinity;

    for (const palabra of palabras) {
      if (Math.abs(palabra.length - token.length) > maxDist) continue;
      const dist = levenshtein(palabra, token);
      if (dist < mejorDist) {
        mejorDist = dist;
        if (mejorDist === 1) break;
      }
    }

    if (mejorDist <= maxDist) {
      huboFuzzy = true;
      sumaPuntosTokens += (mejorDist === 1 ? 10 : 5);
    } else {
      // El token no coincidió con ninguna palabra ni como substring
      return null;
    }
  }

  // Ranking: coincidencia exacta/prefijo primero, luego fuzzy
  let score = 0;
  if (!huboFuzzy) {
    if (nombreNorm === qNorm) {
      score = 1000;
    } else if (aliasNorms.some(a => a === qNorm)) {
      score = 900;
    } else if (nombreNorm.startsWith(qNorm)) {
      score = 800;
    } else if (aliasNorms.some(a => a.startsWith(qNorm))) {
      score = 700;
    } else if (nombreNorm.includes(qNorm)) {
      score = 600;
    } else if (aliasNorms.some(a => a.includes(qNorm))) {
      score = 500;
    } else {
      score = 300 + sumaPuntosTokens;
    }
  } else {
    // Coincidencia que requirió tolerancia fuzzy
    score = 100 + sumaPuntosTokens;
  }

  return score;
}

/**
 * Busca coincidencias en listas de lugares y hoteles.
 * Preserva compatibilidad con firmas previas y aplica scoring fuzzy puro.
 * Ante igualdad de puntaje, los lugares van antes que los hoteles.
 */
export function buscarLugares(query, arg1 = [], arg2 = []) {
  let listaLugares = [];
  let listaHoteles = [];

  if (arguments.length >= 3 || (Array.isArray(arg1) && Array.isArray(arg2) && arg2.length > 0)) {
    listaLugares = arg1;
    listaHoteles = arg2;
  } else {
    if (arg1.length > 0 && (arg1[0].tipo === 'aeropuerto' || arg1[0].tipo === 'centro')) {
      listaLugares = arg1;
    } else {
      listaHoteles = arg1;
    }
  }

  const formatearLugar = (l) => ({
    ...l,
    _id: l.clave || l._id,
    tipo: l.tipo
  });

  const formatearHotel = (h) => ({
    ...h,
    tipo: h.tipo || 'hotel'
  });

  if (typeof query !== 'string' && query !== undefined && query !== null) {
    return [];
  }

  const qNorm = normalizarTexto(query);

  if (!qNorm) {
    const lugaresFmt = listaLugares.map(formatearLugar);
    const hotelesFmt = listaHoteles.map(formatearHotel);
    return [...lugaresFmt, ...hotelesFmt].slice(0, 15);
  }

  const tokens = qNorm.split(' ').filter(Boolean);
  const resultados = [];
  let idx = 0;

  for (const l of listaLugares) {
    const score = evaluarCoincidencia(l, qNorm, tokens);
    if (score !== null) {
      resultados.push({ item: formatearLugar(l), score, indiceOriginal: idx });
    }
    idx++;
  }

  for (const h of listaHoteles) {
    const score = evaluarCoincidencia(h, qNorm, tokens);
    if (score !== null) {
      resultados.push({ item: formatearHotel(h), score, indiceOriginal: idx });
    }
    idx++;
  }

  // Ordenación:
  // 1. Mayor score primero (exactas/prefijo > fuzzy)
  // 2. A igual puntaje: lugares antes que hoteles
  // 3. A igual puntaje y tipo: orden original estable
  resultados.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const aEsLugar = a.item.tipo === 'aeropuerto' || a.item.tipo === 'centro';
    const bEsLugar = b.item.tipo === 'aeropuerto' || b.item.tipo === 'centro';
    if (aEsLugar && !bEsLugar) return -1;
    if (!aEsLugar && bEsLugar) return 1;
    return a.indiceOriginal - b.indiceOriginal;
  });

  return resultados.slice(0, 15).map(r => r.item);
}
