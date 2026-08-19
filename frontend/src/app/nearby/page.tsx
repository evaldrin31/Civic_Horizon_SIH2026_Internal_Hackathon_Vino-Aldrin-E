"use client";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { MapLibre3D } from "@/components/maplibre-3d";
import { VenueCard } from "@/components/venue-card";
import { searchApi } from "@/lib/api/client";
import { Navigation, AlertCircle, Filter, Search, X, Accessibility, Eye, Mic } from "lucide-react";
import {
  getNearbyDemoVenues,
  getDemoVenues,
  getDemoAttributes,
  getDemoEvidence,
  DemoVenue
} from "@/lib/demo-data";
import { Venue } from "@/lib/api/types";
import { ProfileSelector } from "@/components/profile-selector";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/lib/hooks/use-profile";
import { useSpeech } from "@/lib/hooks/use-speech";
import { fuzzyMatch } from "@/lib/utils";
import { calculateProfileMatch } from "@/lib/scoring";

const DEFAULT_LAT = 13.0827;
const DEFAULT_LNG = 80.2707;

const CATEGORY_FILTERS = [
  { id: "all", label: "All" },
  { id: "hospital", label: "Healthcare", Icon: Accessibility },
  { id: "transport", label: "Transport", Icon: Navigation },
  { id: "shopping", label: "Shopping" },
  { id: "education", label: "Education", Icon: Eye },
  { id: "hotel", label: "Hotels" },
];

const STATUS_FILTERS = [
  { id: "all", label: "All Status" },
  { id: "verified", label: "Verified" },
  { id: "high", label: "High (≥80)" },
  { id: "moderate", label: "Moderate (50-79)" },
];

