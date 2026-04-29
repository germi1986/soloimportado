import type { Product } from './types';

function num(v: string) {
  const n = Number(
    String(v ?? '')
      .replace(/\./g,'')
      .replace(',', '.')
      .replace(/[^\d.-]/g,'')
  );

  return Number.isFinite(n) ? n : 0;
}

export async function getProducts(): Promise<Product[]> {

 const url =
 process.env.GOOGLE_SHEET_CSV_URL ||
 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS1zsgjxmnRQ0I27jwdFvaHbjma8L3bmMb500TITz7heoiLnarXTeBWhbuHXZzq6AGjsY9bbJkUni82/pub?output=csv';

 const res = await fetch(url,{cache:'no-store'});
 const text = await res.text();

 const rows = text
   .split('\n')
   .map(r=>r.split(';')); // <- cambio clave

 const [, ...data] = rows;

 return data
  .filter(r => r[1])
  .map((r,i)=>({
      id:String(i+1),
      brand:r[0],
      name:r[1],
      category:r[2],
      price:num(r[3]),
      stock:num(r[5]),
      sku:undefined,
      description:undefined,
      imageUrl:undefined
  }));
}
