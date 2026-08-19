'use client';

import { useState, useMemo } from 'react';
import { Map, MapClusterLayer, MapPopup } from '@/components/ui/map';
import { Venue } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCategory } from '@/lib/utils';
import Link from 'next/link';
import { Map as MapIcon, List } from 'lucide-react';
import type { FeatureCollection, Point } from 'geojson';

interface MapcnViewProps {
  venues: Venue[];
  selectedVenueId?: string;
  onVenueSelect?: (venue: Venue) => void;
  height?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  showControls?: boolean;
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

export function MapcnView(props: MapcnViewProps) {
  const {
    venues = [],
    selectedVenueId,
    onVenueSelect,
    height = '400px',
    center,
    zoom,
    className = '',
    showControls = true,
    venueScores = {},
    venueCategories = {},
  } = props;

  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [popupInfo, setPopupInfo] = useState<Venue | null>(null);

  const defaultCenter = center ? [center.lng, center.lat] as [number, number] : [78.0, 11.0] as [number, number];
  const defaultZoom = zoom || 7;

  const geojsonData = useMemo<FeatureCollection<Point, Record<string, unknown>>>(() => {
    return {
      type: 'FeatureCollection',
      features: venues.map((venue) => {
        const cat = venueCategories[venue.venue_id] || venue.category || 'default';
        const color = CATEGORY_COLORS[cat.toLowerCase()] || CATEGORY_COLORS.default;
        
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [venue.longitude, venue.latitude],
          },
          properties: {
            ...venue,
            color,
            score: venueScores[venue.venue_id] !== undefined ? venueScores[venue.venue_id] : 0,
            hasScore: venueScores[venue.venue_id] !== undefined,
          },
        };
      }),
    };
  }, [venues, venueCategories, venueScores]);

  const pointColor = ['get', 'color'] as unknown as string;

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
        <Map
          viewport={{ center: defaultCenter, zoom: defaultZoom }}
          className="w-full h-full"
        >
          <MapClusterLayer
            data={geojsonData}
            pointColor={pointColor}
            onPointClick={(feature) => {
              const venue = feature.properties as unknown as Venue & { score: number, hasScore: boolean };
              setPopupInfo(venue);
              if (onVenueSelect) {
                onVenueSelect(venue);
              }
            }}
          />

          {popupInfo && (
            <MapPopup
              longitude={popupInfo.longitude}
              latitude={popupInfo.latitude}
              onClose={() => setPopupInfo(null)}
              closeButton
              className="p-2 min-w-[200px]"
            >
              <div>
                <h3 className="font-semibold text-sm">{popupInfo.name}</h3>
                <p className="text-xs text-gray-500 mb-1">
                  {formatCategory(popupInfo.category)} • {popupInfo.city}
                </p>
                {(popupInfo as Venue & { score?: number; hasScore?: boolean }).hasScore && (
                  <div className="flex flex-col gap-1 mt-1 mb-2">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium">Access Score:</span>
                      <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-green-500/10 text-green-500 border-green-500/20">
                        {(popupInfo as Venue & { score?: number }).score}/100
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium">Profile Match:</span>
                      <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-blue-50 text-blue-700 border-blue-200">
                        {Math.min(100, ((popupInfo as Venue & { score?: number }).score || 0) + 15)}%
                      </Badge>
                    </div>
                  </div>
                )}
                <div className="text-xs text-gray-500 mb-2 mt-1">
                  <p>Demo ETA: ~15 mins (2.5 km)</p>
                </div>
                <Link
                  href={`/venues/${popupInfo.venue_id}`}
                  className="text-xs text-blue-600 hover:underline block font-medium"
                >
                  View Details →
                </Link>
              </div>
            </MapPopup>
          )}
        </Map>
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
