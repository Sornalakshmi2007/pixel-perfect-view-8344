import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth } from "@/components/RequireAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatPrice, type Order, type OrderItem } from "@/lib/shop";

export const Route = createFileRoute("/orders/$orderId")({
  head: () => ({
    meta: [
      { title: "Order details — TiraneX" },
      {
        name: "description",
        content: "See the items, delivery address, status and total for this TiraneX order.",
      },
      { property: "og:title", content: "Order details — TiraneX" },
      {
        property: "og:description",
        content: "See the items, delivery address, status and total for this TiraneX order.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <OrderDetailsPage />
    </RequireAuth>
  ),
});

function OrderDetailsPage() {
  const { orderId } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const [orderResult, itemsResult] = await Promise.all([
        supabase.from("orders").select("*").eq("id", orderId).maybeSingle(),
        supabase.from("order_items").select("*").eq("order_id", orderId),
      ]);
      if (orderResult.error) throw orderResult.error;
      if (itemsResult.error) throw itemsResult.error;
      return {
        order: orderResult.data as Order | null,
        items: (itemsResult.data ?? []) as OrderItem[],
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data?.order) {
    return (
      <div className="container-page grid min-h-[60vh] place-items-center text-center">
        <div>
          <h1 className="text-2xl font-bold">Order not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This order doesn't exist or belongs to another account.
          </p>
          <Button asChild className="mt-6">
            <Link to="/orders">Back to my orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { order, items } = data;
  const itemsTotal = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  return (
    <div className="container-page py-10">
      <Link
        to="/orders"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to my orders
      </Link>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed on {formatDate(order.created_at)}
          </p>
        </div>
        <Badge variant="secondary" className="capitalize">
          {order.status}
        </Badge>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-bold">Items</h2>
          <ul className="mt-4 divide-y divide-border">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(item.unit_price)} × {item.quantity}
                  </p>
                </div>
                <span className="font-display font-semibold">
                  {formatPrice(item.unit_price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Items subtotal</dt>
              <dd>{formatPrice(itemsTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd>
                {order.total_amount - itemsTotal <= 0
                  ? "Free"
                  : formatPrice(order.total_amount - itemsTotal)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base">
              <dt className="font-semibold">Total amount</dt>
              <dd className="font-display font-bold">{formatPrice(order.total_amount)}</dd>
            </div>
          </dl>
        </div>

        <aside className="h-fit rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-bold">Delivery address</h2>
          <address className="mt-3 space-y-1 text-sm not-italic text-muted-foreground">
            <p className="font-medium text-foreground">{order.customer_name}</p>
            <p>{order.address}</p>
            <p>
              {order.city}, {order.state} {order.pincode}
            </p>
            <p>{order.phone}</p>
            <p>{order.email}</p>
          </address>
        </aside>
      </div>
    </div>
  );
}
