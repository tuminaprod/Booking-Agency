"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Compass, Heart, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { useSession } from "@/lib/auth";
import { wishlistStore } from "@/lib/stores";
import { HIDE_BOTTOM_NAV } from "./nav-config";

/** Mobile tab bar — 4 destinations, always labelled. */
export function BottomNav() {
  const pathname = usePathname();
  const user = useSession();
  const saved = wishlistStore.use((s) => s.items.length);
  if (HIDE_BOTTOM_NAV.some((r) => r.test(pathname))) return null;

  const items = [
    { href: "/", label: "Explore", icon: Compass, active: pathname === "/" || pathname.startsWith("/hotels") || pathname.startsWith("/destinations") },
    { href: user ? "/account?tab=trips" : "/auth/sign-in", label: "Trips", icon: Briefcase, active: false },
    { href: "/wishlist", label: "Favourites", icon: Heart, active: pathname.startsWith("/wishlist"), badge: saved },
    { href: user ? "/account" : "/auth/sign-in", label: user ? "Account" : "Sign in", icon: User, active: pathname.startsWith("/account") },
  ];

  return (
    <nav data-mobile-nav aria-label="Quick navigation" className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {items.map(({ href, label, icon: Icon, active, badge }) => (
          <li key={label}>
            <Link href={href} aria-current={active ? "page" : undefined} className={cn("flex h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium", active ? "text-navy" : "text-muted")}>
              <span className="relative">
                <Icon className={cn("size-[22px]", active && "stroke-[2.25]")} aria-hidden />
                {badge ? (
                  <span className="absolute -right-2.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[0.625rem] font-semibold text-white">
                    {badge}
                    <span className="sr-only"> saved items</span>
                  </span>
                ) : null}
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
