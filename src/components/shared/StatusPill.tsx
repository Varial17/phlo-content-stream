import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  published: "bg-muted text-muted-foreground",
  approved: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  draft: "bg-blue-100 text-blue-600",
};

interface StatusPillProps {
  status: string;
  className?: string;
}

export function StatusPill({ status, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize whitespace-nowrap",
        statusStyles[status] ?? "bg-muted text-muted-foreground",
        className
      )}
    >
      {status}
    </span>
  );
}
