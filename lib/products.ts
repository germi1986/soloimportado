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
    .replace(/^"|"$/g, '')
    .trim();
}

function normalizeGender(value: string): Product['gender'] {
  const gender = clean(value).toLowerCase();

  if (gender === 'hombre') return 'hombre';
  if (gender === 'mujer') return 'mujer';
  if (gender === 'unisex') return 'unisex';
  if (gender === 'desconocido') return 'desconocido';

  return 'desconocido';
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

export async function getProducts(): Promise<Product[]> {
  const url = process.env.GOOGLE_SHEET_CSV_URL || GOOGLE_SHEET_CSV_URL;

  const res = await fetch(url, { cache: 'no-store' });
  const text = await res.text();

  const rows = parseCsv(text).filter((r) => r.some(Boolean));

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
    .map((r, i) => {
      const genderFromHeader = getCell(r, headers, [
        'Genero',
        'Género',
        'gender',
        'Gender'
      ]);

      const genderFromColumnP = r[15] ?? '';

      return {
        id: String(i + 1),
        brand: getCell(r, headers, ['Marca']),
        name: getCell(r, headers, ['Producto']),
        category: getCell(r, headers, ['Tamaño', 'Categoria', 'Categoría']),
        gender: normalizeGender(genderFromHeader || genderFromColumnP),
        price: num(r[3]),
        stock: Math.floor(Math.random() * 20) + 5,
        sku: undefined,
        description: undefined,
        imageUrl: getCell(r, headers, ['Imagen', 'URL Imagen', 'URLImagen'])
      };
    });
}
