import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-700",
  trial: "bg-amber-100 text-amber-700",
};

interface BillingBadgeProps {
  status: string;
  className?: string;
}

export function BillingBadge({ status, className }: BillingBadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", styles[status] ?? styles.paid, className)}>
      {status}
    </span>
  );
}
