import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getProducts } from '@/lib/products';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  try {
    const products = await getProducts();
    return NextResponse.json({ products });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'No se pudieron cargar los productos.' }, { status: 500 });
  }
}
