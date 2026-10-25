"use server";

import { revalidatePath } from "next/cache";
import { get, run, transaction } from "@/lib/db";
import { requirePermission } from "@/lib/auth";

export type ConsultationState = { error?: string; savedAt?: string };

type RxItemInput = {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
};

// The prescription editor sends its rows as a JSON string in a hidden field.
function parseItems(raw: string): RxItemInput[] {
  let rows: unknown;
  try {
    rows = JSON.parse(raw || "[]");
  } catch {
    return [];
  }
  if (!Array.isArray(rows)) return [];
  const text = (v: unknown) => String(v ?? "").trim().slice(0, 300);
  return rows
    .map((r) => ({
      medicine_name: text(r?.medicine_name),
      dosage: text(r?.dosage),
      frequency: text(r?.frequency),
      duration: text(r?.duration),
      instructions: text(r?.instructions),
    }))
    .filter((r) => r.medicine_name);
}

// Doctor-only: save complaints, diagnosis, notes and the prescription.
// Pressing "Save & complete" also finishes the visit.
export async function saveConsultation(
  visitId: number,
  _prev: ConsultationState,
  formData: FormData,
): Promise<ConsultationState> {
  const user = await requirePermission("clinical:write");

  const visit = get<{ status: string; appointment_id: number | null }>(
    "SELECT status, appointment_id FROM visits WHERE id = ?",
    visitId,
  );
  if (!visit) return { error: "Visit not found." };
  if (visit.status === "cancelled") return { error: "This visit was cancelled." };

  const field = (name: string) => String(formData.get(name) ?? "").trim();
  const items = parseItems(field("items"));
  const complete = formData.get("intent") === "complete";

  transaction(() => {
    run(
      `UPDATE visits SET complaints = ?, diagnosis = ?, notes = ?, advice = ?,
         doctor_id = COALESCE(doctor_id, ?),
         status = CASE WHEN status = 'waiting' THEN 'in_consultation' ELSE status END
       WHERE id = ?`,
      field("complaints"), field("diagnosis"), field("notes"), field("advice"), user.id, visitId,
    );

    // Simplest correct way to "edit" a list: replace all rows.
    run("DELETE FROM prescription_items WHERE visit_id = ?", visitId);
    for (const item of items) {
      run(
        `INSERT INTO prescription_items (visit_id, medicine_name, dosage, frequency, duration, instructions)
         VALUES (?, ?, ?, ?, ?, ?)`,
        visitId, item.medicine_name, item.dosage, item.frequency, item.duration, item.instructions,
      );
    }

    if (complete) {
      run("UPDATE visits SET status = 'completed', completed_at = datetime('now') WHERE id = ?", visitId);
      if (visit.appointment_id) {
        run("UPDATE appointments SET status = 'completed' WHERE id = ?", visit.appointment_id);
      }
    }
  });

  revalidatePath("/", "layout");
  return { savedAt: new Date().toLocaleTimeString() };
}
