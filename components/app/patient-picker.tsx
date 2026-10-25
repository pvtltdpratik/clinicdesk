import Link from "next/link";
import { findPatients } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyRow } from "./page-header";

// A plain GET search form: picking a patient just adds ?patientId= to the URL.
// The caller must already have checked patients:read.
export function PatientPicker({ basePath, search }: { basePath: string; search: string }) {
  const patients = search ? findPatients(search, 20) : findPatients("", 10);
  return (
    <div className="max-w-xl">
      <form className="mb-4 flex gap-3" action={basePath}>
        <Input name="q" defaultValue={search} placeholder="Search patient by name, phone or ID…" aria-label="Search patients" autoFocus />
        <Button type="submit" variant="outline">Search</Button>
      </form>
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {search ? "Results" : "Recently registered"}
      </p>
      {patients.length === 0 ? (
        <EmptyRow>
          No patients found. <Link href="/patients/new" className="underline">Register a new patient</Link>.
        </EmptyRow>
      ) : (
        <ul className="divide-y border">
          {patients.map((p) => (
            <li key={p.id}>
              <Link href={`${basePath}?patientId=${p.id}`} className="flex justify-between gap-4 px-3 py-2 text-sm hover:bg-muted">
                <span className="font-medium">{p.name}</span>
                <span className="text-muted-foreground">{p.phone || `#${p.id}`}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
