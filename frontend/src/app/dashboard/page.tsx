"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Building, ShieldAlert, BarChart3, CheckCircle, ArrowUpRight, AlertTriangle, Info } from "lucide-react";
import { getDemoVenues, getDemoStats, DemoVenue } from "@/lib/demo-data";
import { MapLibre3D } from "@/components/maplibre-3d";
import { Venue } from "@/lib/api/types";
import Link from "next/link";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

/* ── Animated count-up number ── */
function CountUp({ end, suffix = "", duration = 1800 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let startTime: number;
          const step = (ts: number) => {
            if (!startTime) startTime = ts;
            const progress = Math.min((ts - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ── Animated progress bar (triggers on viewport entry) ── */
function ProgressBar({ value, color }: { value: number; color: string }) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setWidth(value), 100);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-[width] duration-1000 ease-out"
        style={{ width: `${width}%`, backgroundColor: color }}
      />
    </div>
  );
}

/* ── Animated SVG confidence ring ── */
function ConfidenceRing({ value, label, color = "#1b55d0" }: { value: number; label: string; color?: string }) {
  const [offset, setOffset] = useState(251.2);
  const ref = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setOffset(251.2 * (1 - value / 100)), 200);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e5eeff" strokeWidth="10" />
        <circle
          ref={ref}
          cx="50" cy="50" r="40"
          fill="transparent"
          stroke={color}
          strokeWidth="10"
          strokeDasharray="251.2"
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-display font-black text-foreground">{value}%</span>
        <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">{label}</span>
      </div>
    </div>
  );
}

/* ── Severity icon ── */
const SEVERITY_CONFIG = {
  Critical: { color: "bg-destructive/10 text-destructive border-destructive/20", Icon: ShieldAlert, dotColor: "bg-red-500" },
  Warning:  { color: "bg-orange-500/10 text-orange-500 border-orange-500/20", Icon: AlertTriangle, dotColor: "bg-amber-500" },
  Verified: { color: "bg-green-500/10 text-green-500 border-green-500/20", Icon: CheckCircle, dotColor: "bg-green-500" },
} as const;

const PRIORITY_ITEMS = [
  { title: "Chennai Central Rly. Station", desc: "Main entrance ramp blocked, no tactile path on Platform 1.", severity: "Critical" as const, category: "Transport", time: "2h ago" },
  { title: "General Hospital East Wing", desc: "Secondary elevator out of service for 3+ days.", severity: "Critical" as const, category: "Hospital", time: "5h ago" },
  { title: "Public Library, Anna Nagar", desc: "Missing handrails on entrance steps, steep incline.", severity: "Warning" as const, category: "Government", time: "1d ago" },
  { title: "Koyambedu Bus Terminal", desc: "Audio announcements fixed. Verified by community.", severity: "Verified" as const, category: "Transport", time: "2d ago" },
];

const CATEGORY_PROGRESS = [
  { category: "Transport Hubs", verified: 85, color: "#1b55d0" },
  { category: "Hospitals & Healthcare", verified: 62, color: "#0d7c66" },
  { category: "Educational Institutions", verified: 45, color: "#7c3aed" },
  { category: "Government Offices", verified: 78, color: "#c2410c" },
];

const KPI_CARDS = [
  {
    label: "Total Venues",
    value: 300,
    suffix: "+",
    sub: "Mapped across regions",
    Icon: Building,
    color: "#1b55d0",
    bg: "#e5eeff",
  },
  {
    label: "Districts",
    value: 38,
    suffix: "",
    sub: "Active Tamil Nadu + Kerala",
    Icon: MapPin,
    color: "#0d7c66",
    bg: "#e0f9f4",
  },
  {
    label: "Volunteers",
    value: 4520,
    suffix: "",
    sub: "Community contributors",
    Icon: Users,
    color: "#7c3aed",
    bg: "#f3eeff",
  },
];

