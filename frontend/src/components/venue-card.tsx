/* eslint-disable */
"use client";

import Link from "next/link";
import { useTTS } from "@/lib/hooks/use-tts";
import { Venue, AccessibilityAttribute, Evidence } from "@/lib/api/types";
import { DemoVenue } from "@/lib/demo-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AccessibilitySummaryCompact } from "./accessibility-attributes";
import { EvidenceSummary } from "./evidence";
import { formatCategory } from "@/lib/utils";
import { formatDistance, calculateEta } from "@/lib/location";
import { calculateProfileMatch, AccessibilityProfile } from "@/lib/scoring";
import { useProfile } from "@/lib/hooks/use-profile";
import { 
  MapPin, 
  Building2, 
  ChevronRight, 
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Navigation,
  Car,
  Footprints
} from "lucide-react";
import { VenueImage } from "@/components/ui/venue-image";

interface VenueCardProps {
  venue: Venue | DemoVenue;
  attributes?: AccessibilityAttribute[];
  evidence?: Evidence[];
  distance?: number;
  showDistance?: boolean;
}

function createAttributesFromSummary(venue: Venue): AccessibilityAttribute[] {
  if (!venue.accessibility_summary) return [];
  const summary = venue.accessibility_summary;
  const attributes: AccessibilityAttribute[] = [];
  if (summary.yes_count > 0) {
    attributes.push({
      attribute_id: `summary-yes-${venue.venue_id}`,
      venue_id: venue.venue_id,
      location_id: null,
      category: 'mobility',
      attribute_name: 'accessible_features',
      value: 'yes',
      value_type: 'summary',
      notes: `${summary.yes_count} accessible features`,
      last_observed_at: undefined,
      location: null,
      created_at: venue.created_at || new Date().toISOString(),
      updated_at: venue.updated_at || new Date().toISOString(),
    });
  }
  return attributes;
}

function ScoreRing({ score, size = 48 }: { score: number, size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  let colorClass = "text-error";
  if (score >= 80) colorClass = "text-tertiary";
  else if (score >= 50) colorClass = "text-sensory-accent";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full" viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="text-ring-track"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${colorClass} transition-all duration-1000 ease-in-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <span className="absolute text-sm font-bold text-foreground">{score}</span>
    </div>
  );
}

