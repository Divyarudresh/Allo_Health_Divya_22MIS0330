type StockBadgeProps = {
  available: number;
  total: number;
};

export function StockBadge({ available, total }: StockBadgeProps) {
  const ratio = total > 0 ? available / total : 0;

  let label = "In stock";
  let className =
    "bg-emerald-50 text-emerald-700 ring-emerald-600/20";

  if (available === 0) {
    label = "Out of stock";
    className = "bg-red-50 text-red-700 ring-red-600/20";
  } else if (ratio <= 0.2) {
    label = "Low stock";
    className = "bg-amber-50 text-amber-800 ring-amber-600/20";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {label}
    </span>
  );
}
