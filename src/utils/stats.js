// utils/stats.js
// Helpers estadísticos para análisis de datos tabulares (Excel, CSV).

/**
 * Calcula estadísticas descriptivas de un array de valores numéricos.
 * Devuelve ceros si el array está vacío para evitar divisiones por cero.
 *
 * @param {number[]} valores - Array de números a analizar
 * @returns {{ suma: number, promedio: number, minimo: number, maximo: number }}
 */
function statsNumericas(valores) {
  if (valores.length === 0) return { suma: 0, promedio: 0, minimo: 0, maximo: 0 };
  const suma = valores.reduce((a, b) => a + b, 0);
  return {
    suma: Math.round(suma * 100) / 100,
    promedio: Math.round((suma / valores.length) * 100) / 100,
    minimo: Math.min(...valores),
    maximo: Math.max(...valores),
  };
}

/**
 * Devuelve los valores más frecuentes de un array, ordenados de mayor a menor.
 *
 * @param {Array<string|number>} valores - Array de valores a contabilizar
 * @param {number} [top=3] - Cantidad máxima de resultados a devolver
 * @returns {Array<{ valor: string, cantidad: number }>}
 */
function masFrequentes(valores, top = 3) {
  const conteo = new Map();
  for (const v of valores) {
    const k = String(v).trim();
    if (k) conteo.set(k, (conteo.get(k) || 0) + 1);
  }
  return [...conteo.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([valor, cantidad]) => ({ valor, cantidad }));
}

module.exports = { statsNumericas, masFrequentes };
