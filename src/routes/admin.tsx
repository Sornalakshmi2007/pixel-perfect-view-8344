import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { CATEGORIES, formatPrice, type Product } from "@/lib/shop";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Product management — TiraneX" },
      {
        name: "description",
        content: "Admin area to add, edit and remove TiraneX products, prices, stock and category.",
      },
      { property: "og:title", content: "Product management — TiraneX" },
      {
        property: "og:description",
        content: "Admin area to add, edit and remove TiraneX products, prices, stock and category.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <AdminPage />
    </RequireAuth>
  ),
});

type Draft = {
  id?: string;
  name: string;
  description: string;
  price: string;
  category: string;
  stock: string;
  image_url: string;
};

const emptyDraft: Draft = {
  name: "",
  description: "",
  price: "",
  category: "Electronics",
  stock: "0",
  image_url: "",
};

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const saveMutation = useMutation({
    mutationFn: async (values: Draft) => {
      const payload = {
        name: values.name.trim(),
        description: values.description.trim(),
        price: Number(values.price),
        category: values.category,
        stock: Number(values.stock),
        image_url: values.image_url.trim() || null,
      };
      if (values.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Product saved");
      setDraft(null);
      invalidate();
    },
    onError: () => toast.error("We couldn't save the product. Please try again."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product deleted");
      invalidate();
    },
    onError: () => toast.error("We couldn't delete the product. Please try again."),
  });

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container-page grid min-h-[60vh] place-items-center text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-bold">Admin access only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account doesn't have product management access. Ask an administrator to grant you
            the admin role.
          </p>
        </div>
      </div>
    );
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    if (draft.name.trim().length < 2) {
      toast.error("Enter a product name.");
      return;
    }
    if (!(Number(draft.price) > 0)) {
      toast.error("Enter a price greater than zero.");
      return;
    }
    if (!Number.isInteger(Number(draft.stock)) || Number(draft.stock) < 0) {
      toast.error("Stock must be a whole number.");
      return;
    }
    saveMutation.mutate(draft);
  };

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Product management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add, edit and remove products in the catalog.
          </p>
        </div>
        <Button onClick={() => setDraft(emptyDraft)}>
          <Plus className="mr-2 size-4" /> Add product
        </Button>
      </div>

      {isLoading ? (
        <div className="grid py-24 place-items-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border border-border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="p-4 font-medium">Product</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Price</th>
                <th className="p-4 font-medium">Stock</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((product) => (
                <tr key={product.id} className="border-b border-border last:border-0">
                  <td className="p-4 font-medium">{product.name}</td>
                  <td className="p-4 text-muted-foreground">{product.category}</td>
                  <td className="p-4">{formatPrice(product.price)}</td>
                  <td className="p-4">
                    {product.stock > 0 ? (
                      product.stock
                    ) : (
                      <span className="text-destructive">Out of stock</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={`Edit ${product.name}`}
                        onClick={() =>
                          setDraft({
                            id: product.id,
                            name: product.name,
                            description: product.description,
                            price: String(product.price),
                            category: product.category,
                            stock: String(product.stock),
                            image_url: product.image_url ?? "",
                          })
                        }
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={`Delete ${product.name}`}
                        onClick={() => {
                          if (window.confirm(`Delete "${product.name}"?`))
                            deleteMutation.mutate(product.id);
                        }}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit product" : "Add product"}</DialogTitle>
            <DialogDescription>
              Update the name, description, price, category, stock and image.
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="p-name">Name</Label>
                <Input
                  id="p-name"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-desc">Description</Label>
                <Textarea
                  id="p-desc"
                  rows={3}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="p-price">Price (₹)</Label>
                  <Input
                    id="p-price"
                    inputMode="decimal"
                    value={draft.price}
                    onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p-stock">Stock</Label>
                  <Input
                    id="p-stock"
                    inputMode="numeric"
                    value={draft.stock}
                    onChange={(e) => setDraft({ ...draft, stock: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={draft.category}
                    onValueChange={(value) => setDraft({ ...draft, category: value })}
                  >
                    <SelectTrigger aria-label="Category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-image">Image URL</Label>
                <Input
                  id="p-image"
                  value={draft.image_url}
                  onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                  placeholder="https://…"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Save product
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
