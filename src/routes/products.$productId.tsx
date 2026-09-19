import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Minus, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { formatPrice, type Product } from "@/lib/shop";

export const Route = createFileRoute("/products/$productId")({
  head: () => ({
    meta: [
      { title: "Product details — TiraneX" },
      {
        name: "description",
        content: "See full product details, price, stock and description before adding to cart.",
      },
      { property: "og:title", content: "Product details — TiraneX" },
      {
        property: "og:description",
        content: "See full product details, price, stock and description before adding to cart.",
      },
    ],
  }),
  component: ProductDetails,
});

function ProductDetails() {
  const { productId } = Route.useParams();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .maybeSingle();
      if (error) throw error;
      return data as Product | null;
    },
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-page grid min-h-[60vh] place-items-center text-center">
        <div>
          <h1 className="text-2xl font-bold">Product not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This product may have been removed from the catalog.
          </p>
          <Button asChild className="mt-6">
            <Link to="/" search={{ q: "" }}>
              Back to shop
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const outOfStock = product.stock <= 0;

  return (
    <div className="container-page py-10">
      <Link
        to="/"
        search={{ q: "" }}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to products
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-border bg-muted shadow-card">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="aspect-4/3 w-full object-cover"
            />
          ) : (
            <div className="grid aspect-4/3 w-full place-items-center text-muted-foreground">
              No image
            </div>
          )}
        </div>

        <div>
          <Badge variant="secondary">{product.category}</Badge>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{product.name}</h1>
          <p className="mt-4 font-display text-3xl font-bold">{formatPrice(product.price)}</p>
          <p className="mt-2 text-sm font-medium">
            {outOfStock ? (
              <span className="text-destructive">Out of stock</span>
            ) : (
              <span className="text-success">In stock — {product.stock} available</span>
            )}
          </p>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center rounded-md border border-border">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Decrease quantity"
                disabled={quantity <= 1}
                onClick={() => setQuantity((n) => Math.max(1, n - 1))}
              >
                <Minus className="size-4" />
              </Button>
              <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Increase quantity"
                disabled={quantity >= product.stock}
                onClick={() => setQuantity((n) => Math.min(product.stock, n + 1))}
              >
                <Plus className="size-4" />
              </Button>
            </div>

            <Button
              size="lg"
              disabled={outOfStock}
              onClick={() =>
                addItem(
                  {
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    imageUrl: product.image_url,
                    stock: product.stock,
                  },
                  quantity,
                )
              }
            >
              {outOfStock ? "Sold out" : "Add to cart"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
