import type { Product } from './types';

function num(v: string) {
  const n = Number(
    String(v ?? '')
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^\d.-]/g, '')
  );

  return Number.isFinite(n) ? n : 0;
}

function getCell(row: string[], headers: string[], possibleNames: string[]) {
  for (const name of possibleNames) {
    const index = headers.findIndex(
      (h) => h.trim().toLowerCase() === name.trim().toLowerCase()
    );

    if (index !== -1) return row[index] ?? '';
  }

  return '';
}

export async function getProducts(): Promise<Product[]> {
  const url =
    process.env.GOOGLE_SHEET_CSV_URL ||
    'TU_URL_CSV';

  const res = await fetch(url, { cache: 'no-store' });
  const text = await res.text();

  const rows = text
    .split('\n')
    .map((r) => r.split(',').map((c) => c.trim()));

  const headerIndex = rows.findIndex(
    (r) =>
      r[0]?.toLowerCase().includes('marca') &&
      r[1]?.toLowerCase().includes('producto')
  );

  if (headerIndex === -1) return [];

  const headers = rows[headerIndex];
  const data = rows.slice(headerIndex + 1);

  return data
    .filter((r) => r[1])
    .map((r, i) => ({
      id: String(i + 1),
      brand: getCell(r, headers, ['Marca']),
      name: getCell(r, headers, ['Producto']),
      category: getCell(r, headers, ['Tamaño', 'Categoria', 'Categoría']),
      price: num(getCell(r, headers, ['Precio', 'ARS Base', 'Precio ARS'])),
      stock: num(getCell(r, headers, ['Cantidad', 'Stock'])),
      sku: undefined,
      description: undefined,
      imageUrl: getCell(r, headers, ['Imagen', 'URL Imagen', 'URLImagen'])
    }));
}
