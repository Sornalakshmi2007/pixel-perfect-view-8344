import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { CATEGORIES } from "@/lib/shop";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-secondary/60">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <ShoppingBag className="size-4" />
            </span>
            <span className="font-display text-base font-bold">TiraneX</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Everyday essentials in electronics, accessories, clothing and home — picked for quality
            and shipped fast.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Shop</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {CATEGORIES.map((category) => (
              <li key={category}>
                <Link
                  to="/"
                  search={{ q: "", category }}
                  className="transition-colors hover:text-foreground"
                >
                  {category}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Account</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/profile" className="transition-colors hover:text-foreground">
                My profile
              </Link>
            </li>
            <li>
              <Link to="/orders" className="transition-colors hover:text-foreground">
                My orders
              </Link>
            </li>
            <li>
              <Link to="/cart" className="transition-colors hover:text-foreground">
                Cart
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Support</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Free delivery over ₹2,000</li>
            <li>7-day easy returns</li>
            <li>support@tiranex.example</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} TiraneX. Built for the Thiranex internship Task 3.
      </div>
    </footer>
  );
}
