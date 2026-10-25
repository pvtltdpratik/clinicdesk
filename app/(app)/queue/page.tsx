import Link from "next/link";
import { can, requirePermission } from "@/lib/auth";
import { findPatients, getQueue, getVisitsForDate, todayISO } from "@/lib/queries";
import { checkInPatient } from "@/app/actions/queue";
import { EmptyRow, PageHeader, Section } from "@/components/app/page-header";
import { QueueTable } from "@/components/app/queue-table";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata = { title: "Waiting queue · Clinic" };

export default async function QueuePage({ searchParams }: PageProps<"/queue">) {
  const user = await requirePermission("queue:manage");
  const { q } = await searchParams;
  const search = typeof q === "string" ? q.trim() : "";
  const today = todayISO();
  const finished = getVisitsForDate(today).filter((v) => v.status === "completed" || v.status === "cancelled");

  return (
    <>
      <PageHeader title="Waiting queue" description="Patients who have arrived today, in the order they will be seen." />

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Section title="Now waiting">
          <QueueTable visits={getQueue(today)} canConsult={can(user, "clinical:write")} canManage />
        </Section>

        <Section title="Walk-in check-in">
          <form className="mb-3 flex gap-2">
            <Input name="q" defaultValue={search} placeholder="Find patient…" aria-label="Find patient" />
            <Button type="submit" variant="outline" size="sm">Find</Button>
          </form>
          {search && (
            <ul className="divide-y text-sm">
              {findPatients(search, 8).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                  <span>{p.name} <span className="text-muted-foreground">{p.phone}</span></span>
                  <form action={checkInPatient.bind(null, p.id)}>
                    <Button type="submit" size="xs">Check in</Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            New patient? <Link href="/patients/new" className="underline">Register them first</Link>.
            Patients with appointments are added when you mark them “Arrived”.
          </p>
        </Section>
      </div>

      <div className="mt-6">
        <Section title="Finished today">
          {finished.length === 0 ? <EmptyRow>Nobody yet.</EmptyRow> : (
            <ul className="divide-y text-sm">
              {finished.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-2 py-2">
                  <span><span className="tabular-nums text-muted-foreground">#{v.queue_number}</span> {v.patient_name}</span>
                  <span className="flex items-center gap-2">
                    <StatusBadge status={v.status} />
                    {v.status === "completed" && (
                      <Link href={`/invoices/new?patientId=${v.patient_id}&visitId=${v.id}`} className="text-xs underline">Bill</Link>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </>
  );
}
