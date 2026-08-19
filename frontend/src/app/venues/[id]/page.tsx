"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Venue, AccessibilityAttribute, Evidence } from "@/lib/api/types";
import { venuesApi } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCategory } from "@/lib/utils";
import {
  Building2, MapPin, Globe, ArrowLeft, Accessibility,
  Eye, Ear, Brain, Activity, ShieldCheck, CheckCircle2,
  Camera, AlertCircle, PhoneCall, Heart, Navigation, Map
} from "lucide-react";
import { getDemoVenues, getDemoAttributes, getDemoEvidence, DemoVenue } from "@/lib/demo-data";
import { calculateVenueScore, calculateProfileMatch } from "@/lib/scoring";
import { MapLibre3D } from "@/components/maplibre-3d";
import { VenueImage } from "@/components/ui/venue-image";
import { useProfile } from "@/lib/hooks/use-profile";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

/* ── Animated score ring ── */
function ScoreRingLarge({ score }: { score: number }) {
  const circleRef = useRef<SVGCircleElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const radius = 45;
  const circumference = 2 * Math.PI * radius;

  useGSAP(() => {
    gsap.fromTo(circleRef.current,
      { strokeDashoffset: circumference },
      { strokeDashoffset: circumference - (score / 100) * circumference, duration: 1.5, ease: "power3.out", delay: 0.2 }
    );
    gsap.fromTo(scoreRef.current,
      { innerText: 0 },
      { 
        innerText: score, 
        duration: 1.5, 
        ease: "power3.out", 
        delay: 0.2, 
        snap: { innerText: 1 },
      }
    );
  }, [score, circumference]);

  const color = score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const label = score >= 80 ? "Excellent" : score >= 50 ? "Good" : "Needs Improvement";

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-card rounded-2xl shadow-sm border border-border">
      <div className="relative w-32 h-32 flex items-center justify-center mb-3">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5eeff" strokeWidth="8" />
          <circle
            ref={circleRef}
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span ref={scoreRef} className="text-4xl font-display font-black text-foreground">0</span>
          <span className="text-xs font-bold text-muted-foreground">/100</span>
        </div>
      </div>
      <span className="text-sm font-bold text-foreground">Access Score</span>
      <span className="text-xs font-medium mt-0.5" style={{ color }}>{label}</span>
    </div>
  );
}

