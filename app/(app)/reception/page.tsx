import Link from "next/link";
import { can, requirePermission } from "@/lib/auth";
import { getAppointmentsForDate, getClinicSummary, getQueue, todayISO } from "@/lib/queries";
import { PageHeader, Section } from "@/components/app/page-header";
import { AppointmentTable } from "@/components/app/appointment-table";
import { QueueTable } from "@/components/app/queue-table";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Reception · Clinic" };

export default async function ReceptionDashboard() {
  const user = await requirePermission("queue:manage");
  const today = todayISO();
  const summary = getClinicSummary(today);

  return (
    <>
      <PageHeader
        title="Front desk"
        description={new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
        actions={
          <>
            <Link href="/patients/new" className={buttonVariants()}>Register patient</Link>
            <Link href="/appointments/new" className={buttonVariants({ variant: "outline" })}>Book appointment</Link>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-px border bg-border lg:grid-cols-4">
        <Stat label="Appointments today" value={summary.appointments} href="/appointments" />
        <Stat label="Waiting now" value={summary.waiting} href="/queue" />
        <Stat label="Seen today" value={summary.completed} />
        <Stat label="Unpaid invoices" value={summary.unpaid} href="/invoices?status=unpaid" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Today's appointments">
          <AppointmentTable appointments={getAppointmentsForDate(today)} />
        </Section>
        <Section title="Waiting queue">
          <QueueTable visits={getQueue(today)} canConsult={can(user, "clinical:write")} canManage />
        </Section>
      </div>
    </>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href?: string }) {
  const body = (
    <>
      <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-3xl tabular-nums">{value}</p>
    </>
  );
  return href ? (
    <Link href={href} className="bg-background p-4 hover:bg-muted">{body}</Link>
  ) : (
    <div className="bg-background p-4">{body}</div>
  );
}
