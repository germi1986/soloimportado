import type { Product } from './types';

function parseCSV(text: string) {
  return text
    .trim()
    .split('\n')
    .map((row) =>
      row
        .split(',')
        .map((cell) => cell.replace(/^"|"$/g, '').trim())
    );
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase();
}

function num(value: string | undefined) {
  const n = Number(
    String(value ?? '')
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^\d.-]/g, '')
  );

  return Number.isFinite(n) ? n : 0;
}

export async function getProducts(): Promise<Product[]> {
  const url =
    process.env.GOOGLE_SHEET_CSV_URL ||
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vS1zsgjxmnRQ0I27jwdFvaHbjma8L3bmMb500TITz7heoiLnarXTeBWhbuHXZzq6AGjsY9bbJkUni82/pub?output=csv';

  const res = await fetch(url, {
    cache: 'no-store'
  });

  const csv = await res.text();
  const rows = parseCSV(csv);

  const [headers, ...data] = rows;
  const normalizedHeaders = headers.map(normalizeHeader);

  return data
    .map((row, i): Product | null => {
      const record = Object.fromEntries(
        normalizedHeaders.map((header, index) => [header, row[index] || ''])
      );

      const name = String(record.producto || record.nombre || record.name || '').trim();

      if (!name) return null;

      return {
        id: String(i + 1),
        sku: String(record.sku || '').trim() || undefined,
        name,
        brand: String(record.marca || '').trim() || undefined,
        category: String(record.tamaño || record.tamano || '').trim() || undefined,
        description: undefined,
        price: num(record['precio usd'] || record['precio ars'] || record.precio),
        stock: num(record.cantidad || record.stock),
        imageUrl: String(record.imagen || record.image || '').trim() || undefined
      };
    })
    .filter((product): product is Product => product !== null);
}
