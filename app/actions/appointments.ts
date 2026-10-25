"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { get, run, transaction } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { addToQueue } from "@/lib/queue";
import type { FormState } from "./patients";

export async function bookAppointment(_prev: FormState, formData: FormData): Promise<FormState> {
  await requirePermission("appointments:manage");
  const patientId = Number(formData.get("patient_id"));
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!get("SELECT id FROM patients WHERE id = ?", patientId)) return { error: "Choose a patient." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Choose a date." };

  run("INSERT INTO appointments (patient_id, date, time, reason) VALUES (?, ?, ?, ?)", patientId, date, time, reason);
  redirect(`/appointments?date=${date}`);
}

export async function rescheduleAppointment(appointmentId: number, formData: FormData) {
  await requirePermission("appointments:manage");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  run("UPDATE appointments SET date = ?, time = ?, status = 'scheduled' WHERE id = ? AND status IN ('scheduled', 'no_show')", date, time, appointmentId);
  revalidatePath("/appointments");
}

export async function setAppointmentStatus(appointmentId: number, status: "cancelled" | "no_show" | "scheduled") {
  await requirePermission("appointments:manage");
  run("UPDATE appointments SET status = ? WHERE id = ? AND status != 'completed'", status, appointmentId);
  revalidatePath("/", "layout");
}

// Patient has arrived for their appointment: put them in today's queue.
export async function markArrived(appointmentId: number) {
  await requirePermission("queue:manage");
  const appointment = get<{ patient_id: number; status: string }>(
    "SELECT patient_id, status FROM appointments WHERE id = ?",
    appointmentId,
  );
  if (!appointment || appointment.status !== "scheduled") return;

  transaction(() => {
    run("UPDATE appointments SET status = 'arrived' WHERE id = ?", appointmentId);
    addToQueue(appointment.patient_id, appointmentId);
  });
  revalidatePath("/", "layout");
}
