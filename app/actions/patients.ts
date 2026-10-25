"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { run } from "@/lib/db";
import { can, requirePermission } from "@/lib/auth";

export type FormState = { error?: string };

function readPatientForm(formData: FormData) {
  const field = (name: string) => String(formData.get(name) ?? "").trim();
  return {
    name: field("name"),
    gender: field("gender"),
    date_of_birth: field("date_of_birth"),
    phone: field("phone"),
    address: field("address"),
    blood_group: field("blood_group"),
    allergies: field("allergies"),
    medical_history: field("medical_history"),
  };
}

export async function createPatient(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission("patients:write");
  const p = readPatientForm(formData);
  if (!p.name) return { error: "Patient name is required." };

  // Medical details are clinical data: only saved if this user may write them.
  const clinical = can(user, "clinical:write");
  const { id } = run(
    `INSERT INTO patients (name, gender, date_of_birth, phone, address, blood_group, allergies, medical_history)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    p.name, p.gender, p.date_of_birth, p.phone, p.address, p.blood_group,
    clinical ? p.allergies : "", clinical ? p.medical_history : "",
  );
  redirect(`/patients/${id}`);
}

export async function updatePatient(patientId: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission("patients:write");
  const p = readPatientForm(formData);
  if (!p.name) return { error: "Patient name is required." };

  run(
    `UPDATE patients SET name = ?, gender = ?, date_of_birth = ?, phone = ?, address = ?, blood_group = ?
     WHERE id = ?`,
    p.name, p.gender, p.date_of_birth, p.phone, p.address, p.blood_group, patientId,
  );
  if (can(user, "clinical:write")) {
    run("UPDATE patients SET allergies = ?, medical_history = ? WHERE id = ?", p.allergies, p.medical_history, patientId);
  }
  revalidatePath(`/patients/${patientId}`);
  redirect(`/patients/${patientId}`);
}
