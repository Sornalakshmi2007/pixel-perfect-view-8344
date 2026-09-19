import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, PackageOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth } from "@/components/RequireAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, formatPrice, type Order } from "@/lib/shop";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { title: "My orders — TiraneX" },
      {
        name: "description",
        content: "View your TiraneX order history with dates, status and totals.",
      },
      { property: "og:title", content: "My orders — TiraneX" },
      {
        property: "og:description",
        content: "View your TiraneX order history with dates, status and totals.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <OrdersPage />
    </RequireAuth>
  ),
});

function OrdersPage() {
  const { user } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["orders", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="container-page py-24 text-center text-sm text-destructive">
        We couldn't load your orders. Please refresh and try again.
      </p>
    );
  }

  const orders = data ?? [];

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold">My orders</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {orders.length} {orders.length === 1 ? "order" : "orders"} placed
      </p>

      {orders.length === 0 ? (
        <div className="mt-16 grid place-items-center gap-3 text-center">
          <PackageOpen className="size-9 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">You haven't placed any orders yet.</p>
          <Button asChild className="mt-2">
            <Link to="/" search={{ q: "" }}>
              Start shopping
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((order) => (
            <li
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-card"
            >
              <div>
                <p className="font-mono text-xs text-muted-foreground">
                  #{order.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="mt-1 font-display font-semibold">{formatDate(order.created_at)}</p>
                <p className="text-sm text-muted-foreground">
                  Delivering to {order.city}, {order.state}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="capitalize">
                  {order.status}
                </Badge>
                <span className="font-display font-bold">{formatPrice(order.total_amount)}</span>
                <Button asChild variant="outline" size="sm">
                  <Link to="/orders/$orderId" params={{ orderId: order.id }}>
                    Details
                  </Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
