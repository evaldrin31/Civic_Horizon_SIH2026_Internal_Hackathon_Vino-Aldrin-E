"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Accessibility, 
  Menu, 
  X, 
  Search,
  MapPin,
  Info,
  MessageSquare
} from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "Search", href: "/", icon: Search },
  { name: "Nearby", href: "/nearby", icon: MapPin },
  { name: "About", href: "/about", icon: Info },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded"
      >
        Skip to main content
      </a>
      
      <div className="container flex h-14 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Accessibility className="h-6 w-6 text-primary" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-tight">AIP</span>
            <span className="text-[10px] text-muted-foreground leading-tight hidden sm:block">
              Accessibility Intelligence
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav 
          id="mobile-menu" 
          className="md:hidden border-t bg-background"
          aria-label="Mobile navigation"
        >
          <div className="container py-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Accessibility className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="font-bold">Accessibility Intelligence Platform</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Evidence-backed accessibility information for venues across India. 
              Built for SIH 2026.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-medium mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Search Venues
                </Link>
              </li>
              <li>
                <Link href="/nearby" className="text-muted-foreground hover:text-foreground transition-colors">
                  Find Nearby
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About the Platform
                </Link>
              </li>
            </ul>
          </div>

          {/* Status */}
          <div>
            <h3 className="font-medium mb-3">Platform Status</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full" aria-hidden="true" />
                <span>Demo Data Mode</span>
              </div>
              <p>
                Currently using demo data for development. 
                Real accessibility data will be imported from research.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            © 2026 Accessibility Intelligence Platform. 
            SIH 2026 Internal Hackathon — Problem Statement #30
          </p>
        </div>
      </div>
    </footer>
  );
}
