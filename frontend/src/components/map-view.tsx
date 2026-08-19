'use client';

/**
 * MapView - Interactive Map using MapLibre + mapcn
 * 
 * Using mapcn for clustered mapping without an API key (CARTO basemaps).
 * Fallback to Leaflet is kept commented out below.
 */

export { MapcnView as MapView, MapcnView as InteractiveMapView } from './mapcn-view';
// export { LeafletMapView as MapView, LeafletMapView as InteractiveMapView } from './leaflet-map';
export type { LeafletMapProps as InteractiveMapViewProps } from './leaflet-map'; // keeping props type interface compatible
