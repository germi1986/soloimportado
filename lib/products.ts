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
 'TU_URL_CSV';

 const res = await fetch(url,{cache:'no-store'});
 const text = await res.text();

 const rows = text
   .split('\n')
   .map(r=>r.split(','));

 const headerIndex = rows.findIndex(
   r => r[0]?.toLowerCase().includes('marca')
   && r[1]?.toLowerCase().includes('producto')
 );

 if(headerIndex === -1) return [];

 const data = rows.slice(headerIndex + 1);

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
