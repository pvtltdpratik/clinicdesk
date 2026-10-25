"use client";

import { useActionState, useState } from "react";
import type { ConsultationState } from "@/app/actions/visits";
import type { PrescriptionItem } from "@/lib/queries";
import { MedicineAutocomplete } from "@/components/app/medicine-autocomplete";
import { FormError } from "@/components/app/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Row = Omit<PrescriptionItem, "id" | "visit_id">;
const EMPTY_ROW: Row = { medicine_name: "", dosage: "", frequency: "", duration: "", instructions: "" };

type Props = {
  action: (prev: ConsultationState, formData: FormData) => Promise<ConsultationState>;
  initial: { complaints: string; diagnosis: string; notes: string; advice: string };
  initialItems: Row[];
  completed: boolean;
};

export function ConsultationForm({ action, initial, initialItems, completed }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const [rows, setRows] = useState<Row[]>(initialItems.length ? initialItems : [EMPTY_ROW]);

  const update = (index: number, patch: Partial<Row>) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="items" value={JSON.stringify(rows)} />

      <div className="grid gap-5 lg:grid-cols-2">
        <TextField label="Chief complaints" name="complaints" defaultValue={initial.complaints} rows={3} />
        <TextField label="Diagnosis" name="diagnosis" defaultValue={initial.diagnosis} rows={3} />
        <TextField label="Clinical notes" name="notes" defaultValue={initial.notes} rows={4}
          placeholder="Examination findings, vitals, investigations…" />
        <TextField label="Advice for patient" name="advice" defaultValue={initial.advice} rows={4}
          placeholder="Diet, rest, follow-up date… (printed on prescription)" />
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-widest">Prescription (Rx)</legend>
        {rows.map((row, i) => (
          <div key={i} className="grid gap-3 border p-3 md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:items-end">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Medicine</span>
              <MedicineAutocomplete value={row.medicine_name} onChange={(name) => update(i, { medicine_name: name })} />
            </div>
            <SmallInput label="Dosage" value={row.dosage} placeholder="1 tablet" onChange={(v) => update(i, { dosage: v })} />
            <SmallInput label="Frequency" value={row.frequency} placeholder="1-0-1" onChange={(v) => update(i, { frequency: v })} />
            <SmallInput label="Duration" value={row.duration} placeholder="5 days" onChange={(v) => update(i, { duration: v })} />
            <Button type="button" variant="ghost" size="sm" aria-label="Remove medicine"
              onClick={() => setRows((current) => current.filter((_, j) => j !== i))}>Remove</Button>
            <div className="md:col-span-5">
              <SmallInput label="Instructions" value={row.instructions} placeholder="After food"
                onChange={(v) => update(i, { instructions: v })} />
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setRows((c) => [...c, EMPTY_ROW])}>
          + Add medicine
        </Button>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3 border-t pt-4">
        <Button type="submit" name="intent" value="save" variant="outline" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        {!completed && (
          <Button type="submit" name="intent" value="complete" disabled={pending}>Save & complete visit</Button>
        )}
        {state.savedAt && !state.error && <span className="text-sm text-muted-foreground">Saved at {state.savedAt}</span>}
        <FormError message={state.error} />
      </div>
    </form>
  );
}

function TextField({ label, name, ...props }: { label: string; name: string } & React.ComponentProps<"textarea">) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} {...props} />
    </div>
  );
}

function SmallInput({ label, value, placeholder, onChange }: { label: string; value: string; placeholder?: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
