'use client';

import { useMemo, useState } from 'react';
import type { CartItem, Product } from '@/lib/types';

const MIN_ORDER = 300;

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
      [product.name, product.brand, product.category]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [products, query]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0);
  const meetsMinimum = total >= MIN_ORDER;
  const progress = Math.min((total / MIN_ORDER) * 100, 100);

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

  function clearCart() {
    setCart([]);
  }

  function buildWhatsAppText() {
    const lines = cart.map((item) => {
      const size = item.category ? ` (${item.category})` : '';
      return `• ${item.quantity} x ${item.name}${size} - ${formatCurrency(item.price * item.quantity)}`;
    });

    return encodeURIComponent(
      `Hola! Quiero hacer este pedido:\n\n${lines.join('\n')}\n\nTotal: ${formatCurrency(total)}\n\nForma de pago:\nDirección:\nHorario:`
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section>

        {/* BUSCADOR */}
        <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
          <input
            className="w-full rounded-xl border px-4 py-3"
            placeholder="Buscar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* MINIMO */}
        <div className="mb-5 rounded-2xl bg-yellow-100 p-3 text-center">
          Compra mínima: USD 300
        </div>

        {/* PRODUCTOS */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <article key={product.id} className="bg-white p-3 rounded shadow">

              <img
                src={product.imageUrl}
                className="h-40 w-full object-contain"
              />

              <p className="text-xs">{product.brand}</p>
              <h2 className="font-bold">{product.name}</h2>
              <p>{product.category}</p>

              <p className="font-black">{formatCurrency(product.price)}</p>

              <div className="flex gap-2 mt-2">
                <button onClick={() =>
                  setQuantities(q => ({...q,[product.id]:Math.max(1,(q[product.id]||1)-1)}))
                }>-</button>

                <input
                  value={quantities[product.id] || 1}
                  onChange={(e) =>
                    setQuantities(q => ({...q,[product.id]:Number(e.target.value)}))
                  }
                  className="w-10 text-center border"
                />

                <button onClick={() =>
                  setQuantities(q => ({...q,[product.id]:(q[product.id]||1)+1}))
                }>+</button>

                <button onClick={() => addToCart(product)}>
                  Agregar
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CARRITO */}
      <aside className="bg-white p-4 rounded shadow">

        <h2>Pedido ({totalUnits})</h2>

        {/* PROGRESO */}
        <div className="my-3">
          <div className="h-2 bg-gray-200 rounded">
            <div
              className="h-2 bg-green-600"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs mt-1">
            {formatCurrency(total)} / {formatCurrency(MIN_ORDER)}
          </p>
        </div>

        <button onClick={clearCart} className="text-red-500 text-sm">
          Vaciar carrito
        </button>

        {cart.map((item) => (
          <div key={item.id} className="border p-2 mt-2">
            <p>{item.name} ({item.category})</p>
            <p>{formatCurrency(item.price * item.quantity)}</p>

            <div className="flex gap-2">
              <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
              <input value={item.quantity} onChange={(e)=>updateQuantity(item.id,Number(e.target.value))}/>
              <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
            </div>
          </div>
        ))}

        <p className="mt-3 font-bold">
          Total: {formatCurrency(total)}
        </p>

        {!meetsMinimum && (
          <p className="text-red-500 text-sm">
            Te faltan {formatCurrency(MIN_ORDER - total)}
          </p>
        )}

        <a
          className={`block mt-3 text-center py-2 ${
            meetsMinimum ? 'bg-green-600 text-white' : 'bg-gray-400'
          }`}
          href={meetsMinimum ? `https://wa.me/54911XXXXXXXX?text=${buildWhatsAppText()}` : undefined}
        >
          {meetsMinimum ? 'Enviar pedido' : 'Mínimo USD 300'}
        </a>

      </aside>
    </div>
  );
}
