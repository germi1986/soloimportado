'use client';

import { useMemo, useState } from 'react';
import type { CartItem, Product } from '@/lib/types';

function formatCurrency(value: number) {
  return `USD ${value.toFixed(2)}`;
}

export default function CatalogClient({ products }: { products: Product[] }) {
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return products;

    return products.filter((product) =>
      [product.name, product.brand, product.category, product.sku]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [products, query]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0);

  function addToCart(product: Product) {
    const qty = quantities[product.id] || 1;

    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.id === product.id);

      if (existing) {
        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }

      return [...currentCart, { ...product, quantity: qty }];
    });
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      setCart((c) => c.filter((item) => item.id !== productId));
      return;
    }

    setCart((c) =>
      c.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  }

  function buildWhatsAppText() {
    const lines = cart.map((item) => {
      const size = item.category ? ` (${item.category})` : '';
      return `• ${item.quantity} x ${item.name}${size} - ${formatCurrency(item.price * item.quantity)}`;
    });

    return encodeURIComponent(
      `Hola, quiero hacer este pedido mayorista:\n\n${lines.join('\n')}\n\nTotal: ${formatCurrency(total)}`
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section>

        {/* 🔍 BUSCADOR */}
        <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
          <input
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
            placeholder="Buscar por producto, marca o tamaño..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* 📄 CONDICIONES */}
        <details className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
          <summary className="cursor-pointer font-black">
            Condiciones de compra
          </summary>

          <div className="mt-4 space-y-3 text-sm text-neutral-700">
            <p><strong>Pagos:</strong> Efectivo (CABA/GBA), Transferencia (+5%), USDT sin recargo.</p>
            <p><strong>Envíos:</strong> Gratis CABA/GBA. Interior a coordinar.</p>
            <p><strong>Descuentos:</strong> desde USD 500 (5%) hasta USD 2000 (12%).</p>
            <p><strong>Entrega:</strong> hasta 3 días hábiles. Stock sujeto a disponibilidad.</p>
            <p><strong>Garantía:</strong> solo productos en mal estado o abiertos.</p>
          </div>
        </details>

        {/* 🧱 PRODUCTOS */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <article key={product.id} className="rounded-2xl bg-white shadow-sm overflow-hidden">

              {/* IMAGEN */}
              <div className="flex aspect-[4/3] items-center justify-center bg-neutral-100">
                {product.imageUrl ? (
                  <img
                    className="h-full w-full object-contain p-3"
                    src={product.imageUrl}
                    alt={product.name}
                  />
                ) : (
                  <span className="text-sm text-neutral-400">Sin imagen</span>
                )}
              </div>

              {/* INFO */}
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs text-neutral-500 uppercase">
                    {product.brand}
                  </p>

                  <h2 className="font-bold text-lg">{product.name}</h2>

                  {product.category && (
                    <p className="text-sm text-neutral-600">
                      {product.category}
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xl font-black">
                      {formatCurrency(product.price)}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Stock: {product.stock}
                    </p>
                  </div>

                  {/* 🔢 CANTIDAD */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setQuantities((q) => ({
                          ...q,
                          [product.id]: Math.max(1, (q[product.id] || 1) - 1)
                        }))
                      }
                      className="h-8 w-8 border rounded"
                    >
                      -
                    </button>

                    <input
                      type="number"
                      className="w-10 text-center border rounded"
                      value={quantities[product.id] || 1}
                      onChange={(e) =>
                        setQuantities((q) => ({
                          ...q,
                          [product.id]: Number(e.target.value)
                        }))
                      }
                    />

                    <button
                      onClick={() =>
                        setQuantities((q) => ({
                          ...q,
                          [product.id]: (q[product.id] || 1) + 1
                        }))
                      }
                      className="h-8 w-8 border rounded"
                    >
                      +
                    </button>

                    <button
                      onClick={() => addToCart(product)}
                      className="ml-2 bg-black text-white px-3 py-2 rounded"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 🛒 CARRITO */}
      <aside className="bg-white p-5 rounded-2xl shadow-sm">
        <h2 className="font-black text-xl mb-2">Pedido</h2>
        <p className="text-sm mb-4">{totalUnits} unidades</p>

        {cart.map((item) => (
          <div key={item.id} className="mb-3 border p-3 rounded">
            <p>{item.name} ({item.category})</p>
            <p>{formatCurrency(item.price * item.quantity)}</p>
          </div>
        ))}

        <div className="border-t pt-4">
          <p className="font-black text-lg">
            Total: {formatCurrency(total)}
          </p>

          <a
            className="block mt-3 bg-green-600 text-white text-center py-2 rounded"
            href={`https://wa.me/?text=${buildWhatsAppText()}`}
            target="_blank"
          >
            Enviar pedido
          </a>
        </div>
      </aside>
    </div>
  );
}
