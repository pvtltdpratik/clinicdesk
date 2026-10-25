import { Suspense, type ReactNode } from "react";
import { requireUser, type CurrentUser } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { NavLinks, type NavGroup } from "@/components/app/nav-links";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Every page inside app/(app)/ is a logged-in page and shares this layout.
// Reading the session depends on the request, so (with Cache Components on)
// it has to happen inside a <Suspense> boundary.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading…</div>}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}

const FRONT_DESK: NavGroup["items"] = [
  { href: "/patients", label: "Patients" },
  { href: "/appointments", label: "Appointments" },
  { href: "/queue", label: "Waiting queue" },
  { href: "/invoices", label: "Invoices & billing" },
];

// Each role gets its own navigation. Doctors see their clinical workspace
// first, plus every front-desk tool.
function navFor(user: CurrentUser): NavGroup[] {
  if (user.role === "doctor") {
    return [
      { title: "Clinical", items: [{ href: "/doctor", label: "Doctor dashboard" }] },
      { title: "Front desk", items: [{ href: "/reception", label: "Reception overview" }, ...FRONT_DESK] },
    ];
  }
  return [{ title: "Front desk", items: [{ href: "/reception", label: "Dashboard" }, ...FRONT_DESK] }];
}

async function AppShell({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const isDoctor = user.role === "doctor";

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex flex-col gap-6 border-b bg-sidebar p-4 text-sidebar-foreground md:w-60 md:shrink-0 md:border-r md:border-b-0 print:hidden">
        <div className={cn("border-l-4 pl-3", isDoctor ? "border-violet-500" : "border-sky-500")}>
          <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-sidebar-foreground/60">
            {isDoctor ? "Doctor workspace" : "Front desk"}
          </p>
          <p className="font-heading text-lg leading-tight">{user.name}</p>
          <p className="text-xs text-sidebar-foreground/60">@{user.username}</p>
        </div>
        <NavLinks groups={navFor(user)} />
        <form action={logout} className="md:mt-auto">
          <Button type="submit" variant="outline" size="sm" className="w-full">
            Log out
          </Button>
        </form>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
