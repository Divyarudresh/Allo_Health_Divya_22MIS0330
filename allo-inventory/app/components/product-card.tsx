"use client";

import { StockBadge } from "./stock-badge";

export type InventoryItem = {
  inventoryId: string;
  productId: string;
  warehouseId: string;
  productName: string;
  productCategory: string;
  productDescription: string | null;
  warehouseName: string;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
};

type ProductCardProps = {
  item: InventoryItem;
  reserving: boolean;
  onReserve: (item: InventoryItem) => void;
};

const categoryIcons: Record<string, string> = {
  Diagnostics: "🩺",
  Supplements: "💊",
  PPE: "🛡️",
  Care: "🩹",
  Equipment: "⚕️",
};

export function ProductCard({ item, reserving, onReserve }: ProductCardProps) {
  const icon = categoryIcons[item.productCategory] ?? "📦";
  const outOfStock = item.availableStock === 0;

  return (
    <article className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md hover:shadow-teal-500/5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-2xl ring-1 ring-slate-100">
          {icon}
        </div>
        <StockBadge
          available={item.availableStock}
          total={item.totalStock}
        />
      </div>

      <div className="mt-4 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-teal-600">
          {item.productCategory}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900 leading-snug">
          {item.productName}
        </h2>
        {item.productDescription && (
          <p className="mt-2 text-sm text-slate-500 line-clamp-2">
            {item.productDescription}
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1 ring-1 ring-slate-100">
          <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {item.warehouseName}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center text-xs ring-1 ring-slate-100">
        <div>
          <p className="font-semibold text-slate-900">{item.totalStock}</p>
          <p className="text-slate-500">Total</p>
        </div>
        <div>
          <p className="font-semibold text-amber-700">{item.reservedStock}</p>
          <p className="text-slate-500">Reserved</p>
        </div>
        <div>
          <p className="font-semibold text-emerald-700">{item.availableStock}</p>
          <p className="text-slate-500">Available</p>
        </div>
      </div>

      <button
        type="button"
        disabled={outOfStock || reserving}
        onClick={() => onReserve(item)}
        className="mt-4 w-full rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-teal-500 hover:to-emerald-500 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
      >
        {reserving ? "Reserving…" : outOfStock ? "Unavailable" : "Reserve 1 unit"}
      </button>
    </article>
  );
}
