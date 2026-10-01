"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Briefcase, ChevronDown, Globe, Heart, HelpCircle, LayoutDashboard, LogOut, Menu, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { auth, useSession } from "@/lib/auth";
import { CURRENCIES, LANGUAGES } from "@/lib/format";
import { preferencesStore } from "@/lib/stores";
import type { CurrencyCode, LanguageCode } from "@/lib/models";
import { Popover } from "@/components/ui/popover";
import { Drawer } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { ButtonLink } from "@/components/ui/button";
import { GlobalSearch } from "./global-search";
import { Logo } from "./logo";
import { MAIN_NAV } from "./nav-config";

function usePreferences() {
  const currency = preferencesStore.use((s) => s.currency);
  const language = preferencesStore.use((s) => s.language);
  return { currency, language };
}

function PreferencePanel({ onDone }: { onDone?: () => void }) {
  const { currency, language } = usePreferences();
  const toast = useToast();
  const setLanguage = (code: LanguageCode, available: boolean, label: string) => {
    preferencesStore.set((s) => ({ ...s, language: code }));
    if (!available) toast.info(`${label} is coming soon`, "We're translating Oriel — content is shown in English for now.");
    onDone?.();
  };
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Language</legend>
        <div className="flex flex-col">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              aria-pressed={language === l.code}
              onClick={() => setLanguage(l.code, l.available, l.label)}
              className={cn("flex h-10 items-center justify-between rounded-md px-3 text-left text-[0.9375rem] hover:bg-sand", language === l.code && "bg-sand font-semibold")}
            >
              {l.label}
              {!l.available && <span className="text-xs text-muted">Soon</span>}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Display currency</legend>
        <div className="flex flex-col">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              type="button"
              aria-pressed={currency === c.code}
              onClick={() => {
                preferencesStore.set((s) => ({ ...s, currency: c.code as CurrencyCode }));
                onDone?.();
              }}
              className={cn("flex h-10 items-center justify-between rounded-md px-3 text-left text-[0.9375rem] hover:bg-sand", currency === c.code && "bg-sand font-semibold")}
            >
              <span>{c.label}</span>
              <span className="text-sm text-muted">{c.code}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 px-3 text-xs leading-relaxed text-muted">Prices are converted at indicative rates. Payments are charged in USD.</p>
      </fieldset>
    </div>
  );
}

function PreferencesMenu({ solid }: { solid: boolean }) {
  const { currency, language } = usePreferences();
  return (
    <Popover
      id="prefs-menu"
      align="end"
      label="Language and currency"
      panelClassName="w-[30rem]"
      trigger={({ toggle, ref, ...aria }) => (
        <button ref={ref} type="button" onClick={toggle} {...aria} className={cn("inline-flex h-10 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors", solid ? "text-ink hover:bg-sand" : "text-white hover:bg-white/10")} aria-label={`Language ${language.toUpperCase()}, currency ${currency}. Change`}>
          <Globe className="size-4" aria-hidden />
          <span className="hidden whitespace-nowrap xl:inline">
            {language.toUpperCase()} · {currency}
          </span>
        </button>
      )}
    >
      {(close) => <PreferencePanel onDone={close} />}
    </Popover>
  );
}

function AccountMenu({ solid }: { solid: boolean }) {
  const user = useSession();
  const router = useRouter();
  const toast = useToast();
  if (!user) {
    return (
      <ButtonLink href="/auth/sign-in" size="sm" variant={solid ? "primary" : "inverse"} className="h-10">
        Sign in
      </ButtonLink>
    );
  }
  const item = "flex h-11 items-center gap-3 rounded-md px-3 text-[0.9375rem] text-ink hover:bg-sand";
  return (
    <Popover
      id="account-menu"
      align="end"
      label="Account"
      panelClassName="w-64 p-2"
      trigger={({ toggle, ref, ...aria }) => (
        <button ref={ref} type="button" onClick={toggle} {...aria} className={cn("inline-flex h-10 items-center gap-2 rounded-md pl-1 pr-2 text-sm font-medium", solid ? "text-ink hover:bg-sand" : "text-white hover:bg-white/10")} aria-label="Account menu">
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-gold text-sm font-semibold text-white" aria-hidden>
            {user.firstName[0]}
            {user.lastName[0]}
          </span>
          <span className="hidden 2xl:inline">{user.firstName}</span>
          <ChevronDown className="size-4" aria-hidden />
        </button>
      )}
    >
      {(close) => (
        <nav aria-label="Account" onClick={close}>
          <div className="border-b border-line px-3 pb-3 pt-2">
            <p className="font-semibold text-ink">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-sm text-muted">{user.email}</p>
          </div>
          <div className="pt-1">
            <Link className={item} href="/account">
              <User className="size-4 text-muted" aria-hidden /> My account
            </Link>
            <Link className={item} href="/account?tab=trips">
              <Briefcase className="size-4 text-muted" aria-hidden /> My trips
            </Link>
            <Link className={item} href="/wishlist">
              <Heart className="size-4 text-muted" aria-hidden /> Wishlist
            </Link>
            {user.role === "admin" && (
              <Link className={item} href="/admin">
                <LayoutDashboard className="size-4 text-muted" aria-hidden /> Admin console
              </Link>
            )}
            <button
              type="button"
              className={cn(item, "w-full")}
              onClick={async () => {
                await auth.signOut();
                toast.info("You're signed out", "See you on your next journey.");
                router.push("/");
              }}
            >
              <LogOut className="size-4 text-muted" aria-hidden /> Sign out
            </button>
          </div>
        </nav>
      )}
    </Popover>
  );
}

