import { StockReceiptStatus } from "./approvisionnements.types";

export const STATUS_LABELS: Record<StockReceiptStatus, string> = {
  draft: "Brouillon",
  validated: "Validé",
  cancelled: "Annulé",
};

const STATUS_COLORS: Record<StockReceiptStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  validated: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-700",
};

export default function StockReceiptStatusBadge({ status }: { status: StockReceiptStatus }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
