import { can, requirePermission } from "@/lib/auth";
import { createPatient } from "@/app/actions/patients";
import { PageHeader } from "@/components/app/page-header";
import { PatientForm } from "@/components/app/patient-form";

export const metadata = { title: "Register patient · Clinic" };

export default async function NewPatientPage() {
  const user = await requirePermission("patients:write");
  return (
    <>
      <PageHeader title="Register patient" />
      <PatientForm action={createPatient} showClinical={can(user, "clinical:write")} submitLabel="Register patient" />
    </>
  );
}
