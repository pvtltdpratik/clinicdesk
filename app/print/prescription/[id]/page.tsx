import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getPatient, getPrescriptionItems, getVisit } from "@/lib/queries";
import { PrintButton } from "@/components/app/print-button";
import { ClinicLetterhead } from "@/components/app/letterhead";

// Prescriptions contain clinical data, so they need clinical:read.
export default async function PrintPrescriptionPage({ params }: PageProps<"/print/prescription/[id]">) {
  await requirePermission("clinical:read");
  const visit = getVisit(Number((await params).id));
  if (!visit) notFound();
  const patient = getPatient(visit.patient_id)!;
  const items = getPrescriptionItems(visit.id);

  return (
    <>
      <ClinicLetterhead />
      <div className="mb-6 grid grid-cols-2 gap-2 text-sm">
        <p><strong>Patient:</strong> {patient.name} (#{patient.id})</p>
        <p className="text-right"><strong>Date:</strong> {visit.visit_date}</p>
        <p><strong>Gender / DOB:</strong> {patient.gender || "—"} / {patient.date_of_birth || "—"}</p>
        <p className="text-right"><strong>Doctor:</strong> {visit.doctor_name ?? "—"}</p>
        {patient.allergies && <p className="col-span-2"><strong>Allergies:</strong> {patient.allergies}</p>}
      </div>

      {visit.complaints && <p className="mb-2 text-sm"><strong>Complaints:</strong> {visit.complaints}</p>}
      {visit.diagnosis && <p className="mb-4 text-sm"><strong>Diagnosis:</strong> {visit.diagnosis}</p>}

      <p className="mb-2 font-heading text-3xl">℞</p>
      {items.length === 0 ? <p className="text-sm">No medicines prescribed.</p> : (
        <ol className="list-decimal space-y-3 pl-6 text-sm">
          {items.map((item) => (
            <li key={item.id}>
              <p className="font-semibold">{item.medicine_name}</p>
              <p>{[item.dosage, item.frequency, item.duration].filter(Boolean).join(" · ")}</p>
              {item.instructions && <p className="italic">{item.instructions}</p>}
            </li>
          ))}
        </ol>
      )}

      {visit.advice && (
        <div className="mt-6 text-sm">
          <p className="font-semibold">Advice</p>
          <p className="whitespace-pre-line">{visit.advice}</p>
        </div>
      )}

      <div className="mt-16 flex justify-end">
        <div className="border-t border-black pt-1 text-center text-sm">
          <p>{visit.doctor_name ?? "Doctor"}</p>
          <p className="text-xs">Signature</p>
        </div>
      </div>
      <div className="mt-6 text-center"><PrintButton /></div>
    </>
  );
}