/* ── Animated passport progress bar ── */
function PassportBar({ score, max, color }: { score: number; max: number; color: string }) {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(el, { width: `${(score / max) * 100}%`, duration: 1.2, ease: "power3.out" });
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [score, max]);

  return (
    <div className="w-full h-1.5 rounded-full bg-black/8 mt-auto">
      <div
        ref={ref}
        className="h-1.5 rounded-full w-0"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

/* ── Side panel progress bar ── */
function SideProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(el, { width: `${(value / max) * 100}%`, duration: 1.2, ease: "power3.out" });
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, max]);

  return (
    <div className="w-24 bg-muted rounded-full h-1.5 hidden sm:block">
      <div
        ref={ref}
        className="h-1.5 rounded-full w-0"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

/* ── Accessibility bento config ── */
const BENTO_CONFIG = [
  {
    id: "mobility",
    label: "Mobility",
    sublabel: "Physical access & wayfinding",
    icon: Accessibility,
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
    max: 25,
  },
  {
    id: "vision",
    label: "Vision",
    sublabel: "Braille, audio & tactile",
    icon: Eye,
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#ddd6fe",
    max: 15,
  },
  {
    id: "hearing",
    label: "Hearing",
    sublabel: "Visual alerts & sign language",
    icon: Ear,
    color: "#0d9488",
    bg: "#f0fdfa",
    border: "#99f6e4",
    max: 15,
  },
  {
    id: "cognitive",
    label: "Cognitive",
    sublabel: "Clear signage & navigation",
    icon: Brain,
    color: "#e11d48",
    bg: "#fff1f2",
    border: "#fecdd3",
    max: 15,
  },
  {
    id: "sensory",
    label: "Sensory",
    sublabel: "Quiet zones & calm spaces",
    icon: Activity,
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
    max: 15,
  },
] as const;

export default function VenueDetailPage() {
  const params = useParams();
  const rawId = (params?.id as string) || "";
  const { profile } = useProfile();

  const [venue, setVenue] = useState<Venue | null>(null);
  const [_attributes, setAttributes] = useState<AccessibilityAttribute[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [etaInfo, setEtaInfo] = useState<{distanceKm: number, timeMins: number} | null>(null);

  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: 13.0827, lng: 80.2707 }), // Default Chennai
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, []);

  useEffect(() => {
    if (userLocation && venue && (venue as DemoVenue).latitude && (venue as DemoVenue).longitude) {
      const R = 6371;
      const dLat = ((venue as DemoVenue).latitude - userLocation.lat) * (Math.PI/180);
      const dLon = ((venue as DemoVenue).longitude - userLocation.lng) * (Math.PI/180); 
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(userLocation.lat * (Math.PI/180)) * Math.cos((venue as DemoVenue).latitude * (Math.PI/180)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      const distanceKm = R * c;
      const timeMins = Math.max(1, Math.round((distanceKm / 25) * 60));
      setEtaInfo({ distanceKm: Number(distanceKm.toFixed(1)), timeMins });
    }
  }, [userLocation, venue]);

  useEffect(() => {
    const loadVenueData = async () => {
      setIsLoading(true);
      setNotFound(false);
      const decodedId = decodeURIComponent(rawId);

      try {
        const detailData = await venuesApi.getDetail(decodedId);
        setVenue(detailData.venue);
        setAttributes(detailData.attributes);
        setEvidence(detailData.evidence);
      } catch {
        let demoVenue = getDemoVenues().find(v => v.venue_id === decodedId);
        if (!demoVenue) demoVenue = getDemoVenues().find(v => v.venue_id === `venue-${decodedId}`);
        if (demoVenue) {
          setVenue(demoVenue as unknown as Venue);
          setAttributes(getDemoAttributes(demoVenue.venue_id));
          setEvidence(getDemoEvidence(demoVenue.venue_id));
        } else {
          setNotFound(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (rawId) loadVenueData();
  }, [rawId]);

  useGSAP(() => {
    if (!isLoading && !notFound && venue) {
      gsap.from(".bento-item", {
        y: 30,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.1
      });

      gsap.from(".evidence-item", {
        scale: 0.9,
        opacity: 0,
        stagger: 0.05,
        duration: 0.6,
        ease: "back.out(1.2)",
        delay: 0.3
      });
      
      if (profile) {
        gsap.from(".profile-match-banner", {
          y: -20,
          opacity: 0,
          duration: 0.6,
          ease: "back.out(1.5)",
          delay: 0.5
        });
      }
    }
  }, [isLoading, notFound, venue, profile]);

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-[3px] border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground font-medium text-sm">Loading venue details…</p>
        </div>
      </main>
    );
  }

  if (notFound || !venue) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="max-w-sm w-full bg-card text-center p-8 rounded-2xl shadow-sm border border-border">
          <AlertCircle className="w-14 h-14 text-destructive mx-auto mb-5" aria-hidden="true" />
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Venue Not Found</h1>
          <p className="text-muted-foreground text-sm mb-6">
            We couldn't locate this venue. It may have been removed or the link is incorrect.
          </p>
          <Link href="/">
            <Button className="w-full h-11 rounded-xl font-semibold gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Directory
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  const isDemo = "accessibilityScore" in venue;
  const demoVenue = isDemo ? (venue as DemoVenue) : null;
  const score = isDemo ? demoVenue!.accessibilityScore : 85;
  const breakdown = isDemo ? calculateVenueScore(demoVenue!) : {
    mobility: 20, vision: 10, hearing: 12, sensory: 14, facilities: 12, safety: 8, total: 76,
  };

  const matchData = profile && demoVenue ? calculateProfileMatch(demoVenue, profile) : null;

  const bentoItems = BENTO_CONFIG.map(cfg => ({
    ...cfg,
    score: cfg.id === "cognitive" ? (breakdown.facilities || 12) : breakdown[cfg.id as keyof typeof breakdown] as number || 0,
  }));

  return (
    <main ref={containerRef} className="min-h-screen bg-muted/50 font-sans pb-20">

      {/* ── Hero ── */}
      <section className="relative pt-14 pb-12 overflow-hidden border-b border-border bg-card">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-background to-background pointer-events-none" aria-hidden="true" />

        <div className="container relative z-10 px-4 md:px-8 max-w-6xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors mb-6"
            aria-label="Back to search"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </Link>

          <div className="w-full h-[300px] md:h-[400px] rounded-3xl overflow-hidden relative shadow-lg mb-10 group bg-muted">
            <VenueImage 
              src={(venue as unknown as Record<string, string>).imageUrl} 
              venueId={venue.venue_id} 
              venueName={venue.name} 
              category={venue.category} 
              type="venue" 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.02]" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:items-start justify-between">
            <div className="flex-1 max-w-2xl">
              {profile && matchData && (
                <div className="profile-match-banner inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full mb-4 font-semibold text-sm border border-primary/20">
                  <Heart className="w-4 h-4 fill-primary" />
                  {matchData.matchPercentage}% Match for your {profile} profile
                </div>
              )}
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className="bg-primary text-white rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider">
                  <Building2 className="w-3 h-3 mr-1 inline" aria-hidden="true" />
                  {formatCategory(venue.category)}
                </Badge>
                {demoVenue?.verificationStatus === "demo" && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 rounded-full px-3 py-1 text-xs font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                    Civic Partner
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl md:text-5xl font-display font-black text-foreground mb-3 leading-tight tracking-tight">
                {venue.name}
              </h1>

              <div className="flex flex-col gap-3 mb-6">
                <div className="flex items-center text-muted-foreground font-medium text-sm">
                  <MapPin className="w-4 h-4 mr-2 text-primary shrink-0" aria-hidden="true" />
                  {venue.address}, {venue.city}, {venue.state}
                </div>
                {etaInfo && (
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 rounded-lg px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5 shadow-sm">
                      <Navigation className="w-4 h-4" aria-hidden="true" />
                      {etaInfo.timeMins} min drive
                    </Badge>
                    <span className="text-muted-foreground text-sm font-medium flex items-center gap-1">
                      <Map className="w-4 h-4 shrink-0 text-muted-foreground" />
                      {etaInfo.distanceKm} km away
                    </span>
                  </div>
                )}
              </div>

              {demoVenue?.description && (
                <p className="text-muted-foreground text-base leading-relaxed max-w-xl">
                  {demoVenue.description}
                </p>
              )}
            </div>

            {/* Score Ring */}
            <div className="shrink-0">
              <ScoreRingLarge score={score} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Content ── */}
      <div className="container px-4 md:px-8 py-10 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Main column ── */}
          <div className="lg:col-span-2 space-y-10">

            {/* Accessibility Passport */}
            <section aria-labelledby="passport-heading">
              <h2 id="passport-heading" className="text-xl font-display font-bold text-foreground mb-5 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" aria-hidden="true" />
                Accessibility Passport
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {bentoItems.map((item) => (
                  <div
                    key={item.id}
                    className="bento-item p-5 rounded-2xl border flex flex-col shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                    style={{ backgroundColor: item.bg, borderColor: item.border }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-2 rounded-xl bg-card/70" style={{ color: item.color }}>
                        <item.icon className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-foreground">{item.score}</span>
                        <span className="text-xs font-medium text-muted-foreground">/{item.max}</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-foreground text-base mb-0.5">{item.label}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{item.sublabel}</p>
                    <PassportBar score={item.score} max={item.max} color={item.color} />
                  </div>
                ))}
              </div>
            </section>

            {/* Evidence Dossier */}
            <section aria-labelledby="evidence-heading">
              <div className="flex items-center justify-between mb-5">
                <h2 id="evidence-heading" className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" aria-hidden="true" />
                  Evidence Dossier
                </h2>
                <Badge variant="secondary" className="rounded-full px-3 text-xs font-semibold">
                  {evidence.length} sources
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {evidence.length > 0 ? evidence.map((e, i) => {
                  const hasValidImage = e.evidence_media_url && e.evidence_media_url.startsWith('http');
                  return (
                  <div
                    key={i}
                    className="evidence-item aspect-square rounded-xl overflow-hidden bg-muted relative group shadow-sm border border-border"
                  >
                    {hasValidImage ? (
                      <img
                        src={e.evidence_media_url}
                        alt="Evidence photo"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(evt) => {
                          (evt.target as HTMLImageElement).style.display = 'none';
                          const parent = (evt.target as HTMLImageElement).parentElement;
                          if (parent) parent.classList.add('broken-image');
                        }}
                      />
                    ) : (
                      <VenueImage type="evidence" text={e.notes || "Evidence"} className="w-full h-full transition-transform duration-700 group-hover:scale-105" />
                    )}
                    
                    {hasValidImage && (
                      <div className="absolute inset-0 hidden group-[.broken-image]:block bg-muted">
                         <VenueImage type="evidence" text={e.notes || "Evidence"} className="w-full h-full transition-transform duration-700 group-hover:scale-105" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-[.broken-image]:opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 z-10">
                      <span className="text-white text-[10px] font-medium leading-relaxed line-clamp-2 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        {e.notes || "Community verified"}
                      </span>
                    </div>
                  </div>
                )}) : (
                  [1, 2, 3, 4].map(i => (
                    <div key={i} className="evidence-item aspect-square rounded-xl overflow-hidden bg-muted">
                       <VenueImage type="evidence" text="No evidence" className="w-full h-full rounded-xl" />
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* ── Side panel ── */}
          <div className="space-y-5">

            {/* Location & Contact */}
            <Card className="rounded-2xl border-border shadow-sm bg-card overflow-hidden">
              <CardHeader className="bg-muted/40 border-b border-border pb-4">
                <CardTitle className="text-base font-display font-bold text-foreground">Location & Contact</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[180px] w-full bg-muted relative">
                  <MapLibre3D
                    venues={[venue]}
                    selectedVenueId={venue.venue_id}
                    showGeolocateControl={false}
                  />
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-sm text-foreground leading-relaxed">
                      {venue.address}, {venue.city}, {venue.state}
                    </span>
                  </div>
                  {Boolean((venue as Venue & { official_url?: string }).official_url) && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                      <a
                        href={(venue as Venue & { official_url?: string }).official_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline truncate"
                      >
                        {(venue as Venue & { official_url?: string }).official_url}
                      </a>
                    </div>
                  )}
                  {venue.contact_phone && (
                    <div className="flex items-center gap-3">
                      <PhoneCall className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                      <span className="text-sm text-foreground">{venue.contact_phone}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Score Breakdown */}
            <Card className="rounded-2xl border-border shadow-sm bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-display font-bold text-foreground">Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {bentoItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <item.icon className="w-4 h-4 shrink-0" style={{ color: item.color }} aria-hidden="true" />
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <SideProgressBar value={item.score} max={item.max} color={item.color} />
                      <span className="text-xs font-bold text-foreground w-10 text-right">
                        {item.score}/{item.max}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick features */}
            {demoVenue && (
              <Card className="rounded-2xl border-border shadow-sm bg-card">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-display font-bold text-foreground">Key Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {demoVenue.wheelchairAccessible && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#e5eeff] text-[#1b55d0] border border-[#b4c5ff]">
                        <Accessibility className="w-3 h-3" aria-hidden="true" /> Wheelchair
                      </span>
                    )}
                    {demoVenue.rampAvailable && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#e5eeff] text-[#1b55d0] border border-[#b4c5ff]">
                        Ramp
                      </span>
                    )}
                    {demoVenue.elevatorAvailable && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#e5eeff] text-[#1b55d0] border border-[#b4c5ff]">
                        Elevator
                      </span>
                    )}
                    {demoVenue.accessibleParking && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#e0f9f4] text-[#0d7c66] border border-[#99f6e4]">
                        Parking
                      </span>
                    )}
                    {demoVenue.accessibleRestroom && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#e0f9f4] text-[#0d7c66] border border-[#99f6e4]">
                        Restroom
                      </span>
                    )}
                    {demoVenue.brailleSignage && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#f3eeff] text-[#7c3aed] border border-[#ddd6fe]">
                        <Eye className="w-3 h-3" aria-hidden="true" /> Braille
                      </span>
                    )}
                    {demoVenue.audioAssistance && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#f3eeff] text-[#7c3aed] border border-[#ddd6fe]">
                        Audio Guide
                      </span>
                    )}
                    {demoVenue.signLanguageSupport && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#e0f9f4] text-[#0d7c66] border border-[#99f6e4]">
                        <Ear className="w-3 h-3" aria-hidden="true" /> Sign Language
                      </span>
                    )}
                    {demoVenue.tactilePath && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#fff4ed] text-[#c2410c] border border-[#fed7aa]">
                        Tactile Path
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
