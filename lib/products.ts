import { google } from 'googleapis';
import type { Product } from './types';

const fallbackProducts: Product[] = [
  {
    id: 'demo-1',
    name: 'Producto demo',
    brand: 'Solo Importado',
    category: 'Demo',
    description: 'Configurá Google Sheets para reemplazar este producto.',
    price: 0,
    stock: 0
  }
];

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .trim();
}

function parseNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  const raw = String(value ?? '').trim();
  if (!raw) return 0;
  const cleaned = raw.replace(/[$\s]/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function rowsToProducts(rows: string[][]): Product[] {
  const [headers, ...dataRows] = rows;
  if (!headers || headers.length === 0) return [];

  const keys = headers.map(normalizeKey);

  return dataRows
  .map((row, index) => {
    const record = Object.fromEntries(
      keys.map((key, colIndex) => [key, row[colIndex] ?? ''])
    );

    const name = String(
      record.nombre || record.name || record.producto || ''
    ).trim();

    if (!name) return null;

    return {
      id: String(index + 1),
      sku: String(record.sku || ''),
      name,
      brand: String(record.brand || record.marca || ''),
      category: String(record.category || ''),
      description: String(record.description || ''),
      price: Number(record.price || record.precio || 0),
      stock: Number(record.stock || 0),
      imageUrl: String(record.image || '')
    };
  })
  .filter(Boolean) as Product[];

      return {
        id,
        sku: String(record.sku || '').trim() || undefined,
        name,
        brand: String(record.marca || record.brand || '').trim() || undefined,
        category: String(record.categoria || record.category || '').trim() || undefined,
        description: String(record.descripcion || record.description || '').trim() || undefined,
        price,
        stock,
        imageUrl: String(record.imagen || record.image || record.imageurl || record.image_url || '').trim() || undefined
      } satisfies Product;
    })
    .filter((product): product is Product => product !== null);
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result.map((cell) => cell.trim());
}

function parseCsv(csv: string): string[][] {
  return csv
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map(parseCsvLine);
}

async function getProductsFromCsvUrl(): Promise<Product[]> {
  const url = process.env.SHEET_CSV_URL;
  if (!url) return [];

  const response = await fetch(url, { next: { revalidate: 60 } });
  if (!response.ok) {
    throw new Error(`No se pudo leer el CSV de Google Sheets: ${response.status}`);
  }

  return rowsToProducts(parseCsv(await response.text()));
}

async function getProductsFromGoogleSheets(): Promise<Product[]> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const range = process.env.GOOGLE_SHEETS_RANGE || 'Productos!A:Z';

  if (!spreadsheetId || !clientEmail || !privateKey) return [];

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  return rowsToProducts((response.data.values ?? []) as string[][]);
}

export async function getProducts(): Promise<Product[]> {
  const csvProducts = await getProductsFromCsvUrl();
  if (csvProducts.length > 0) return csvProducts;

  const sheetProducts = await getProductsFromGoogleSheets();
  if (sheetProducts.length > 0) return sheetProducts;

  return fallbackProducts;
}
