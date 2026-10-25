"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { get, run, transaction } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import type { FormState } from "./patients";

const PAYMENT_METHODS = ["cash", "card", "upi", "other"];

export async function createInvoice(_prev: FormState, formData: FormData): Promise<FormState> {
  await requirePermission("invoices:manage");

  const patientId = Number(formData.get("patient_id"));
  const visitIdRaw = Number(formData.get("visit_id"));
  const notes = String(formData.get("notes") ?? "").trim();
  if (!get("SELECT id FROM patients WHERE id = ?", patientId)) return { error: "Choose a patient." };

  // Only link a visit if it really belongs to this patient.
  const visitId = visitIdRaw && get("SELECT id FROM visits WHERE id = ? AND patient_id = ?", visitIdRaw, patientId)
    ? visitIdRaw
    : null;

  let rows: { description?: unknown; quantity?: unknown; unit_price?: unknown }[] = [];
  try {
    rows = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Could not read the invoice items." };
  }
  const items = (Array.isArray(rows) ? rows : [])
    .map((r) => ({
      description: String(r.description ?? "").trim(),
      quantity: Math.max(1, Math.round(Number(r.quantity) || 1)),
      unit_price: Math.max(0, Number(r.unit_price) || 0),
    }))
    .filter((r) => r.description);
  if (items.length === 0) return { error: "Add at least one item." };

  const invoiceId = transaction(() => {
    const { id } = run("INSERT INTO invoices (patient_id, visit_id, notes) VALUES (?, ?, ?)", patientId, visitId, notes);
    for (const item of items) {
      run(
        "INSERT INTO invoice_items (invoice_id, description, quantity, unit_price) VALUES (?, ?, ?, ?)",
        id, item.description, item.quantity, item.unit_price,
      );
    }
    return id;
  });
  redirect(`/invoices/${invoiceId}`);
}

export async function updatePaymentStatus(invoiceId: number, formData: FormData) {
  await requirePermission("invoices:manage");
  const status = String(formData.get("status") ?? "");
  const method = String(formData.get("payment_method") ?? "");

  if (status === "paid") {
    run(
      "UPDATE invoices SET status = 'paid', payment_method = ?, paid_at = datetime('now') WHERE id = ?",
      PAYMENT_METHODS.includes(method) ? method : "cash", invoiceId,
    );
  } else if (status === "unpaid" || status === "cancelled") {
    run("UPDATE invoices SET status = ?, payment_method = '', paid_at = NULL WHERE id = ?", status, invoiceId);
  }
  revalidatePath("/", "layout");
}
