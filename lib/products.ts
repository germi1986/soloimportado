import type { Product } from './types';

function num(v: string) {
  const raw = String(v ?? '').trim();

  const cleaned = raw
    .replace(/[^\d.,-]/g, '')
    .replace(',', '.');

  const n = Number(cleaned);

  return Number.isFinite(n) ? n : 0;
}

function clean(value: string) {
  return String(value ?? '')
    .replace(/^"|"$/g, '')
    .trim();
}

function normalizeGender(value: string) {
  const gender = clean(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  if (['hombre', 'masculino', 'male', 'men', 'man'].includes(gender)) {
    return 'Hombre';
  }

  if (['mujer', 'femenino', 'female', 'women', 'woman'].includes(gender)) {
    return 'Mujer';
  }

  if (['unisex', 'uni sex', 'ambos'].includes(gender)) {
    return 'Unisex';
  }

  return 'Desconocido';
}

function getCell(row: string[], headers: string[], possibleNames: string[]) {
  for (const name of possibleNames) {
    const index = headers.findIndex(
      (h) => clean(h).toLowerCase() === name.trim().toLowerCase()
    );

    if (index !== -1) return clean(row[index] ?? '');
  }

  return '';
}

function parseCsvLine(line: string) {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      current += '"';
      i++;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === ',' && !insideQuotes) {
      result.push(clean(current));
      current = '';
      continue;
    }

    current += char;
  }

  result.push(clean(current));
  return result;
}

export async function getProducts(): Promise<Product[]> {
  const url =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vS1zsgjxmnRQ0I27jwdFvaHbjma8L3bmMb500TITz7heoiLnarXTeBWhbuHXZzq6AGjsY9bbJkUni82/pub?gid=1050214761&single=true&output=csv';

  const res = await fetch(url, { cache: 'no-store' });
  const text = await res.text();

  const rows = text
    .split(/\r?\n/)
    .filter(Boolean)
    .map(parseCsvLine);

  const headerIndex = rows.findIndex(
    (r) =>
      clean(r[0]).toLowerCase().includes('marca') &&
      clean(r[1]).toLowerCase().includes('producto')
  );

  if (headerIndex === -1) return [];

  const headers = rows[headerIndex];
  const data = rows.slice(headerIndex + 1);

  return data
    .filter((r) => getCell(r, headers, ['Producto']))
    .map((r, i) => ({
      id: String(i + 1),
      brand: getCell(r, headers, ['Marca']),
      name: getCell(r, headers, ['Producto']),

      // Usamos la categoría existente, pero alimentada por Género.
      // Columna P = índice 15.
      category: `P=${r[15] || 'VACIO'} | columnas=${r.length}`,

      price: num(r[3]),
      stock: Math.floor(Math.random() * 20) + 5,
      sku: undefined,
      description: undefined,
      imageUrl: getCell(r, headers, ['Imagen', 'URL Imagen', 'URLImagen'])
    }));
}
