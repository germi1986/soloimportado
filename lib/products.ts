import { google } from 'googleapis';
import type { Product } from './types';

function normalizeKey(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .replace(/_/g, '');
}

function parseNumber(value: unknown) {
  const clean = String(value ?? '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');

  const number = Number(clean);
  return Number.isFinite(number) ? number : 0;
}

export async function getProducts(): Promise<Product[]> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!sheetId || !clientEmail || !privateKey) {
    return [];
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: process.env.GOOGLE_SHEET_RANGE || 'Productos!A:Z'
  });

  const rows = response.data.values || [];
  const [headers = [], ...dataRows] = rows;

  const keys = headers.map((header) => normalizeKey(String(header)));

  return dataRows
    .map((row, index): Product | null => {
      const record = Object.fromEntries(
        keys.map((key, colIndex) => [key, row[colIndex] ?? ''])
      );

      const name = String(record.nombre || record.name || record.producto || '').trim();

      if (!name) return null;

      const price = parseNumber(record.precio || record.price);
      const stockValue = record.stock || record.cantidad;
      const stock = stockValue ? parseNumber(stockValue) : undefined;

      return {
        id: String(record.id || record.codigo || record.sku || index + 1),
        sku: String(record.sku || record.codigo || '').trim() || undefined,
        name,
        brand: String(record.marca || record.brand || '').trim() || undefined,
        category: String(record.categoria || record.category || '').trim() || undefined,
        description: String(record.descripcion || record.description || '').trim() || undefined,
        price,
        stock,
        imageUrl:
          String(record.imagen || record.image || record.imageurl || record.image_url || '').trim() ||
          undefined
      };
    })
    .filter((product): product is Product => product !== null);
}
