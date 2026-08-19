"use client";
import { CurrentLocationIndicator } from "@/components/current-location";
import { useA11yTTS } from "@/lib/hooks/use-a11y-tts";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Accessibility,
  Search,
  MapPin,
  LayoutDashboard,
} from "lucide-react";
import { ProfileSelector } from "@/components/profile-selector";

const navigation = [
  { name: "Home", href: "/", icon: Search, desc: "Search venues" },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, desc: "Civic analytics" },
  { name: "Explore", href: "/nearby", icon: MapPin, desc: "Map view" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-border bg-background lg:flex"
      aria-label="Main navigation"
    >
      {/* Brand */}
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity" aria-label="Civic Horizon — Home">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Accessibility className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-display font-black text-foreground tracking-tight">Civic Horizon</span>
            <span className="text-[10px] text-muted-foreground font-medium">Accessibility Intelligence</span>
          </div>
        </Link>
      </div>

      <CurrentLocationIndicator />

      <div className="flex flex-1 flex-col overflow-y-auto py-5 px-3">
        {/* Navigation */}
        <div className="mb-6">
          <p className="px-3 mb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Menu</p>
          <nav className="flex flex-col gap-0.5" aria-label="Primary navigation">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
                    transition-all duration-200 group relative
                    ${isActive
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }
                  `}
                  aria-current={isActive ? "page" : undefined}
                  title={item.desc}
                >
                  <Icon
                    className={`h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-white" : "text-muted-foreground group-hover:text-primary"}`}
                    style={{ width: "18px", height: "18px" }}
                    aria-hidden="true"
                  />
                  <span>{item.name}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" aria-hidden="true" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Profile selector */}
        <div className="mt-auto">
          <p className="px-3 mb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Accessibility Profile</p>
          <ProfileSelector variant="default" />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-5 py-3 flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground/50 font-medium">
          SIH 2026 &middot; Civic Horizon
        </p>
        <ThemeToggle />
      </div>
    </aside>
  );
}

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur-md lg:hidden" role="banner">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-xl text-sm font-semibold"
      >
        Skip to main content
      </a>

      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity" aria-label="Civic Horizon — Home">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Accessibility className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
          <span className="text-base font-display font-black text-foreground tracking-tight">Civic Horizon</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ProfileSelector variant="header" />
        </div>
      </div>
      <CurrentLocationIndicator isMobile={true} />
    </header>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background lg:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex h-16 items-center justify-around px-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.name}
              className={`
                flex flex-col items-center justify-center gap-1 flex-1 h-full px-1
                transition-colors duration-150
                ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}
              `}
            >
              <div className={`
                flex items-center justify-center w-12 h-7 rounded-full transition-all duration-200
                ${isActive ? "bg-primary/10" : "bg-transparent"}
              `}>
                <Icon
                  className={`h-5 w-5 transition-transform duration-200 ${isActive ? "scale-110" : ""}`}
                  aria-hidden="true"
                />
              </div>
              <span className="text-[10px] font-semibold leading-none">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  useA11yTTS();

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      <Sidebar />
      <MobileHeader />

      <main id="main-content" className="flex-1 flex flex-col min-w-0 lg:ml-64 pb-16 lg:pb-0">
        {children}
      </main>

      <MobileBottomNav />
    </div>
  );
}

/* Backward-compat stubs */
export function Header() { return null; }
export function Footer() { return null; }
