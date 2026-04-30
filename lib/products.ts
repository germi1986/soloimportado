import type { Product } from './types';

const GOOGLE_SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vS1zsgjxmnRQ0I27jwdFvaHbjma8L3bmMb500TITz7heoiLnarXTeBWhbuHXZzq6AGjsY9bbJkUni82/pub?gid=1050214761&single=true&output=csv';

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

function num(value: string) {
  const raw = clean(value);

  const cleaned = raw
    .replace(/[^\d.,-]/g, '')
    .replace(',', '.');

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function normalizeGender(value: string): Product['gender'] {
  const gender = clean(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  if (['hombre', 'masculino', 'male', 'men', 'man'].includes(gender)) {
    return 'hombre';
  }

  if (['mujer', 'femenino', 'female', 'women', 'woman'].includes(gender)) {
    return 'mujer';
  }

  if (['unisex', 'uni sex', 'ambos'].includes(gender)) {
    return 'unisex';
  }

  return 'desconocido';
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

function getCell(row: string[], headers: string[], possibleNames: string[]) {
  const normalizedNames = possibleNames.map(normalizeHeader);

  const index = headers.findIndex((header) =>
    normalizedNames.includes(normalizeHeader(header))
  );

  if (index !== -1) return clean(row[index] ?? '');

  return '';
}

function detectHeaderIndex(rows: string[][]) {
  return rows.findIndex((row) => {
    const normalized = row.map(normalizeHeader);

    return (
      normalized.includes('marca') &&
      normalized.includes('producto')
    );
  });
}

function getGender(row: string[], headers: string[]) {
  const byHeader = getCell(row, headers, [
    'Genero',
    'Género',
    'Gender',
    'Sexo',
    'Genero comercial',
    'Género comercial'
  ]);

  if (byHeader) return normalizeGender(byHeader);

  // Columna P = índice 15
  return normalizeGender(row[15] ?? '');
}

export async function getProducts(): Promise<Product[]> {
  const res = await fetch(GOOGLE_SHEET_CSV_URL, {
    cache: 'no-store',
    next: { revalidate: 0 }
  });

  const text = await res.text();
  const rows = parseCsv(text).filter((row) => row.some(Boolean));

  const headerIndex = detectHeaderIndex(rows);

  if (headerIndex === -1) return [];

  const headers = rows[headerIndex];
  const data = rows.slice(headerIndex + 1);

  return data
    .filter((row) =>
      getCell(row, headers, ['Producto', 'Nombre', 'Name'])
    )
    .map((row, index) => {
      const brand = getCell(row, headers, ['Marca', 'Brand']);
      const name = getCell(row, headers, ['Producto', 'Nombre', 'Name']);
      const category = getCell(row, headers, [
        'Tamaño',
        'Tamano',
        'Categoría',
        'Categoria',
        'Category'
      ]);

      const price =
        num(getCell(row, headers, ['Precio USD', 'Precio', 'Price USD', 'Price'])) ||
        num(row[3]);

      const gender = getGender(row, headers);

      return {
        id: String(index + 1),
        brand,
        name,
        category,
        gender,
        price,
        stock: Math.floor(Math.random() * 20) + 5,
        sku: undefined,
        description: undefined,
        imageUrl: getCell(row, headers, [
          'Imagen',
          'URL Imagen',
          'URLImagen',
          'Image',
          'Image URL'
        ])
      };
    });
}
