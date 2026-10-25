"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavGroup = { title: string; items: { href: string; label: string }[] };

// Client component only because it needs the current URL to highlight
// the active link. Which links appear is decided on the server.
export function NavLinks({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="mb-2 px-3 text-[0.65rem] font-semibold uppercase tracking-widest text-sidebar-foreground/60">
            {group.title}
          </p>
          <ul className="flex flex-col">
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "block px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent",
                      active && "bg-sidebar-accent font-semibold text-sidebar-accent-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
