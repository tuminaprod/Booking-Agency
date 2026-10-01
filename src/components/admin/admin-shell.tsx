"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BedDouble, BookOpenCheck, Building2, CalendarRange, Compass, CreditCard, LayoutDashboard, MapPinned, Menu, MessageSquareText, ShieldAlert, Sparkles, Tag, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { useSession } from "@/lib/auth";
import { useHydrated } from "@/lib/stores/create-store";
import { ButtonLink } from "@/components/ui/button";
import { Drawer } from "@/components/ui/dialog";
import { EmptyState, Skeleton } from "@/components/ui/feedback";

export const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/reservations", label: "Reservations", icon: BookOpenCheck },
  { href: "/admin/hotels", label: "Hotels", icon: Building2 },
  { href: "/admin/rooms", label: "Rooms", icon: BedDouble },
  { href: "/admin/availability", label: "Availability", icon: CalendarRange },
  { href: "/admin/destinations", label: "Destinations", icon: MapPinned },
  { href: "/admin/trips", label: "Trips", icon: Compass },
  { href: "/admin/experiences", label: "Experiences", icon: Sparkles },
  { href: "/admin/promotions", label: "Promotions", icon: Tag },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquareText },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/users", label: "Users", icon: Users },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-0.5">
      {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <li key={href}>
            <Link href={href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={cn("flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors", active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white")}>
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const user = useSession();
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="hidden bg-navy lg:block" aria-label="Admin navigation">
        <div className="sticky top-[72px] max-h-[calc(100dvh-72px)] overflow-y-auto p-4">
          <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-gold-soft">Admin console</p>
          <NavList />
        </div>
      </aside>
      <div className="min-w-0">
        <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-2 lg:hidden">
          <button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-md px-2 text-sm font-medium text-ink hover:bg-sand" aria-haspopup="dialog">
            <Menu className="size-5" aria-hidden /> Admin menu
          </button>
        </div>
        <div className="border-b border-warning/20 bg-warning-tint px-4 py-2 text-[0.8125rem] text-warning sm:px-8">
          Demo console — data is fictional and edits are kept in this browser session only. Connect the repositories in <code className="font-mono">src/server</code> to a database to persist changes.
        </div>
        <div className="p-4 sm:p-8">
          {!hydrated ? (
            <Skeleton className="h-96" />
          ) : user?.role !== "admin" ? (
            <EmptyState
              icon={<ShieldAlert className="size-6" aria-hidden />}
              title="Admin access required"
              description="Sign in with an administrator account to manage hotels, reservations and content. The demo admin account is available on the sign-in page."
              action={<ButtonLink href="/auth/sign-in?next=/admin">Sign in as admin</ButtonLink>}
            />
          ) : (
            children
          )}
        </div>
      </div>
      <Drawer open={open} onClose={() => setOpen(false)} side="left" title="Admin console" className="bg-navy text-white [&_h2]:text-white">
        <NavList onNavigate={() => setOpen(false)} />
      </Drawer>
    </div>
  );
}