export default function CivicDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [mapVenues, setMapVenues] = useState<Venue[]>([]);
  const [venueScores, setVenueScores] = useState<Record<string, number>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (mounted) {
      gsap.fromTo(
        ".dashboard-section",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: "power3.out" }
      );
    }
  }, { scope: containerRef, dependencies: [mounted] });

  useEffect(() => {
    setMounted(true);
    const venues = getDemoVenues().slice(0, 60);
    setMapVenues(venues as unknown as Venue[]);
    const scores: Record<string, number> = {};
    venues.forEach(v => { scores[v.venue_id] = v.accessibilityScore; });
    setVenueScores(scores);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground" ref={containerRef}>
      <main className="container py-8 md:py-10 space-y-8 max-w-7xl">

        {/* ── Header ── */}
        <div className="dashboard-section opacity-0">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-foreground">
                Civic Dashboard
              </h1>
              <p className="text-muted-foreground mt-1.5 text-sm md:text-base max-w-2xl">
                Monitor accessibility gaps, track volunteer coverage, and prioritise interventions across India.
              </p>
            </div>
            <Badge variant="outline" className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border-border text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live Demo Data
            </Badge>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="dashboard-section opacity-0 grid grid-cols-1 md:grid-cols-3 gap-5">
          {KPI_CARDS.map((kpi) => {
            const Icon = kpi.Icon;
            return (
              <Card key={kpi.label} className="bg-card border-border shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-200" style={{ backgroundColor: `${kpi.color}08`, borderColor: `${kpi.color}20` }}>
                <div className="h-1 w-full" style={{ backgroundColor: kpi.color }} />
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: kpi.bg }}
                    >
                      <Icon className="h-5 w-5" style={{ color: kpi.color }} aria-hidden="true" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground/40" aria-hidden="true" />
                  </div>
                  <div className="text-4xl font-display font-black leading-tight" style={{ color: kpi.color }}>
                    <CountUp end={kpi.value} suffix={kpi.suffix} />
                  </div>
                  <p className="text-xs font-bold text-foreground mt-1.5">{kpi.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Map + Priority Interventions ── */}
        <div className="dashboard-section opacity-0 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Accessibility Gap Map */}
          <Card className="lg:col-span-2 bg-card border-border shadow-sm rounded-2xl overflow-hidden flex flex-col">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-display font-bold text-foreground flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
                    Accessibility Gap Map
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mt-0.5">
                    Geospatial distribution of venues — color indicates accessibility score.
                  </CardDescription>
                </div>
                <Link href="/nearby" className="text-xs font-semibold text-primary hover:underline hidden sm:block">
                  Full map →
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-[380px] relative">
              {mapVenues.length > 0 && (
                <MapLibre3D
                  venues={mapVenues}
                  venueScores={venueScores}
                  className="border-none rounded-none absolute inset-0 w-full h-full"
                />
              )}
              {/* Legend overlay */}
              <div className="absolute bottom-3 left-3 z-[10] bg-card/90 backdrop-blur-sm border border-border rounded-xl px-3 py-2 shadow-sm">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Score Legend</p>
                <div className="flex flex-col gap-1">
                  {[
                    { color: "#10b981", label: "High (≥80)" },
                    { color: "#f59e0b", label: "Moderate (50–79)" },
                    { color: "#ef4444", label: "Gap (<50)" },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                      <span className="text-[10px] text-muted-foreground font-medium">{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Priority Interventions */}
          <Card className="bg-card border-border shadow-sm rounded-2xl flex flex-col overflow-hidden">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-lg font-display font-bold text-foreground flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-destructive" aria-hidden="true" />
                Priority Interventions
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Critical issues requiring immediate attention.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pt-4 overflow-auto">
              <div className="space-y-3">
                {PRIORITY_ITEMS.map((item, idx) => {
                  const cfg = SEVERITY_CONFIG[item.severity];
                  const Icon = cfg.Icon;
                  return (
                    <div
                      key={idx}
                      className="bg-background border border-border rounded-xl p-3.5 hover:shadow-sm hover:border-primary/30 transition-all duration-200 group cursor-default"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${cfg.color}`}>
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold text-sm text-foreground leading-tight truncate">{item.title}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className={`text-[9px] font-bold px-1.5 py-0.5 border ${cfg.color}`}>
                              {item.severity}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">{item.category}</span>
                            <span className="text-[10px] text-muted-foreground ml-auto">{item.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Category Verification + Confidence Ring ── */}
        <div className="dashboard-section opacity-0 grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Category Verification Status */}
          <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-display font-bold text-foreground flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-[#0d7c66]" aria-hidden="true" />
                Category Verification Status
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                % of mapped venues verified by active volunteers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {CATEGORY_PROGRESS.map((item) => (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">{item.category}</span>
                      <span className="text-sm font-bold" style={{ color: item.color }}>{item.verified}%</span>
                    </div>
                    <ProgressBar value={item.verified} color={item.color} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Data Confidence Index */}
          <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-display font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#7c3aed]" aria-hidden="true" />
                Data Confidence Index
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Reliability score based on multi-source verification.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-2">
              <ConfidenceRing value={78} label="High Confidence" color="#1b55d0" />

              <div className="w-full grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-border text-center">
                {[
                  { label: "Single Source", value: "15%", color: "#c2410c" },
                  { label: "Double Verified", value: "45%", color: "#1b55d0" },
                  { label: "Community Audit", value: "40%", color: "#0d7c66" },
                ].map(item => (
                  <div key={item.label}>
                    <div className="text-sm font-display font-black" style={{ color: item.color }}>{item.value}</div>
                    <div className="text-[10px] text-muted-foreground font-medium mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  );
}
