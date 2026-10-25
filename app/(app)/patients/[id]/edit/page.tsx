import { notFound } from "next/navigation";
import { can, requirePermission } from "@/lib/auth";
import { getPatient } from "@/lib/queries";
import { updatePatient } from "@/app/actions/patients";
import { PageHeader } from "@/components/app/page-header";
import { PatientForm } from "@/components/app/patient-form";

export default async function EditPatientPage({ params }: PageProps<"/patients/[id]/edit">) {
  const user = await requirePermission("patients:write");
  const patient = getPatient(Number((await params).id));
  if (!patient) notFound();

  return (
    <>
      <PageHeader title={`Edit ${patient.name}`} />
      <PatientForm
        action={updatePatient.bind(null, patient.id)}
        patient={patient}
        showClinical={can(user, "clinical:write")}
        submitLabel="Save changes"
      />
    </>
  );
}
