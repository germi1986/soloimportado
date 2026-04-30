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

    return products.filter((product) => {
      return [product.name, product.brand, product.category, product.sku]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });
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
      setCart((currentCart) => currentCart.filter((item) => item.id !== productId));
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) => (item.id === productId ? { ...item, quantity } : item))
    );
  }

  function buildWhatsAppText() {
    const lines = cart.map((item) => {
      const sizeText = item.category ? ` ${item.category}` : '';
      return `• ${item.quantity} x ${item.name}${sizeText} - ${formatCurrency(item.price * item.quantity)}`;
    });

    return encodeURIComponent(
      `Hola, quiero hacer este pedido mayorista:\n\n${lines.join('\n')}\n\nTotal: ${formatCurrency(total)}`
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section>
        <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
          <input
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
            placeholder="Buscar por producto, marca, tamaño o SKU..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <details className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
          <summary className="cursor-pointer select-none text-base font-black">
            Condiciones de compra
          </summary>

          <div className="mt-4 space-y-4 text-sm text-neutral-700">
            <p>Condiciones ya configuradas...</p>
          </div>
        </details>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <article key={product.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="flex aspect-[4/3] items-center justify-center bg-neutral-100">
                {product.imageUrl ? (
                  <img
                    className="h-full w-full object-contain p-3"
                    src={product.imageUrl?.replace(/^"|"$/g, '').trim()}
                    alt={product.name}
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-sm text-neutral-400">Sin imagen</span>
                )}
              </div>

              <div className="space-y-3 p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {product.brand || 'Producto'}
                  </p>

                  <h2 className="text-lg font-bold">{product.name}</h2>

                  {product.category && (
                    <p className="mt-1 text-sm font-semibold text-neutral-600">
                      Tamaño: {product.category}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xl font-black">{formatCurrency(product.price)}</p>
                    {typeof product.stock === 'number' && (
                      <p className="text-xs text-neutral-500">Stock: {product.stock}</p>
                    )}
                  </div>

                  {/* 🔥 NUEVO BLOQUE DE CANTIDAD */}
                  <div className="flex items-center gap-2">
                    <button
                      className="h-8 w-8 rounded-lg border"
                      onClick={() =>
                        setQuantities((q) => ({
                          ...q,
                          [product.id]: Math.max(1, (q[product.id] || 1) - 1)
                        }))
                      }
                      type="button"
                    >
                      -
                    </button>

                    <input
                      className="h-8 w-12 rounded-lg border text-center"
                      type="number"
                      min={1}
                      value={quantities[product.id] || 1}
                      onChange={(e) =>
                        setQuantities((q) => ({
                          ...q,
                          [product.id]: Math.max(1, Number(e.target.value))
                        }))
                      }
                    />

                    <button
                      className="h-8 w-8 rounded-lg border"
                      onClick={() =>
                        setQuantities((q) => ({
                          ...q,
                          [product.id]: (q[product.id] || 1) + 1
                        }))
                      }
                      type="button"
                    >
                      +
                    </button>

                    <button
                      className="ml-2 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
                      onClick={() => addToCart(product)}
                      type="button"
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

      <aside className="h-fit rounded-2xl bg-white p-5 shadow-sm lg:sticky lg:top-6">
        <h2 className="mb-1 text-xl font-black">Pedido</h2>
        <p className="mb-4 text-sm text-neutral-600">{totalUnits} unidades seleccionadas</p>

        {cart.length === 0 ? (
          <p className="rounded-xl bg-neutral-100 p-4 text-sm text-neutral-600">
            Todavía no agregaste productos.
          </p>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="rounded-xl border border-neutral-200 p-3">
                <div className="mb-2 flex justify-between gap-3">
                  <p className="font-semibold">{item.name}</p>
                  <p className="font-bold">{formatCurrency(item.price * item.quantity)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                  />
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                </div>
              </div>
            ))}

            <div className="border-t pt-4">
              <div className="mb-4 flex justify-between text-lg font-black">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>

              <a
                className="block rounded-xl bg-green-600 px-4 py-3 text-center font-bold text-white"
                href={`https://wa.me/?text=${buildWhatsAppText()}`}
                target="_blank"
              >
                Enviar pedido por WhatsApp
              </a>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
