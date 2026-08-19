"use client";
import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";

export function CurrentLocationIndicator({ isMobile = false }: { isMobile?: boolean }) {
  const [locationName, setLocationName] = useState("Locating...");

  useEffect(() => {
    // Basic mock location to give an immediate response
    const name = "Chennai, Tamil Nadu";
    setLocationName(name);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          // Attempt reverse geocoding via OpenStreetMap Nominatim API
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data && data.address) {
            const city = data.address.city || data.address.town || data.address.village || data.address.county || "Chennai";
            const state = data.address.state || "Tamil Nadu";
            setLocationName(`${city}, ${state}`);
          }
        } catch (e) {
          // Silently fail to mock data if no internet/API block
        }
      }, () => {
        // Location denied or unavailable
        setLocationName("Location Unavailable");
      });
    }
  }, []);

  if (isMobile) {
    return (
      <div className="flex items-center gap-1.5 px-4 py-1.5 bg-muted/50 border-b border-border/50 lg:hidden">
        <MapPin className="w-3 h-3 text-primary" />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider line-clamp-1">
          {locationName}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-muted/30">
      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <MapPin className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="flex flex-col overflow-hidden">
        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-tight mb-0.5">Current Location</span>
        <span className="text-xs font-semibold text-foreground truncate" title={locationName}>{locationName}</span>
      </div>
    </div>
  );
}
