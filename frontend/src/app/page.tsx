"use client";

import { SearchBar } from "@/components/search-bar";
import { VenueCard, VenueCardSkeleton } from "@/components/venue-card";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { 
  Accessibility, MapPin, Eye, Ear, Brain, ArrowRight, 
  Building2, Shield, Star, Search, ShoppingBag, Bus, 
  Bed, GraduationCap, Activity, Sparkles, TreePine, Landmark
} from "lucide-react";
import { useTTS } from "@/lib/hooks/use-tts";
import Link from "next/link";
import gsap from "gsap";
import {
  getDemoVenues,
  getDemoAttributes,
  getDemoEvidence,
  searchDemoVenues,
  DemoVenue
} from "@/lib/demo-data";
import { useProfile } from "@/lib/hooks/use-profile";
import { rankVenuesForProfile, calculateProfileMatch } from "@/lib/scoring";
import type { AccessibilityProfile } from "@/lib/scoring";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// --- THREE.JS BACKGROUND ---
function FloatingShapes() {
  const group = useRef<THREE.Group>(null);
  const mesh1 = useRef<THREE.Mesh>(null);
  const mesh2 = useRef<THREE.Mesh>(null);
  const mesh3 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y = time * 0.05;
      group.current.position.y = Math.sin(time * 0.2) * 0.5;
    }
    if (mesh1.current) {
      mesh1.current.rotation.x = time * 0.2;
      mesh1.current.rotation.y = time * 0.3;
    }
    if (mesh2.current) {
      mesh2.current.rotation.x = time * -0.15;
      mesh2.current.rotation.z = time * 0.25;
    }
    if (mesh3.current) {
      mesh3.current.rotation.y = time * 0.4;
      mesh3.current.rotation.z = time * 0.1;
    }
  });

  return (
    <group ref={group}>
      <mesh ref={mesh1} position={[-4, 1, -2]}>
        <torusGeometry args={[1.5, 0.4, 16, 32]} />
        <meshBasicMaterial color="#1b55d0" wireframe transparent opacity={0.05} />
      </mesh>
      <mesh ref={mesh2} position={[5, -2, -5]}>
        <icosahedronGeometry args={[2, 0]} />
        <meshBasicMaterial color="#7c3aed" wireframe transparent opacity={0.06} />
      </mesh>
      <mesh ref={mesh3} position={[2, 3, -8]}>
        <octahedronGeometry args={[2.5, 0]} />
        <meshBasicMaterial color="#0d7c66" wireframe transparent opacity={0.04} />
      </mesh>
    </group>
  );
}

// --- CONSTANTS ---
const CHIPS: { id: AccessibilityProfile, label: string, Icon: React.ElementType, color: string, bg: string, activeBg: string, activeBorder: string, border: string, activeText: string }[] = [
  {
    id: "wheelchair",
    label: "Mobility",
    Icon: Accessibility,
    color: "text-blue-600",
    bg: "bg-blue-50",
    activeBg: "bg-blue-600",
    activeBorder: "border-blue-600",
    border: "border-blue-200",
    activeText: "text-white",
  },
  {
    id: "blind",
    label: "Vision",
    Icon: Eye,
    color: "text-violet-600",
    bg: "bg-violet-50",
    activeBg: "bg-violet-600",
    activeBorder: "border-violet-600",
    border: "border-violet-200",
    activeText: "text-white",
  },
  {
    id: "deaf",
    label: "Hearing",
    Icon: Ear,
    color: "text-teal-600",
    bg: "bg-teal-50",
    activeBg: "bg-teal-600",
    activeBorder: "border-teal-600",
    border: "border-teal-200",
    activeText: "text-white",
  },
  {
    id: "sensory",
    label: "Sensory",
    Icon: Brain,
    color: "text-orange-600",
    bg: "bg-orange-50",
    activeBg: "bg-orange-600",
    activeBorder: "border-orange-600",
    border: "border-orange-200",
    activeText: "text-white",
  },
];

