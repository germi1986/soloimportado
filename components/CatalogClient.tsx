'use client';

import { useMemo, useState } from 'react';
import type { CartItem, Product } from '@/lib/types';

const MIN_ORDER = 300;

const DISCOUNT_TIERS = [
  { amount: 500, percent: 5 },
  { amount: 1000, percent: 8 },
  { amount: 2000, percent: 12 }
];

function formatCurrency(value: number) {
  return `USD ${value.toFixed(2)}`;
}

export default function CatalogClient({ products }: { products: Product[] }) {
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [lastAdded, setLastAdded] = useState<string>('');

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
  const meetsMinimum = total >= MIN_ORDER;

  const minimumProgress = Math.min((total / MIN_ORDER) * 100, 100);

  const currentDiscount =
    DISCOUNT_TIERS.filter((tier) => total >= tier.amount).at(-1) || null;

  const nextDiscount =
    DISCOUNT_TIERS.find((tier) => total < tier.amount) || null;

  const discountAmount = currentDiscount
    ? total * (currentDiscount.percent / 100)
    : 0;

  const finalTotal = total - discountAmount;

  function addToCart(product: Product) {
    const qty = Math.max(1, quantities[product.id] || 1);

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

    setLastAdded(product.name);
    setTimeout(() => setLastAdded(''), 1800);
  }

  function addOneQuick(product: Product) {
    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.id === product.id);

      if (existing) {
        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...currentCart, { ...product, quantity: 1 }];
    });

    setLastAdded(product.name);
    setTimeout(() => setLastAdded(''), 1800);
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
      return `• ${item.quantity} x ${item.name}${size} - ${formatCurrency(
        item.price * item.quantity
      )}`;
    });

    const discountLine = currentDiscount
      ? `\nDescuento estimado: ${currentDiscount.percent}% (-${formatCurrency(
          discountAmount
        )})\nTotal final estimado: ${formatCurrency(finalTotal)}`
      : '';

    return encodeURIComponent(
      `Hola, quiero hacer este pedido mayorista:\n\n${lines.join(
        '\n'
      )}\n\nSubtotal: ${formatCurrency(total)}${discountLine}`
    );
  }

  return (
    <div className="relative grid gap-6 lg:grid-cols-[1fr_360px]">

      {lastAdded && (
        <div className="fixed top-4 right-4 z-50 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white shadow-lg">
          ✔ Agregado: {lastAdded}
        </div>
      )}

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

        {/* 🚨 MÍNIMO + PROGRESO */}
        <div className="mb-5 rounded-2xl bg-yellow-100 border border-yellow-300 p-4">
          <p className="text-center font-bold text-yellow-800">
            Compra mínima: USD 300
          </p>

          <div className="mt-3 h-3 overflow-hidden rounded-full bg-yellow-200">
            <div
              className="h-full rounded-full bg-yellow-600 transition-all"
              style={{ width: `${minimumProgress}%` }}
            />
          </div>

          <p className="mt-2 text-center text-sm font-semibold text-yellow-900">
            {meetsMinimum
              ? 'Ya alcanzaste el mínimo para enviar el pedido.'
              : `Te faltan ${formatCurrency(MIN_ORDER - total)} para completar el mínimo.`}
          </p>
        </div>

        {/* 🎁 DESCUENTOS DINÁMICOS */}
        <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
          <p className="font-black">Descuentos por volumen</p>

          <div className="mt-3 grid gap-2 text-sm">
            {DISCOUNT_TIERS.map((tier) => (
              <div
                key={tier.amount}
                className={`flex justify-between rounded-xl border p-3 ${
                  total >= tier.amount
                    ? 'border-green-400 bg-green-50 text-green-800'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-600'
                }`}
              >
                <span>Desde {formatCurrency(tier.amount)}</span>
                <strong>{tier.percent}% OFF</strong>
              </div>
            ))}
          </div>

          <p className="mt-3 text-sm font-semibold">
            {nextDiscount
              ? `Te faltan ${formatCurrency(
                  nextDiscount.amount - total
                )} para activar el ${nextDiscount.percent}% OFF.`
              : 'Ya alcanzaste el mayor descuento disponible.'}
          </p>
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

                <div>
                  <p className="text-xl font-black">
                    {formatCurrency(product.price)}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Stock: {product.stock}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
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
                    className="w-12 text-center border rounded"
                    value={quantities[product.id] || 1}
                    onChange={(e) =>
                      setQuantities((q) => ({
                        ...q,
                        [product.id]: Math.max(1, Number(e.target.value))
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
                    className="bg-black text-white px-3 py-2 rounded"
                  >
                    Agregar
                  </button>

                  <button
                    onClick={() => addOneQuick(product)}
                    className="border border-black px-3 py-2 rounded text-sm font-bold"
                  >
                    +1 rápido
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 🛒 CARRITO */}
      <aside className="bg-white p-5 rounded-2xl shadow-sm h-fit lg:sticky lg:top-4">
        <h2 className="font-black text-xl mb-2">Pedido</h2>
        <p className="text-sm mb-4">{totalUnits} unidades</p>

        {!meetsMinimum && (
          <p className="mb-3 text-sm text-red-600 text-center font-semibold">
            Te faltan {formatCurrency(MIN_ORDER - total)} para completar el mínimo
          </p>
        )}

        {cart.length === 0 && (
          <p className="rounded-xl bg-neutral-100 p-4 text-center text-sm text-neutral-600">
            Todavía no agregaste productos.
          </p>
        )}

        {cart.map((item) => (
          <div key={item.id} className="mb-3 border p-3 rounded">

            <div className="flex justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {item.name}
                  {item.category ? ` (${item.category})` : ''}
                </p>
                <p className="text-sm text-neutral-500">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>

              <button
                onClick={() => updateQuantity(item.id, 0)}
                className="text-red-500"
              >
                ✕
              </button>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="h-8 w-8 border rounded"
              >
                -
              </button>

              <input
                className="h-8 w-12 border rounded text-center"
                type="number"
                value={item.quantity}
                onChange={(e) =>
                  updateQuantity(item.id, Math.max(1, Number(e.target.value)))
                }
              />

              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="h-8 w-8 border rounded"
              >
                +
              </button>
            </div>

          </div>
        ))}

        <div className="border-t pt-4 space-y-2">
          <p className="font-black text-lg">
            Subtotal: {formatCurrency(total)}
          </p>

          {currentDiscount && (
            <>
              <p className="text-sm font-bold text-green-700">
                Descuento aplicado: {currentDiscount.percent}% OFF
              </p>
              <p className="text-sm text-green-700">
                Ahorrás {formatCurrency(discountAmount)}
              </p>
              <p className="font-black text-xl">
                Total final: {formatCurrency(finalTotal)}
              </p>
            </>
          )}

          {!currentDiscount && nextDiscount && total > 0 && (
            <p className="text-sm font-semibold text-neutral-700">
              Agregá {formatCurrency(nextDiscount.amount - total)} más y activás {nextDiscount.percent}% OFF.
            </p>
          )}

          <a
            className={`block mt-3 text-white text-center py-3 rounded-xl font-black ${
              meetsMinimum ? 'bg-green-600' : 'bg-gray-400 cursor-not-allowed'
            }`}
            href={meetsMinimum ? `https://wa.me/5491170612311?text=${buildWhatsAppText()}` : undefined}
            onClick={(e) => {
              if (!meetsMinimum) e.preventDefault();
            }}
            target="_blank"
            rel="noopener noreferrer"
          >
            {meetsMinimum ? 'Confirmar pedido por WhatsApp' : 'Mínimo USD 300'}
          </a>

          {meetsMinimum && (
            <p className="text-center text-xs text-neutral-500">
              Al enviar el pedido coordinamos entrega, pago y disponibilidad final.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
