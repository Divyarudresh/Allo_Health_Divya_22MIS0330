"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";

type Reservation = {
  id: string;
  status: string;
  quantity: number;
  expiresAt: string;
  productName: string;
  warehouseName: string;
};

export default function ReservationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch(`/api/reservations/${id}`);
    if (!response.ok) {
      setError("Reservation not found");
      setReservation(null);
      return;
    }
    const data = await response.json();
    setReservation(data);
    setError(null);
  }, [id]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function confirm() {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/reservations/${id}/confirm`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error ?? "Could not confirm");
        return;
      }
      await load();
    } finally {
      setActionLoading(false);
    }
  }

  async function release() {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/reservations/${id}/release`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error ?? "Could not release");
        return;
      }
      await load();
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
        <p className="mt-4 text-slate-500">Loading reservation…</p>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-medium text-slate-800">{error}</p>
        <Link
          href="/"
          className="mt-6 inline-block text-teal-600 font-medium hover:text-teal-500"
        >
          ← Back to catalog
        </Link>
      </div>
    );
  }

  const expiresAt = new Date(reservation.expiresAt);
  const isExpired = expiresAt < new Date();
  const isPending = reservation.status === "pending";

  const statusStyles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-800 ring-amber-600/20",
    confirmed: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
    released: "bg-slate-100 text-slate-600 ring-slate-500/20",
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:py-14">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-500"
      >
        ← Back to catalog
      </Link>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900">Reservation</h1>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset ${
              statusStyles[reservation.status] ?? statusStyles.released
            }`}
          >
            {reservation.status}
          </span>
        </div>

        <dl className="mt-8 space-y-4">
          <Detail label="Product" value={reservation.productName} />
          <Detail label="Warehouse" value={reservation.warehouseName} />
          <Detail label="Quantity" value={String(reservation.quantity)} />
          <Detail
            label="Expires"
            value={expiresAt.toLocaleString()}
            highlight={isPending && isExpired}
          />
        </dl>

        {isPending && (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={actionLoading || isExpired}
              onClick={confirm}
              className="flex-1 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-teal-500 hover:to-emerald-500 disabled:from-slate-300 disabled:to-slate-300"
            >
              {actionLoading ? "Processing…" : "Confirm reservation"}
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={release}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Release stock
            </button>
          </div>
        )}

        {isPending && isExpired && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            This reservation has expired and can no longer be confirmed.
          </p>
        )}

        {reservation.status === "confirmed" && (
          <p className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Reservation confirmed. Stock remains allocated to this order.
          </p>
        )}

        {reservation.status === "released" && (
          <p className="mt-6 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Stock has been returned to available inventory.
          </p>
        )}
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd
        className={`text-sm font-medium text-right ${
          highlight ? "text-red-600" : "text-slate-900"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
