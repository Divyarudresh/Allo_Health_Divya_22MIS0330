"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ProductCard,
  type InventoryItem,
} from "./components/product-card";

export default function HomePage() {
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [reservingId, setReservingId] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    fetch("/api/products")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load products");
        return res.json();
      })
      .then((data: InventoryItem[]) => {
        setProducts(data);
        setError(null);
      })
      .catch(() => setError("Could not load inventory. Check your database connection."))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.productCategory));
    return ["All", ...Array.from(set).sort()];
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((item) => {
      const matchesCategory =
        category === "All" || item.productCategory === category;
      const matchesSearch =
        !q ||
        item.productName.toLowerCase().includes(q) ||
        item.warehouseName.toLowerCase().includes(q) ||
        item.productCategory.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [products, search, category]);

  const stats = useMemo(() => {
    const available = products.reduce((sum, p) => sum + p.availableStock, 0);
    const skus = new Set(products.map((p) => p.productId)).size;
    return { available, skus, listings: products.length };
  }, [products]);

  async function reserve(item: InventoryItem) {
    setReservingId(item.inventoryId);

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: item.productId,
          warehouseId: item.warehouseId,
          quantity: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error ?? "Reservation failed");
        return;
      }

      router.push(`/reservation/${data.id}`);
    } finally {
      setReservingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <section className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Product catalog
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Browse health products across warehouses and reserve units. Reservations
          are held for 10 minutes until confirmed.
        </p>

        {!loading && !error && (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="Product types" value={String(stats.skus)} />
            <StatCard label="Warehouse listings" value={String(stats.listings)} />
            <StatCard label="Units available" value={String(stats.available)} accent />
          </div>
        )}
      </section>

      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            placeholder="Search products or warehouses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none ring-teal-500/0 transition focus:border-teal-300 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                category === cat
                  ? "bg-teal-600 text-white shadow-sm"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-teal-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {loading && <ProductGridSkeleton />}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center text-red-800">
          <p className="font-medium">{error}</p>
          <p className="mt-2 text-sm text-red-600">
            Run <code className="rounded bg-red-100 px-1.5 py-0.5">npm run db:push</code> then{" "}
            <code className="rounded bg-red-100 px-1.5 py-0.5">npm run db:seed</code>
          </p>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-lg font-medium text-slate-700">No products found</p>
          <p className="mt-1 text-sm text-slate-500">Try a different search or category</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <ProductCard
              key={item.inventoryId}
              item={item}
              reserving={reservingId === item.inventoryId}
              onReserve={reserve}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-5 py-4 ${
        accent
          ? "border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-72 animate-pulse-soft rounded-2xl border border-slate-200 bg-white"
        />
      ))}
    </div>
  );
}
