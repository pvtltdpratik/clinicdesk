"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions/patients";
import type { Patient } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { FormError } from "./form-error";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  patient?: Patient;
  // Shown only to users with clinical:write. The server ignores these
  // fields for everyone else, even if they are sent.
  showClinical: boolean;
  submitLabel: string;
};

export function PatientForm({ action, patient, showClinical, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="grid max-w-3xl gap-5 sm:grid-cols-2">
      <Field label="Full name *" name="name" defaultValue={patient?.name} required className="sm:col-span-2" />
      <Field label="Phone" name="phone" type="tel" defaultValue={patient?.phone} />
      <Field label="Date of birth" name="date_of_birth" type="date" defaultValue={patient?.date_of_birth} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="gender">Gender</Label>
        <NativeSelect id="gender" name="gender" defaultValue={patient?.gender ?? ""} className="w-full">
          <NativeSelectOption value="">—</NativeSelectOption>
          <NativeSelectOption value="female">Female</NativeSelectOption>
          <NativeSelectOption value="male">Male</NativeSelectOption>
          <NativeSelectOption value="other">Other</NativeSelectOption>
        </NativeSelect>
      </div>
      <Field label="Blood group" name="blood_group" defaultValue={patient?.blood_group} placeholder="e.g. B+" />
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" name="address" rows={2} defaultValue={patient?.address} />
      </div>

      {showClinical && (
        <>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="allergies">Allergies</Label>
            <Textarea id="allergies" name="allergies" rows={2} defaultValue={patient?.allergies} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="medical_history">Medical history</Label>
            <Textarea id="medical_history" name="medical_history" rows={4} defaultValue={patient?.medical_history}
              placeholder="Chronic conditions, surgeries, family history…" />
          </div>
        </>
      )}

      <div className="flex flex-col gap-3 sm:col-span-2">
        <FormError message={state.error} />
        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, name, className, ...props }: { label: string; name: string } & React.ComponentProps<"input">) {
  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`}>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
    </div>
  );
}
