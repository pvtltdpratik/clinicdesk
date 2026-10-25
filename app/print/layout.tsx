import { Suspense, type ReactNode } from "react";

// Printable pages: no sidebar, plain paper-like layout.
export default function PrintLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 bg-muted/40 py-8 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl bg-white p-10 text-black shadow print:max-w-none print:p-0 print:shadow-none">
        <Suspense fallback={<p>Loading…</p>}>{children}</Suspense>
      </div>
    </div>
  );
}

