'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CartItem, Product } from '@/lib/types';

const MIN_ORDER = 200;
const FREE_SHIPPING_AMOUNT = 200;
const INITIAL_VISIBLE_PRODUCTS = 24;
const PRODUCTS_STEP = 24;

const DISCOUNT_TIERS = [
  { amount: 300, percent: 3 },
  { amount: 500, percent: 5 },
  { amount: 1000, percent: 8 },
  { amount: 2000, percent: 12 }
];

function formatCurrency(value: number) {
  return `USD ${value.toFixed(2)}`;
}

function formatArs(value?: number) {
  if (!value || Number.isNaN(value)) return null;

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(value);
}

function getProductTotalArs(product: Product, quantity = 1) {
  if (!product.priceArs || Number.isNaN(product.priceArs)) return null;
  return product.priceArs * quantity;
}

function productMeta(product: Product) {
  return [product.mainCategory, product.category, product.description]
    .filter((value): value is string => Boolean(value))
    .join(' · ');
}

export default function CatalogClient({ products }: { products: Product[] }) {
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [lastAdded, setLastAdded] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_PRODUCTS);
  const [viewMode, setViewMode] = useState<'catalog' | 'list'>('list');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMainCategory, setSelectedMainCategory] = useState('all');
  const [selectedSize, setSelectedSize] = useState('all');
  const [sortOrder, setSortOrder] = useState<'none' | 'asc' | 'desc'>('none');

  const normalizedQuery = query.toLowerCase().trim();

  function matchesSearch(product: Product) {
    return (
      !normalizedQuery ||
      [product.name, product.brand, product.mainCategory, product.category, product.description, product.sku]
        .filter((value): value is string => Boolean(value))
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }

  function sortCategories(values: string[]) {
    const order = ['Hombre', 'Mujer', 'Unisex', 'Desconocido'];

    return values.sort((a, b) => {
      const ia = order.indexOf(String(a));
      const ib = order.indexOf(String(b));

      if (ia === -1 && ib === -1) return String(a).localeCompare(String(b));
      if (ia === -1) return 1;
      if (ib === -1) return -1;

      return ia - ib;
    });
  }

  const mainCategories = useMemo(() => {
    return Array.from(
      new Set(
        products
          .filter((product) => {
            const matchesBrand =
              selectedBrand === 'all' || product.brand === selectedBrand;

            const matchesCategory =
              selectedCategory === 'all' || product.category === selectedCategory;

            const matchesSize =
              selectedSize === 'all' || product.description === selectedSize;

            return matchesSearch(product) && matchesBrand && matchesCategory && matchesSize;
          })
          .map((p) => p.mainCategory)
          .filter((value): value is string => Boolean(value))
      )
    ).sort();
  }, [products, normalizedQuery, selectedBrand, selectedCategory, selectedSize]);

  const brands = useMemo(() => {
    return Array.from(
      new Set(
        products
          .filter((product) => {
            const matchesCategory =
              selectedCategory === 'all' || product.category === selectedCategory;

            const matchesMainCategory =
              selectedMainCategory === 'all' || product.mainCategory === selectedMainCategory;

            const matchesSize =
              selectedSize === 'all' || product.description === selectedSize;

            return matchesSearch(product) && matchesCategory && matchesMainCategory && matchesSize;
          })
          .map((p) => p.brand)
          .filter((value): value is string => Boolean(value))
      )
    ).sort();
  }, [products, normalizedQuery, selectedCategory, selectedMainCategory, selectedSize]);

  const categories = useMemo(() => {
    const availableCategories = Array.from(
      new Set(
        products
          .filter((product) => {
            const matchesBrand =
              selectedBrand === 'all' || product.brand === selectedBrand;

            const matchesMainCategory =
              selectedMainCategory === 'all' || product.mainCategory === selectedMainCategory;

            const matchesSize =
              selectedSize === 'all' || product.description === selectedSize;

            return matchesSearch(product) && matchesBrand && matchesMainCategory && matchesSize;
          })
          .map((p) => p.category)
          .filter((value): value is string => Boolean(value))
      )
    );

    return sortCategories(availableCategories);
  }, [products, normalizedQuery, selectedBrand, selectedMainCategory, selectedSize]);

  const sizes = useMemo(() => {
    return Array.from(
      new Set(
        products
          .filter((product) => {
            const matchesBrand =
              selectedBrand === 'all' || product.brand === selectedBrand;

            const matchesCategory =
              selectedCategory === 'all' || product.category === selectedCategory;

            const matchesMainCategory =
              selectedMainCategory === 'all' || product.mainCategory === selectedMainCategory;

            return matchesSearch(product) && matchesBrand && matchesCategory && matchesMainCategory;
          })
          .map((p) => p.description)
          .filter((value): value is string => Boolean(value))
      )
    ).sort();
  }, [products, normalizedQuery, selectedBrand, selectedCategory, selectedMainCategory]);

  useEffect(() => {
    if (selectedBrand !== 'all' && !brands.includes(selectedBrand)) {
      setSelectedBrand('all');
    }
  }, [brands, selectedBrand]);

  useEffect(() => {
    if (selectedMainCategory !== 'all' && !mainCategories.includes(selectedMainCategory)) {
      setSelectedMainCategory('all');
    }
  }, [mainCategories, selectedMainCategory]);

  useEffect(() => {
    if (selectedCategory !== 'all' && !categories.includes(selectedCategory)) {
      setSelectedCategory('all');
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    if (selectedSize !== 'all' && !sizes.includes(selectedSize)) {
      setSelectedSize('all');
    }
  }, [sizes, selectedSize]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const matchesBrand =
        selectedBrand === 'all' || product.brand === selectedBrand;

      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory;

      const matchesMainCategory =
        selectedMainCategory === 'all' || product.mainCategory === selectedMainCategory;

      const matchesSize =
        selectedSize === 'all' || product.description === selectedSize;

      return matchesSearch(product) && matchesBrand && matchesCategory && matchesMainCategory && matchesSize;
    });

    if (sortOrder === 'asc') {
      result = [...result].sort((a, b) => a.price - b.price);
    }

    if (sortOrder === 'desc') {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, query, selectedBrand, selectedCategory, selectedMainCategory, selectedSize, sortOrder]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMoreProducts = visibleCount < filteredProducts.length;

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalArs = cart.reduce((sum, item) => {
    const itemTotalArs = getProductTotalArs(item, item.quantity);
    return sum + (itemTotalArs || 0);
  }, 0);

  const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0);
  const meetsMinimum = total >= MIN_ORDER;
  const hasFreeShipping = total >= FREE_SHIPPING_AMOUNT;
  const freeShippingProgress = Math.min((total / FREE_SHIPPING_AMOUNT) * 100, 100);
  const minimumProgress = Math.min((total / MIN_ORDER) * 100, 100);

  const currentDiscount =
    DISCOUNT_TIERS.filter((tier) => total >= tier.amount).at(-1) || null;

  const nextDiscount =
    DISCOUNT_TIERS.find((tier) => total < tier.amount) || null;

  const discountAmount = currentDiscount
    ? total * (currentDiscount.percent / 100)
    : 0;

  const finalTotal = total - discountAmount;

  const discountAmountArs = currentDiscount && totalArs > 0
    ? totalArs * (currentDiscount.percent / 100)
    : 0;

  const finalTotalArs = totalArs - discountAmountArs;

  function resetVisibleProducts() {
    setVisibleCount(INITIAL_VISIBLE_PRODUCTS);
  }

  function getCartQuantity(productId: string) {
    return cart.find((item) => item.id === productId)?.quantity || 0;
  }

  function flashAdded(productName: string) {
    setLastAdded(productName);
    setTimeout(() => setLastAdded(''), 1800);
  }

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

    flashAdded(product.name);
  }

  function handleIncrease(product: Product) {
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

    flashAdded(product.name);
  }

  function handleDecrease(product: Product) {
    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.id === product.id);

      if (!existing) return currentCart;

      if (existing.quantity <= 1) {
        return currentCart.filter((item) => item.id !== product.id);
      }

      return currentCart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
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

  function changeProductQuantity(productId: string, quantity: number) {
    setQuantities((q) => ({
      ...q,
      [productId]: Math.max(1, quantity)
    }));
  }

  function buildWhatsAppText() {
    const lines = cart.map((item) => {
      const size = item.description ? ` (${item.description})` : '';
      const itemTotalArs = getProductTotalArs(item, item.quantity);
      const arsText = itemTotalArs ? ` / ${formatArs(itemTotalArs)}` : '';

      return `• ${item.quantity} x ${item.name}${size} - ${formatCurrency(
        item.price * item.quantity
      )}${arsText}`;
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

  const whatsappHref = `https://wa.me/5491170612311?text=${buildWhatsAppText()}`;

  return (
    <div id="top" className="relative pb-28 lg:pb-0">
      <a
        href="#top"
        className="fixed bottom-24 right-4 z-50 rounded-full bg-black px-4 py-3 text-white shadow-lg lg:bottom-6"
      >
        ↑
      </a>

      {lastAdded && (
        <div className="fixed top-4 right-4 z-50 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white shadow-lg">
          ✔ Agregado: {lastAdded}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section>
          <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
            <input
              className="mb-4 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
              placeholder="Buscar por producto, marca, categoría, género o tamaño..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                resetVisibleProducts();
              }}
            />

            <div className="grid gap-3 md:grid-cols-5">
              <select
                className="rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
                value={selectedBrand}
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  resetVisibleProducts();
                }}
              >
                <option value="all">Todas las marcas</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>

              <select
                className="rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
                value={selectedMainCategory}
                onChange={(e) => {
                  setSelectedMainCategory(e.target.value);
                  resetVisibleProducts();
                }}
              >
                <option value="all">Todas las categorías</option>
                {mainCategories.map((mainCategory) => (
                  <option key={mainCategory} value={mainCategory}>
                    {mainCategory}
                  </option>
                ))}
              </select>

              <select
                className="rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  resetVisibleProducts();
                }}
              >
                <option value="all">Todos los géneros</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                className="rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
                value={selectedSize}
                onChange={(e) => {
                  setSelectedSize(e.target.value);
                  resetVisibleProducts();
                }}
              >
                <option value="all">Todos los tamaños</option>
                {sizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>

              <select
                className="rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value as 'none' | 'asc' | 'desc');
                  resetVisibleProducts();
                }}
              >
                <option value="none">Ordenar por precio</option>
                <option value="asc">Precio: menor a mayor</option>
                <option value="desc">Precio: mayor a menor</option>
              </select>
            </div>
          </div>

          <div
            className={`mb-5 rounded-2xl border p-4 ${
              meetsMinimum
                ? 'border-green-300 bg-green-100'
                : 'border-yellow-300 bg-yellow-100'
            }`}
          >
            <p
              className={`text-center font-bold ${
                meetsMinimum ? 'text-green-800' : 'text-yellow-800'
              }`}
            >
              Compra mínima: USD 200
            </p>

            <div
              className={`mt-3 h-3 overflow-hidden rounded-full ${
                meetsMinimum ? 'bg-green-200' : 'bg-yellow-200'
              }`}
            >
              <div
                className={`h-full rounded-full transition-all ${
                  meetsMinimum ? 'bg-green-600' : 'bg-yellow-600'
                }`}
                style={{ width: `${minimumProgress}%` }}
              />
            </div>

            <p
              className={`mt-2 text-center text-sm font-semibold ${
                meetsMinimum ? 'text-green-900' : 'text-yellow-900'
              }`}
            >
              {meetsMinimum
                ? 'Ya alcanzaste el mínimo para enviar el pedido.'
                : `Te faltan ${formatCurrency(MIN_ORDER - total)} para completar el mínimo.`}
            </p>
          </div>

          <div
            className={`mb-5 rounded-2xl border p-4 ${
              hasFreeShipping
                ? 'border-green-300 bg-green-100'
                : 'border-blue-200 bg-blue-50'
            }`}
          >
            <p
              className={`text-center font-bold ${
                hasFreeShipping ? 'text-green-800' : 'text-blue-800'
              }`}
            >
              Envío gratis desde USD 200
            </p>

            <div
              className={`mt-3 h-3 overflow-hidden rounded-full ${
                hasFreeShipping ? 'bg-green-200' : 'bg-blue-100'
              }`}
            >
              <div
                className={`h-full rounded-full transition-all ${
                  hasFreeShipping ? 'bg-green-600' : 'bg-blue-500'
                }`}
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>

            <p
              className={`mt-2 text-center text-sm font-semibold ${
                hasFreeShipping ? 'text-green-900' : 'text-blue-900'
              }`}
            >
              {hasFreeShipping
                ? 'Ya tenés envío gratis en CABA/GBA.'
                : `Te faltan ${formatCurrency(FREE_SHIPPING_AMOUNT - total)} para envío gratis.`}
            </p>
          </div>

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
                ? `Te faltan ${formatCurrency(nextDiscount.amount - total)} para activar el ${nextDiscount.percent}% OFF.`
                : 'Ya alcanzaste el mayor descuento disponible.'}
            </p>
          </div>

          <details className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
            <summary className="cursor-pointer font-black">
              Condiciones de compra
            </summary>

            <div className="mt-4 space-y-3 text-sm text-neutral-700">
              <p><strong>Compra mínima:</strong> USD 200.</p>
              <p><strong>Pagos:</strong> Efectivo (CABA/GBA), Transferencia (+5%), USDT sin recargo.</p>
              <p><strong>Envíos:</strong> Gratis CABA/GBA desde USD 200. Interior a coordinar.</p>
              <p><strong>Descuentos:</strong> desde USD 300 (3%) hasta USD 2000 (12%).</p>
              <p><strong>Entrega:</strong> hasta 3 días hábiles. Stock sujeto a disponibilidad.</p>
              <p><strong>Garantía:</strong> solo productos en mal estado o abiertos.</p>
            </div>
          </details>

          <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
            <p className="mb-2 text-sm font-black text-neutral-700">
              Tipo de vista
            </p>

            <div className="grid grid-cols-2 rounded-xl border border-neutral-300 p-1">
              <button
                onClick={() => setViewMode('catalog')}
                className={`rounded-lg px-4 py-2 text-sm font-black ${
                  viewMode === 'catalog'
                    ? 'bg-black text-white'
                    : 'bg-white text-black'
                }`}
              >
                Catálogo
              </button>

              <button
                onClick={() => setViewMode('list')}
                className={`rounded-lg px-4 py-2 text-sm font-black ${
                  viewMode === 'list'
                    ? 'bg-black text-white'
                    : 'bg-white text-black'
                }`}
              >
                Lista mayorista
              </button>
            </div>
          </div>

          <p className="mb-3 text-sm text-neutral-600">
            Mostrando {visibleProducts.length} de {filteredProducts.length} productos
          </p>

          {viewMode === 'catalog' && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.map((product) => {
                const cartQty = getCartQuantity(product.id);
                const isInCart = cartQty > 0;

                return (
                  <article
                    key={product.id}
                    className={`relative overflow-hidden rounded-2xl bg-white shadow-sm ${
                      isInCart ? 'ring-2 ring-green-500' : ''
                    }`}
                  >
                    {isInCart && (
                      <div className="absolute left-3 top-3 z-10 rounded-full bg-green-600 px-3 py-1 text-xs font-black text-white shadow">
                        ✔ En pedido: {cartQty}
                      </div>
                    )}

                    <div className="flex aspect-[4/3] items-center justify-center bg-neutral-100">
                      {product.imageUrl ? (
                        <img
                          className="h-full w-full object-contain p-3"
                          src={product.imageUrl}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className="text-sm text-neutral-400">Sin imagen</span>
                      )}
                    </div>

                    <div className="space-y-3 p-4">
                      <div>
                        <p className="text-xs uppercase text-neutral-500">
                          {product.brand}
                        </p>

                        <h2 className="text-lg font-bold">{product.name}</h2>

                        {productMeta(product) && (
                          <p className="text-sm text-neutral-600">
                            {productMeta(product)}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-xl font-black">
                          {formatCurrency(product.price)}
                        </p>
                        {formatArs(product.priceArs) && (
                          <p className="text-sm font-semibold text-neutral-500">
                            {formatArs(product.priceArs)}
                          </p>
                        )}
                        <p className="text-xs text-neutral-500">
                          Stock: {product.stock}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleDecrease(product)}
                          className={`h-8 w-8 rounded border ${
                            isInCart ? 'border-green-600 text-green-700' : ''
                          }`}
                        >
                          -
                        </button>

                        <input
                          type="number"
                          className="w-12 rounded border text-center"
                          value={isInCart ? cartQty : quantities[product.id] || 1}
                          onChange={(e) => {
                            const value = Math.max(1, Number(e.target.value));
                            if (isInCart) {
                              updateQuantity(product.id, value);
                            } else {
                              changeProductQuantity(product.id, value);
                            }
                          }}
                        />

                        <button
                          onClick={() => handleIncrease(product)}
                          className="h-8 w-8 rounded border"
                        >
                          +
                        </button>

                        <button
                          onClick={() => addToCart(product)}
                          className={`rounded px-3 py-2 text-white ${
                            isInCart ? 'bg-green-700' : 'bg-black'
                          }`}
                        >
                          {isInCart ? 'Sumar cantidad' : 'Agregar'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {viewMode === 'list' && (
            <div className="rounded-2xl bg-white shadow-sm">
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-100 text-left text-xs uppercase text-neutral-500">
                    <tr>
                      <th className="p-3">Img</th>
                      <th className="p-3">Producto</th>
                      <th className="p-3">Marca</th>
                      <th className="p-3">Género / Tamaño</th>
                      <th className="p-3">Precio</th>
                      <th className="p-3">Stock</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3">Cantidad</th>
                      <th className="p-3">Agregar</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleProducts.map((product) => {
                      const cartQty = getCartQuantity(product.id);
                      const isInCart = cartQty > 0;

                      return (
                        <tr
                          key={product.id}
                          className={`border-t ${isInCart ? 'bg-green-50' : ''}`}
                        >
                          <td className="p-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="h-full w-full object-contain p-1"
                                  loading="lazy"
                                  decoding="async"
                                />
                              ) : (
                                <span className="text-xs text-neutral-400">—</span>
                              )}
                            </div>
                          </td>

                          <td className="p-3 font-bold">{product.name}</td>
                          <td className="p-3">{product.brand}</td>
                          <td className="p-3">{productMeta(product)}</td>
                          <td className="p-3 font-black">
                            <span>{formatCurrency(product.price)}</span>
                            {formatArs(product.priceArs) && (
                              <span className="block text-xs font-semibold text-neutral-500">
                                {formatArs(product.priceArs)}
                              </span>
                            )}
                          </td>
                          <td className="p-3">{product.stock}</td>

                          <td className="p-3">
                            {isInCart ? (
                              <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-black text-white">
                                En pedido: {cartQty}
                              </span>
                            ) : (
                              <span className="text-xs text-neutral-400">—</span>
                            )}
                          </td>

                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDecrease(product)}
                                className={`h-8 w-8 rounded border ${
                                  isInCart ? 'border-green-600 text-green-700' : ''
                                }`}
                              >
                                -
                              </button>

                              <input
                                type="number"
                                className="h-8 w-12 rounded border text-center"
                                value={isInCart ? cartQty : quantities[product.id] || 1}
                                onChange={(e) => {
                                  const value = Math.max(1, Number(e.target.value));
                                  if (isInCart) {
                                    updateQuantity(product.id, value);
                                  } else {
                                    changeProductQuantity(product.id, value);
                                  }
                                }}
                              />

                              <button
                                onClick={() => handleIncrease(product)}
                                className="h-8 w-8 rounded border"
                              >
                                +
                              </button>
                            </div>
                          </td>

                          <td className="p-3">
                            <button
                              onClick={() => addToCart(product)}
                              className={`rounded-lg px-3 py-2 font-bold text-white ${
                                isInCart ? 'bg-green-700' : 'bg-black'
                              }`}
                            >
                              {isInCart ? 'Sumar' : 'Agregar'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 p-3 md:hidden">
                {visibleProducts.map((product) => {
                  const cartQty = getCartQuantity(product.id);
                  const isInCart = cartQty > 0;

                  return (
                    <div
                      key={product.id}
                      className={`rounded-xl border p-3 ${
                        isInCart ? 'border-green-500 bg-green-50' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-full w-full object-contain p-1"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <span className="text-xs text-neutral-400">Sin img</span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-xs uppercase text-neutral-500">
                              {product.brand}
                            </p>

                            {isInCart && (
                              <span className="shrink-0 rounded-full bg-green-600 px-2 py-1 text-[11px] font-black text-white">
                                {cartQty} en pedido
                              </span>
                            )}
                          </div>

                          <h3 className="font-bold leading-tight">{product.name}</h3>
                          <p className="text-sm text-neutral-600">{productMeta(product)}</p>

                          <div className="mt-1 flex justify-between gap-3">
                            <div>
                              <p className="font-black">{formatCurrency(product.price)}</p>
                              {formatArs(product.priceArs) && (
                                <p className="text-xs font-semibold text-neutral-500">
                                  {formatArs(product.priceArs)}
                                </p>
                              )}
                            </div>
                            <p className="text-xs text-neutral-500">Stock: {product.stock}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => handleDecrease(product)}
                          className={`h-9 w-9 rounded border ${
                            isInCart ? 'border-green-600 text-green-700' : ''
                          }`}
                        >
                          -
                        </button>

                        <input
                          type="number"
                          className="h-9 w-14 rounded border text-center"
                          value={isInCart ? cartQty : quantities[product.id] || 1}
                          onChange={(e) => {
                            const value = Math.max(1, Number(e.target.value));
                            if (isInCart) {
                              updateQuantity(product.id, value);
                            } else {
                              changeProductQuantity(product.id, value);
                            }
                          }}
                        />

                        <button
                          onClick={() => handleIncrease(product)}
                          className="h-9 w-9 rounded border"
                        >
                          +
                        </button>

                        <button
                          onClick={() => addToCart(product)}
                          className={`ml-auto rounded-lg px-4 py-2 font-bold text-white ${
                            isInCart ? 'bg-green-700' : 'bg-black'
                          }`}
                        >
                          {isInCart ? 'Sumar' : 'Agregar'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {hasMoreProducts && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setVisibleCount((count) => count + PRODUCTS_STEP)}
                className="rounded-xl bg-black px-6 py-3 font-black text-white shadow-sm"
              >
                Ver más productos
              </button>
            </div>
          )}
        </section>

        <aside
          id="pedido"
          className="flex h-fit flex-col rounded-2xl bg-white p-5 shadow-sm lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)]"
        >
          <div className="shrink-0">
            <h2 className="mb-2 text-xl font-black">Pedido</h2>
            <p className="mb-4 text-sm">{totalUnits} unidades</p>

            {!meetsMinimum && (
              <p className="mb-3 text-center text-sm font-semibold text-red-600">
                Te faltan {formatCurrency(MIN_ORDER - total)} para completar el mínimo
              </p>
            )}
          </div>

          <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
            {cart.length === 0 && (
              <p className="rounded-xl bg-neutral-100 p-4 text-center text-sm text-neutral-600">
                Todavía no agregaste productos.
              </p>
            )}

            {cart.map((item) => (
              <div key={item.id} className="mb-3 rounded border p-3">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {item.name}
                      {item.description ? ` (${item.description})` : ''}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {formatCurrency(item.price * item.quantity)}
                      {formatArs(getProductTotalArs(item, item.quantity) || undefined) && (
                        <span className="block">
                          {formatArs(getProductTotalArs(item, item.quantity) || undefined)}
                        </span>
                      )}
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
                    className="h-8 w-8 rounded border"
                  >
                    -
                  </button>

                  <input
                    className="h-8 w-12 rounded border text-center"
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      updateQuantity(item.id, Math.max(1, Number(e.target.value)))
                    }
                  />

                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="h-8 w-8 rounded border"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 shrink-0 space-y-2 border-t bg-white pt-4">
            <p className="text-lg font-black">
              Subtotal: {formatCurrency(total)}
              {totalArs > 0 && (
                <span className="block text-sm font-semibold text-neutral-500">
                  {formatArs(totalArs)}
                </span>
              )}
            </p>

            {currentDiscount && (
              <>
                <p className="text-sm font-bold text-green-700">
                  Descuento aplicado: {currentDiscount.percent}% OFF
                </p>
                <p className="text-sm text-green-700">
                  Ahorrás {formatCurrency(discountAmount)}
                  {discountAmountArs > 0 && (
                    <span className="block">{formatArs(discountAmountArs)}</span>
                  )}
                </p>
                <p className="text-xl font-black">
                  Total final: {formatCurrency(finalTotal)}
                  {finalTotalArs > 0 && (
                    <span className="block text-sm font-semibold text-neutral-500">
                      {formatArs(finalTotalArs)}
                    </span>
                  )}
                </p>
              </>
            )}

            {!currentDiscount && nextDiscount && total > 0 && (
              <p className="text-sm font-semibold text-neutral-700">
                Agregá {formatCurrency(nextDiscount.amount - total)} más y activás {nextDiscount.percent}% OFF.
              </p>
            )}

            <p className={`text-sm font-bold ${hasFreeShipping ? 'text-green-700' : 'text-neutral-600'}`}>
              {hasFreeShipping
                ? 'Envío gratis activado'
                : total > 0
                  ? `Te faltan ${formatCurrency(FREE_SHIPPING_AMOUNT - total)} para envío gratis.`
                  : 'Envío gratis desde USD 200.'}
            </p>

            <a
              className={`mt-3 block rounded-xl py-3 text-center font-black text-white ${
                meetsMinimum ? 'bg-green-600' : 'cursor-not-allowed bg-gray-400'
              }`}
              href={meetsMinimum ? whatsappHref : undefined}
              onClick={(e) => {
                if (!meetsMinimum) e.preventDefault();
              }}
              target="_blank"
              rel="noopener noreferrer"
            >
              {meetsMinimum ? 'Confirmar pedido por WhatsApp' : 'Mínimo USD 200'}
            </a>

            {meetsMinimum && (
              <p className="text-center text-xs text-neutral-500">
                Al enviar el pedido coordinamos entrega, pago y disponibilidad final.
              </p>
            )}
          </div>
        </aside>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] lg:hidden">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-500">Pedido</p>
            <p className="font-black">
              {formatCurrency(currentDiscount ? finalTotal : total)}
              {(currentDiscount ? finalTotalArs : totalArs) > 0 && (
                <span className="block text-xs font-semibold text-neutral-500">
                  {formatArs(currentDiscount ? finalTotalArs : totalArs)}
                </span>
              )}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-neutral-500">Unidades</p>
            <p className="font-black">{totalUnits}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <a
            href="#pedido"
            className="rounded-xl border border-black py-3 text-center text-sm font-black"
          >
            Ver pedido
          </a>

          <a
            href={meetsMinimum ? whatsappHref : '#pedido'}
            onClick={(e) => {
              if (!meetsMinimum) {
                e.preventDefault();
                document.getElementById('pedido')?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start'
                });
              }
            }}
            target={meetsMinimum ? '_blank' : undefined}
            rel={meetsMinimum ? 'noopener noreferrer' : undefined}
            className={`rounded-xl py-3 text-center text-sm font-black text-white ${
              meetsMinimum ? 'bg-green-600' : 'bg-gray-400'
            }`}
          >
            {meetsMinimum ? 'Enviar' : 'Falta mínimo'}
          </a>
        </div>
      </div>
    </div>
  );
}
