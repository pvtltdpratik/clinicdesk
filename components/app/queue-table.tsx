import Link from "next/link";
import type { Visit } from "@/lib/queries";
import { cancelVisit, moveInQueue, startConsultation } from "@/app/actions/queue";
import { StatusBadge } from "./status-badge";
import { EmptyRow } from "./page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function timeOf(sqliteDate: string) {
  // SQLite datetime('now') is UTC "YYYY-MM-DD HH:MM:SS".
  return new Date(`${sqliteDate.replace(" ", "T")}Z`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// canConsult / canManage come from the server-side permission check.
// They only hide buttons; the actions re-check permissions themselves.
export function QueueTable({ visits, canConsult, canManage }: { visits: Visit[]; canConsult: boolean; canManage: boolean }) {
  if (visits.length === 0) return <EmptyRow>Nobody is waiting.</EmptyRow>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Patient</TableHead>
          <TableHead>Arrived</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {visits.map((v) => (
          <TableRow key={v.id}>
            <TableCell className="font-semibold tabular-nums">{v.queue_number}</TableCell>
            <TableCell>
              <Link href={`/patients/${v.patient_id}`} className="font-medium hover:underline">
                {v.patient_name}
              </Link>
              {v.appointment_id ? null : <span className="block text-xs text-muted-foreground">Walk-in</span>}
            </TableCell>
            <TableCell className="tabular-nums">{timeOf(v.arrived_at)}</TableCell>
            <TableCell>
              <StatusBadge status={v.status} />
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                {canConsult && v.status === "waiting" && (
                  <form action={startConsultation.bind(null, v.id)}>
                    <Button type="submit" size="xs">Start consultation</Button>
                  </form>
                )}
                {canConsult && v.status === "in_consultation" && (
                  <Link href={`/visits/${v.id}`} className={buttonVariants({ size: "xs" })}>
                    Continue
                  </Link>
                )}
                {canManage && v.status === "waiting" && (
                  <>
                    <form action={moveInQueue.bind(null, v.id, "up")}>
                      <Button type="submit" size="xs" variant="outline" aria-label="Move up">↑</Button>
                    </form>
                    <form action={moveInQueue.bind(null, v.id, "down")}>
                      <Button type="submit" size="xs" variant="outline" aria-label="Move down">↓</Button>
                    </form>
                    <form action={cancelVisit.bind(null, v.id)}>
                      <Button type="submit" size="xs" variant="destructive">Remove</Button>
                    </form>
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
