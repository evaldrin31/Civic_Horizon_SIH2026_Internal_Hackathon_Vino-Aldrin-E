/**
 * Location-Based Accessibility Display
 * 
 * Groups accessibility attributes by venue location/entrance.
 * Shows venue-level attributes separately from location-specific ones.
 * 
 * Example structure:
 * Venue: Hospital
 *   ├── Main Entrance
 *   │     ├── Ramp: YES
 *   │     └── Step-free: YES
 *   ├── Emergency Entrance
 *   │     └── Step-free: UNKNOWN
 *   └── Accessible Toilet
 *         └── Accessible toilet: PARTIAL
 */

"use client";

import { AccessibilityAttribute, VenueLocation } from "@/lib/api/types";
import { AttributeValueBadge } from "./accessibility-attributes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatAttributeName, formatCategory } from "@/lib/utils";
import { 
  MapPin, 
  Building2, 
  DoorOpen,
  HelpCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info
} from "lucide-react";

interface LocationBasedAttributesProps {
  attributes: AccessibilityAttribute[];
  showEvidenceCount?: boolean;
}

interface LocationGroup {
  location: VenueLocation | null | undefined;
  attributes: AccessibilityAttribute[];
}

// Location type icons
const locationTypeIcons: Record<string, React.ReactNode> = {
  entrance: <DoorOpen className="h-4 w-4" />,
  floor: <Building2 className="h-4 w-4" />,
  area: <MapPin className="h-4 w-4" />,
  default: <MapPin className="h-4 w-4" />,
};

export function LocationBasedAttributes({ 
  attributes, 
  showEvidenceCount = true 
}: LocationBasedAttributesProps) {
  if (!attributes || attributes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No accessibility information available</p>
        <p className="text-sm mt-1">
          This venue has not yet been assessed for accessibility features.
        </p>
      </div>
    );
  }

  // Group attributes by location
  const grouped = attributes.reduce((acc, attr) => {
    const locationId = attr.location?.location_id || "venue-level";
    if (!acc[locationId]) {
      acc[locationId] = {
        location: attr.location,
        attributes: [],
      };
    }
    acc[locationId].attributes.push(attr);
    return acc;
  }, {} as Record<string, LocationGroup>);

  // Separate venue-level and location-specific
  const venueLevel = grouped["venue-level"];
  const locationSpecific = Object.entries(grouped)
    .filter(([key]) => key !== "venue-level")
    .map(([_, group]) => group);

  return (
    <div className="space-y-6">
      {/* Venue-Level Attributes */}
      {venueLevel && venueLevel.attributes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Venue-Wide Accessibility
              <Badge variant="outline" className="ml-2 text-xs">
                {venueLevel.attributes.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Accessibility features that apply to the entire venue
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {venueLevel.attributes.map((attr) => (
                <AttributeRow 
                  key={attr.attribute_id} 
                  attribute={attr}
                  showEvidenceCount={showEvidenceCount}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location-Specific Attributes */}
      {locationSpecific.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location-Specific Accessibility
            <Badge variant="outline" className="text-xs">
              {locationSpecific.length} locations
            </Badge>
          </h3>
          
          {locationSpecific.map((group) => (
            <LocationCard 
              key={group.location?.location_id || Math.random()}
              group={group}
              showEvidenceCount={showEvidenceCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LocationCard({ 
  group, 
  showEvidenceCount 
}: { 
  group: LocationGroup; 
  showEvidenceCount: boolean;
}) {
  const location = group.location;
  if (!location) return null;

  const hasExactCoordinates = location.latitude !== undefined && location.longitude !== undefined;
  const locationType = location.location_type || "area";
  const icon = locationTypeIcons[locationType] || locationTypeIcons.default;

  // Calculate stats
  const yesCount = group.attributes.filter(a => a.value === 'yes').length;
  const unknownCount = group.attributes.filter(a => a.value === 'unknown').length;

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              {icon}
              {location.name}
              <Badge variant="secondary" className="text-xs">
                {formatCategory(locationType)}
              </Badge>
            </CardTitle>
            {location.description && (
              <CardDescription>{location.description}</CardDescription>
            )}
          </div>
          <div className="flex gap-1">
            {yesCount > 0 && (
              <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {yesCount}
              </Badge>
            )}
            {unknownCount > 0 && (
              <Badge variant="outline" className="bg-gray-50 text-gray-600 text-xs">
                <HelpCircle className="h-3 w-3 mr-1" />
                {unknownCount}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Coordinate information */}
        {hasExactCoordinates ? (
          <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3" />
            Exact location available
          </p>
        ) : (
          <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
            <Info className="h-3 w-3" />
            Coordinates represent venue location
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {group.attributes.map((attr) => (
            <AttributeRow 
              key={attr.attribute_id} 
              attribute={attr}
              showEvidenceCount={showEvidenceCount}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AttributeRow({ 
  attribute, 
  showEvidenceCount 
}: { 
  attribute: AccessibilityAttribute; 
  showEvidenceCount: boolean;
}) {
  const valueIcons: Record<string, React.ReactNode> = {
    yes: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    no: <XCircle className="h-4 w-4 text-red-500" />,
    unknown: <HelpCircle className="h-4 w-4 text-gray-400" />,
    partial: <AlertCircle className="h-4 w-4 text-amber-500" />,
  };

  return (
    <div className="flex items-start justify-between py-2 border-b border-border last:border-0">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{formatAttributeName(attribute.attribute_name)}</span>
          <AttributeValueBadge value={attribute.value} />
        </div>
        
        {attribute.notes && (
          <p className="text-sm text-muted-foreground mt-1">{attribute.notes}</p>
        )}
        
        {attribute.last_observed_at && (
          <p className="text-xs text-muted-foreground mt-1">
            Last observed: {new Date(attribute.last_observed_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Summary of accessibility by value type
 */
interface VerificationSummaryProps {
  attributes: AccessibilityAttribute[];
}

export function VerificationSummary({ attributes }: VerificationSummaryProps) {
  if (!attributes || attributes.length === 0) return null;

  const yes = attributes.filter(a => a.value === 'yes').length;
  const no = attributes.filter(a => a.value === 'no').length;
  const partial = attributes.filter(a => a.value === 'partial').length;
  const unknown = attributes.filter(a => a.value === 'unknown').length;

  return (
    <div className="flex gap-2">
      {yes > 0 && (
        <Badge variant="outline" className="bg-green-50 text-green-700">
          {yes} Available
        </Badge>
      )}
      {partial > 0 && (
        <Badge variant="outline" className="bg-amber-50 text-amber-700">
          {partial} Partial
        </Badge>
      )}
      {unknown > 0 && (
        <Badge variant="outline" className="bg-gray-50 text-gray-600">
          {unknown} Unknown
        </Badge>
      )}
      {no > 0 && (
        <Badge variant="outline" className="bg-red-50 text-red-700">
          {no} Not Available
        </Badge>
      )}
    </div>
  );
}