export function Header() {
  const pathname = usePathname();
  const overlayRoute = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const user = useSession();

  useEffect(() => {
    if (!overlayRoute) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlayRoute]);

  const solid = !overlayRoute || scrolled;
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      data-site-header
      className={cn(
        "top-0 z-40 w-full transition-[background-color,box-shadow,border-color] duration-200",
        overlayRoute ? "fixed" : "sticky",
        solid ? "border-b border-line bg-surface/95 shadow-soft backdrop-blur supports-[backdrop-filter]:bg-surface/90" : "border-b border-transparent bg-gradient-to-b from-ink/50 to-transparent",
      )}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-ink focus:shadow-raised">
        Skip to content
      </a>
      <div className="container-page flex h-16 items-center gap-4 lg:h-[72px]">
        <button
          type="button"
          className={cn("-ml-2 inline-flex size-11 items-center justify-center rounded-md lg:hidden", solid ? "text-ink hover:bg-sand" : "text-white hover:bg-white/10")}
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-haspopup="dialog"
        >
          <Menu className="size-6" aria-hidden />
        </button>
        <Logo tone={solid ? "dark" : "light"} className="shrink-0" />

        <nav aria-label="Main" className="ml-2 hidden lg:block xl:ml-4">
          <ul className="flex items-center gap-0.5">
            {MAIN_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "relative inline-flex h-10 items-center whitespace-nowrap rounded-md px-2.5 text-[0.9375rem] font-medium transition-colors xl:px-3",
                    solid ? "text-ink-soft hover:bg-sand hover:text-ink" : "text-white/90 hover:bg-white/10 hover:text-white",
                    isActive(item.href) && (solid ? "text-ink after:absolute after:inset-x-3 after:-bottom-[15px] after:h-0.5 after:bg-gold" : "text-white"),
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <GlobalSearch light={!solid} />
          <div className="hidden items-center gap-1 lg:flex">
            <PreferencesMenu solid={solid} />
            <Link href="/help" className={cn("hidden h-10 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-sm font-medium xl:inline-flex", solid ? "text-ink hover:bg-sand" : "text-white hover:bg-white/10")}>
              <HelpCircle className="size-4" aria-hidden />
              Help
            </Link>
            <Link href={user ? "/account?tab=trips" : "/auth/sign-in?next=/account%3Ftab%3Dtrips"} className={cn("mr-1 hidden h-10 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-sm font-medium xl:inline-flex", solid ? "text-ink hover:bg-sand" : "text-white hover:bg-white/10")}>
              <Briefcase className="size-4" aria-hidden />
              My Trips
            </Link>
            <AccountMenu solid={solid} />
          </div>
        </div>
      </div>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} side="left" title={<Logo className="pointer-events-none" />}>
        <nav aria-label="Mobile" onClick={(e) => (e.target as HTMLElement).closest("a") && setMenuOpen(false)}>
          <ul className="-mx-2 flex flex-col">
            {MAIN_NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} aria-current={isActive(item.href) ? "page" : undefined} className={cn("flex h-12 items-center rounded-md px-3 text-lg font-medium text-ink hover:bg-sand", isActive(item.href) && "bg-sand")}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="my-4 h-px bg-line" />
          <ul className="-mx-2 flex flex-col">
            <li>
              <Link href={user ? "/account?tab=trips" : "/auth/sign-in"} className="flex h-12 items-center gap-3 rounded-md px-3 text-[0.9375rem] text-ink hover:bg-sand">
                <Briefcase className="size-5 text-muted" aria-hidden /> My Trips
              </Link>
            </li>
            <li>
              <Link href="/wishlist" className="flex h-12 items-center gap-3 rounded-md px-3 text-[0.9375rem] text-ink hover:bg-sand">
                <Heart className="size-5 text-muted" aria-hidden /> Wishlist
              </Link>
            </li>
            <li>
              <Link href={user ? "/account" : "/auth/sign-in"} className="flex h-12 items-center gap-3 rounded-md px-3 text-[0.9375rem] text-ink hover:bg-sand">
                <User className="size-5 text-muted" aria-hidden /> {user ? "My account" : "Sign in or create account"}
              </Link>
            </li>
            <li>
              <Link href="/help" className="flex h-12 items-center gap-3 rounded-md px-3 text-[0.9375rem] text-ink hover:bg-sand">
                <HelpCircle className="size-5 text-muted" aria-hidden /> Help centre
              </Link>
            </li>
          </ul>
          <div className="my-4 h-px bg-line" />
          <PreferencePanel />
        </nav>
      </Drawer>
    </header>
  );
}
