import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { getPatient, todayISO } from "@/lib/queries";
import { PageHeader } from "@/components/app/page-header";
import { PatientPicker } from "@/components/app/patient-picker";
import { BookAppointmentForm } from "./book-form";

export const metadata = { title: "Book appointment · Clinic" };

export default async function NewAppointmentPage({ searchParams }: PageProps<"/appointments/new">) {
  await requirePermission("appointments:manage");
  const { patientId, q } = await searchParams;
  const patient = patientId ? getPatient(Number(patientId)) : undefined;

  return (
    <>
      <PageHeader
        title="Book appointment"
        description={
          patient ? (
            <>For <strong>{patient.name}</strong> · <Link href="/appointments/new" className="underline">change patient</Link></>
          ) : "Step 1: choose the patient"
        }
      />
      {patient ? (
        <BookAppointmentForm patientId={patient.id} defaultDate={todayISO()} />
      ) : (
        <PatientPicker basePath="/appointments/new" search={typeof q === "string" ? q : ""} />
      )}
    </>
  );
}
