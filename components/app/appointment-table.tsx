import Link from "next/link";
import type { Appointment } from "@/lib/queries";
import { markArrived, setAppointmentStatus } from "@/app/actions/appointments";
import { StatusBadge } from "./status-badge";
import { EmptyRow } from "./page-header";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Used on both dashboards and the appointments page.
export function AppointmentTable({ appointments, showActions = true }: { appointments: Appointment[]; showActions?: boolean }) {
  if (appointments.length === 0) return <EmptyRow>No appointments.</EmptyRow>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Time</TableHead>
          <TableHead>Patient</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Status</TableHead>
          {showActions && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {appointments.map((a) => (
          <TableRow key={a.id}>
            <TableCell className="tabular-nums">{a.time || "—"}</TableCell>
            <TableCell>
              <Link href={`/patients/${a.patient_id}`} className="font-medium hover:underline">
                {a.patient_name}
              </Link>
              {a.patient_phone && <span className="block text-xs text-muted-foreground">{a.patient_phone}</span>}
            </TableCell>
            <TableCell className="max-w-48 truncate">{a.reason || "—"}</TableCell>
            <TableCell>
              <StatusBadge status={a.status} />
            </TableCell>
            {showActions && (
              <TableCell>
                <div className="flex justify-end gap-1">
                  {a.status === "scheduled" && (
                    <>
                      <form action={markArrived.bind(null, a.id)}>
                        <Button type="submit" size="xs">Arrived</Button>
                      </form>
                      <form action={setAppointmentStatus.bind(null, a.id, "no_show")}>
                        <Button type="submit" size="xs" variant="outline">No-show</Button>
                      </form>
                      <form action={setAppointmentStatus.bind(null, a.id, "cancelled")}>
                        <Button type="submit" size="xs" variant="destructive">Cancel</Button>
                      </form>
                    </>
                  )}
                  {(a.status === "cancelled" || a.status === "no_show") && (
                    <form action={setAppointmentStatus.bind(null, a.id, "scheduled")}>
                      <Button type="submit" size="xs" variant="outline">Restore</Button>
                    </form>
                  )}
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
