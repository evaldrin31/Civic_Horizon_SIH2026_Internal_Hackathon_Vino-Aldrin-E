/**
 * Data Fetching Hooks - Real API Integration
 * 
 * Provides hooks for fetching data from the backend API with proper
 * error handling, loading states, and data source tracking.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Venue,
  AccessibilityAttribute,
  Evidence,
  VenueSearchParams,
  NearbySearchParams,
} from "@/lib/api/types";
import { searchApi, venuesApi, accessibilityApi, evidenceApi } from "@/lib/api/client";
import { ApiClientError } from "@/lib/api/client";

// ==================== Data Source Types ====================

export type DataSource = "api" | "demo" | "error" | "loading" | "empty";

export interface DataState<T> {
  data: T;
  source: DataSource;
  isLoading: boolean;
  error: string | null;
  isUsingDemoData: boolean;
  lastFetchTime: Date | null;
}

// ==================== Demo Data ====================

const DEMO_VENUES: Venue[] = [
  {
    venue_id: "demo-venue-1",
    name: "City General Hospital - Demo Data",
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
    name: "Metro Station Central - Demo Data",
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
    name: "Community Shopping Center - Demo Data",
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
      notes: "Accessible ramp at main entrance",
      last_observed_at: "2024-01-15T00:00:00Z",
      location: {
        location_id: "demo-loc-1",
        venue_id: "demo-venue-1",
        name: "Main Entrance",
        location_type: "entrance",
        description: "Primary hospital entrance",
        latitude: 19.0760,
        longitude: 72.8777,
      },
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
      notes: "Elevator to all floors",
      last_observed_at: "2024-01-15T00:00:00Z",
      location: null,
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-15T10:30:00Z",
    },
    {
      attribute_id: "demo-attr-3",
      venue_id: "demo-venue-1",
      location_id: null,
      category: "mobility",
      attribute_name: "accessible_toilet",
      value: "yes",
      value_type: "boolean",
      notes: "Accessible toilet on ground floor",
      last_observed_at: "2024-01-15T00:00:00Z",
      location: {
        location_id: "demo-loc-2",
        venue_id: "demo-venue-1",
        name: "Ground Floor",
        location_type: "floor",
        description: "Main floor with reception",
      },
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-15T10:30:00Z",
    },
    {
      attribute_id: "demo-attr-4",
      venue_id: "demo-venue-1",
      location_id: null,
      category: "visual",
      attribute_name: "braille_signage",
      value: "unknown",
      value_type: "boolean",
      notes: "Not yet verified",
      last_observed_at: undefined,
      location: null,
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-15T10:30:00Z",
    },
  ],
  "demo-venue-2": [
    {
      attribute_id: "demo-attr-5",
      venue_id: "demo-venue-2",
      location_id: null,
      category: "mobility",
      attribute_name: "step_free_entrance",
      value: "yes",
      value_type: "boolean",
      notes: "Step-free main entrance",
      last_observed_at: "2024-01-15T00:00:00Z",
      location: null,
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-15T10:30:00Z",
    },
  ],
  "demo-venue-3": [
    {
      attribute_id: "demo-attr-6",
      venue_id: "demo-venue-3",
      location_id: null,
      category: "mobility",
      attribute_name: "accessible_parking",
      value: "yes",
      value_type: "boolean",
      notes: "Accessible parking available",
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
      evidence_text: "Hospital website lists accessible entrance with ramp",
      evidence_media_url: undefined,
      observed_at: "2024-01-15T00:00:00Z",
      collected_at: "2024-01-15T10:30:00Z",
      collector: "demo_collector",
      verification_status: "reported",
      confidence: 0.7,
      notes: "Based on official venue documentation. Not yet independently verified.",
      source: {
        source_id: "demo-source-1",
        source_type: "official_venue",
        source_name: "Hospital Website",
        source_url: "https://example.com",
        trust_level: 6,
        created_at: "2024-01-15T10:30:00Z",
      },
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-15T10:30:00Z",
    },
    {
      evidence_id: "demo-evidence-2",
      attribute_id: "demo-attr-1",
      source_id: undefined,
      evidence_text: "User submitted photo showing ramp with handrails",
      evidence_media_url: undefined,
      observed_at: "2024-02-01T00:00:00Z",
      collected_at: "2024-02-01T10:30:00Z",
      collector: "community_reporter",
      verification_status: "corroborated",
      confidence: 0.85,
      notes: "Community observation corroborates venue claim.",
      source: {
        source_id: "demo-source-2",
        source_type: "community_observation",
        source_name: "Community Reporter",
        trust_level: 3,
        created_at: "2024-02-01T10:30:00Z",
      },
      created_at: "2024-02-01T10:30:00Z",
      updated_at: "2024-02-01T10:30:00Z",
    },
  ],
};

// ==================== Hooks ====================

/**
 * Hook for searching venues with proper error handling and fallback
 */
