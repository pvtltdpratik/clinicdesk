import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { getAppointmentsForDate, getQueue, getVisitsForDate, todayISO } from "@/lib/queries";
import { EmptyRow, PageHeader, Section } from "@/components/app/page-header";
import { AppointmentTable } from "@/components/app/appointment-table";
import { QueueTable } from "@/components/app/queue-table";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Doctor · Clinic" };

export default async function DoctorDashboard() {
  // Doctor-only page: receptionists are redirected to /forbidden.
  const user = await requirePermission("clinical:write");
  const today = todayISO();
  const queue = getQueue(today);
  const seen = getVisitsForDate(today).filter((v) => v.status === "completed");

  return (
    <>
      <PageHeader
        title={`Good day, ${user.name}`}
        description={`${queue.filter((v) => v.status === "waiting").length} waiting · ${seen.length} seen today`}
        actions={<Link href="/patients" className={buttonVariants({ variant: "outline" })}>Find patient</Link>}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Waiting patients">
          <QueueTable visits={queue} canConsult canManage />
        </Section>
        <Section title="Today's appointments">
          <AppointmentTable appointments={getAppointmentsForDate(today)} />
        </Section>
        <Section title="Seen today">
          {seen.length === 0 ? (
            <EmptyRow>No completed consultations yet.</EmptyRow>
          ) : (
            <ul className="divide-y">
              {seen.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-4 py-2 text-sm">
                  <span>
                    <span className="font-medium">{v.patient_name}</span>
                    <span className="block text-xs text-muted-foreground">{v.diagnosis || "No diagnosis recorded"}</span>
                  </span>
                  <Link href={`/visits/${v.id}`} className={buttonVariants({ size: "xs", variant: "outline" })}>Open</Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </>
  );
}
