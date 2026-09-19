import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My profile — TiraneX" },
      {
        name: "description",
        content: "Manage your TiraneX contact and delivery details for faster checkout.",
      },
      { property: "og:title", content: "My profile — TiraneX" },
      {
        property: "og:description",
        content: "Manage your TiraneX contact and delivery details for faster checkout.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <ProfilePage />
    </RequireAuth>
  ),
});

type ProfileForm = {
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

const emptyForm: ProfileForm = {
  full_name: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
};

function ProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      full_name: data.full_name ?? "",
      phone: data.phone ?? "",
      address: data.address ?? "",
      city: data.city ?? "",
      state: data.state ?? "",
      pincode: data.pincode ?? "",
    });
  }, [data]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.full_name.trim().length < 2) {
      toast.error("Please enter your full name.");
      return;
    }
    if (form.phone && !/^\d{10}$/.test(form.phone.trim())) {
      toast.error("Phone number must be 10 digits.");
      return;
    }
    if (form.pincode && !/^\d{6}$/.test(form.pincode.trim())) {
      toast.error("Pincode must be 6 digits.");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user!.id, email: user!.email ?? null, ...form });
    setSaving(false);

    if (error) toast.error("We couldn't save your profile. Please try again.");
    else toast.success("Profile saved");
  };

  if (isLoading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container-page max-w-2xl py-10">
      <h1 className="text-3xl font-bold">My profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Signed in as <span className="font-medium text-foreground">{user?.email}</span>
      </p>

      <form onSubmit={save} className="mt-8 space-y-4 rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            inputMode="numeric"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="10-digit mobile number"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pincode">Pincode</Label>
            <Input
              id="pincode"
              inputMode="numeric"
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
            />
          </div>
        </div>

        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
          Save changes
        </Button>
      </form>
    </div>
  );
}
