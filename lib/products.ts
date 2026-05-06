import type { Product } from './types';

function num(v: string, kind: 'usd' | 'ars' = 'usd') {
  const raw = String(v ?? '').trim();
  if (!raw) return 0;

  const only = raw.replace(/[^\d.,-]/g, '');

  if (kind === 'ars') {
    if (only.includes(',')) {
      const cleaned = only.replace(/\./g, '').replace(',', '.');
      const n = parseFloat(cleaned);
      return Number.isFinite(n) ? n : 0;
    }

    if (only.includes('.')) {
      const parts = only.split('.');
      const last = parts[parts.length - 1];

      if (last.length === 3) {
        const n = parseFloat(only.replace(/\./g, ''));
        return Number.isFinite(n) ? n : 0;
      }
    }

    const n = parseFloat(only);
    return Number.isFinite(n) ? n : 0;
  }

  const cleaned = only.replace(',', '.');
  const n = parseFloat(cleaned);
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

  if (['hombre', 'masculino', 'male', 'men', 'man'].includes(gender)) return 'Hombre';
  if (['mujer', 'femenino', 'female', 'women', 'woman'].includes(gender)) return 'Mujer';
  if (['unisex', 'uni sex', 'ambos'].includes(gender)) return 'Unisex';

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
    process.env.GOOGLE_SHEET_CSV_URL ||
    'TU_URL_CSV';

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
      category: normalizeGender(getCell(r, headers, ['Genero', 'Género'])),
      mainCategory: clean(r[11] ?? getCell(r, headers, ['Categoria', 'Categoría'])),
      description: getCell(r, headers, ['Tamaño', 'Categoria', 'Categoría']),
      price: num(r[3], 'usd'),
      priceArs: num(r[4], 'ars'),
      stock: Math.floor(Math.random() * 20) + 5,
      sku: undefined,
      imageUrl: getCell(r, headers, ['Imagen', 'URL Imagen', 'URLImagen'])
    }));
}
