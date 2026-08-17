"use client";

import { Header, Footer } from "@/components/layout";
import { SearchBar } from "@/components/search-bar";
import { VenueCard, VenueCardSkeleton } from "@/components/venue-card";
import { MapView } from "@/components/map-view";
import { Button } from "@/components/ui/button";
import { Venue, AccessibilityAttribute, Evidence } from "@/lib/api/types";
import { searchApi } from "@/lib/api/client";
import { useState, useCallback, useEffect } from "react";
import { Accessibility, ArrowRight, Info, MapPin, Search as SearchIcon } from "lucide-react";
import Link from "next/link";

// DEMO DATA - Clearly marked as test data per project rules
const DEMO_VENUES: Venue[] = [
  {
    venue_id: "demo-venue-1",
    name: "City General Hospital - Demo",
    category: "hospital",
    address: "123 Healthcare Avenue",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    postal_code: "400001",
    latitude: 19.0760,
    longitude: 72.8777,
    official_url: undefined,
    contact_phone: undefined,
    contact_email: undefined,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
  {
    venue_id: "demo-venue-2",
    name: "Metro Station Central - Demo",
    category: "transport",
    address: "45 Metro Road",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    postal_code: "400002",
    latitude: 19.0822,
    longitude: 72.8812,
    official_url: undefined,
    contact_phone: undefined,
    contact_email: undefined,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
  {
    venue_id: "demo-venue-3",
    name: "Community Shopping Center - Demo",
    category: "shopping",
    address: "78 Market Street",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    postal_code: "400003",
    latitude: 19.0650,
    longitude: 72.8690,
    official_url: undefined,
    contact_phone: undefined,
    contact_email: undefined,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
];

const DEMO_ATTRIBUTES: Record<string, AccessibilityAttribute[]> = {
  "demo-venue-1": [
    {
      attribute_id: "demo-attr-1",
      venue_id: "demo-venue-1",
      location_id: null,
      category: "mobility",
      attribute_name: "ramp",
      value: "yes",
      value_type: "boolean",
      notes: "Accessible ramp at main entrance - DEMO DATA",
      last_observed_at: "2024-01-15T00:00:00Z",
      location: null,
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-15T10:30:00Z",
    },
    {
      attribute_id: "demo-attr-2",
      venue_id: "demo-venue-1",
      location_id: null,
      category: "mobility",
      attribute_name: "elevator",
      value: "yes",
      value_type: "boolean",
      notes: "Elevator to all floors - DEMO DATA",
      last_observed_at: "2024-01-15T00:00:00Z",
      location: null,
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-15T10:30:00Z",
    },
  ],
  "demo-venue-2": [
    {
      attribute_id: "demo-attr-3",
      venue_id: "demo-venue-2",
      location_id: null,
      category: "mobility",
      attribute_name: "step_free_entrance",
      value: "yes",
      value_type: "boolean",
      notes: "Step-free entrance available - DEMO DATA",
      last_observed_at: "2024-01-15T00:00:00Z",
      location: null,
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-15T10:30:00Z",
    },
  ],
};

const DEMO_EVIDENCE: Record<string, Evidence[]> = {
  "demo-venue-1": [
    {
      evidence_id: "demo-evidence-1",
      attribute_id: "demo-attr-1",
      source_id: undefined,
      evidence_text: "Hospital website lists accessible entrance - DEMO DATA",
      evidence_media_url: undefined,
      observed_at: "2024-01-15T00:00:00Z",
      collected_at: "2024-01-15T10:30:00Z",
      collector: "demo_collector",
      verification_status: "reported",
      confidence: 0.7,
      notes: "DEMO EVIDENCE - NOT VERIFIED",
      source: undefined,
      attribute: undefined,
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-15T10:30:00Z",
    },
  ],
};

export default function HomePage() {
  const [venues, setVenues] = useState<Venue[]>(DEMO_VENUES);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const handleSearch = useCallback(async (filters: { q: string; category: string; city: string; state: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to call the real API first
      const response = await searchApi.search({
        q: filters.q || undefined,
        category: filters.category || undefined,
        city: filters.city || undefined,
        state: filters.state || undefined,
      });
      setVenues(response.items);
    } catch (err) {
      // If API fails, filter demo data locally
      console.log("API unavailable, using demo data");
      let filtered = DEMO_VENUES;
      
      if (filters.q) {
        const q = filters.q.toLowerCase();
        filtered = filtered.filter(v => 
          v.name.toLowerCase().includes(q) || 
          v.address.toLowerCase().includes(q) ||
          v.city.toLowerCase().includes(q)
        );
      }
      
      if (filters.category) {
        filtered = filtered.filter(v => v.category === filters.category);
      }
      
      if (filters.city) {
        filtered = filtered.filter(v => 
          v.city.toLowerCase().includes(filters.city.toLowerCase())
        );
      }
      
      if (filters.state) {
        filtered = filtered.filter(v => v.state === filters.state);
      }
      
      setVenues(filtered);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLocationSearch = useCallback(() => {
    setIsLocating(true);
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await searchApi.nearby({
              lat: position.coords.latitude,
              lon: position.coords.longitude,
              radius: 5,
            });
            setVenues(response.items);
          } catch (err) {
            // Filter demo data by distance from user location
            console.log("API unavailable, using demo data with location");
          }
          setIsLocating(false);
        },
        (err) => {
          setError("Unable to access your location. Please enable location services.");
          setIsLocating(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      setIsLocating(false);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-12 md:py-20">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Accessibility className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium text-primary uppercase tracking-wide">
                  SIH 2026
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Find Accessible Venues
                <span className="text-primary"> Near You</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-2">
                Discover evidence-backed accessibility information for venues across India.
              </p>
              <p className="text-sm text-amber-600 bg-amber-50 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full">
                <Info className="h-4 w-4" />
                <span>Currently showing demo data - real data coming from research</span>
              </p>
            </div>
            
            <SearchBar 
              onSearch={handleSearch}
              onLocationSearch={handleLocationSearch}
              isLocating={isLocating}
              variant="hero"
            />
          </div>
        </section>

        {/* Results Section */}
        <section className="py-8 md:py-12">
          <div className="container">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            {/* Map + List View */}
            <div className="mb-8">
              <MapView 
                venues={venues}
                height="400px"
                onVenueSelect={(venue) => {
                  // Could open venue detail modal or navigate
                  window.location.href = `/venues/${venue.venue_id}`;
                }}
              />
            </div>

            {/* Venue List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {isLoading ? "Loading..." : `${venues.length} venues found`}
                </h2>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/nearby">
                    <MapPin className="h-4 w-4 mr-2" />
                    Find Nearby
                  </Link>
                </Button>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <VenueCardSkeleton key={i} />
                  ))}
                </div>
              ) : venues.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {venues.map((venue) => (
                    <VenueCard
                      key={venue.venue_id}
                      venue={venue}
                      attributes={DEMO_ATTRIBUTES[venue.venue_id] || []}
                      evidence={DEMO_EVIDENCE[venue.venue_id] || []}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                  <SearchIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">No venues found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search or filters to find more results.
                  </p>
                  <Button variant="outline" onClick={() => handleSearch({ q: "", category: "", city: "", state: "" })}>
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-12 bg-muted/50">
          <div className="container">
            <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SearchIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Search Venues</h3>
                <p className="text-sm text-muted-foreground">
                  Find venues by name, location, or category across India.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Info className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Check Accessibility</h3>
                <p className="text-sm text-muted-foreground">
                  View detailed accessibility attributes with evidence and verification status.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Plan Your Visit</h3>
                <p className="text-sm text-muted-foreground">
                  Make informed decisions with specific entrance and location information.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
