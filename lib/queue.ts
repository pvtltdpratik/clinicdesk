import "server-only";
import { get, run } from "@/lib/db";
import { todayISO } from "@/lib/queries";

// Not a Server Action (no "use server"), so it can't be called from the browser.
// Callers must check permissions first.
export function addToQueue(patientId: number, appointmentId: number | null) {
  const today = todayISO();
  const { next } = get<{ next: number }>(
    "SELECT COALESCE(MAX(queue_number), 0) + 1 AS next FROM visits WHERE visit_date = ?",
    today,
  )!;
  return run(
    "INSERT INTO visits (patient_id, appointment_id, visit_date, queue_number) VALUES (?, ?, ?, ?)",
    patientId, appointmentId, today, next,
  ).id;
}
