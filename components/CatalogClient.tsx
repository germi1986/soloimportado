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
    const q = query.toLowerCase().trim();
    if (!q) return products;

    return products.filter((p) =>
      [p.name, p.brand, p.category].join(' ').toLowerCase().includes(q)
    );
  }, [products, query]);

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalUnits = cart.reduce((s, i) => s + i.quantity, 0);
  const meetsMinimum = total >= MIN_ORDER;

  // 🔥 DESCUENTOS
  let discount = 0;
  if (total >= 2000) discount = 0.12;
  else if (total >= 1500) discount = 0.10;
  else if (total >= 1000) discount = 0.07;
  else if (total >= 500) discount = 0.05;

  const totalWithDiscount = total * (1 - discount);

  function addToCart(product: Product) {
    const qty = quantities[product.id] || 1;

    setCart((c) => {
      const existing = c.find((i) => i.id === product.id);

      if (existing) {
        return c.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + qty } : i
        );
      }

      return [...c, { ...product, quantity: qty }];
    });
  }

  function updateQuantity(id: string, qty: number) {
    if (qty <= 0) return setCart((c) => c.filter((i) => i.id !== id));

    setCart((c) =>
      c.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
    );
  }

  function clearCart() {
    setCart([]);
  }

  function buildWhatsAppText() {
    const lines = cart.map(
      (i) =>
        `• ${i.quantity} x ${i.name} (${i.category}) - ${formatCurrency(
          i.price * i.quantity
        )}`
    );

    return encodeURIComponent(
      `Hola! Quiero hacer este pedido:\n\n${lines.join(
        '\n'
      )}\n\nTotal: ${formatCurrency(totalWithDiscount)}\n\nForma de pago:\nDirección:\nHorario:`
    );
  }

  const progress = Math.min((total / MIN_ORDER) * 100, 100);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section>

        {/* 🔍 BUSCADOR */}
        <input
          className="mb-5 w-full border p-3 rounded"
          placeholder="Buscar..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {/* 🔥 BARRA PROGRESO */}
        <div className="mb-5">
          <div className="h-3 bg-gray-200 rounded">
            <div
              className="h-3 bg-green-500 rounded"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm mt-1">
            {formatCurrency(total)} / {formatCurrency(MIN_ORDER)}
          </p>
        </div>

        {/* 🧱 PRODUCTOS */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((p) => (
            <div key={p.id} className="border rounded p-3">
              <img src={p.imageUrl} className="h-40 object-contain w-full" />

              <p className="text-xs">{p.brand}</p>
              <h2 className="font-bold">{p.name}</h2>
              <p className="text-sm">{p.category}</p>

              <p className="font-black">{formatCurrency(p.price)}</p>

              <div className="flex gap-2 mt-2">
                <button onClick={() =>
                  setQuantities(q => ({...q,[p.id]:Math.max(1,(q[p.id]||1)-1)}))
                }>-</button>

                <input
                  value={quantities[p.id] || 1}
                  onChange={(e) =>
                    setQuantities(q => ({...q,[p.id]:Number(e.target.value)}))
                  }
                  className="w-10 text-center border"
                />

                <button onClick={() =>
                  setQuantities(q => ({...q,[p.id]:(q[p.id]||1)+1}))
                }>+</button>

                <button onClick={() => addToCart(p)}>
                  Agregar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🛒 CARRITO */}
      <aside className="border p-4 rounded">
        <h2>Pedido ({totalUnits})</h2>

        <button onClick={clearCart} className="text-red-500 text-sm">
          Vaciar carrito
        </button>

        {cart.map((i) => (
          <div key={i.id} className="border p-2 mt-2">
            <p>{i.name}</p>
            <p>{formatCurrency(i.price * i.quantity)}</p>

            <div className="flex gap-2">
              <button onClick={() => updateQuantity(i.id, i.quantity - 1)}>-</button>
              <input value={i.quantity} onChange={(e)=>updateQuantity(i.id,Number(e.target.value))}/>
              <button onClick={() => updateQuantity(i.id, i.quantity + 1)}>+</button>
            </div>
          </div>
        ))}

        <p className="mt-3">Total: {formatCurrency(total)}</p>

        {discount > 0 && (
          <p className="text-green-600">
            Descuento aplicado: {(discount * 100).toFixed(0)}%
          </p>
        )}

        <p className="font-bold">
          Final: {formatCurrency(totalWithDiscount)}
        </p>

        <a
          className={`block mt-3 text-center py-2 ${
            meetsMinimum ? 'bg-green-600 text-white' : 'bg-gray-400'
          }`}
          href={meetsMinimum ? `https://wa.me/54911XXXXXXXX?text=${buildWhatsAppText()}` : undefined}
        >
          {meetsMinimum ? 'Enviar pedido por WhatsApp' : 'Mínimo USD 300'}
        </a>
      </aside>

      {/* 📱 STICKY MOBILE */}
      <div className="fixed bottom-0 left-0 right-0 bg-white p-3 shadow lg:hidden">
        <p>{totalUnits} unidades - {formatCurrency(total)}</p>
      </div>
    </div>
  );
}
