export type Product = {
  id: string;
  name: string;
  brand?: string;
  category?: string; // esto sigue siendo el género
  mainCategory?: string; // NUEVO: Perfumería, Cremas y cosmética, Vapeadores
  description?: string;
  price: number;
  priceArs?: number;
  stock?: number;
  imageUrl?: string;
  sku?: string;
};

export type CartItem = Product & {
  quantity: number;
};
