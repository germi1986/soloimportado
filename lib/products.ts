import type { Product } from './types';

const GOOGLE_SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vS1zsgjxmnRQ0I27jwdFvaHbjma8L3bmMb500TITz7heoiLnarXTeBWhbuHXZzq6AGjsY9bbJkUni82/pub?gid=1050214761&single=true&output=csv';

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
    .replace(/^\uFEFF/, '')
    .replace(/^"|"$/g, '')
    .trim();
}

function normalizeHeader(value: string) {
  return clean(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normalizeGender(value: string): Product['gender'] {
  const raw = clean(value).toLowerCase();

  const gender = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  if (
    gender === 'hombre' ||
    gender === 'masculino' ||
    gender === 'male' ||
    gender === 'men' ||
    gender === 'man'
  ) {
    return 'hombre';
  }

  if (
    gender === 'mujer' ||
    gender === 'femenino' ||
    gender === 'female' ||
    gender === 'women' ||
    gender === 'woman'
  ) {
    return 'mujer';
  }

  if (
    gender === 'unisex' ||
    gender === 'uni sex' ||
    gender === 'ambos'
  ) {
    return 'unisex';
  }

  if (
    gender === 'desconocido' ||
    gender === 'unknown' ||
    gender === 'sin dato' ||
    gender === 's/d'
  ) {
    return 'desconocido';
  }

  return 'desconocido';
}

function getCell(row: string[], headers: string[], possibleNames: string[]) {
  const normalizedNames = possibleNames.map(normalizeHeader);

  const index = headers.findIndex((h) =>
    normalizedNames.includes(normalizeHeader(h))
  );

  if (index !== -1) return clean(row[index] ?? '');

  return '';
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

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
      row.push(clean(current));
      current = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') i++;

      if (current || row.length) {
        row.push(clean(current));
        rows.push(row);
        row = [];
        current = '';
      }

      continue;
    }

    current += char;
  }

  if (current || row.length) {
    row.push(clean(current));
    rows.push(row);
  }

  return rows;
}

function detectHeaderIndex(rows: string[][]) {
  return rows.findIndex((r) => {
    const normalized = r.map(normalizeHeader);

    return (
      normalized.includes('marca') &&
      normalized.includes('producto')
    );
  });
}

function getGenderFromRow(row: string[], headers: string[]) {
  const byHeader = getCell(row, headers, [
    'Genero',
    'Género',
    'Gender',
    'Sexo',
    'gender',
    'genero comercial',
    'género comercial'
  ]);

  if (byHeader) return normalizeGender(byHeader);

  // Fallback real: columna P de Google Sheets = índice 15
  return normalizeGender(row[15] ?? '');
}

export async function getProducts(): Promise<Product[]> {
  const url = process.env.GOOGLE_SHEET_CSV_URL || GOOGLE_SHEET_CSV_URL;

  const res = await fetch(url, { cache: 'no-store' });
  const text = await res.text();

  const rows = parseCsv(text).filter((r) => r.some(Boolean));
  const headerIndex = detectHeaderIndex(rows);

  if (headerIndex === -1) return [];

  const headers = rows[headerIndex];
  const data = rows.slice(headerIndex + 1);

  return data
    .filter((r) => getCell(r, headers, ['Producto', 'Nombre', 'Name']))
    .map((r, i) => {
      const gender = getGenderFromRow(r, headers);

      return {
        id: String(i + 1),
        brand: getCell(r, headers, ['Marca', 'Brand']),
        name: getCell(r, headers, ['Producto', 'Nombre', 'Name']),
        category: getCell(r, headers, ['Tamaño', 'Tamano', 'Categoria', 'Categoría', 'Category']),
        gender,
        price: num(
          getCell(r, headers, ['Precio USD', 'Precio', 'Price USD', 'Price']) ||
          r[3]
        ),
        stock: Math.floor(Math.random() * 20) + 5,
        sku: undefined,
        description: undefined,
        imageUrl: getCell(r, headers, ['Imagen', 'URL Imagen', 'URLImagen', 'Image', 'Image URL'])
      };
    });
}
