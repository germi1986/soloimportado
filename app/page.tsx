import CatalogClient from '@/components/CatalogClient';
import { getProducts } from '@/lib/products';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const products = await getProducts();

  return (
    <main className="min-h-screen px-4 py-6 md:px-8">
      <header className="mb-6 flex flex-col gap-3 rounded-3xl bg-black p-6 text-white md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-neutral-300">
            Catálogo mayorista
          </p>
          <h1 className="text-3xl font-black">Solo Importado Mayorista</h1>
          <p className="mt-1 text-sm text-neutral-300">
            Catálogo conectado a Google Sheets.
          </p>
        </div>
      </header>

      <CatalogClient products={products} />
    </main>
  );
}
