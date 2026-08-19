"use client";

import React, { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { 
  Layers, 
  Crosshair, 
  MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";

// Accept any venue-shaped object and normalize internally
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyVenue = Record<string, any>;

function getVenueId(v: AnyVenue): string {
  return v.venue_id || v.id || '';
}
function getVenueCategory(v: AnyVenue): string {
  return v.category || '';
}
function getVenueCoords(v: AnyVenue): [number, number] | null {
  if (v.coordinates && Array.isArray(v.coordinates)) return v.coordinates as [number, number];
  if (typeof v.longitude === 'number' && typeof v.latitude === 'number') return [v.longitude, v.latitude];
  return null;
}
function isVenueVerified(v: AnyVenue): boolean {
  return v.isVerified === true || v.verificationStatus === 'verified';
}

export interface MapLibre3DProps {
  venues: AnyVenue[];
  selectedVenueId?: string;
  onVenueSelect?: (venue: AnyVenue) => void;
  className?: string;
  venueScores?: Record<string, number>;
  showGeolocateControl?: boolean;
}

const CHENNAI_COORDS: [number, number] = [80.2707, 13.0827]; // [lng, lat]

const getCategoryColor = (category?: string) => {
  switch (category?.toLowerCase()) {
    case "mobility": return "bg-blue-500 text-white";
    case "vision": return "bg-violet-500 text-white";
    case "hearing": return "bg-teal-500 text-white";
    case "sensory": return "bg-orange-500 text-white";
    default: return "bg-slate-700 text-white";
  }
};

export default function MapLibre3D({
  venues = [],
  selectedVenueId,
  onVenueSelect,
  className,
  venueScores = {},
  showGeolocateControl = true
}: MapLibre3DProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  
  const [is3D, setIs3D] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'carto-voyager': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
              'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
              'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png'
            ],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
          }
        },
        layers: [
          {
            id: 'carto-voyager-layer',
            type: 'raster',
            source: 'carto-voyager',
            minzoom: 0,
            maxzoom: 20
          }
        ]
      },
      center: CHENNAI_COORDS,
      zoom: 14,
      pitch: 60,
      bearing: -15,
    });

    mapRef.current = map;

    // Add geolocate control to the map if requested (default true)
    if (showGeolocateControl) {
      const geolocate = new maplibregl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showAccuracyCircle: true,
      });
      map.addControl(geolocate, 'bottom-right');
    }

    map.on("load", () => {
      setMapLoaded(true);
      map.resize();
    });

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });
    
    if (mapContainer.current) {
      resizeObserver.observe(mapContainer.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const filteredVenues = venues;

  // Update Markers
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    filteredVenues.forEach((venue) => {
      const vId = getVenueId(venue);
      const vCoords = getVenueCoords(venue);
      const vCategory = getVenueCategory(venue);
      
      if (!vId || !vCoords) return; // Skip invalid venues

      const el = document.createElement("div");
      
      const isSelected = selectedVenueId === vId;
      const isVerified = isVenueVerified(venue);
      const score = venueScores ? venueScores[vId] : undefined;
      const categoryColor = getCategoryColor(vCategory);

      // Construct DOM node for React-like rendering manually
      el.className = cn(
        "relative flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer shadow-lg",
        categoryColor,
        isSelected ? "w-12 h-12 z-50 animate-pulse ring-4 ring-offset-2 ring-primary" : "w-8 h-8 z-10",
        isVerified && !isSelected && "ring-2 ring-green-500 ring-offset-1"
      );

      // Custom marker inner HTML
      el.innerHTML = `
        <div class="flex items-center justify-center w-full h-full">
          <!-- Icon will be inserted based on category but simple fallback here -->
          <svg xmlns="http://www.w3.org/2000/svg" width="${isSelected ? '24' : '16'}" height="${isSelected ? '24' : '16'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${
              vCategory === 'mobility' ? '<circle cx="12" cy="5" r="1"></circle><path d="m4.77 8.5 6-1.5c1.24-.31 2.58.26 3.12 1.4l1.2 2.6c.39.82 1.25 1.3 2.16 1.3H19"></path><path d="m10.5 15.5 1.5 5.5"></path><path d="m14.5 10.5-2.5 5.5"></path>' :
              vCategory === 'vision' ? '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle>' :
              vCategory === 'hearing' ? '<path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a8 8 0 0 1-5-7.17 2.5 2.5 0 0 1 5.06-1.17c0 2-3 2-3 4"></path><path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2.5 2.5 0 1 0 5 0Z"></path>' :
              vCategory === 'sensory' ? '<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"></path><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"></path>' :
              '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle>'
            }
          </svg>
        </div>
        ${score ? `<div class="absolute -top-2 -right-2 bg-white text-xs font-bold px-1 rounded-full text-black shadow border border-gray-200">${score}</div>` : ''}
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onVenueSelect) onVenueSelect(venue);
      });

      const marker = new maplibregl.Marker({
        element: el,
        anchor: "bottom",
      })
        .setLngLat(vCoords)
        .addTo(mapRef.current!);

      markersRef.current[vId] = marker;
    });
  }, [filteredVenues, selectedVenueId, mapLoaded, venueScores, onVenueSelect]);

  // Fly to selected venue
  useEffect(() => {
    if (selectedVenueId && mapRef.current && mapLoaded) {
      const venue = venues.find(v => getVenueId(v) === selectedVenueId);
      if (venue) {
        const coords = getVenueCoords(venue);
        if (coords) {
          mapRef.current.flyTo({
            center: coords,
            zoom: 16,
            pitch: is3D ? 60 : 0,
            speed: 1.2,
            curve: 1.42
          });
        }
      }
    }
  }, [selectedVenueId, venues, mapLoaded, is3D]);

  // Toggle 3D
  const toggle3D = () => {
    if (mapRef.current) {
      const newIs3D = !is3D;
      setIs3D(newIs3D);
      mapRef.current.easeTo({
        pitch: newIs3D ? 60 : 0,
        bearing: newIs3D ? -15 : 0,
        duration: 1000,
      });
    }
  };

  const recenter = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: CHENNAI_COORDS,
        zoom: 14,
        pitch: is3D ? 60 : 0,
        bearing: is3D ? -15 : 0,
      });
    }
  };

  return (
    <div className={cn("relative w-full h-full overflow-hidden rounded-xl bg-slate-100", className)}>
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      

      {/* Map Tools */}
      <div className="absolute bottom-6 right-4 flex flex-col gap-2 z-10 pointer-events-auto">
        <button 
          onClick={toggle3D}
          className={cn(
            "w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all backdrop-blur-md border border-white/20",
            is3D ? "bg-primary text-primary-foreground" : "bg-white/90 text-slate-700 hover:bg-white"
          )}
          title="Toggle 3D View"
        >
          <Layers size={18} />
        </button>
        
        <button 
          onClick={recenter}
          className="w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-slate-700 hover:bg-white transition-all backdrop-blur-md border border-white/20"
          title="Recenter Map"
        >
          <Crosshair size={18} />
        </button>
      </div>

    </div>
  );
}
// Named export for consumers that use { MapLibre3D }
export { MapLibre3D };
