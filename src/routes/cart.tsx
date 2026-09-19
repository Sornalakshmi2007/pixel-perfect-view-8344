import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/shop";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — TiraneX" },
      {
        name: "description",
        content: "Review the items in your TiraneX cart, adjust quantities and head to checkout.",
      },
      { property: "og:title", content: "Your cart — TiraneX" },
      {
        property: "og:description",
        content: "Review the items in your TiraneX cart, adjust quantities and head to checkout.",
      },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, totalItems, subtotal, increment, decrement, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <div className="container-page grid min-h-[60vh] place-items-center text-center">
        <div>
          <ShoppingCart className="mx-auto size-10 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Your cart is empty</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse the catalog and add something you love.
          </p>
          <Button asChild className="mt-6">
            <Link to="/" search={{ q: "" }}>
              Start shopping
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold">Your cart</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {totalItems} {totalItems === 1 ? "item" : "items"}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={item.productId}
              className="flex gap-4 rounded-xl border border-border bg-card p-4 shadow-card"
            >
              <Link
                to="/products/$productId"
                params={{ productId: item.productId }}
                className="size-24 shrink-0 overflow-hidden rounded-md bg-muted"
              >
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.name} className="size-full object-cover" />
                )}
              </Link>

              <div className="flex flex-1 flex-col">
                <Link
                  to="/products/$productId"
                  params={{ productId: item.productId }}
                  className="font-display font-semibold"
                >
                  {item.name}
                </Link>
                <span className="text-sm text-muted-foreground">
                  {formatPrice(item.price)} each · {item.stock} in stock
                </span>

                <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                  <div className="flex items-center rounded-md border border-border">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Decrease quantity"
                      onClick={() => decrement(item.productId)}
                    >
                      <Minus className="size-4" />
                    </Button>
                    <span className="w-9 text-center text-sm font-semibold">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Increase quantity"
                      disabled={item.quantity >= item.stock}
                      onClick={() => increment(item.productId)}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => removeItem(item.productId)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-bold">Order summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Total items</dt>
              <dd className="font-medium">{totalItems}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="font-medium">{subtotal >= 2000 ? "Free" : formatPrice(99)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base">
              <dt className="font-semibold">Total</dt>
              <dd className="font-display font-bold">
                {formatPrice(subtotal >= 2000 ? subtotal : subtotal + 99)}
              </dd>
            </div>
          </dl>
          <Button asChild size="lg" className="mt-6 w-full">
            <Link to="/checkout">Proceed to checkout</Link>
          </Button>
          <Button asChild variant="ghost" className="mt-2 w-full">
            <Link to="/" search={{ q: "" }}>
              Continue shopping
            </Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