export function useVenueSearch(initialParams?: VenueSearchParams) {
  const [state, setState] = useState<DataState<Venue[]>>({
    data: [],
    source: "loading",
    isLoading: true,
    error: null,
    isUsingDemoData: false,
    lastFetchTime: null,
  });

  const search = useCallback(async (params: VenueSearchParams) => {
    setState((prev) => ({ ...prev, isLoading: true, source: "loading" }));

    try {
      const response = await searchApi.search(params);

      if (response.items.length === 0) {
        setState({
          data: [],
          source: "empty",
          isLoading: false,
          error: null,
          isUsingDemoData: false,
          lastFetchTime: new Date(),
        });
        return;
      }

      setState({
        data: response.items,
        source: "api",
        isLoading: false,
        error: null,
        isUsingDemoData: false,
        lastFetchTime: new Date(),
      });
    } catch (error) {
      console.log("API unavailable, using demo data");

      // Filter demo data based on search params
      let filtered = DEMO_VENUES;

      if (params.q) {
        const q = params.q.toLowerCase();
        filtered = filtered.filter(
          (v) =>
            v.name.toLowerCase().includes(q) ||
            v.address.toLowerCase().includes(q) ||
            v.city.toLowerCase().includes(q)
        );
      }

      if (params.category) {
        filtered = filtered.filter((v) => v.category === params.category);
      }

      if (params.city) {
        filtered = filtered.filter((v) =>
          v.city.toLowerCase().includes(params.city!.toLowerCase())
        );
      }

      if (params.state) {
        filtered = filtered.filter((v) => v.state === params.state);
      }

      // Simulate API error if search term is "error"
      if (params.q === "error") {
        setState({
          data: [],
          source: "error",
          isLoading: false,
          error: "API Error: Could not connect to backend server",
          isUsingDemoData: false,
          lastFetchTime: new Date(),
        });
        return;
      }

      setState({
        data: filtered,
        source: filtered.length > 0 ? "demo" : "empty",
        isLoading: false,
        error: null,
        isUsingDemoData: true,
        lastFetchTime: new Date(),
      });
    }
  }, []);

  const refetch = useCallback(() => {
    if (initialParams) {
      search(initialParams);
    }
  }, [initialParams, search]);

  return { ...state, search, refetch };
}

/**
 * Hook for nearby search with geolocation
 */
export function useNearbySearch() {
  const [state, setState] = useState<DataState<Venue[]>>({
    data: [],
    source: "loading",
    isLoading: true,
    error: null,
    isUsingDemoData: false,
    lastFetchTime: null,
  });

  const searchNearby = useCallback(async (lat: number, lng: number, radius: number = 5) => {
    setState((prev) => ({ ...prev, isLoading: true, source: "loading" }));

    try {
      const response = await searchApi.nearby({ lat, lon: lng, radius });

      setState({
        data: response.items,
        source: response.items.length === 0 ? "empty" : "api",
        isLoading: false,
        error: null,
        isUsingDemoData: false,
        lastFetchTime: new Date(),
      });
    } catch (error) {
      console.log("API unavailable for nearby search, using demo data");

      // Calculate distances and sort
      const venuesWithDistance = DEMO_VENUES.map((v) => {
        const distance = calculateDistance(lat, lng, v.latitude, v.longitude);
        return { ...v, distance };
      }).filter((v) => v.distance !== undefined && v.distance <= radius);

      setState({
        data: venuesWithDistance,
        source: venuesWithDistance.length > 0 ? "demo" : "empty",
        isLoading: false,
        error: null,
        isUsingDemoData: true,
        lastFetchTime: new Date(),
      });
    }
  }, []);

  return { ...state, searchNearby };
}

/**
 * Hook for fetching venue details
 */
