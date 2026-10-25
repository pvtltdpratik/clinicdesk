"use client";

import { useActionState } from "react";
import { bookAppointment } from "@/app/actions/appointments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/app/form-error";

export function BookAppointmentForm({ patientId, defaultDate }: { patientId: number; defaultDate: string }) {
  const [state, formAction, pending] = useActionState(bookAppointment, {});
  return (
    <form action={formAction} className="grid max-w-xl gap-5 sm:grid-cols-2">
      <input type="hidden" name="patient_id" value={patientId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="date">Date *</Label>
        <Input id="date" name="date" type="date" defaultValue={defaultDate} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="time">Time</Label>
        <Input id="time" name="time" type="time" />
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="reason">Reason for visit</Label>
        <Input id="reason" name="reason" placeholder="e.g. Fever since 3 days, follow-up" />
      </div>
      <div className="flex flex-col gap-3 sm:col-span-2">
        <FormError message={state.error} />
        <Button type="submit" disabled={pending} className="w-fit">{pending ? "Booking…" : "Book appointment"}</Button>
      </div>
    </form>
  );
}
