/**
 * Google Maps Provider Implementation
 * 
 * Implements the MapProviderInstance interface for Google Maps JavaScript API.
 * Keeps all Google Maps-specific code isolated here.
 */

"use client";

import {
  MapProviderInstance,
  MapProviderConfig,
  MapPosition,
  MapViewport,
  MapBounds,
  MapMarker,
  MapErrorType,
} from "../types";

export class GoogleMapsProvider implements MapProviderInstance {
  private map: google.maps.Map | null = null;
  private markers: Map<string, google.maps.Marker> = new Map();
  private infoWindow: google.maps.InfoWindow | null = null;
  private container: HTMLElement | null = null;
  private listeners: google.maps.MapsEventListener[] = [];
  
  // Event callbacks
  private clickCallback: ((position: MapPosition) => void) | null = null;
  private markerClickCallback: ((markerId: string) => void) | null = null;
  private viewportChangeCallback: ((viewport: MapViewport) => void) | null = null;

  async init(container: HTMLElement, config: MapProviderConfig): Promise<void> {
    if (!window.google?.maps) {
      await this.loadGoogleMapsScript(config.apiKey);
    }

    this.container = container;
    
    const mapOptions: google.maps.MapOptions = {
      center: config.initialCenter || { lat: 20.5937, lng: 78.9629 }, // Center of India
      zoom: config.initialZoom || 5,
      minZoom: config.minZoom || 2,
      maxZoom: config.maxZoom || 20,
      disableDefaultUI: config.disableDefaultUI ?? false,
      gestureHandling: config.gestureHandling || "cooperative",
      mapTypeControl: true,
      zoomControl: true,
      streetViewControl: false,
      fullscreenControl: false,
    };

    this.map = new google.maps.Map(container, mapOptions);
    this.infoWindow = new google.maps.InfoWindow();

    // Set up viewport change listener
    const idleListener = this.map.addListener("idle", () => {
      if (this.viewportChangeCallback && this.map) {
        const center = this.map.getCenter();
        const zoom = this.map.getZoom();
        if (center && zoom !== undefined) {
          const bounds = this.map.getBounds();
          const viewport: MapViewport = {
            center: { lat: center.lat(), lng: center.lng() },
            zoom,
            bounds: bounds ? this.convertBounds(bounds) : undefined,
          };
          this.viewportChangeCallback(viewport);
        }
      }
    });
    this.listeners.push(idleListener);

    // Set up map click listener
    const clickListener = this.map.addListener("click", (event: google.maps.MapMouseEvent) => {
      if (this.clickCallback && event.latLng) {
        this.clickCallback({
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        });
      }
    });
    this.listeners.push(clickListener);
  }

