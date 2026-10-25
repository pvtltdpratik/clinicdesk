import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Not allowed · Clinic" };

export default function ForbiddenPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="max-w-md border p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-destructive">403 · Not allowed</p>
        <h1 className="mt-2 font-heading text-2xl">You don&apos;t have access to this</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This part of the clinic system is limited to other staff roles. Ask the clinic administrator if you need access.
        </p>
        <Link href="/" className={buttonVariants({ className: "mt-6" })}>
          Back to my dashboard
        </Link>
      </div>
    </main>
  );
}