export default function NearbyPage() {
  const [allVenues, setAllVenues] = useState<(Venue & { distance?: number })[]>([]);
  const [_userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [_isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const { profile } = useProfile();
  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeech();

  useEffect(() => {
    if (transcript) setSearchQuery(transcript);
  }, [transcript]);

  const loadNearbyVenues = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await searchApi.nearby({ lat, lon: lng, radius: 5 });
      setAllVenues(response.items);
    } catch {
      const nearbyDemoVenues = getNearbyDemoVenues(lat, lng, 50);
      setAllVenues(nearbyDemoVenues as unknown as (Venue & { distance?: number })[]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestLocation = useCallback(() => {
    setIsLocating(true);
    setError(null);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          setIsLocating(false);
          loadNearbyVenues(loc.lat, loc.lng);
        },
        (err) => {
          setIsLocating(false);
          if (err.code === err.PERMISSION_DENIED) {
            setError("Location denied — showing Chennai demo data.");
            setUserLocation({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
            loadNearbyVenues(DEFAULT_LAT, DEFAULT_LNG);
          } else {
            setError("Unable to get location. Showing demo data.");
            setUserLocation({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
            loadNearbyVenues(DEFAULT_LAT, DEFAULT_LNG);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsLocating(false);
      setUserLocation({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
      loadNearbyVenues(DEFAULT_LAT, DEFAULT_LNG);
    }
  }, [loadNearbyVenues]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Filtered venues
  const filteredVenues = useMemo(() => {
    // If there's a search query, search across ALL cities in the dataset
    // Otherwise, just show the nearby venues (allVenues)
    let result = searchQuery.trim() ? getDemoVenues() as DemoVenue[] : allVenues;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(v =>
        fuzzyMatch(v.name, q) ||
        fuzzyMatch(v.city || '', q) ||
        fuzzyMatch(v.category || '', q)
      );
    }

    if (categoryFilter !== "all") {
      result = result.filter(v => v.category === categoryFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter(v => {
        let score = (v as DemoVenue).accessibilityScore;
        if (profile) {
            score = calculateProfileMatch(v as DemoVenue, profile).matchPercentage;
        }

        if (statusFilter === "verified") return (v as DemoVenue).verificationStatus === "verified";
        if (statusFilter === "high") return score >= 80;
        if (statusFilter === "moderate") return score >= 50 && score < 80;
        return true;
      });
    }

    return result;
  }, [allVenues, searchQuery, categoryFilter, statusFilter, profile]);

  const venueScores = useMemo(() => {
    const scores: Record<string, number> = {};
    allVenues.forEach(v => {
      if ("accessibilityScore" in v) {
        if (profile) {
            scores[v.venue_id] = calculateProfileMatch(v as DemoVenue, profile).matchPercentage;
        } else {
            scores[v.venue_id] = (v as DemoVenue).accessibilityScore;
        }
      }
    });
    return scores;
  }, [allVenues, profile]);

  const selectedVenue = useMemo(() => filteredVenues.find(v => v.venue_id === selectedVenueId), [filteredVenues, selectedVenueId]);

  useGSAP(() => {
    if (listRef.current) {
      gsap.fromTo(
        listRef.current.children,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, stagger: 0.05, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [filteredVenues]);

  return (
    <div className="relative flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-background">

      {/* ── Map background ── */}
      <div className="absolute inset-0 z-0">
        <MapLibre3D
          venues={filteredVenues}
          venueScores={venueScores}
          selectedVenueId={selectedVenueId}
          onVenueSelect={(venue) => setSelectedVenueId(venue.venue_id)}
          className="w-full h-full border-none rounded-none"
        />
      </div>

      {/* ── Floating UI Overlay ── */}
      <div className="absolute inset-0 z-[20] pointer-events-none p-4 md:p-5 flex flex-col md:flex-row gap-4 justify-between min-h-0">
        
        {/* Left Side Panel */}
        <div className="flex flex-col gap-3 w-full md:w-[420px] h-full min-h-0">
          
          {/* Search + Filters Area */}
          <div className="flex flex-col gap-2.5 pointer-events-auto">
            {/* Search bar */}
              <div className="flex items-center gap-2 bg-card/80 dark:bg-black/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/40 dark:border-white/10 px-3 py-2 relative">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search venues, cities..."
                  aria-label="Search venues"
                  className="bg-transparent border-none outline-none flex-1 text-sm text-foreground placeholder:text-muted-foreground/60 font-medium"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                
                {isListening ? (
                  <button 
                    onClick={stopListening}
                    className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-500 rounded-full animate-pulse"
                    aria-label="Stop listening"
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  </button>
                ) : isSupported ? (
                  <button
                    onClick={startListening}
                    aria-label="Voice search"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                ) : null}
                
                {searchQuery && !isListening && (
                  <button
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <div className="w-px h-5 bg-border mx-1" />
                <ProfileSelector variant="header" />
              </div>

            {/* Filter chips row */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {CATEGORY_FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setCategoryFilter(f.id)}
                  aria-pressed={categoryFilter === f.id}
                  className={`
                    flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap
                    border transition-all duration-150 shadow-sm
                    ${categoryFilter === f.id
                      ? "bg-primary text-white border-primary shadow-md"
                      : "bg-card/80 backdrop-blur-xl border-white/40 text-foreground hover:bg-card/95"
                    }
                  `}
                >
                  {f.label}
                </button>
              ))}
              <button
                onClick={() => setShowFilters(!showFilters)}
                aria-expanded={showFilters}
                aria-label="Toggle status filters"
                className={`
                  flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap
                  border transition-all duration-150 shadow-sm
                  ${showFilters
                    ? "bg-primary text-white border-primary"
                    : "bg-card/80 backdrop-blur-xl border-white/40 text-foreground hover:bg-card/95"
                  }
                `}
              >
                <Filter className="w-3 h-3" aria-hidden="true" />
                Filter
              </button>
            </div>

            {/* Status filter dropdown */}
            {showFilters && (
              <div className="flex items-center gap-2 flex-wrap pointer-events-auto animate-fade-in">
                {STATUS_FILTERS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id)}
                    aria-pressed={statusFilter === f.id}
                    className={`
                      px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 shadow-sm
                      ${statusFilter === f.id
                        ? "bg-[#0d7c66] text-white border-[#0d7c66]"
                        : "bg-card/80 backdrop-blur-xl border-white/40 text-foreground hover:bg-card/95"
                      }
                    `}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* List View */}
          <div className="flex-1 overflow-y-auto pointer-events-auto no-scrollbar flex flex-col gap-3 pb-32 md:pb-4" ref={listRef}>
            {filteredVenues.map((venue) => {
              const isSelected = selectedVenueId === venue.venue_id;
              const score = venueScores[venue.venue_id];
              const isVerified = (venue as DemoVenue).verificationStatus === "verified";
              return (
                <div
                  key={venue.venue_id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${venue.name}, ${venue.category} in ${venue.city || 'Chennai'}`}
                  onClick={() => setSelectedVenueId(venue.venue_id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedVenueId(venue.venue_id);
                    }
                  }}
                  className={`
                    venue-list-item shrink-0 p-4 rounded-2xl cursor-pointer transition-all duration-200 border relative overflow-hidden group
                    ${isSelected ? "bg-primary/10 border-primary shadow-md" : "bg-card/95 backdrop-blur-xl border-white/60 hover:bg-card shadow-sm"}
                  `}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-foreground line-clamp-1 pr-2">{venue.name}</h3>
                    {score !== undefined && (
                      <Badge variant={score >= 80 ? "default" : score >= 50 ? "secondary" : "outline"} className="shrink-0 text-[10px] px-1.5 py-0">
                        {score}% Match
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-2 capitalize">
                    {venue.category} • {venue.city || "Chennai"}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    {isVerified ? (
                      <div className="flex items-center gap-1 text-[10px] text-green-700 font-bold uppercase tracking-wider bg-green-100/50 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3" />
                        Verified
                      </div>
                    ) : <div />}
                    
                    <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      View details &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
            {filteredVenues.length === 0 && (
              <div className="p-8 text-center bg-card/50 backdrop-blur-md rounded-2xl border border-white/40">
                <p className="text-sm text-muted-foreground">No venues found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right side tools */}
        <div className="flex flex-col items-end gap-3 pointer-events-auto absolute top-4 right-4 md:static">
          <div className="bg-card/80 backdrop-blur-xl rounded-xl shadow-md border border-white/40 px-3 py-2 flex items-center gap-2">
            <span className="text-xs font-bold text-foreground">{filteredVenues.length}</span>
            <span className="text-xs text-muted-foreground font-medium">venues</span>
          </div>
          <button
            onClick={requestLocation}
            aria-label="Center on my location"
            title="My Location"
            className="w-10 h-10 bg-card/80 backdrop-blur-xl rounded-xl flex items-center justify-center text-primary shadow-md border border-white/40 hover:bg-card/95 transition-colors"
          >
            <Navigation className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>


      {/* ── Selected venue card ── */}
      {selectedVenue && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-5 z-[20] pointer-events-auto animate-slide-bottom">
          <div className="w-full md:w-[420px] relative">
            <button
              onClick={() => setSelectedVenueId(undefined)}
              aria-label="Close venue card"
              className="absolute -top-3 -right-2 z-30 w-7 h-7 bg-card rounded-full shadow-md flex items-center justify-center border border-border text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="bg-card/95 backdrop-blur-xl rounded-2xl shadow-xl border border-border overflow-hidden max-h-[55vh] overflow-y-auto">
              <VenueCard
                venue={selectedVenue as DemoVenue}
                attributes={getDemoAttributes(selectedVenue.venue_id)}
                evidence={getDemoEvidence(selectedVenue.venue_id)}
                distance={(selectedVenue as DemoVenue & { distance?: number }).distance}
                showDistance={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Loading overlay ── */}
      {isLocating && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm pointer-events-none">
          <div className="bg-card px-6 py-5 rounded-2xl shadow-xl flex flex-col items-center gap-3 border border-border">
            <div className="w-9 h-9 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-foreground">Locating you...</p>
          </div>
        </div>
      )}

      {/* ── Error toast ── */}
      {error && !isLocating && (
        <div className="absolute top-[100px] left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md pointer-events-auto animate-fade-in">
          <div className="bg-card border border-amber-200 text-amber-800 p-4 rounded-xl shadow-lg flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm font-medium flex-1">{error}</p>
            <button onClick={() => setError(null)} aria-label="Dismiss" className="text-amber-500 hover:text-amber-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