export function useVenueDetail(venueId: string | null) {
  const [state, setState] = useState<DataState<Venue | null>>({
    data: null,
    source: "loading",
    isLoading: true,
    error: null,
    isUsingDemoData: false,
    lastFetchTime: null,
  });

  const [attributes, setAttributes] = useState<DataState<AccessibilityAttribute[]>>({
    data: [],
    source: "loading",
    isLoading: true,
    error: null,
    isUsingDemoData: false,
    lastFetchTime: null,
  });

  const [evidence, setEvidence] = useState<DataState<Evidence[]>>({
    data: [],
    source: "loading",
    isLoading: true,
    error: null,
    isUsingDemoData: false,
    lastFetchTime: null,
  });

  useEffect(() => {
    if (!venueId) {
      setState({
        data: null,
        source: "empty",
        isLoading: false,
        error: null,
        isUsingDemoData: false,
        lastFetchTime: null,
      });
      setAttributes({
        data: [],
        source: "empty",
        isLoading: false,
        error: null,
        isUsingDemoData: false,
        lastFetchTime: null,
      });
      setEvidence({
        data: [],
        source: "empty",
        isLoading: false,
        error: null,
        isUsingDemoData: false,
        lastFetchTime: null,
      });
      return;
    }

    const fetchVenueData = async () => {
      setState((prev) => ({ ...prev, isLoading: true, source: "loading" }));
      setAttributes((prev) => ({ ...prev, isLoading: true, source: "loading" }));
      setEvidence((prev) => ({ ...prev, isLoading: true, source: "loading" }));

      try {
        // Fetch venue
        const venueData = await venuesApi.getById(venueId);
        setState({
          data: venueData,
          source: "api",
          isLoading: false,
          error: null,
          isUsingDemoData: false,
          lastFetchTime: new Date(),
        });

        // Fetch attributes
        const attributesData = await accessibilityApi.getForVenue(venueId);
        setAttributes({
          data: attributesData.items,
          source: attributesData.items.length === 0 ? "empty" : "api",
          isLoading: false,
          error: null,
          isUsingDemoData: false,
          lastFetchTime: new Date(),
        });

        // Fetch evidence
        const evidenceData = await evidenceApi.getForVenue(venueId);
        setEvidence({
          data: evidenceData.items,
          source: evidenceData.items.length === 0 ? "empty" : "api",
          isLoading: false,
          error: null,
          isUsingDemoData: false,
          lastFetchTime: new Date(),
        });
      } catch (error) {
        console.log("API unavailable, using demo data for venue detail");

        // Check if it's a demo venue
        const demoVenue = DEMO_VENUES.find((v) => v.venue_id === venueId);

        if (demoVenue) {
          setState({
            data: demoVenue,
            source: "demo",
            isLoading: false,
            error: null,
            isUsingDemoData: true,
            lastFetchTime: new Date(),
          });

          const demoAttrs = DEMO_ATTRIBUTES[venueId] || [];
          setAttributes({
            data: demoAttrs,
            source: demoAttrs.length === 0 ? "empty" : "demo",
            isLoading: false,
            error: null,
            isUsingDemoData: true,
            lastFetchTime: new Date(),
          });

          const demoEvidence = DEMO_EVIDENCE[venueId] || [];
          setEvidence({
            data: demoEvidence,
            source: demoEvidence.length === 0 ? "empty" : "demo",
            isLoading: false,
            error: null,
            isUsingDemoData: true,
            lastFetchTime: new Date(),
          });
        } else {
          setState({
            data: null,
            source: "error",
            isLoading: false,
            error: "Venue not found",
            isUsingDemoData: false,
            lastFetchTime: new Date(),
          });
          setAttributes({
            data: [],
            source: "error",
            isLoading: false,
            error: "Failed to load attributes",
            isUsingDemoData: false,
            lastFetchTime: new Date(),
          });
          setEvidence({
            data: [],
            source: "error",
            isLoading: false,
            error: "Failed to load evidence",
            isUsingDemoData: false,
            lastFetchTime: new Date(),
          });
        }
      }
    };

    fetchVenueData();
  }, [venueId]);

  return {
    venue: state,
    attributes,
    evidence,
  };
}

// ==================== Utility Functions ====================

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Hook for geolocation
 */
export function useGeolocation() {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const requestLocation = useCallback(() => {
    setIsLoading(true);
    setError(null);

    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by your browser");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setIsLoading(false);
      },
      (err) => {
        let message = "Unable to get your location";
        switch (err.code) {
          case err.PERMISSION_DENIED:
            message = "Location access was denied. Please enable location services.";
            break;
          case err.POSITION_UNAVAILABLE:
            message = "Location information is unavailable.";
            break;
          case err.TIMEOUT:
            message = "Location request timed out.";
            break;
        }
        setError(message);
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  return { position, error, isLoading, requestLocation };
}
