import { cn } from "@/lib/utils";

const COLORS: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  arrived: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  waiting: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  in_consultation: "bg-violet-500/15 text-violet-800 dark:text-violet-300",
  completed: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  paid: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  unpaid: "bg-red-500/10 text-red-700 dark:text-red-300",
  cancelled: "bg-muted text-muted-foreground line-through",
  no_show: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-widest whitespace-nowrap",
        COLORS[status] ?? "bg-muted",
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}
