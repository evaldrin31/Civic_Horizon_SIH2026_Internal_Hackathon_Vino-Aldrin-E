/**
 * MapView Component - Real Interactive Map
 * 
 * A fully interactive map using the MapProvider abstraction.
 * Supports pan, zoom, markers, selection, and list synchronization.
 * Falls back to list-only view if map fails to initialize.
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Venue, AccessibilityAttribute } from "@/lib/api/types";
import { GoogleMapsProvider } from "@/lib/map/providers/google-maps";
import {
  MapContainerProps,
  MapViewport,
  MapBounds,
  MapMarker,
} from "@/lib/map/types";
import { VenueCardCompact } from "@/components/venue-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AccessibilitySummaryCompact } from "@/components/accessibility-attributes";
import { DataSourceIndicator } from "@/components/data-source-indicator";
import { formatCategory } from "@/lib/utils";
import { useGeolocation } from "@/lib/hooks/use-data";
import {
  Map as MapIcon,
  List,
  AlertCircle,
  RefreshCw,
  Crosshair,
  Plus,
  Minus,
  Navigation,
  ChevronRight,
  LocateFixed,
} from "lucide-react";

// Component props extending the base props
interface InteractiveMapViewProps extends MapContainerProps {
  attributes?: Record<string, AccessibilityAttribute[]>;
}

export function InteractiveMapView({
  venues,
  selectedVenueId,
  onVenueSelect,
  onViewportChange,
  attributes = {},
  height = "500px",
  className = "",
}: InteractiveMapViewProps) {
  // State
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapAvailable, setMapAvailable] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(selectedVenueId || null);
  const [currentViewport, setCurrentViewport] = useState<MapViewport>({
    center: { lat: 20.5937, lng: 78.9629 }, // Center of India
    zoom: 5,
  });

  // Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const providerRef = useRef<GoogleMapsProvider | null>(null);
  const infoWindowRef = useRef<HTMLDivElement | null>(null);

  // Get API key from environment
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Geolocation hook
  const { position: userPosition, error: geoError, requestLocation } = useGeolocation();

  // Calculate bounds for all venues
  const calculateBounds = useCallback((venueList: Venue[]): MapBounds | null => {
    if (venueList.length === 0) return null;

    const lats = venueList.map((v) => v.latitude);
    const lngs = venueList.map((v) => v.longitude);

    return {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs),
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || !mapAvailable) return;
    if (!apiKey) {
      setError("Google Maps API key not configured");
      setMapAvailable(false);
      setIsLoading(false);
      return;
    }

    const initMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const provider = new GoogleMapsProvider();
        providerRef.current = provider;

        await provider.init(mapContainerRef.current!, {
          apiKey,
          initialCenter: currentViewport.center,
          initialZoom: currentViewport.zoom,
          minZoom: 2,
          maxZoom: 20,
          gestureHandling: "cooperative",
        });

        // Set up event listeners
        provider.onMarkerClick((markerId) => {
          handleVenueSelect(markerId);
        });

        provider.onViewportChange((viewport) => {
          setCurrentViewport(viewport);
          onViewportChange?.(viewport);
        });

        // Fit to venue bounds if venues exist
        const bounds = calculateBounds(venues);
        if (bounds) {
          provider.fitBounds(bounds, 50);
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Failed to initialize map:", err);
        setError("Failed to load map. Please check your connection.");
        setMapAvailable(false);
        setIsLoading(false);
      }
    };

    initMap();

    // Cleanup
    return () => {
      providerRef.current?.destroy();
      providerRef.current = null;
    };
  }, [apiKey, mapAvailable]);

  // Update markers when venues change
  useEffect(() => {
    if (!providerRef.current || isLoading || error) return;

    providerRef.current.removeAllMarkers();

    venues.forEach((venue) => {
      const marker: MapMarker = {
        id: venue.venue_id,
        position: { lat: venue.latitude, lng: venue.longitude },
        title: venue.name,
        selected: venue.venue_id === selectedId,
        venue,
      };
      providerRef.current?.addMarker(marker);
    });

    // Fit bounds if venues changed significantly
    const bounds = calculateBounds(venues);
    if (bounds && venues.length > 0) {
      providerRef.current.fitBounds(bounds, 50);
    }
  }, [venues, isLoading, error]);

  // Update marker selection
  useEffect(() => {
    if (!providerRef.current || isLoading) return;

    // Update all markers' selected state
    venues.forEach((venue) => {
      providerRef.current?.updateMarker(venue.venue_id, {
        selected: venue.venue_id === selectedId,
      });
    });

    // Center on selected venue
    const selectedVenue = venues.find((v) => v.venue_id === selectedId);
    if (selectedVenue) {
      providerRef.current.setCenter({
        lat: selectedVenue.latitude,
        lng: selectedVenue.longitude,
      });

      // Show info window
      if (infoWindowRef.current) {
        providerRef.current.openInfoWindow(selectedId!, infoWindowRef.current);
      }
    } else {
      providerRef.current.closeInfoWindow();
    }
  }, [selectedId, venues, isLoading]);

  // Sync with external selectedVenueId prop
  useEffect(() => {
    if (selectedVenueId !== undefined && selectedVenueId !== selectedId) {
      setSelectedId(selectedVenueId);
    }
  }, [selectedVenueId]);

  const handleVenueSelect = useCallback(
    (venueId: string | null) => {
      setSelectedId(venueId);
      if (venueId) {
        const venue = venues.find((v) => v.venue_id === venueId);
        if (venue) {
          onVenueSelect?.(venue);
        }
      }
    },
    [venues, onVenueSelect]
  );

  const handleZoomIn = () => {
    providerRef.current?.setZoom(currentViewport.zoom + 1);
  };

  const handleZoomOut = () => {
    providerRef.current?.setZoom(currentViewport.zoom - 1);
  };

  const handleRecenter = () => {
    const bounds = calculateBounds(venues);
    if (bounds) {
      providerRef.current?.fitBounds(bounds, 50);
    }
  };

  const handleMyLocation = async () => {
    await requestLocation();
  };

  // Update user location on map when position changes
  useEffect(() => {
    if (userPosition && providerRef.current) {
      providerRef.current.setUserLocation(userPosition);
      providerRef.current.panToUserLocation();
    }
  }, [userPosition]);

  const handleRetry = () => {
    setMapAvailable(true);
    setError(null);
    setIsLoading(true);
  };

  const selectedVenue = venues.find((v) => v.venue_id === selectedId);

  // Render info window content
  const renderInfoWindow = () => {
    if (!selectedVenue) return null;
    const venueAttrs = attributes[selectedVenue.venue_id] || [];

    return (
      <div ref={infoWindowRef} className="min-w-[200px] max-w-[280px]">
        <div className="bg-white rounded-lg shadow-lg border p-3">
          <h3 className="font-semibold text-sm mb-1">{selectedVenue.name}</h3>
          <p className="text-xs text-muted-foreground mb-2">
            {formatCategory(selectedVenue.category)}
          </p>
          <div className="mb-2">
            <AccessibilitySummaryCompact attributes={venueAttrs} />
          </div>
          <Button
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              window.location.href = `/venues/${selectedVenue.venue_id}`;
            }}
          >
            View Details
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>
    );
  };

  // Empty state
  if (venues.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">No venues found</div>
        </div>
        <div
          className="flex items-center justify-center bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25"
          style={{ height }}
        >
          <div className="text-center p-8">
            <MapIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">No venues to display</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* View Toggle & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {venues.length} venue{venues.length !== 1 ? "s" : ""} found
          </span>
          {!mapAvailable && (
            <Badge variant="secondary" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Map unavailable
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {mapAvailable && !error && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                title="Zoom out"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                title="Zoom in"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecenter}
                title="Fit to results"
              >
                <Crosshair className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleMyLocation}
                title="My Location"
              >
                <LocateFixed className="h-4 w-4" />
              </Button>
            </>
          )}
          <div className="flex gap-1">
            <Button
              variant={viewMode === "map" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("map")}
              disabled={!mapAvailable}
            >
              <MapIcon className="h-4 w-4 mr-2" />
              Map
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4 mr-2" />
              List
            </Button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      {viewMode === "map" && mapAvailable && (
        <div className="relative rounded-lg overflow-hidden border">
          {/* Loading State */}
          {isLoading && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-muted z-10"
              style={{ height }}
            >
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-red-50 z-10"
              style={{ height }}
            >
              <div className="text-center p-6">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-700 font-medium mb-2">Map Error</p>
                <p className="text-sm text-red-600 mb-4">{error}</p>
                <Button variant="outline" size="sm" onClick={handleRetry}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* Actual Map */}
          <div
            ref={mapContainerRef}
            className="w-full"
            style={{ height }}
            aria-label="Interactive map showing venue locations"
          />

          {/* Info Window (rendered but hidden, used by Google Maps) */}
          <div className="hidden">{renderInfoWindow()}</div>

          {/* Selected Venue Card (below map) */}
          {selectedVenue && (
            <div className="absolute bottom-4 left-4 right-4 z-20">
              <VenueCardCompact
                venue={selectedVenue}
                attributes={attributes[selectedVenue.venue_id] || []}
              />
            </div>
          )}
        </div>
      )}

      {/* Fallback List View (when map unavailable or user selects list) */}
      {(viewMode === "list" || !mapAvailable || error) && (
        <div
          className="bg-muted rounded-lg p-4 overflow-y-auto border"
          style={{ height: viewMode === "list" || !mapAvailable ? height : "auto" }}
        >
          {venues.length === 0 ? (
            <div className="text-center py-8">
              <Navigation className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-muted-foreground">No venues found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {venues.map((venue) => {
                const venueAttrs = attributes[venue.venue_id] || [];
                const isSelected = venue.venue_id === selectedId;

                return (
                  <button
                    key={venue.venue_id}
                    onClick={() => handleVenueSelect(venue.venue_id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all hover:bg-accent ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border bg-background"
                    }`}
                    aria-selected={isSelected}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{venue.name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {venue.address}, {venue.city}
                        </div>
                        <div className="mt-2">
                          <AccessibilitySummaryCompact attributes={venueAttrs} />
                        </div>
                      </div>
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 ml-2 ${
                          isSelected ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Accessibility Note */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <AlertCircle className="h-3 w-3" />
        <span>
          Map and list are synchronized. Use the list view for keyboard navigation.
        </span>
      </div>
    </div>
  );
}

// Export for backward compatibility
export { InteractiveMapView as MapView };
