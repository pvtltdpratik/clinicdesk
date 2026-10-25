import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getInvoice, getInvoiceItems } from "@/lib/queries";
import { updatePaymentStatus } from "@/app/actions/invoices";
import { PageHeader, Section } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { InvoiceItemsTable } from "@/components/app/invoice-items-table";
import { Button, buttonVariants } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

export default async function InvoicePage({ params }: PageProps<"/invoices/[id]">) {
  await requirePermission("invoices:manage");
  const invoice = getInvoice(Number((await params).id));
  if (!invoice) notFound();
  const items = getInvoiceItems(invoice.id);
  const setStatus = updatePaymentStatus.bind(null, invoice.id);

  return (
    <>
      <PageHeader
        title={`Invoice #${invoice.id}`}
        description={<>For <Link href={`/patients/${invoice.patient_id}`} className="underline">{invoice.patient_name}</Link> · {invoice.created_at.slice(0, 10)}</>}
        actions={<Link href={`/print/invoice/${invoice.id}`} target="_blank" className={buttonVariants()}>Print invoice</Link>}
      />

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Section title="Items">
          <InvoiceItemsTable items={items} total={invoice.total} />
          {invoice.notes && <p className="mt-4 text-sm text-muted-foreground">Notes: {invoice.notes}</p>}
        </Section>

        <Section title="Payment">
          <div className="mb-4 flex items-center gap-3">
            <StatusBadge status={invoice.status} />
            {invoice.status === "paid" && (
              <span className="text-sm text-muted-foreground">
                via {invoice.payment_method.toUpperCase()} on {invoice.paid_at?.slice(0, 10)}
              </span>
            )}
          </div>
          {invoice.status !== "paid" && invoice.status !== "cancelled" && (
            <form action={setStatus} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="status" value="paid" />
              <NativeSelect name="payment_method" defaultValue="cash" aria-label="Payment method">
                <NativeSelectOption value="cash">Cash</NativeSelectOption>
                <NativeSelectOption value="upi">UPI</NativeSelectOption>
                <NativeSelectOption value="card">Card</NativeSelectOption>
                <NativeSelectOption value="other">Other</NativeSelectOption>
              </NativeSelect>
              <Button type="submit">Mark as paid</Button>
            </form>
          )}
          <div className="mt-4 flex gap-2">
            {invoice.status !== "unpaid" && (
              <form action={setStatus}>
                <input type="hidden" name="status" value="unpaid" />
                <Button type="submit" variant="outline" size="sm">Mark unpaid</Button>
              </form>
            )}
            {invoice.status !== "cancelled" && (
              <form action={setStatus}>
                <input type="hidden" name="status" value="cancelled" />
                <Button type="submit" variant="destructive" size="sm">Cancel invoice</Button>
              </form>
            )}
          </div>
        </Section>
      </div>
    </>
  );
}