  private async loadGoogleMapsScript(apiKey?: string): Promise<void> {
    if (document.querySelector('script[data-google-maps]')) {
      // Script already loading or loaded
      await this.waitForGoogleMaps();
      return;
    }

    if (!apiKey) {
      throw new Error("Google Maps API key is required");
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker`;
      script.async = true;
      script.defer = true;
      script.setAttribute("data-google-maps", "true");
      
      script.onload = () => {
        this.waitForGoogleMaps().then(resolve).catch(reject);
      };
      
      script.onerror = () => {
        reject(new Error("Failed to load Google Maps script"));
      };

      document.head.appendChild(script);
    });
  }

  private async waitForGoogleMaps(): Promise<void> {
    return new Promise((resolve, reject) => {
      const maxAttempts = 50;
      let attempts = 0;
      
      const checkGoogleMaps = () => {
        attempts++;
        if (window.google?.maps) {
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error("Google Maps failed to initialize"));
        } else {
          setTimeout(checkGoogleMaps, 100);
        }
      };
      
      checkGoogleMaps();
    });
  }

  destroy(): void {
    // Remove all listeners
    this.listeners.forEach(listener => {
      google.maps.event.removeListener(listener);
    });
    this.listeners = [];

    // Remove all markers
    this.markers.forEach(marker => marker.setMap(null));
    this.markers.clear();

    // Close info window
    if (this.infoWindow) {
      this.infoWindow.close();
    }

    // Clear map reference
    this.map = null;
    this.container = null;
  }

  setCenter(position: MapPosition): void {
    if (this.map) {
      this.map.setCenter(position);
    }
  }

  setZoom(zoom: number): void {
    if (this.map) {
      this.map.setZoom(zoom);
    }
  }

  setViewport(viewport: MapViewport): void {
    if (this.map) {
      this.map.setCenter(viewport.center);
      this.map.setZoom(viewport.zoom);
    }
  }

  getViewport(): MapViewport {
    if (!this.map) {
      return {
        center: { lat: 20.5937, lng: 78.9629 },
        zoom: 5,
      };
    }

    const center = this.map.getCenter();
    const zoom = this.map.getZoom();
    const bounds = this.map.getBounds();

    return {
      center: center ? { lat: center.lat(), lng: center.lng() } : { lat: 20.5937, lng: 78.9629 },
      zoom: zoom ?? 5,
      bounds: bounds ? this.convertBounds(bounds) : undefined,
    };
  }

  fitBounds(bounds: MapBounds, padding: number = 50): void {
    if (!this.map) return;

    const googleBounds = new google.maps.LatLngBounds(
      { lat: bounds.south, lng: bounds.west },
      { lat: bounds.north, lng: bounds.east }
    );

    this.map.fitBounds(googleBounds, padding);
  }

  addMarker(marker: MapMarker): void {
    if (!this.map) return;

    // Remove existing marker if present
    this.removeMarker(marker.id);

    const googleMarker = new google.maps.Marker({
      position: marker.position,
      map: this.map,
      title: marker.title,
      animation: marker.selected ? google.maps.Animation.BOUNCE : undefined,
    });

    // Store reference
    this.markers.set(marker.id, googleMarker);

    // Add click listener
    const clickListener = googleMarker.addListener("click", () => {
      if (this.markerClickCallback) {
        this.markerClickCallback(marker.id);
      }
    });
    this.listeners.push(clickListener);
  }

  updateMarker(id: string, updates: Partial<MapMarker>): void {
    const marker = this.markers.get(id);
    if (!marker) return;

    if (updates.position) {
      marker.setPosition(updates.position);
    }
    if (updates.title !== undefined) {
      marker.setTitle(updates.title);
    }
    if (updates.selected !== undefined) {
      if (updates.selected) {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => marker.setAnimation(null), 750);
      } else {
        marker.setAnimation(null);
      }
    }
  }

  removeMarker(id: string): void {
    const marker = this.markers.get(id);
    if (marker) {
      marker.setMap(null);
      this.markers.delete(id);
    }
  }

  removeAllMarkers(): void {
    this.markers.forEach(marker => marker.setMap(null));
    this.markers.clear();
  }

  getMarker(id: string): MapMarker | undefined {
    const googleMarker = this.markers.get(id);
    if (!googleMarker) return undefined;

    const position = googleMarker.getPosition();
    if (!position) return undefined;

    return {
      id,
      position: { lat: position.lat(), lng: position.lng() },
      title: googleMarker.getTitle() || "",
    };
  }

  onClick(callback: (position: MapPosition) => void): void {
    this.clickCallback = callback;
  }

  onMarkerClick(callback: (markerId: string) => void): void {
    this.markerClickCallback = callback;
  }

  onViewportChange(callback: (viewport: MapViewport) => void): void {
    this.viewportChangeCallback = callback;
  }

  openInfoWindow(markerId: string, content: HTMLElement): void {
    const marker = this.markers.get(markerId);
    if (!marker || !this.infoWindow) return;

    this.infoWindow.setContent(content);
    this.infoWindow.open(this.map, marker);
  }

  closeInfoWindow(): void {
    if (this.infoWindow) {
      this.infoWindow.close();
    }
  }

  private convertBounds(bounds: google.maps.LatLngBounds): MapBounds {
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    
    return {
      north: ne.lat(),
      south: sw.lat(),
      east: ne.lng(),
      west: sw.lng(),
    };
  }
}

// Declare global types
declare global {
  interface Window {
    google?: typeof google;
  }
}