const CATEGORIES = [
  { id: "hospital", label: "Hospital", Icon: Activity, color: "text-rose-600", bg: "bg-rose-50", hoverBg: "hover:bg-rose-100", border: "border-rose-200", activeBg: "bg-rose-600", activeText: "text-white" },
  { id: "shopping", label: "Shopping", Icon: ShoppingBag, color: "text-fuchsia-600", bg: "bg-fuchsia-50", hoverBg: "hover:bg-fuchsia-100", border: "border-fuchsia-200", activeBg: "bg-fuchsia-600", activeText: "text-white" },
  { id: "transport", label: "Transport", Icon: Bus, color: "text-blue-600", bg: "bg-blue-50", hoverBg: "hover:bg-blue-100", border: "border-blue-200", activeBg: "bg-blue-600", activeText: "text-white" },
  { id: "education", label: "Education", Icon: GraduationCap, color: "text-amber-600", bg: "bg-amber-50", hoverBg: "hover:bg-amber-100", border: "border-amber-200", activeBg: "bg-amber-600", activeText: "text-white" },
  { id: "devotional", label: "Devotional", Icon: Sparkles, color: "text-orange-600", bg: "bg-orange-50", hoverBg: "hover:bg-orange-100", border: "border-orange-200", activeBg: "bg-orange-600", activeText: "text-white" },
  { id: "nature", label: "Nature", Icon: TreePine, color: "text-green-600", bg: "bg-green-50", hoverBg: "hover:bg-green-100", border: "border-green-200", activeBg: "bg-green-600", activeText: "text-white" },
  { id: "tourism", label: "Tourism", Icon: Landmark, color: "text-indigo-600", bg: "bg-indigo-50", hoverBg: "hover:bg-indigo-100", border: "border-indigo-200", activeBg: "bg-indigo-600", activeText: "text-white" }
];

const STATS = [
  { label: "Venues Mapped", value: 300, suffix: "+", Icon: Building2, color: "text-primary", bg: "bg-primary/10" },
  { label: "Districts Covered", value: 38, suffix: "", Icon: MapPin, color: "text-[#0d7c66]", bg: "bg-[#0d7c66]/10" },
  { label: "Verified Locations", value: 180, suffix: "+", Icon: Shield, color: "text-[#7c3aed]", bg: "bg-[#7c3aed]/10" },
  { label: "Avg. Score", value: 74, suffix: "/100", Icon: Star, color: "text-[#c2410c]", bg: "bg-[#c2410c]/10" },
];

// --- STAT COUNTER COMPONENT ---
function StatCounter({ value, suffix }: { value: number, suffix: string }) {
  const [count, setCount] = useState(0);
  const valRef = useRef({ val: 0 });

  useEffect(() => {
    gsap.to(valRef.current, {
      val: value,
      duration: 2,
      ease: "power3.out",
      onUpdate: () => {
        setCount(Math.floor(valRef.current.val));
      }
    });
  }, [value]);

  return <>{count}{suffix}</>;
}