export function VenueCard({ 
  venue, 
  attributes: propAttributes = [], 
  evidence: propEvidence = [],
  distance,
  showDistance = false 
}: VenueCardProps) {
  const { profile } = useProfile();
  
  const attributes = venue.accessibility_summary 
    ? createAttributesFromSummary(venue as Venue)
    : propAttributes;
  
  const isDemo = 'accessibilityScore' in venue;
  const demoVenue = isDemo ? venue as DemoVenue : null;
  const score = demoVenue?.accessibilityScore;
  
  let matchPercentage: number | undefined;
  let matchReasons: string[] = [];
  if (demoVenue && profile) {
    const match = calculateProfileMatch(demoVenue, profile);
    matchPercentage = match.matchPercentage;
    matchReasons = match.reasons || [];
  }
  
  const lastObservedDates = attributes
    .map(a => a.last_observed_at)
    .filter((d): d is string => !!d);
  
  let freshnessIndicator = null;
  if (lastObservedDates.length > 0) {
    const mostRecent = new Date(Math.max(...lastObservedDates.map(d => new Date(d).getTime())));
    const daysSince = (new Date().getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSince < 30) {
      freshnessIndicator = (
        <span className="flex items-center gap-1 text-xs text-tertiary">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Recently verified
        </span>
      );
    } else if (daysSince < 180) {
      freshnessIndicator = (
        <span className="flex items-center gap-1 text-xs text-secondary">
          <Clock className="h-3.5 w-3.5" />
          Verified {Math.floor(daysSince / 30)} months ago
        </span>
      );
    } else {
      freshnessIndicator = (
        <span className="flex items-center gap-1 text-xs text-error">
          <AlertCircle className="h-3.5 w-3.5" />
          May be outdated
        </span>
      );
    }
  }

  let etaWalking = null;
  if (distance !== undefined) {
    etaWalking = calculateEta(distance, 'walking');
  }

  let borderClass = "border-l-error";
  if (score) {
    if (score >= 80) borderClass = "border-l-tertiary";
    else if (score >= 50) borderClass = "border-l-sensory-accent";
  }

  return (
    <div 
      role="button" 
      tabIndex={0} 
      aria-label={`${venue.name}, ${venue.category} in ${venue.city}.`}
      className={`group flex flex-col hover:-translate-y-[2px] hover:shadow-xl transition-all duration-300 bg-card border border-border/50 rounded-2xl overflow-hidden border-l-[6px] ${borderClass}`}
    >
      <div className="h-40 w-full relative overflow-hidden bg-muted">
         <VenueImage src={(venue as unknown as Record<string, string>).imageUrl} venueId={venue.venue_id} venueName={venue.name} category={venue.category} type="venue" className="w-full h-full object-cover" />
         <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
         
         {/* Category Badge overlapping image bottom-right */}
         <div className="absolute bottom-3 right-3">
           <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border-border/50 text-white bg-black/50 backdrop-blur-md">
             {formatCategory(venue.category)}
           </Badge>
         </div>

         {/* Score Ring overlapping image bottom-left */}
         <div className="absolute -bottom-6 left-4 bg-card rounded-full p-1 shadow-md z-10">
            {profile && matchPercentage !== undefined ? (
              <ScoreRing score={matchPercentage} size={52} />
            ) : score !== undefined ? (
              <ScoreRing score={score} size={52} />
            ) : (
              <div className="w-[52px] h-[52px] rounded-full bg-muted flex items-center justify-center">
                <span className="text-xs font-bold text-muted-foreground">N/A</span>
              </div>
            )}
         </div>
      </div>
      
      <div className="p-5 pt-8 flex flex-col h-full relative z-0">
        <div className="flex flex-col gap-1 mb-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-xl font-display font-bold text-foreground truncate">
              <Link 
                href={`/venues/${venue.venue_id}`}
                className="hover:text-primary transition-colors focus:outline-none focus:underline before:absolute before:inset-0"
              >
                {venue.name}
              </Link>
            </h3>
            {showDistance && distance !== undefined && (
              <div className="flex items-center gap-1 text-xs text-primary font-medium shrink-0">
                <Footprints className="h-3.5 w-3.5" />
                {etaWalking?.timeString} ({formatDistance(distance)})
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground line-clamp-1">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{venue.address}, {venue.city}</span>
          </div>
        </div>
        
        <div className="flex-1 space-y-4">
          {/* Profile Match Reasons */}
          {profile && matchReasons && matchReasons.length > 0 && (
             <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
               <p className="text-xs font-semibold text-primary mb-1">{profile} Profile Match</p>
               <ul className="space-y-1">
                 {matchReasons.slice(0, 2).map((reason, i) => (
                   <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                     <span className="text-primary mt-0.5">•</span> 
                     <span className="line-clamp-1">{reason}</span>
                   </li>
                 ))}
               </ul>
             </div>
          )}

          {/* Quick Profile Icons for Demo */}
          {demoVenue && (
            <div className="flex flex-wrap gap-2">
              {demoVenue.wheelchairAccessible && <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-[11px] font-semibold dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50"><span className="mr-1">♿</span>Mobility</span>}
              {demoVenue.brailleSignage && <span className="inline-flex items-center px-2 py-1 rounded-md bg-violet-100 text-violet-800 text-[11px] font-semibold dark:bg-violet-900/30 dark:text-violet-300 border border-violet-200 dark:border-violet-800/50"><span className="mr-1">👁️</span>Vision</span>}
              {demoVenue.signLanguageSupport && <span className="inline-flex items-center px-2 py-1 rounded-md bg-teal-100 text-teal-800 text-[11px] font-semibold dark:bg-teal-900/30 dark:text-teal-300 border border-teal-200 dark:border-teal-800/50"><span className="mr-1">🦻</span>Hearing</span>}
              {demoVenue.quietZone && <span className="inline-flex items-center px-2 py-1 rounded-md bg-orange-100 text-orange-800 text-[11px] font-semibold dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50"><span className="mr-1">🧠</span>Sensory</span>}
            </div>
          )}
          
          {attributes.length > 0 && !demoVenue && (
            <AccessibilitySummaryCompact attributes={attributes} />
          )}
        </div>
        
        {/* Footer info */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/30">
          {demoVenue?.verificationStatus === 'verified' || demoVenue?.verificationStatus === 'demo' ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-tertiary bg-tertiary-container/20 px-2.5 py-1 rounded-lg">
              <ShieldCheck className="h-4 w-4" />
              Verified Partner
            </span>
          ) : freshnessIndicator ? (
            <div className="font-medium">{freshnessIndicator}</div>
          ) : (
            <span className="text-xs font-medium text-muted-foreground">Unverified data</span>
          )}
          
          <div className="text-primary group-hover:translate-x-1 transition-transform">
             <ChevronRight className="h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact version for map popups
export function VenueCardCompact({ 
  venue, 
  distance 
}: VenueCardProps) {
  const { profile } = useProfile();
  const isDemo = 'accessibilityScore' in venue;
  const demoVenue = isDemo ? venue as DemoVenue : null;
  const score = demoVenue?.accessibilityScore;
  
  let matchPercentage = undefined;
  if (demoVenue && profile) {
    matchPercentage = calculateProfileMatch(demoVenue, profile).matchPercentage;
  }
  
  return (
    <div className="p-3 min-w-[240px] font-sans">
      <div className="flex justify-between items-start mb-2 gap-3">
        <h3 className="font-display font-bold text-base leading-tight text-foreground">
          <Link 
            href={`/venues/${venue.venue_id}`}
            className="hover:text-primary transition-colors focus:underline"
          >
            {venue.name}
          </Link>
        </h3>
        {score !== undefined && (
          <div className="shrink-0">
             <ScoreRing score={profile && matchPercentage !== undefined ? matchPercentage : score} size={36} />
          </div>
        )}
      </div>
      
      <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center justify-between">
        <span className="uppercase tracking-wider">{formatCategory(venue.category)}</span>
        {distance !== undefined && <span className="text-primary">{formatDistance(distance)}</span>}
      </p>

      {score === undefined && (
        <Badge variant="outline" className="text-xs w-full justify-center mt-2 border-border text-muted-foreground">
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
    <div className="animate-pulse bg-muted border border-border/30 rounded-2xl overflow-hidden flex flex-col h-full min-h-[200px]">
      <div className="h-40 w-full bg-outline-variant/20" />
      <div className="p-5 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4 gap-4">
          <div className="flex-1 space-y-3">
            <div className="h-5 bg-outline-variant/20 rounded-md w-1/4" />
            <div className="h-7 bg-outline-variant/20 rounded-md w-3/4" />
            <div className="h-4 bg-outline-variant/20 rounded-md w-full" />
          </div>
          <div className="h-[52px] w-[52px] bg-outline-variant/20 rounded-full shrink-0 -mt-10" />
        </div>
        <div className="flex-1">
          <div className="flex gap-2 mb-4">
             <div className="h-6 w-16 bg-outline-variant/20 rounded-md" />
             <div className="h-6 w-16 bg-outline-variant/20 rounded-md" />
          </div>
        </div>
        <div className="pt-4 border-t border-border/30 flex justify-between">
          <div className="h-5 bg-outline-variant/20 rounded-md w-1/3" />
          <div className="h-5 bg-outline-variant/20 rounded-md w-6" />
        </div>
      </div>
    </div>
  );
}




