import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { findPatients } from "@/lib/queries";
import { EmptyRow, PageHeader } from "@/components/app/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata = { title: "Patients · Clinic" };

export default async function PatientsPage({ searchParams }: PageProps<"/patients">) {
  await requirePermission("patients:read");
  const { q } = await searchParams;
  const search = typeof q === "string" ? q : "";
  const patients = findPatients(search);

  return (
    <>
      <PageHeader
        title="Patients"
        description="Search by name, phone number or patient ID."
        actions={<Link href="/patients/new" className={buttonVariants()}>Register patient</Link>}
      />

      <form className="mb-6 flex max-w-xl gap-3">
        <Input name="q" defaultValue={search} placeholder="Search patients…" aria-label="Search patients" />
        <Button type="submit" variant="outline">Search</Button>
      </form>

      {patients.length === 0 ? (
        <EmptyRow>{search ? `No patients match “${search}”.` : "No patients registered yet."}</EmptyRow>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Date of birth</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="tabular-nums text-muted-foreground">#{p.id}</TableCell>
                <TableCell>
                  <Link href={`/patients/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                </TableCell>
                <TableCell>{p.phone || "—"}</TableCell>
                <TableCell className="capitalize">{p.gender || "—"}</TableCell>
                <TableCell>{p.date_of_birth || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
