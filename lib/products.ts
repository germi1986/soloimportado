import type { Product } from './types';

function parseCSV(text: string) {
  return text
    .trim()
    .split('\n')
    .map(row =>
      row
        .split(',')
        .map(cell => cell.replace(/^"|"$/g,'').trim())
    );
}

function num(v: string) {
  const n = Number(
    String(v)
      .replace(/\./g,'')
      .replace(',', '.')
      .replace(/[^\d.-]/g,'')
  );

  return Number.isFinite(n) ? n : 0;
}

export async function getProducts(): Promise<Product[]> {
  const url = process.env.GOOGLE_SHEET_CSV_URL ||
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vS1zsgjxmnRQ0I27jwdFvaHbjma8L3bmMb500TITz7heoiLnarXTeBWhbuHXZzq6AGjsY9bbJkUni82/pub?output=csv';

  if (!url) return [];

  const res = await fetch(url, {
    cache: 'no-store'
  });

  const csv = await res.text();

  const rows = parseCSV(csv);

  const [headers, ...data] = rows;

  return data
    .map((row, i): Product | null => {

      const record = Object.fromEntries(
        headers.map((h,idx)=>[
          h.toLowerCase(),
          row[idx] || ''
        ])
      );

      const name =
        record.nombre ||
        record.producto ||
        record.name ||
        '';

      if(!name) return null;

      return {
        id: String(i+1),
        sku: record.sku || undefined,
        name,
        brand: record.marca || undefined,
        category: record.categoria || undefined,
        description: record.descripcion || undefined,
        price: num(record.precio),
        stock: num(record.stock),
        imageUrl: record.imagen || undefined
      };
    })
    .filter(Boolean) as Product[];
}