export default function HomePage() {
  const { profile, setProfile } = useProfile();
  const { speak } = useTTS();
  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [displayVenues, setDisplayVenues] = useState<DemoVenue[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(false);
    let venues = getDemoVenues();
    
    if (activeCategory) {
      venues = venues.filter(v => v.category.toLowerCase() === activeCategory);
    }
    
    const ranked = rankVenuesForProfile(venues, profile);
    setDisplayVenues(ranked.slice(0, 6));

    // Enhanced GSAP Recommendation Card Entrance
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 40, scale: 0.95, filter: "blur(4px)" },
        { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.8, stagger: 0.1, ease: "power3.out", overwrite: "auto" }
      );
    }
  }, [profile, activeCategory]);

  // Initial Hero GSAP animation
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!prefersReducedMotion) {
      const tl = gsap.timeline();
      tl.fromTo(".badge-anim", { opacity: 0, y: -20, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "back.out(1.5)" })
      
      // Staggered word reveal for headline
      if (titleRef.current) {
        const words = titleRef.current.querySelectorAll(".word-anim");
        tl.fromTo(words, { opacity: 0, y: 30, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8, stagger: 0.08, ease: "power4.out" }, "-=0.4");
      }

      tl.fromTo(".hero-sub", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, "-=0.6")
        .fromTo(".search-anim", { opacity: 0, y: 30, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power4.out" }, "-=0.6")
        .fromTo(".category-anim", { opacity: 0, y: 20, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: "back.out(1.5)" }, "-=0.5")
        .fromTo(".chip-anim", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.6, stagger: 0.1, ease: "elastic.out(1, 0.8)" }, "-=0.4");
    } else {
      gsap.set([".badge-anim", ".word-anim", ".hero-sub", ".search-anim", ".category-anim", ".chip-anim"], { opacity: 1, y: 0, scale: 1 });
    }
  }, []);

  const handleSearch = useCallback(async (filters: { q: string; category: string; city: string; state: string }) => {
    setIsLoading(true);
    try {
      const filtered = searchDemoVenues(filters);
      setDisplayVenues(filtered.slice(0, 6) as DemoVenue[]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLocationSearch = useCallback(() => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => { window.location.href = `/nearby`; setIsLocating(false); },
        () => { setIsLocating(false); }
      );
    } else {
      setIsLocating(false);
      window.location.href = "/nearby";
    }
  }, []);

  const handleChipClick = (chip: AccessibilityProfile) => {
    const next = chip === profile ? null : chip;
    setProfile(next);
  };

  const getProfileHeading = () => {
    if (!profile) return "Recommendations for You";
    const labels: Record<string, string> = {
      wheelchair: "Wheelchair & Mobility",
      blind: "Low Vision & Blind",
      deaf: "Hearing Accessibility",
      sensory: "Sensory Friendly",
      elderly: "Elderly Accessible",
      temporary: "Temporary Mobility"
    };
    return `Best Matches: ${labels[profile] || profile}`;
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-background">
      {/* ── Hero ── */}
      <section className="relative px-6 pt-16 pb-24 md:pt-28 md:pb-32 flex flex-col items-center justify-center overflow-hidden">
        {/* Three.js Background Component */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
            <Suspense fallback={null}>
              <FloatingShapes />
            </Suspense>
          </Canvas>
        </div>

        {/* CSS Gradients for premium feel */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-300/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen dark:mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-violet-300/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen dark:mix-blend-screen pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-teal-300/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen dark:mix-blend-screen pointer-events-none" />
        <div className="absolute -bottom-1/4 left-1/3 w-[500px] h-[500px] bg-orange-300/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen dark:mix-blend-screen pointer-events-none" />
        
        {/* Subtle Dot Grid */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, currentColor 2px, transparent 0)", backgroundSize: "40px 40px" }} />

        <div className="relative z-10 w-full max-w-4xl text-center flex flex-col items-center">
          {/* Badge */}
          <div className="badge-anim inline-flex items-center justify-center gap-2 mb-8 px-4 py-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-primary/20 shadow-sm opacity-0">
            <Accessibility className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Civic Intelligence Platform
            </span>
          </div>

          {/* Headline */}
          <h1 ref={titleRef} className="text-5xl md:text-7xl font-display font-black tracking-tight mb-6 text-foreground leading-[1.1]">
            {"Find places that work for you.".split(" ").map((word, i) => (
              <span key={i} className="word-anim inline-block mr-3 opacity-0">
                {word === "work" || word === "for" || word === "you." ? (
                  <span className={word === "you." ? "text-primary relative inline-block" : "text-primary"}>
                    {word}
                    {word === "you." && (
                      <span className="absolute bottom-1 left-0 right-0 h-1.5 rounded-full bg-primary/30 -z-10" />
                    )}
                  </span>
                ) : (
                  word
                )}
              </span>
            ))}
          </h1>

          <p className="hero-sub text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto font-medium opacity-0">
            Evidence-backed accessibility intelligence for hospitals, transit hubs, malls, and public spaces across Tamil Nadu and Kerala.
          </p>

          {/* Frosted Glass Search bar */}
          <div className="search-anim w-full max-w-2xl mx-auto mb-10 opacity-0 relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-violet-400/10 to-teal-400/10 rounded-[2rem] blur-md" />
            <div className="relative rounded-2xl bg-card/70 backdrop-blur-xl shadow-xl border border-border/50 p-2">
              <SearchBar
                onSearch={handleSearch}
                onLocationSearch={handleLocationSearch}
                isLocating={isLocating}
                variant="hero"
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="w-full max-w-3xl mb-8 flex flex-wrap justify-center gap-2 md:gap-4">
            {CATEGORIES.map((cat) => {
              const Icon = cat.Icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                      speak(isActive ? `Removed ${cat.label} filter` : `Selected ${cat.label} category`);
                      setActiveCategory(isActive ? null : cat.id);
                  }}
                  className={`category-anim flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 opacity-0 shadow-sm border
                    ${isActive 
                      ? `${cat.activeBg} ${cat.activeText} border-transparent scale-[1.02] shadow-md` 
                      : `${cat.bg} ${cat.color} ${cat.border} ${cat.hoverBg} hover:scale-[1.02]`
                    }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {cat.label}
                </button>
              )
            })}
          </div>

          {/* Accessibility Profiles */}
          <div className="flex flex-col items-center">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 opacity-80">Or filter by accessibility needs</p>
            <div className="flex flex-wrap justify-center gap-3">
              {CHIPS.map((chip) => {
                const isActive = profile === chip.id;
                const Icon = chip.Icon;
                return (
                  <button
                    key={chip.id}
                    onClick={() => handleChipClick(chip.id)}
                    aria-pressed={isActive}
                    className={`chip-anim flex items-center gap-2.5 px-6 py-3 rounded-full border-2 font-bold text-sm opacity-0
                      transition-all duration-300 hover:scale-[1.05] active:scale-95 shadow-sm
                      ${isActive
                        ? `${chip.activeBg} border-transparent ${chip.activeText} shadow-md`
                        : `${chip.bg} ${chip.border} ${chip.color} bg-opacity-50 hover:bg-opacity-100`
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <section className="bg-card/40 backdrop-blur-md border-y border-border/50 relative z-20" aria-label="Platform statistics">
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-x-0 md:divide-x divide-border">
          {STATS.map((stat, i) => {
            const Icon = stat.Icon;
            return (
              <div
                key={stat.label}
                className="flex flex-col items-center text-center md:flex-row md:text-left md:items-center gap-4 px-4"
              >
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} aria-hidden="true" />
                </div>
                <div>
                  <div className="text-3xl font-display font-black text-foreground leading-none mb-1">
                    <StatCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-muted-foreground font-semibold">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Recommendations ── */}
      <section className="relative py-20 px-6 lg:px-12 flex-1 overflow-hidden">
        {/* Subtle background layer for Recommendations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-blue-100/30 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen dark:mix-blend-screen" />
          <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-violet-100/30 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen dark:mix-blend-screen" />
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-display font-bold text-foreground">
                {getProfileHeading()}
              </h2>
              <p className="text-base text-muted-foreground font-medium mt-2">
                {profile
                  ? `Venues ranked by accessibility criteria for your needs`
                  : "Highest-rated accessible venues in your region"}
              </p>
            </div>
            <Link
              href="/nearby"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-card border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors shadow-sm"
            >
              View on map <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <VenueCardSkeleton key={i} />)
              : displayVenues.map(venue => {
                  const match = profile ? calculateProfileMatch(venue, profile) : null;
                  return (
                    <VenueCard
                      key={venue.venue_id}
                      venue={venue as DemoVenue}
                      attributes={getDemoAttributes(venue.venue_id)}
                      evidence={getDemoEvidence(venue.venue_id)}
                    />
                  );
                })}
          </div>

          {displayVenues.length === 0 && !isLoading && (
            <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border mt-8">
              <Accessibility className="h-12 w-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
              <p className="text-muted-foreground font-medium">No venues match this filter.</p>
            </div>
          )}

          {/* Mobile CTA */}
          <div className="mt-10 sm:hidden">
            <Link href="/nearby">
              <Button className="w-full rounded-xl h-14 font-semibold gap-2 text-base">
                <MapPin className="h-5 w-5" />
                Explore on Map
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
