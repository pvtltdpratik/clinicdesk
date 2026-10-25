import "server-only";
import { all, get } from "./db";

// Read-only SQL queries shared by several pages.
// These do NOT check permissions themselves: the page or action that calls
// them must call requirePermission() first.

export type Patient = {
  id: number;
  name: string;
  gender: string;
  date_of_birth: string;
  phone: string;
  address: string;
  blood_group: string;
  allergies: string;
  medical_history: string;
  created_at: string;
};

export type Appointment = {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_phone: string;
  date: string;
  time: string;
  reason: string;
  status: "scheduled" | "arrived" | "completed" | "cancelled" | "no_show";
};

export type Visit = {
  id: number;
  patient_id: number;
  patient_name: string;
  appointment_id: number | null;
  visit_date: string;
  queue_number: number;
  arrived_at: string;
  status: "waiting" | "in_consultation" | "completed" | "cancelled";
  complaints: string;
  diagnosis: string;
  notes: string;
  advice: string;
  doctor_name: string | null;
  completed_at: string | null;
};

export type PrescriptionItem = {
  id: number;
  visit_id: number;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
};

export type Invoice = {
  id: number;
  patient_id: number;
  patient_name: string;
  visit_id: number | null;
  status: "unpaid" | "paid" | "cancelled";
  payment_method: string;
  notes: string;
  created_at: string;
  paid_at: string | null;
  total: number;
};

export type InvoiceItem = {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
};

// Local date as YYYY-MM-DD (the clinic's "today").
export function todayISO() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function findPatients(search: string, limit = 50) {
  const like = `%${search.trim()}%`;
  return all<Patient>(
    `SELECT * FROM patients
     WHERE ? = '' OR name LIKE ? OR phone LIKE ? OR CAST(id AS TEXT) = ?
     ORDER BY created_at DESC LIMIT ?`,
    search.trim(), like, like, search.trim(), limit,
  );
}

export function getPatient(id: number) {
  return get<Patient>("SELECT * FROM patients WHERE id = ?", id);
}

const APPOINTMENT_SELECT = `
  SELECT a.*, p.name AS patient_name, p.phone AS patient_phone
  FROM appointments a JOIN patients p ON p.id = a.patient_id`;

export function getAppointmentsForDate(date: string) {
  return all<Appointment>(`${APPOINTMENT_SELECT} WHERE a.date = ? ORDER BY a.time, a.id`, date);
}

export function getPatientAppointments(patientId: number) {
  return all<Appointment>(`${APPOINTMENT_SELECT} WHERE a.patient_id = ? ORDER BY a.date DESC, a.time DESC`, patientId);
}

const VISIT_SELECT = `
  SELECT v.*, p.name AS patient_name, u.name AS doctor_name
  FROM visits v
  JOIN patients p ON p.id = v.patient_id
  LEFT JOIN users u ON u.id = v.doctor_id`;

export function getQueue(date: string) {
  return all<Visit>(
    `${VISIT_SELECT} WHERE v.visit_date = ? AND v.status IN ('waiting', 'in_consultation')
     ORDER BY CASE v.status WHEN 'in_consultation' THEN 0 ELSE 1 END, v.queue_number`,
    date,
  );
}

export function getVisitsForDate(date: string) {
  return all<Visit>(`${VISIT_SELECT} WHERE v.visit_date = ? ORDER BY v.queue_number`, date);
}

export function getVisit(id: number) {
  return get<Visit>(`${VISIT_SELECT} WHERE v.id = ?`, id);
}

export function getPatientVisits(patientId: number) {
  return all<Visit>(`${VISIT_SELECT} WHERE v.patient_id = ? ORDER BY v.visit_date DESC, v.id DESC`, patientId);
}

export function getPrescriptionItems(visitId: number) {
  return all<PrescriptionItem>("SELECT * FROM prescription_items WHERE visit_id = ? ORDER BY id", visitId);
}

const INVOICE_SELECT = `
  SELECT i.*, p.name AS patient_name,
    COALESCE((SELECT SUM(quantity * unit_price) FROM invoice_items WHERE invoice_id = i.id), 0) AS total
  FROM invoices i JOIN patients p ON p.id = i.patient_id`;

export function getInvoices(status: string) {
  return all<Invoice>(`${INVOICE_SELECT} WHERE ? = '' OR i.status = ? ORDER BY i.id DESC LIMIT 200`, status, status);
}

export function getPatientInvoices(patientId: number) {
  return all<Invoice>(`${INVOICE_SELECT} WHERE i.patient_id = ? ORDER BY i.id DESC`, patientId);
}

export function getInvoice(id: number) {
  return get<Invoice>(`${INVOICE_SELECT} WHERE i.id = ?`, id);
}

export function getInvoiceItems(invoiceId: number) {
  return all<InvoiceItem>("SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id", invoiceId);
}

export function getClinicSummary(date: string) {
  return get<{ appointments: number; waiting: number; completed: number; unpaid: number }>(
    `SELECT
       (SELECT COUNT(*) FROM appointments WHERE date = ? AND status != 'cancelled') AS appointments,
       (SELECT COUNT(*) FROM visits WHERE visit_date = ? AND status = 'waiting') AS waiting,
       (SELECT COUNT(*) FROM visits WHERE visit_date = ? AND status = 'completed') AS completed,
       (SELECT COUNT(*) FROM invoices WHERE status = 'unpaid') AS unpaid`,
    date, date, date,
  )!;
}
