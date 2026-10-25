import Link from "next/link";
import { notFound } from "next/navigation";
import { can, requirePermission } from "@/lib/auth";
import { getPatient, getPatientVisits, getPrescriptionItems, getVisit } from "@/lib/queries";
import { saveConsultation } from "@/app/actions/visits";
import { EmptyRow, PageHeader, Section } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { ConsultationForm } from "./consultation-form";

// The consultation screen. Viewing needs clinical:read, editing clinical:write.
export default async function VisitPage({ params }: PageProps<"/visits/[id]">) {
  const user = await requirePermission("clinical:read");
  const visit = getVisit(Number((await params).id));
  if (!visit) notFound();
  const patient = getPatient(visit.patient_id)!;
  const items = getPrescriptionItems(visit.id);
  const previous = getPatientVisits(patient.id).filter((v) => v.id !== visit.id && v.status === "completed");
  const canEdit = can(user, "clinical:write") && visit.status !== "cancelled";

  return (
    <>
      <PageHeader
        title={patient.name}
        description={<>Visit on {visit.visit_date} · Queue #{visit.queue_number} · <StatusBadge status={visit.status} /></>}
        actions={
          <>
            <Link href={`/print/prescription/${visit.id}`} target="_blank" className={buttonVariants({ variant: "outline" })}>
              Print prescription
            </Link>
            <Link href={`/invoices/new?patientId=${patient.id}&visitId=${visit.id}`} className={buttonVariants({ variant: "outline" })}>
              Create invoice
            </Link>
            <Link href={`/patients/${patient.id}`} className={buttonVariants({ variant: "ghost" })}>Patient profile</Link>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Section title="Consultation">
          {canEdit ? (
            <ConsultationForm
              action={saveConsultation.bind(null, visit.id)}
              initial={{ complaints: visit.complaints, diagnosis: visit.diagnosis, notes: visit.notes, advice: visit.advice }}
              initialItems={items.map(({ medicine_name, dosage, frequency, duration, instructions }) => ({
                medicine_name, dosage, frequency, duration, instructions,
              }))}
              completed={visit.status === "completed"}
            />
          ) : (
            <ReadOnlyConsultation complaints={visit.complaints} diagnosis={visit.diagnosis} notes={visit.notes} advice={visit.advice} />
          )}
        </Section>

        <div className="flex flex-col gap-6">
          <Section title="Patient">
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-destructive">Allergies</dt>
                <dd className="whitespace-pre-line">{patient.allergies || "None recorded"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Medical history</dt>
                <dd className="whitespace-pre-line">{patient.medical_history || "None recorded"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Details</dt>
                <dd>{[patient.gender, patient.date_of_birth && `DOB ${patient.date_of_birth}`, patient.blood_group].filter(Boolean).join(" · ") || "—"}</dd>
              </div>
            </dl>
            <Link href={`/patients/${patient.id}/edit`} className="mt-3 inline-block text-xs underline">Update history</Link>
          </Section>

          <Section title="Previous visits">
            {previous.length === 0 ? <EmptyRow>First visit.</EmptyRow> : (
              <ul className="divide-y text-sm">
                {previous.map((v) => (
                  <li key={v.id} className="py-2">
                    <Link href={`/visits/${v.id}`} className="font-medium hover:underline">{v.visit_date}</Link>
                    <p className="text-muted-foreground">{v.diagnosis || v.complaints || "No notes"}</p>
                    <p className="text-xs text-muted-foreground">
                      {getPrescriptionItems(v.id).map((i) => i.medicine_name).join(", ")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}

function ReadOnlyConsultation(props: { complaints: string; diagnosis: string; notes: string; advice: string }) {
  return (
    <dl className="grid gap-3 text-sm">
      {Object.entries(props).map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</dt>
          <dd className="whitespace-pre-line">{value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
