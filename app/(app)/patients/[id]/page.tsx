import Link from "next/link";
import { notFound } from "next/navigation";
import { can, requirePermission } from "@/lib/auth";
import {
  getPatient, getPatientAppointments, getPatientInvoices, getPatientVisits, getPrescriptionItems,
} from "@/lib/queries";
import { checkInPatient } from "@/app/actions/queue";
import { EmptyRow, PageHeader, Section } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { AppointmentTable } from "@/components/app/appointment-table";
import { Button, buttonVariants } from "@/components/ui/button";

function ageFrom(dob: string) {
  if (!dob) return null;
  const years = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
  return Number.isFinite(years) ? years : null;
}

export default async function PatientProfilePage({ params }: PageProps<"/patients/[id]">) {
  const user = await requirePermission("patients:read");
  const patient = getPatient(Number((await params).id));
  if (!patient) notFound();

  // Receptionists see visit dates and status; only users with clinical:read
  // see diagnoses, notes, medical history and prescriptions.
  const showClinical = can(user, "clinical:read");
  const visits = getPatientVisits(patient.id);
  const age = ageFrom(patient.date_of_birth);

  return (
    <>
      <PageHeader
        title={patient.name}
        description={[`Patient #${patient.id}`, age !== null && `${age} yrs`, patient.gender, patient.phone]
          .filter(Boolean).join(" · ")}
        actions={
          <>
            <form action={checkInPatient.bind(null, patient.id)}>
              <Button type="submit">Check in now</Button>
            </form>
            <Link href={`/appointments/new?patientId=${patient.id}`} className={buttonVariants({ variant: "outline" })}>
              Book appointment
            </Link>
            <Link href={`/invoices/new?patientId=${patient.id}`} className={buttonVariants({ variant: "outline" })}>
              New invoice
            </Link>
            <Link href={`/patients/${patient.id}/edit`} className={buttonVariants({ variant: "ghost" })}>Edit</Link>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Details">
          <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
            <dt className="text-muted-foreground">Date of birth</dt><dd>{patient.date_of_birth || "—"}</dd>
            <dt className="text-muted-foreground">Blood group</dt><dd>{patient.blood_group || "—"}</dd>
            <dt className="text-muted-foreground">Address</dt><dd className="whitespace-pre-line">{patient.address || "—"}</dd>
            <dt className="text-muted-foreground">Registered</dt><dd>{patient.created_at.slice(0, 10)}</dd>
          </dl>
        </Section>

        {showClinical && (
          <Section title="Medical history">
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-destructive">Allergies</dt>
                <dd className="whitespace-pre-line">{patient.allergies || "None recorded"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">History</dt>
                <dd className="whitespace-pre-line">{patient.medical_history || "None recorded"}</dd>
              </div>
            </dl>
          </Section>
        )}

        <Section title="Visit history">
          {visits.length === 0 ? (
            <EmptyRow>No visits yet.</EmptyRow>
          ) : (
            <ul className="divide-y">
              {visits.map((v) => (
                <li key={v.id} className="py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium tabular-nums">{v.visit_date}</span>
                    <span className="flex items-center gap-2">
                      <StatusBadge status={v.status} />
                      {showClinical && (
                        <Link href={`/visits/${v.id}`} className={buttonVariants({ size: "xs", variant: "outline" })}>Open</Link>
                      )}
                    </span>
                  </div>
                  {showClinical && <ClinicalSummary visitId={v.id} complaints={v.complaints} diagnosis={v.diagnosis} doctor={v.doctor_name} />}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Appointments">
          <AppointmentTable appointments={getPatientAppointments(patient.id)} showActions={false} />
        </Section>

        <Section title="Invoices">
          <InvoiceList patientId={patient.id} />
        </Section>
      </div>
    </>
  );
}

function ClinicalSummary({ visitId, complaints, diagnosis, doctor }: { visitId: number; complaints: string; diagnosis: string; doctor: string | null }) {
  const items = getPrescriptionItems(visitId);
  return (
    <div className="mt-1 space-y-1 text-muted-foreground">
      {complaints && <p><span className="text-foreground">Complaints:</span> {complaints}</p>}
      {diagnosis && <p><span className="text-foreground">Diagnosis:</span> {diagnosis}</p>}
      {items.length > 0 && (
        <p><span className="text-foreground">Rx:</span> {items.map((i) => i.medicine_name).join(", ")}</p>
      )}
      {doctor && <p className="text-xs">Seen by {doctor}</p>}
    </div>
  );
}

function InvoiceList({ patientId }: { patientId: number }) {
  const invoices = getPatientInvoices(patientId);
  if (invoices.length === 0) return <EmptyRow>No invoices.</EmptyRow>;
  return (
    <ul className="divide-y text-sm">
      {invoices.map((i) => (
        <li key={i.id} className="flex items-center justify-between gap-2 py-2">
          <Link href={`/invoices/${i.id}`} className="font-medium hover:underline">Invoice #{i.id}</Link>
          <span className="text-muted-foreground">{i.created_at.slice(0, 10)}</span>
          <span className="tabular-nums">₹{i.total.toFixed(2)}</span>
          <StatusBadge status={i.status} />
        </li>
      ))}
    </ul>
  );
}
