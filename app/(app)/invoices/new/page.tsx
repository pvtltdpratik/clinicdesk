import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { get } from "@/lib/db";
import { getPatient } from "@/lib/queries";
import { PageHeader } from "@/components/app/page-header";
import { PatientPicker } from "@/components/app/patient-picker";
import { InvoiceForm } from "./invoice-form";

export const metadata = { title: "New invoice · Clinic" };

export default async function NewInvoicePage({ searchParams }: PageProps<"/invoices/new">) {
  await requirePermission("invoices:manage");
  const { patientId, visitId, q } = await searchParams;
  const patient = patientId ? getPatient(Number(patientId)) : undefined;
  const visit = patient && visitId
    ? get<{ id: number; visit_date: string }>("SELECT id, visit_date FROM visits WHERE id = ? AND patient_id = ?", Number(visitId), patient.id)
    : undefined;

  return (
    <>
      <PageHeader
        title="New invoice"
        description={
          patient ? (
            <>
              For <strong>{patient.name}</strong>{visit && <> · visit on {visit.visit_date}</>} ·{" "}
              <Link href="/invoices/new" className="underline">change patient</Link>
            </>
          ) : "Step 1: choose the patient"
        }
      />
      {patient ? (
        <InvoiceForm patientId={patient.id} visitId={visit?.id ?? null} />
      ) : (
        <PatientPicker basePath="/invoices/new" search={typeof q === "string" ? q : ""} />
      )}
    </>
  );
}
