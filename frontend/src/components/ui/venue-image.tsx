import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Building2, 
  ShoppingBag, 
  GraduationCap, 
  Train,
  Plane, 
  Coffee, 
  HeartPulse, 
  Landmark,
  Camera,
  MapPin,
  Hotel
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VenueImageProps {
  venueId?: string;
  venueName?: string;
  category?: string;
  className?: string;
  aspectRatio?: 'video' | 'square' | 'wide' | 'auto';
  showOverlay?: boolean;
  priority?: boolean;
  type?: "venue" | "evidence";
  text?: string;
  src?: string;
}

const VENUE_IMAGES: Record<string, string> = {};

function getKnownImage(name: string, id: string): string | null {
  const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  if (VENUE_IMAGES[id]) return VENUE_IMAGES[id];
  
  for (const key of Object.keys(VENUE_IMAGES)) {
    if (normalizedName.includes(key)) {
      return VENUE_IMAGES[key];
    }
  }
  
  return null;
}

export function VenueImage({
  venueId = '',
  venueName = '',
  category = '',
  className,
  aspectRatio = 'auto',
  showOverlay = false,
  priority = false,
  type = 'venue',
  text,
  src,
}: VenueImageProps) {
  const [imgError, setImgError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const knownImage = src || getKnownImage(venueName, venueId);
  const hasImage = knownImage && !imgError;
  const displayName = text || venueName || 'Unknown Location';

  // Determine icon and colors based on category/type
  let Icon = Building2;
  let gradientClass = "from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900";
  let iconColorClass = "text-slate-400 dark:text-slate-600";

  if (type === "evidence") {
    Icon = Camera;
    gradientClass = "from-slate-100 to-gray-200 dark:from-slate-800 dark:to-gray-900";
  } else {
    const cat = category.toLowerCase();
    if (cat.includes("hospital") || cat.includes("health")) {
      Icon = HeartPulse;
      gradientClass = "from-blue-500/20 to-teal-500/20 dark:from-blue-900/40 dark:to-teal-900/40";
      iconColorClass = "text-teal-600/50 dark:text-teal-400/30";
    } else if (cat.includes("shopping") || cat.includes("mall")) {
      Icon = ShoppingBag;
      gradientClass = "from-pink-500/20 to-purple-500/20 dark:from-pink-900/40 dark:to-purple-900/40";
      iconColorClass = "text-purple-600/50 dark:text-purple-400/30";
    } else if (cat.includes("education") || cat.includes("university") || cat.includes("college")) {
      Icon = GraduationCap;
      gradientClass = "from-blue-500/20 to-indigo-500/20 dark:from-blue-900/40 dark:to-indigo-900/40";
      iconColorClass = "text-indigo-600/50 dark:text-indigo-400/30";
    } else if (cat.includes("transport") || cat.includes("airport") || cat.includes("station") || cat.includes("metro")) {
      Icon = cat.includes("airport") ? Plane : Train;
      gradientClass = "from-amber-500/20 to-orange-500/20 dark:from-amber-900/40 dark:to-orange-900/40";
      iconColorClass = "text-orange-600/50 dark:text-orange-400/30";
    } else if (cat.includes("restaurant") || cat.includes("food") || cat.includes("cafe")) {
      Icon = Coffee;
      gradientClass = "from-rose-500/20 to-orange-500/20 dark:from-rose-900/40 dark:to-orange-900/40";
      iconColorClass = "text-rose-600/50 dark:text-rose-400/30";
    } else if (cat.includes("hotel") || cat.includes("stay")) {
      Icon = Hotel;
      gradientClass = "from-emerald-500/20 to-teal-500/20 dark:from-emerald-900/40 dark:to-teal-900/40";
      iconColorClass = "text-emerald-600/50 dark:text-emerald-400/30";
    } else if (cat.includes("government") || cat.includes("public")) {
      Icon = Landmark;
      gradientClass = "from-slate-400/20 to-blue-500/20 dark:from-slate-700/40 dark:to-blue-900/40";
      iconColorClass = "text-blue-600/50 dark:text-blue-400/30";
    } else if (cat.includes("tourism") || cat.includes("attraction")) {
      Icon = MapPin;
      gradientClass = "from-cyan-500/20 to-blue-500/20 dark:from-cyan-900/40 dark:to-blue-900/40";
      iconColorClass = "text-cyan-600/50 dark:text-cyan-400/30";
    } else {
      Icon = Building2;
      gradientClass = "from-slate-200 to-gray-200 dark:from-slate-800 dark:to-gray-800";
    }
  }

  const aspectClasses = {
    'video': 'aspect-video',
    'square': 'aspect-square',
    'wide': 'aspect-[2/1]',
    'auto': 'h-full w-full'
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden group bg-gradient-to-br flex flex-col items-center justify-center",
        aspectClasses[aspectRatio],
        !hasImage && gradientClass,
        className
      )}
    >
      {hasImage ? (
        <>
          {/* Loading Skeleton with Icon */}
          <div className={cn(
            "absolute inset-0 bg-muted flex flex-col items-center justify-center transition-opacity duration-500 z-0",
            isLoaded ? "opacity-0" : "opacity-100",
            !isLoaded && "animate-pulse"
          )}>
            <Icon className={cn("w-12 h-12 mb-2 opacity-50", iconColorClass)} />
            <span className="text-xs font-semibold opacity-50 px-2 text-center line-clamp-1">{displayName}</span>
          </div>
          
          <Image
            src={knownImage}
            alt={displayName}
            fill
            className={cn(
              "object-cover transition-transform duration-700 group-hover:scale-105 z-10",
              isLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setIsLoaded(true)}
            onError={() => setImgError(true)}
            priority={priority}
            unoptimized
          />
          {showOverlay && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-20" />
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full p-4 relative z-10">
          <Icon className={cn("w-16 h-16 mb-3 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3", iconColorClass)} />
          <span className="text-sm font-semibold tracking-wide text-center text-foreground/70 dark:text-foreground/60 line-clamp-2 px-2">
            {displayName}
          </span>
          {type === "venue" && category && (
            <span className="text-[10px] uppercase font-bold tracking-widest text-foreground/40 mt-2">
              {category}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
