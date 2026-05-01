export type Product = {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  description?: string;
  price: number;
  stock?: number;
  imageUrl?: string;
  sku?: string;
};

export type CartItem = Product & {
  quantity: number;
};
