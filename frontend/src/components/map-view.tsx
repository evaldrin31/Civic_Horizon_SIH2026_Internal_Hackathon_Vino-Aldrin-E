"use client";

import { useState, useCallback } from "react";
import { Venue } from "@/lib/api/types";
import { VenueCardCompact } from "./venue-card";
import { Button } from "@/components/ui/button";
import { 
  Map as MapIcon, 
  List, 
  Crosshair, 
  ZoomIn, 
  ZoomOut,
  AlertCircle
} from "lucide-react";

interface MapViewProps {
  venues: Venue[];
  selectedVenueId?: string;
  onVenueSelect?: (venue: Venue) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
}

interface MapPlaceholderProps {
  venues: Venue[];
  selectedVenueId?: string;
  onVenueSelect?: (venue: Venue) => void;
  height?: string;
}

/**
 * MapPlaceholder - Development placeholder for map functionality
 * 
 * This component provides a visual placeholder when map provider credentials
 * are not available. It shows venue locations as dots on a grid.
 * 
 * To integrate a real map:
 * 1. Add map provider API key to environment variables
 * 2. Replace this with actual map component (Mapbox, Google Maps, Leaflet, etc.)
 * 3. Update imports and configuration
 */
function MapPlaceholder({ 
  venues, 
  selectedVenueId,
  onVenueSelect,
  height = "400px"
}: MapPlaceholderProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  const handleVenueClick = (venue: Venue) => {
    setSelectedVenue(venue);
    onVenueSelect?.(venue);
  };

  // Simple projection: convert lat/lng to x/y percentage
  // This is a simplified view - real maps use proper projections
  const project = (lat: number, lng: number) => {
    // India approximate bounds
    const latMin = 8, latMax = 37;
    const lngMin = 68, lngMax = 97;
    
    const x = ((lng - lngMin) / (lngMax - lngMin)) * 100;
    const y = 100 - ((lat - latMin) / (latMax - latMin)) * 100;
    
    return { 
      x: Math.max(5, Math.min(95, x)), 
      y: Math.max(5, Math.min(95, y)) 
    };
  };

  return (
    <div className="relative bg-muted rounded-lg overflow-hidden" style={{ height }}>
      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={() => setZoom(z => Math.min(z * 1.2, 3))}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={() => setZoom(z => Math.max(z / 1.2, 0.5))}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
        >
          <Crosshair className="h-4 w-4" />
        </Button>
      </div>

      {/* Map Area */}
      <div 
        className="absolute inset-0 transition-transform duration-300"
        style={{ 
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: 'center'
        }}
      >
        {/* Grid lines for visual reference */}
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={`h-${i}`} className="absolute w-full border-t border-foreground" style={{ top: `${i * 10}%` }} />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={`v-${i}`} className="absolute h-full border-l border-foreground" style={{ left: `${i * 10}%` }} />
          ))}
        </div>

        {/* Venue markers */}
        {venues.map((venue) => {
          const pos = project(venue.latitude, venue.longitude);
          const isSelected = venue.venue_id === selectedVenueId || venue.venue_id === selectedVenue?.venue_id;
          
          return (
            <button
              key={venue.venue_id}
              onClick={() => handleVenueClick(venue)}
              className={`absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 transition-all hover:scale-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                isSelected 
                  ? 'bg-primary border-primary scale-125' 
                  : 'bg-background border-primary'
              }`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              title={venue.name}
              aria-label={`${venue.name} at ${venue.address}`}
            />
          );
      })}
      </div>

      {/* Selected venue popup */}
      {selectedVenue && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="bg-background rounded-lg shadow-lg border">
            <VenueCardCompact 
              venue={selectedVenue}
              distance={undefined}
            />
          </div>
        </div>
      )}

      {/* Placeholder notice */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="bg-amber-50 text-amber-800 text-xs px-3 py-2 rounded-lg border border-amber-200 flex items-center gap-2">
          <AlertCircle className="h-3 w-3" />
          <span>Demo Map View</span>
        </div>
      </div>
    </div>
  );
}

/**
 * MapView - Main map component with list view toggle
 */
export function MapView({ 
  venues, 
  selectedVenueId,
  onVenueSelect,
  height = "500px"
}: MapViewProps) {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {venues.length} venue{venues.length !== 1 ? 's' : ''} found
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('map')}
          >
            <MapIcon className="h-4 w-4 mr-2" />
            Map
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4 mr-2" />
            List
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'map' ? (
        <MapPlaceholder
          venues={venues}
          selectedVenueId={selectedVenueId}
          onVenueSelect={onVenueSelect}
          height={height}
        />
      ) : (
        <div 
          className="bg-muted rounded-lg p-4 overflow-y-auto"
          style={{ height }}
        >
          <div className="space-y-2">
            {venues.map((venue) => (
              <button
                key={venue.venue_id}
                onClick={() => onVenueSelect?.(venue)}
                className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-accent ${
                  venue.venue_id === selectedVenueId ? 'border-primary bg-primary/5' : 'border-border bg-background'
                }`}
              >
                <div className="font-medium">{venue.name}</div>
                <div className="text-sm text-muted-foreground">{venue.address}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { MapPlaceholder };
