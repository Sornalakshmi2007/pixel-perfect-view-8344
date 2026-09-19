import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  stock: number;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};

const STORAGE_KEY = "tiranex.cart.v1";

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore malformed cart */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const addItem: CartContextValue["addItem"] = (item, quantity = 1) => {
      if (item.stock <= 0) {
        toast.error("This product is out of stock.");
        return;
      }
      setItems((current) => {
        const existing = current.find((c) => c.productId === item.productId);
        const requested = (existing?.quantity ?? 0) + quantity;
        if (requested > item.stock) {
          toast.error(`Only ${item.stock} left in stock.`);
          return existing
            ? current.map((c) =>
                c.productId === item.productId ? { ...c, quantity: item.stock } : c,
              )
            : [...current, { ...item, quantity: item.stock }];
        }
        toast.success(`${item.name} added to cart`);
        return existing
          ? current.map((c) =>
              c.productId === item.productId ? { ...c, quantity: requested, stock: item.stock } : c,
            )
          : [...current, { ...item, quantity }];
      });
    };

    const setQuantity: CartContextValue["setQuantity"] = (productId, quantity) => {
      setItems((current) =>
        current.flatMap((c) => {
          if (c.productId !== productId) return [c];
          if (quantity <= 0) return [];
          if (quantity > c.stock) {
            toast.error(`Only ${c.stock} left in stock.`);
            return [{ ...c, quantity: c.stock }];
          }
          return [{ ...c, quantity }];
        }),
      );
    };

    return {
      items,
      totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: items.reduce((sum, i) => sum + i.quantity * i.price, 0),
      addItem,
      setQuantity,
      increment: (productId) => {
        const item = items.find((i) => i.productId === productId);
        if (item) setQuantity(productId, item.quantity + 1);
      },
      decrement: (productId) => {
        const item = items.find((i) => i.productId === productId);
        if (item) setQuantity(productId, item.quantity - 1);
      },
      removeItem: (productId) =>
        setItems((current) => current.filter((c) => c.productId !== productId)),
      clearCart: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
