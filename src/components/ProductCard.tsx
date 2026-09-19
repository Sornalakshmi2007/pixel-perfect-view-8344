import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { formatPrice, type Product } from "@/lib/shop";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const outOfStock = product.stock <= 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-shadow hover:shadow-lift">
      <Link
        to="/products/$productId"
        params={{ productId: product.id }}
        className="relative block aspect-4/3 overflow-hidden bg-muted"
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-sm text-muted-foreground">
            No image
          </div>
        )}
        <Badge
          variant={outOfStock ? "destructive" : "secondary"}
          className="absolute left-3 top-3"
        >
          {outOfStock ? "Out of stock" : `${product.stock} in stock`}
        </Badge>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {product.category}
        </span>
        <Link
          to="/products/$productId"
          params={{ productId: product.id }}
          className="font-display text-base font-semibold leading-snug"
        >
          {product.name}
        </Link>
        <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="font-display text-lg font-bold">{formatPrice(product.price)}</span>
          <Button
            size="sm"
            disabled={outOfStock}
            onClick={() =>
              addItem({
                productId: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.image_url,
                stock: product.stock,
              })
            }
          >
            {outOfStock ? "Sold out" : "Add to cart"}
          </Button>
        </div>
      </div>
    </div>
  );
}
