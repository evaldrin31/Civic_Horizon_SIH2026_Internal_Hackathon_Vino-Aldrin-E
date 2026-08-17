"use client";

import Link from "next/link";
import { Venue, AccessibilityAttribute, Evidence } from "@/lib/api/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AccessibilitySummaryCompact } from "./accessibility-attributes";
import { EvidenceSummary } from "./evidence";
import { formatCategory, formatDistance } from "@/lib/utils";
import { 
  MapPin, 
  Building2, 
  ChevronRight, 
  Accessibility,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react";

interface VenueCardProps {
  venue: Venue;
  attributes?: AccessibilityAttribute[];
  evidence?: Evidence[];
  distance?: number;
  showDistance?: boolean;
}

export function VenueCard({ 
  venue, 
  attributes = [], 
  evidence = [],
  distance,
  showDistance = false 
}: VenueCardProps) {
  // Determine overall freshness based on last_observed_at
  const lastObservedDates = attributes
    .map(a => a.last_observed_at)
    .filter((d): d is string => !!d);
  
  let freshnessIndicator = null;
  if (lastObservedDates.length > 0) {
    const mostRecent = new Date(Math.max(...lastObservedDates.map(d => new Date(d).getTime())));
    const daysSince = (new Date().getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSince < 30) {
      freshnessIndicator = (
        <span className="flex items-center gap-1 text-xs text-green-600">
          <CheckCircle2 className="h-3 w-3" />
          Recently verified
        </span>
      );
    } else if (daysSince < 180) {
      freshnessIndicator = (
        <span className="flex items-center gap-1 text-xs text-amber-600">
          <Clock className="h-3 w-3" />
          Verified {Math.floor(daysSince / 30)} months ago
        </span>
      );
    } else {
      freshnessIndicator = (
        <span className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="h-3 w-3" />
          May be outdated
        </span>
      );
    }
  }

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-lg truncate">
                <Link 
                  href={`/venues/${venue.venue_id}`}
                  className="hover:underline focus:underline focus:outline-none"
                >
                  {venue.name}
                </Link>
              </CardTitle>
              {showDistance && distance !== undefined && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  {formatDistance(distance)}
                </Badge>
              )}
            </div>
            <CardDescription className="flex items-center gap-1 mt-1">
              <Building2 className="h-3 w-3" />
              {formatCategory(venue.category)}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {/* Address */}
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="line-clamp-2">
            {venue.address}, {venue.city}, {venue.state}
          </span>
        </div>
        
        {/* Accessibility Summary */}
        <div className="pt-2 border-t border-border">
          <AccessibilitySummaryCompact attributes={attributes} />
        </div>
        
        {/* Evidence Summary */}
        {evidence.length > 0 && (
          <EvidenceSummary evidence={evidence} showCount={false} />
        )}
        
        {/* Freshness */}
        {freshnessIndicator && (
          <div className="pt-1">{freshnessIndicator}</div>
        )}
        
        {/* CTA */}
        <div className="pt-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full group-hover:bg-primary/5"
            asChild
          >
            <Link href={`/venues/${venue.venue_id}`}>
              <Accessibility className="h-4 w-4 mr-2" />
              View accessibility details
              <ChevronRight className="h-4 w-4 ml-auto" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for map popups or smaller displays
export function VenueCardCompact({ 
  venue, 
  attributes = [],
  distance 
}: VenueCardProps) {
  const yesCount = attributes.filter(a => a.value === 'yes').length;
  
  return (
    <div className="p-3 min-w-[200px]">
      <h3 className="font-medium text-sm mb-1">
        <Link 
          href={`/venues/${venue.venue_id}`}
          className="hover:underline focus:underline"
        >
          {venue.name}
        </Link>
      </h3>
      <p className="text-xs text-muted-foreground mb-2">
        {formatCategory(venue.category)}
        {distance !== undefined && ` • ${formatDistance(distance)}`}
      </p>
      {yesCount > 0 ? (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {yesCount} accessible features
        </Badge>
      ) : (
        <Badge variant="outline" className="text-xs">
          <AlertCircle className="h-3 w-3 mr-1" />
          No data available
        </Badge>
      )}
    </div>
  );
}

// Skeleton loading state
export function VenueCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-3">
        <div className="h-5 bg-muted rounded w-3/4 mb-2" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-2/3" />
        <div className="pt-2 border-t border-border">
          <div className="h-6 bg-muted rounded w-1/2" />
        </div>
      </CardContent>
    </Card>
  );
}
