import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, PackageSearch, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, type Product } from "@/lib/shop";

type HomeSearch = { q?: string; category?: string };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): HomeSearch => {
    const q = typeof search["q"] === "string" ? search["q"] : "";
    const rawCategory = search["category"];
    return typeof rawCategory === "string" && rawCategory ? { q, category: rawCategory } : { q };
  },
  head: () => ({
    meta: [
      { title: "TiraneX — Shop electronics, accessories, clothing & home" },
      {
        name: "description",
        content:
          "Browse the TiraneX catalog: electronics, accessories, clothing and home essentials with fast delivery and easy returns.",
      },
      { property: "og:title", content: "TiraneX — Modern online store" },
      {
        property: "og:description",
        content:
          "Browse the TiraneX catalog: electronics, accessories, clothing and home essentials with fast delivery and easy returns.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { q, category } = Route.useSearch();
  const navigate = useNavigate();
  const [sort, setSort] = useState<"newest" | "price-asc" | "price-desc">("newest");
  const [localQuery, setLocalQuery] = useState(q ?? "");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });

  const term = (localQuery || q || "").trim().toLowerCase();
  const products = (data ?? [])
    .filter((p) => p.is_active)
    .filter((p) => (category ? p.category === category : true))
    .filter((p) =>
      term
        ? p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)
        : true,
    )
    .sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      return 0;
    });

  return (
    <div>
      <section className="border-b border-border bg-secondary/50">
        <div className="container-page grid gap-8 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <span className="inline-flex rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
              New season, fresh picks
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
              Well-made things for everyday life.
            </h1>
            <p className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
              Electronics, accessories, clothing and home goods — curated, honestly priced and ready
              to ship across India.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href="#catalog">Shop the catalog</a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/orders">Track my orders</Link>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                to="/"
                search={{ q: "", category: cat }}
                className="rounded-xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-lift"
              >
                <span className="font-display text-lg font-semibold">{cat}</span>
                <p className="mt-1 text-sm text-muted-foreground">Shop {cat.toLowerCase()}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="catalog" className="container-page py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">
              {category ? category : "All products"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {products.length} {products.length === 1 ? "product" : "products"} available
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Search by name or description…"
              aria-label="Search products"
              className="pl-9"
            />
          </div>

          <Select
            value={category ?? "all"}
            onValueChange={(value) => {
              navigate({
                to: "/",
                search: value === "all" ? { q: localQuery } : { q: localQuery, category: value },
              });
            }}
          >
            <SelectTrigger className="sm:w-48" aria-label="Filter by category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(value) => setSort(value as typeof sort)}>
            <SelectTrigger className="sm:w-48" aria-label="Sort products">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="price-asc">Price: low to high</SelectItem>
              <SelectItem value="price-desc">Price: high to low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading && (
          <div className="grid place-items-center py-24">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {isError && (
          <p className="py-24 text-center text-sm text-destructive">
            We couldn't load the products. Please refresh and try again.
          </p>
        )}

        {!isLoading && !isError && products.length === 0 && (
          <div className="grid place-items-center gap-3 py-24 text-center">
            <PackageSearch className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No products match your search or filters.
            </p>
          </div>
        )}

        {products.length > 0 && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
