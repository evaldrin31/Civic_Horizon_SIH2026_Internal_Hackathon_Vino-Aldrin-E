'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Venue } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCategory } from '@/lib/utils';
import Link from 'next/link';
import {
  Map as MapIcon,
  List
} from 'lucide-react';

interface LeafletMapProps {
  venues: Venue[];
  selectedVenueId?: string;
  onVenueSelect?: (venue: Venue) => void;
  height?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  showControls?: boolean;
  // Extended data from demo
  venueScores?: Record<string, number>;
  venueCategories?: Record<string, string>;
}

const CATEGORY_COLORS: Record<string, string> = {
  hospital: '#ef4444',
  restaurant: '#f97316',
  shopping: '#8b5cf6',
  education: '#3b82f6',
  transport: '#06b6d4',
  hotel: '#ec4899',
  government: '#6b7280',
  entertainment: '#10b981',
  tourism: '#f59e0b',
  airport: '#0ea5e9',
  university: '#6366f1',
  theatre: '#a855f7',
  public: '#14b8a6',
  default: '#3b82f6',
};

// We use dynamic import to completely avoid SSR for the map component
const ClientOnlyMap = dynamic(
  async () => {
    // Import leafet and react-leaflet dynamically on the client
    const ReactLeaflet = await import('react-leaflet');
    const L = (await import('leaflet')).default;
    // @ts-expect-error Leaflet CSS has no types
    await import('leaflet/dist/leaflet.css');

    const { MapContainer, TileLayer, Marker, Popup, useMap } = ReactLeaflet;

    // Fix default marker icon issue in Leaflet/NextJS
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    const getScoreColor = (score: number) => {
      if (score >= 80) return '#10b981'; // green
      if (score >= 50) return '#f59e0b'; // yellow/orange
      return '#ef4444'; // red
    };

    const createMarkerIcon = (category: string, isSelected: boolean, score?: number) => {
      const iconColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
      const size = isSelected ? 48 : 36;
      const scoreColor = score !== undefined ? getScoreColor(score) : '#ccc';
      
      const scoreDeg = score !== undefined ? (score / 100) * 360 : 0;
      
      return L.divIcon({
        className: 'custom-marker bg-transparent',
        html: `
          <div style="
            width: ${size}px; 
            height: ${size}px; 
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            ${isSelected ? 'transform: scale(1.1); z-index: 1000;' : ''}
            transition: all 0.2s ease;
          ">
            <div style="
              position: absolute;
              inset: 0;
              border-radius: 50%;
              background: conic-gradient(${scoreColor} ${scoreDeg}deg, #e5e7eb ${scoreDeg}deg);
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            "></div>
            <div style="
              position: absolute;
              inset: ${isSelected ? '4px' : '3px'};
              background: white;
              border-radius: 50%;
            "></div>
            <div style="
              position: absolute;
              inset: ${isSelected ? '8px' : '7px'};
              background: ${iconColor};
              border-radius: 50%;
            "></div>
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
      });
    };

    const FitBounds = ({ venues }: { venues: Venue[] }) => {
      const map = useMap();
      useEffect(() => {
        if (venues && venues.length > 0) {
          try {
            const bounds = L.latLngBounds(venues.map(v => [v.latitude, v.longitude]));
            map.fitBounds(bounds, { padding: [50, 50] });
          } catch (e) {
            console.error("Error fitting bounds", e);
          }
        }
      }, [venues, map]);
      return null;
    };

    const MapSync = ({ selectedVenueId, venues }: { selectedVenueId?: string; venues: Venue[] }) => {
      const map = useMap();
      useEffect(() => {
        if (selectedVenueId && venues) {
          const venue = venues.find(v => v.venue_id === selectedVenueId);
          if (venue) {
            map.setView([venue.latitude, venue.longitude], 15, { animate: true });
          }
        }
      }, [selectedVenueId, venues, map]);
      return null;
    };

    // Return the actual map component
    return function InnerMap({ 
      venues, 
      selectedVenueId, 
      onVenueSelect,
      center, 
      zoom, 
      venueScores,
      venueCategories
    }: LeafletMapProps) {
      const defaultCenter = center || { lat: 11.0, lng: 78.0 };
      const defaultZoom = zoom || 7;

      return (
        <MapContainer
          center={[defaultCenter.lat, defaultCenter.lng]}
          zoom={defaultZoom}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <FitBounds venues={venues} />
          <MapSync selectedVenueId={selectedVenueId} venues={venues} />

          {venues?.map(venue => {
            const category = venueCategories?.[venue.venue_id] || venue.category || 'default';
            const score = venueScores?.[venue.venue_id];
            const isSelected = selectedVenueId === venue.venue_id;

            return (
              <Marker
                key={venue.venue_id}
                position={[venue.latitude, venue.longitude]}
                icon={createMarkerIcon(category.toLowerCase(), isSelected, score)}
                eventHandlers={{
                  click: () => onVenueSelect?.(venue)
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[180px]">
                    <h3 className="font-semibold text-sm">{venue.name}</h3>
                    <p className="text-xs text-gray-500">{formatCategory(venue.category)} • {venue.city}</p>
                    {score !== undefined && <p className="text-xs font-medium mt-1">Score: {score}/100</p>}
                    <a href={`/venues/${venue.venue_id}`} className="text-xs text-blue-600 hover:underline mt-1 block">View Details →</a>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      );
    };
  },
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }
);

function LeafletMapView(props: LeafletMapProps) {
  const {
    venues = [],
    selectedVenueId,
    onVenueSelect,
    height = '400px',
    className = '',
    showControls = true,
  } = props;

  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  return (
    <div className={`relative flex flex-col w-full border rounded-lg overflow-hidden ${className}`} style={{ height }}>
      {showControls && (
        <div className="absolute top-4 right-4 z-[10] flex bg-white rounded-md shadow-md overflow-hidden">
          <Button
            variant={viewMode === 'map' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-none px-3"
            onClick={() => setViewMode('map')}
          >
            <MapIcon className="w-4 h-4 mr-2" />
            Map
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-none px-3"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4 mr-2" />
            List
          </Button>
        </div>
      )}

      <div className={`flex-1 w-full h-full relative ${viewMode === 'list' ? 'hidden' : 'block'}`}>
        <ClientOnlyMap {...props} />
      </div>

      {viewMode === 'list' && (
        <div className="flex-1 w-full h-full overflow-y-auto bg-gray-50 p-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {venues.map(venue => (
              <div 
                key={venue.venue_id}
                className={`p-4 rounded-lg bg-white border cursor-pointer transition-colors ${selectedVenueId === venue.venue_id ? 'border-blue-500 ring-1 ring-blue-500' : 'hover:border-gray-300'}`}
                onClick={() => onVenueSelect?.(venue)}
              >
                <h3 className="font-semibold">{venue.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{venue.city}</p>
                <div className="flex items-center justify-between mt-4">
                  <Badge variant="outline">{formatCategory(venue.category)}</Badge>
                  <Link href={`/venues/${venue.venue_id}`} className="text-sm text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                    View
                  </Link>
                </div>
              </div>
            ))}
            {venues.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                No venues found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export { LeafletMapView };
export type { LeafletMapProps };
