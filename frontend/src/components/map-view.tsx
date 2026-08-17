"use client";

/**
 * MapView - Real Interactive Map Export
 * 
 * Re-exports InteractiveMapView as the default MapView.
 * This ensures all pages get the real Google Maps implementation.
 * 
 * The deprecated MapPlaceholder has been removed.
 */

export { InteractiveMapView as MapView } from "./map/interactive-map";
export { InteractiveMapView } from "./map/interactive-map";
export type { InteractiveMapViewProps } from "./map/interactive-map";
export type { MapContainerProps } from "@/lib/map/types";
