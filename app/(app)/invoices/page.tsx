import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { getInvoices } from "@/lib/queries";
import { EmptyRow, PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const metadata = { title: "Invoices · Clinic" };

const FILTERS = [
  { value: "", label: "All" },
  { value: "unpaid", label: "Unpaid" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
];

export default async function InvoicesPage({ searchParams }: PageProps<"/invoices">) {
  await requirePermission("invoices:manage");
  const { status: rawStatus } = await searchParams;
  const status = FILTERS.some((f) => f.value === rawStatus) ? String(rawStatus) : "";
  const invoices = getInvoices(status);

  return (
    <>
      <PageHeader
        title="Invoices & billing"
        actions={<Link href="/invoices/new" className={buttonVariants()}>New invoice</Link>}
      />
      <div className="mb-4 flex gap-1">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/invoices?status=${f.value}` : "/invoices"}
            className={cn(buttonVariants({ size: "sm", variant: status === f.value ? "default" : "outline" }))}
          >
            {f.label}
          </Link>
        ))}
      </div>
      {invoices.length === 0 ? <EmptyRow>No invoices.</EmptyRow> : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((i) => (
              <TableRow key={i.id}>
                <TableCell><Link href={`/invoices/${i.id}`} className="font-medium hover:underline">#{i.id}</Link></TableCell>
                <TableCell>{i.created_at.slice(0, 10)}</TableCell>
                <TableCell><Link href={`/patients/${i.patient_id}`} className="hover:underline">{i.patient_name}</Link></TableCell>
                <TableCell className="text-right tabular-nums">₹{i.total.toFixed(2)}</TableCell>
                <TableCell><StatusBadge status={i.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
