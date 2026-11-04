import { STATUS_LABEL, STATUS_TONE } from "@/lib/payments/status";
import type { PaymentStatus } from "@/lib/db/schema";
import { Badge } from "./ui";

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>;
}
