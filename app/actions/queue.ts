"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { get, run, transaction } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { todayISO } from "@/lib/queries";
import { addToQueue } from "@/lib/queue";

// Walk-in patient (no appointment) joins today's queue.
export async function checkInPatient(patientId: number) {
  await requirePermission("queue:manage");
  if (!get("SELECT id FROM patients WHERE id = ?", patientId)) return;

  const alreadyWaiting = get(
    "SELECT id FROM visits WHERE patient_id = ? AND visit_date = ? AND status IN ('waiting', 'in_consultation')",
    patientId, todayISO(),
  );
  if (!alreadyWaiting) addToQueue(patientId, null);
  redirect("/queue");
}

// Remove a patient from the queue (left, or checked in by mistake).
export async function cancelVisit(visitId: number) {
  await requirePermission("queue:manage");
  transaction(() => {
    const visit = get<{ appointment_id: number | null }>(
      "SELECT appointment_id FROM visits WHERE id = ? AND status = 'waiting'",
      visitId,
    );
    if (!visit) return;
    run("UPDATE visits SET status = 'cancelled' WHERE id = ?", visitId);
    if (visit.appointment_id) {
      run("UPDATE appointments SET status = 'scheduled' WHERE id = ?", visit.appointment_id);
    }
  });
  revalidatePath("/", "layout");
}

// Swap a waiting patient with the one before/after them in the queue.
export async function moveInQueue(visitId: number, direction: "up" | "down") {
  await requirePermission("queue:manage");
  const visit = get<{ queue_number: number; visit_date: string }>(
    "SELECT queue_number, visit_date FROM visits WHERE id = ? AND status = 'waiting'",
    visitId,
  );
  if (!visit) return;

  const neighbour = get<{ id: number; queue_number: number }>(
    direction === "up"
      ? "SELECT id, queue_number FROM visits WHERE visit_date = ? AND status = 'waiting' AND queue_number < ? ORDER BY queue_number DESC LIMIT 1"
      : "SELECT id, queue_number FROM visits WHERE visit_date = ? AND status = 'waiting' AND queue_number > ? ORDER BY queue_number ASC LIMIT 1",
    visit.visit_date, visit.queue_number,
  );
  if (!neighbour) return;

  transaction(() => {
    run("UPDATE visits SET queue_number = ? WHERE id = ?", neighbour.queue_number, visitId);
    run("UPDATE visits SET queue_number = ? WHERE id = ?", visit.queue_number, neighbour.id);
  });
  revalidatePath("/queue");
}

// Doctor-only: call the patient in and open the consultation screen.
export async function startConsultation(visitId: number) {
  const user = await requirePermission("clinical:write");
  run(
    "UPDATE visits SET status = 'in_consultation', doctor_id = ? WHERE id = ? AND status = 'waiting'",
    user.id, visitId,
  );
  redirect(`/visits/${visitId}`);
}
