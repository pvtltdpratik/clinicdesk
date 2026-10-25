import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { getAppointmentsForDate, todayISO } from "@/lib/queries";
import { rescheduleAppointment } from "@/app/actions/appointments";
import { PageHeader, Section } from "@/components/app/page-header";
import { AppointmentTable } from "@/components/app/appointment-table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata = { title: "Appointments · Clinic" };

function shiftDate(date: string, days: number) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function AppointmentsPage({ searchParams }: PageProps<"/appointments">) {
  await requirePermission("appointments:manage");
  const { date: rawDate } = await searchParams;
  const date = typeof rawDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : todayISO();
  const appointments = getAppointmentsForDate(date);
  const reschedulable = appointments.filter((a) => a.status === "scheduled" || a.status === "no_show");

  return (
    <>
      <PageHeader
        title="Appointments"
        description={new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        actions={<Link href="/appointments/new" className={buttonVariants()}>Book appointment</Link>}
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Link href={`/appointments?date=${shiftDate(date, -1)}`} className={buttonVariants({ variant: "outline", size: "sm" })}>← Prev</Link>
        <Link href="/appointments" className={buttonVariants({ variant: "outline", size: "sm" })}>Today</Link>
        <Link href={`/appointments?date=${shiftDate(date, 1)}`} className={buttonVariants({ variant: "outline", size: "sm" })}>Next →</Link>
        <form className="flex items-center gap-2">
          <Input type="date" name="date" defaultValue={date} className="w-auto" aria-label="Choose date" />
          <Button type="submit" size="sm" variant="ghost">Go</Button>
        </form>
      </div>

      <div className="grid gap-6">
        <Section title={`${appointments.length} appointment${appointments.length === 1 ? "" : "s"}`}>
          <AppointmentTable appointments={appointments} />
        </Section>

        {reschedulable.length > 0 && (
          <Section title="Reschedule">
            <ul className="divide-y">
              {reschedulable.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                  <span className="min-w-40 font-medium">{a.patient_name}</span>
                  <form action={rescheduleAppointment.bind(null, a.id)} className="flex flex-wrap items-center gap-2">
                    <Input type="date" name="date" defaultValue={a.date} required className="w-auto" aria-label="New date" />
                    <Input type="time" name="time" defaultValue={a.time} className="w-auto" aria-label="New time" />
                    <Button type="submit" size="xs" variant="outline">Move</Button>
                  </form>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </>
  );
}
