'use client';

import { useMemo, useState } from 'react';
import type { CartItem, Product } from '@/lib/types';

const MIN_ORDER = 300;
const INITIAL_VISIBLE_PRODUCTS = 24;
const PRODUCTS_STEP = 24;

const DISCOUNT_TIERS = [
  { amount: 500, percent: 5 },
  { amount: 1000, percent: 8 },
  { amount: 2000, percent: 12 }
];

function formatCurrency(value: number) {
  return `USD ${value.toFixed(2)}`;
}

function productMeta(product: Product) {
  return [product.category, product.description].filter(Boolean).join(' · ');
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
  const [selectedSize, setSelectedSize] = useState('all');

  const [sortOrder, setSortOrder] = useState<'none' | 'asc' | 'desc'>('none');

  const brands = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.brand).filter(Boolean))).sort();
  }, [products]);

  // 🔥 Géneros DEPENDEN de marca + tamaño
  const categories = useMemo(() => {
    const order = ['Hombre', 'Mujer', 'Unisex', 'Desconocido'];

    const baseProducts = products.filter((product) => {
      const matchesBrand =
        selectedBrand === 'all' || product.brand === selectedBrand;

      const matchesSize =
        selectedSize === 'all' || product.description === selectedSize;

      return matchesBrand && matchesSize;
    });

    return Array.from(new Set(baseProducts.map((p) => p.category).filter(Boolean))).sort(
      (a, b) => {
        const ia = order.indexOf(String(a));
        const ib = order.indexOf(String(b));

        if (ia === -1 && ib === -1) return String(a).localeCompare(String(b));
        if (ia === -1) return 1;
        if (ib === -1) return -1;

        return ia - ib;
      }
    );
  }, [products, selectedBrand, selectedSize]);

  // 🔥 Tamaños DEPENDEN de marca + género
  const sizes = useMemo(() => {
    const baseProducts = products.filter((product) => {
      const matchesBrand =
        selectedBrand === 'all' || product.brand === selectedBrand;

      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory;

      return matchesBrand && matchesCategory;
    });

    return Array.from(
      new Set(baseProducts.map((p) => p.description).filter(Boolean))
    ).sort();
  }, [products, selectedBrand, selectedCategory]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();

    let result = products.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        [product.name, product.brand, product.category, product.description]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesBrand =
        selectedBrand === 'all' || product.brand === selectedBrand;

      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory;

      const matchesSize =
        selectedSize === 'all' || product.description === selectedSize;

      return matchesQuery && matchesBrand && matchesCategory && matchesSize;
    });

    if (sortOrder === 'asc') {
      result = [...result].sort((a, b) => a.price - b.price);
    }

    if (sortOrder === 'desc') {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, query, selectedBrand, selectedCategory, selectedSize, sortOrder]);

  function resetVisibleProducts() {
    setVisibleCount(INITIAL_VISIBLE_PRODUCTS);
  }

  return (
    <div>

      <div className="grid gap-3 md:grid-cols-4">

        {/* 🔥 MARCA */}
        <select
          value={selectedBrand}
          onChange={(e) => {
            setSelectedBrand(e.target.value);
            setSelectedCategory('all');
            setSelectedSize('all');
            resetVisibleProducts();
          }}
        >
          <option value="all">Todas las marcas</option>
          {brands.map((brand) => (
            <option key={brand}>{brand}</option>
          ))}
        </select>

        {/* 🔥 GENERO */}
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setSelectedSize('all');
            resetVisibleProducts();
          }}
        >
          <option value="all">Todos los géneros</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        {/* 🔥 TAMAÑO */}
        <select
          value={selectedSize}
          onChange={(e) => {
            setSelectedSize(e.target.value);
            resetVisibleProducts();
          }}
        >
          <option value="all">Todos los tamaños</option>
          {sizes.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as any)}
        >
          <option value="none">Ordenar</option>
          <option value="asc">Menor precio</option>
          <option value="desc">Mayor precio</option>
        </select>

      </div>

      {/* resto de tu componente queda igual */}

    </div>
  );
}
