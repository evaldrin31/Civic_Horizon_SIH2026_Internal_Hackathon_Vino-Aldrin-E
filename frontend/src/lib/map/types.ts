/**
 * Map Provider Types and Interfaces
 * 
 * Abstraction layer for map providers (Google Maps, Mapbox, Leaflet, etc.)
 * Keeps provider-specific code isolated from the rest of the application.
 */

import { Venue } from "@/lib/api/types";

// ==================== Map Provider Interface ====================

export interface MapPosition {
  lat: number;
  lng: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapMarker {
  id: string;
  position: MapPosition;
  title: string;
  selected?: boolean;
  venue?: Venue;
}

export interface MapViewport {
  center: MapPosition;
  zoom: number;
  bounds?: MapBounds;
}

export interface MapProviderConfig {
  apiKey?: string;
  containerId?: string;
  initialCenter?: MapPosition;
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  disableDefaultUI?: boolean;
  gestureHandling?: "cooperative" | "greedy" | "none";
}

export interface MapProviderInstance {
  // Map lifecycle
  init: (container: HTMLElement, config: MapProviderConfig) => Promise<void>;
  destroy: () => void;
  
  // Viewport controls
  setCenter: (position: MapPosition) => void;
  setZoom: (zoom: number) => void;
  setViewport: (viewport: MapViewport) => void;
  getViewport: () => MapViewport;
  fitBounds: (bounds: MapBounds, padding?: number) => void;
  
  // Markers
  addMarker: (marker: MapMarker) => void;
  updateMarker: (id: string, updates: Partial<MapMarker>) => void;
  removeMarker: (id: string) => void;
  removeAllMarkers: () => void;
  getMarker: (id: string) => MapMarker | undefined;
  
  // Events
  onClick: (callback: (position: MapPosition) => void) => void;
  onMarkerClick: (callback: (markerId: string) => void) => void;
  onViewportChange: (callback: (viewport: MapViewport) => void) => void;
  
  // Info Windows
  openInfoWindow: (markerId: string, content: HTMLElement) => void;
  closeInfoWindow: () => void;
}

// ==================== Provider Factory ====================

export type MapProviderType = "google" | "mapbox" | "leaflet" | null;

export interface MapProviderFactory {
  create: (type: MapProviderType) => MapProviderInstance | null;
  getAvailableProviders: () => MapProviderType[];
}

// ==================== Map State ====================

export interface MapState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  viewport: MapViewport;
  selectedMarkerId: string | null;
}

export interface MapContextValue {
  provider: MapProviderInstance | null;
  state: MapState;
  // Actions
  selectMarker: (id: string | null) => void;
  setViewport: (viewport: MapViewport) => void;
  fitToVenues: (venues: Venue[]) => void;
}

// ==================== Component Props ====================

export interface MapContainerProps {
  venues: Venue[];
  selectedVenueId?: string | null;
  onVenueSelect?: (venue: Venue) => void;
  onViewportChange?: (viewport: MapViewport) => void;
  height?: string;
  className?: string;
}

export interface MapMarkerProps {
  marker: MapMarker;
  onClick: () => void;
  isSelected: boolean;
}

export interface MapInfoWindowProps {
  venue: Venue;
  accessibilitySummary?: string;
  verificationStatus?: string;
  onViewDetails: () => void;
  onClose: () => void;
}

// ==================== Error Types ====================

export enum MapErrorType {
  NO_API_KEY = "NO_API_KEY",
  INITIALIZATION_FAILED = "INITIALIZATION_FAILED",
  PROVIDER_UNAVAILABLE = "PROVIDER_UNAVAILABLE",
  GEOLOCATION_DENIED = "GEOLOCATION_DENIED",
  NETWORK_ERROR = "NETWORK_ERROR",
}

export interface MapError {
  type: MapErrorType;
  message: string;
  recoverable: boolean;
}
