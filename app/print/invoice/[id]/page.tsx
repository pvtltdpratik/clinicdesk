import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getInvoice, getInvoiceItems, getPatient } from "@/lib/queries";
import { InvoiceItemsTable } from "@/components/app/invoice-items-table";
import { PrintButton } from "@/components/app/print-button";
import { ClinicLetterhead } from "@/components/app/letterhead";

export default async function PrintInvoicePage({ params }: PageProps<"/print/invoice/[id]">) {
  await requirePermission("invoices:manage");
  const invoice = getInvoice(Number((await params).id));
  if (!invoice) notFound();
  const patient = getPatient(invoice.patient_id)!;

  return (
    <>
      <ClinicLetterhead />
      <div className="mb-6 flex justify-between text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest">Billed to</p>
          <p className="font-semibold">{patient.name}</p>
          <p>Patient #{patient.id}{patient.phone && ` · ${patient.phone}`}</p>
        </div>
        <div className="text-right">
          <p className="font-heading text-xl">Invoice #{invoice.id}</p>
          <p>Date: {invoice.created_at.slice(0, 10)}</p>
          <p className="font-semibold uppercase">
            {invoice.status === "paid" ? `Paid (${invoice.payment_method.toUpperCase()})` : invoice.status}
          </p>
        </div>
      </div>
      <InvoiceItemsTable items={getInvoiceItems(invoice.id)} total={invoice.total} />
      {invoice.notes && <p className="mt-4 text-sm">Notes: {invoice.notes}</p>}
      <p className="mt-12 text-center text-xs">Thank you. This is a computer-generated invoice.</p>
      <div className="mt-6 text-center"><PrintButton /></div>
    </>
  );
}
