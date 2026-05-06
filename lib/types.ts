export type Product = {
  id: string;
  name: string;
  brand?: string;
  category?: string; // esto sigue siendo el género
  mainCategory?: string; // 👈 NUEVO (Perfumería, Cremas, Vapeadores)
  description?: string;
  price: number;
  priceArs?: number;
  stock?: number;
  imageUrl?: string;
  sku?: string;
};
