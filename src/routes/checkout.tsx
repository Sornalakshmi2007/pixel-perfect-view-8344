import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/shop";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — TiraneX" },
      {
        name: "description",
        content: "Enter your delivery details and place your TiraneX order securely.",
      },
      { property: "og:title", content: "Checkout — TiraneX" },
      {
        property: "og:description",
        content: "Enter your delivery details and place your TiraneX order securely.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <CheckoutPage />
    </RequireAuth>
  ),
});

type Form = {
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

function CheckoutPage() {
  const { user } = useAuth();
  const { items, totalItems, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const shipping = subtotal >= 2000 ? 0 : 99;
  const total = subtotal + shipping;

  const [form, setForm] = useState<Form>({
    customer_name: "",
    email: user?.email ?? "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [placing, setPlacing] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("profiles")
      .select("full_name, phone, address, city, state, pincode, email")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setForm((current) => ({
          customer_name: current.customer_name || (data.full_name ?? ""),
          email: current.email || (data.email ?? user.email ?? ""),
          phone: current.phone || (data.phone ?? ""),
          address: current.address || (data.address ?? ""),
          city: current.city || (data.city ?? ""),
          state: current.state || (data.state ?? ""),
          pincode: current.pincode || (data.pincode ?? ""),
        }));
      });
  }, [user?.id, user?.email]);

  const validate = () => {
    const next: Partial<Record<keyof Form, string>> = {};
    if (form.customer_name.trim().length < 2) next.customer_name = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      next.email = "Enter a valid email address.";
    if (!/^\d{10}$/.test(form.phone.trim())) next.phone = "Enter a 10-digit phone number.";
    if (form.address.trim().length < 6) next.address = "Enter your full street address.";
    if (form.city.trim().length < 2) next.city = "Enter your city.";
    if (form.state.trim().length < 2) next.state = "Enter your state.";
    if (!/^\d{6}$/.test(form.pincode.trim())) next.pincode = "Enter a 6-digit pincode.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const placeOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    if (items.length === 0) return;

    setPlacing(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user!.id,
          customer_name: form.customer_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          pincode: form.pincode.trim(),
          total_amount: total,
          status: "pending",
        })
        .select("id")
        .single();
      if (orderError) throw orderError;

      const { error: itemsError } = await supabase.from("order_items").insert(
        items.map((item) => ({
          order_id: order.id,
          product_id: item.productId,
          product_name: item.name,
          unit_price: item.price,
          quantity: item.quantity,
        })),
      );
      if (itemsError) throw itemsError;

      clearCart();
      setPlacedOrderId(order.id);
    } catch {
      toast.error("We couldn't place your order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  if (placedOrderId) {
    return (
      <div className="container-page grid min-h-[70vh] place-items-center py-12 text-center">
        <div className="max-w-md rounded-xl border border-border bg-card p-8 shadow-card">
          <CheckCircle2 className="mx-auto size-12 text-success" />
          <h1 className="mt-4 text-2xl font-bold">Order placed successfully</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Thank you, {form.customer_name.split(" ")[0]}! Your order has been saved and is now
            pending confirmation.
          </p>
          <p className="mt-4 rounded-md bg-secondary px-3 py-2 text-xs">
            Order ID: <span className="font-mono">{placedOrderId}</span>
          </p>
          <div className="mt-6 grid gap-2">
            <Button asChild>
              <Link to="/orders/$orderId" params={{ orderId: placedOrderId }}>
                View order details
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/" search={{ q: "" }}>
                Continue shopping
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-page grid min-h-[60vh] place-items-center text-center">
        <div>
          <h1 className="text-2xl font-bold">Your cart is empty</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Add a few products before checking out.
          </p>
          <Button className="mt-6" onClick={() => navigate({ to: "/", search: { q: "" } })}>
            Browse products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <form
          onSubmit={placeOrder}
          className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-card"
        >
          <h2 className="font-display text-lg font-bold">Delivery details</h2>

          <Field
            id="customer_name"
            label="Full name"
            value={form.customer_name}
            error={errors.customer_name}
            onChange={(v) => setForm({ ...form, customer_name: v })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="email"
              label="Email"
              type="email"
              value={form.email}
              error={errors.email}
              onChange={(v) => setForm({ ...form, email: v })}
            />
            <Field
              id="phone"
              label="Phone"
              value={form.phone}
              error={errors.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
            />
          </div>
          <Field
            id="address"
            label="Address"
            value={form.address}
            error={errors.address}
            onChange={(v) => setForm({ ...form, address: v })}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              id="city"
              label="City"
              value={form.city}
              error={errors.city}
              onChange={(v) => setForm({ ...form, city: v })}
            />
            <Field
              id="state"
              label="State"
              value={form.state}
              error={errors.state}
              onChange={(v) => setForm({ ...form, state: v })}
            />
            <Field
              id="pincode"
              label="Pincode"
              value={form.pincode}
              error={errors.pincode}
              onChange={(v) => setForm({ ...form, pincode: v })}
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={placing}>
            {placing && <Loader2 className="mr-2 size-4 animate-spin" />}
            Place order · {formatPrice(total)}
          </Button>
        </form>

        <aside className="h-fit rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-bold">Order summary</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {items.map((item) => (
              <li key={item.productId} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {item.name} × {item.quantity}
                </span>
                <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Total items</dt>
              <dd>{totalItems}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base">
              <dt className="font-semibold">Total amount</dt>
              <dd className="font-display font-bold">{formatPrice(total)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
