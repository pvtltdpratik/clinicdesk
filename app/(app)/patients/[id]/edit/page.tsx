import { notFound } from "next/navigation";
import { can, requirePermission } from "@/lib/auth";
import { getPatient } from "@/lib/queries";
import { updatePatient } from "@/app/actions/patients";
import { PageHeader } from "@/components/app/page-header";
import { PatientForm } from "@/components/app/patient-form";

export default async function EditPatientPage({ params }: PageProps<"/patients/[id]/edit">) {
  const user = await requirePermission("patients:write");
  const found = getPatient(Number((await params).id));
  if (!found) notFound();
  // Everything passed to a Client Component ends up in the page sent to the
  // browser, even if the form doesn't show it. Strip clinical fields for
  // users who aren't allowed to read them.
  const patient = can(user, "clinical:read") ? found : { ...found, allergies: "", medical_history: "" };

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
