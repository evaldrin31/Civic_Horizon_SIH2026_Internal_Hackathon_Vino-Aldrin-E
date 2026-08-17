"use client";

import { useEffect, useState, useCallback } from "react";
import { Header, Footer } from "@/components/layout";
import { MapView } from "@/components/map-view";
import { VenueCard, VenueCardSkeleton } from "@/components/venue-card";
import { Button } from "@/components/ui/button";
import { Venue, AccessibilityAttribute, Evidence } from "@/lib/api/types";
import { searchApi } from "@/lib/api/client";
import { MapPin, Navigation, AlertCircle } from "lucide-react";

// DEMO DATA
const DEMO_VENUES: Venue[] = [
  {
    venue_id: "demo-nearby-1",
    name: "Accessible Cafe - Demo",
    category: "restaurant",
    address: "12 Food Street",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    postal_code: "400001",
    latitude: 19.0765,
    longitude: 72.8780,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
  {
    venue_id: "demo-nearby-2",
    name: "Community Library - Demo",
    category: "education",
    address: "45 Knowledge Road",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    postal_code: "400001",
    latitude: 19.0755,
    longitude: 72.8770,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
  {
    venue_id: "demo-nearby-3",
    name: "Public Park - Demo",
    category: "entertainment",
    address: "78 Green Avenue",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    postal_code: "400001",
    latitude: 19.0770,
    longitude: 72.8785,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
];

const DEMO_ATTRIBUTES: Record<string, AccessibilityAttribute[]> = {
  "demo-nearby-1": [
    {
      attribute_id: "demo-attr-n1",
      venue_id: "demo-nearby-1",
      location_id: null,
      category: "mobility",
      attribute_name: "step_free_entrance",
      value: "yes",
      value_type: "boolean",
      last_observed_at: "2024-01-15T00:00:00Z",
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-15T10:30:00Z",
    },
  ],
  "demo-nearby-2": [
    {
      attribute_id: "demo-attr-n2",
      venue_id: "demo-nearby-2",
      location_id: null,
      category: "mobility",
      attribute_name: "ramp",
      value: "yes",
      value_type: "boolean",
      last_observed_at: "2024-01-15T00:00:00Z",
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-15T10:30:00Z",
    },
    {
      attribute_id: "demo-attr-n3",
      venue_id: "demo-nearby-2",
      location_id: null,
      category: "mobility",
      attribute_name: "accessible_toilet",
      value: "yes",
      value_type: "boolean",
      last_observed_at: "2024-01-15T00:00:00Z",
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-15T10:30:00Z",
    },
  ],
};

export default function NearbyPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const loadNearbyVenues = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await searchApi.nearby({
        lat,
        lon: lng,
        radius: 5,
      });
      setVenues(response.items);
    } catch (err) {
      console.log("API unavailable, using demo data with location");
      // Calculate distances and sort demo data
      const venuesWithDistance = DEMO_VENUES.map(v => {
        const distance = calculateDistance(lat, lng, v.latitude, v.longitude);
        return { ...v, distance };
      }).sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
      setVenues(venuesWithDistance);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestLocation = useCallback(() => {
    setIsLocating(true);
    setError(null);
    setPermissionDenied(false);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          setIsLocating(false);
          loadNearbyVenues(location.lat, location.lng);
        },
        (err) => {
          setIsLocating(false);
          if (err.code === err.PERMISSION_DENIED) {
            setPermissionDenied(true);
            setError("Location access was denied. Please enable location services to find nearby venues.");
          } else {
            setError("Unable to get your location. Please try again.");
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsLocating(false);
      setError("Geolocation is not supported by your browser.");
    }
  }, [loadNearbyVenues]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Calculate distance between two coordinates (Haversine formula)
  function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main id="main-content" className="flex-1">
        {/* Header */}
        <section className="bg-muted/30 border-b">
          <div className="container py-8">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Find Nearby Venues</h1>
            </div>
            <p className="text-muted-foreground">
              Discover accessible venues near your current location.
            </p>
          </div>
        </section>

        {/* Location Status */}
        <section className="container py-6">
          {isLocating ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Getting your location...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
              <h3 className="font-medium text-red-800 mb-2">Location Error</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={requestLocation}>
                <Navigation className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Map View */}
              <MapView 
                venues={venues}
                center={userLocation || undefined}
                height="400px"
                onVenueSelect={(venue) => {
                  window.location.href = `/venues/${venue.venue_id}`;
                }}
              />

              {/* Venue List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">
                    {isLoading ? "Loading..." : `${venues.length} venues nearby`}
                  </h2>
                  <Button variant="outline" size="sm" onClick={requestLocation}>
                    <Navigation className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>

                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
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
                        distance={calculateDistance(
                          userLocation?.lat || 19.0760,
                          userLocation?.lng || 72.8777,
                          venue.latitude,
                          venue.longitude
                        )}
                        showDistance={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-medium mb-2">No venues found nearby</h3>
                    <p className="text-muted-foreground">
                      Try expanding your search or check back later.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
