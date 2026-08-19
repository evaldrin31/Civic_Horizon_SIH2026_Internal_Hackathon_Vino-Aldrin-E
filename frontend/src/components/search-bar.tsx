"use client";

import { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin, SlidersHorizontal, X, Mic } from "lucide-react";
import { getDemoCities, getDemoCategories } from "@/lib/demo-data";
import { useSpeech } from "@/lib/hooks/use-speech";
import { fuzzyMatch } from "@/lib/utils";

interface SearchFilters {
  q: string;
  category: string;
  city: string;
  state: string;
  has_accessible_entrance?: boolean;
  minScore?: number;
  wheelchairAccessible?: boolean;
}

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  initialFilters?: Partial<SearchFilters>;
  showLocationButton?: boolean;
  onLocationSearch?: () => void;
  isLocating?: boolean;
  variant?: "default" | "compact" | "hero";
}

const states = [
  { value: "", label: "All States" },
  { value: "Tamil Nadu", label: "Tamil Nadu" },
  { value: "Kerala", label: "Kerala" },
];

const accessibilityFilters = [
  { value: "", label: "Any Accessibility" },
  { value: "wheelchair", label: "Wheelchair Accessible" },
  { value: "high_score", label: "High Score (80+)" },
];

export function SearchBar({ 
  onSearch, 
  initialFilters = {},
  showLocationButton = true,
  onLocationSearch,
  isLocating = false,
  variant = "default"
}: SearchBarProps) {
  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeech();

  const [filters, setFilters] = useState<SearchFilters>({
    q: initialFilters.q || "",
    category: initialFilters.category || "",
    city: initialFilters.city || "",
    state: initialFilters.state || "",
    has_accessible_entrance: initialFilters.has_accessible_entrance,
    minScore: initialFilters.minScore,
    wheelchairAccessible: initialFilters.wheelchairAccessible,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    // Load dynamic lists from demo data
    setCities(getDemoCities());
    setCategories(getDemoCategories());
  }, []);

  const handleSearch = useCallback(() => {
    onSearch(filters);
  }, [filters, onSearch]);

  useEffect(() => {
    if (transcript) {
      setFilters(prev => ({ ...prev, q: transcript }));
      setTimeout(() => onSearch({ ...filters, q: transcript }), 100);
    }
  }, [transcript, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: string | boolean | number | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleAccessibilityFilter = (value: string) => {
    if (value === "wheelchair") {
      setFilters(prev => ({ ...prev, wheelchairAccessible: true, minScore: undefined }));
    } else if (value === "high_score") {
      setFilters(prev => ({ ...prev, minScore: 80, wheelchairAccessible: undefined }));
    } else {
      setFilters(prev => ({ ...prev, wheelchairAccessible: undefined, minScore: undefined }));
    }
  };

  const clearFilters = () => {
    setFilters({ 
      q: "", 
      category: "", 
      city: "", 
      state: "", 
      has_accessible_entrance: undefined,
      wheelchairAccessible: undefined,
      minScore: undefined
    });
  };

  const hasActiveFilters = filters.category || filters.city || filters.state || filters.has_accessible_entrance !== undefined || filters.wheelchairAccessible || filters.minScore;

  if (variant === "hero") {
    return (
      <div className="w-full relative z-20">
        <div className="flex flex-col sm:flex-row gap-3 p-3 bg-card/50 backdrop-blur-xl rounded-2xl border border-white/60 shadow-lg">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for venues by name, city, or address..."
              value={filters.q}
              onChange={(e) => updateFilter("q", e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-16 pl-12 pr-14 bg-card/70 border-border/80 focus-visible:ring-primary/50 text-foreground placeholder:text-muted-foreground rounded-xl shadow-inner transition-all hover:bg-card/90 text-lg font-medium"
              aria-label="Search venues"
            />
            {isListening ? (
              <button 
                onClick={stopListening}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-500 rounded-full animate-pulse"
                aria-label="Stop listening"
              >
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              </button>
            ) : isSupported ? (
              <button
                onClick={startListening}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                aria-label="Voice search"
              >
                <Mic className="w-6 h-6" />
              </button>
            ) : null}
          </div>
          <div className="flex gap-2">
            {showLocationButton && onLocationSearch && (
              <Button 
                variant="outline" 
                size="lg"
                onClick={onLocationSearch}
                disabled={isLocating}
                className="h-16 px-6 bg-card/60 border-border hover:bg-card text-foreground shadow-sm rounded-xl transition-all font-medium"
              >
                <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                {isLocating ? "Locating..." : "Near Me"}
              </Button>
            )}
            <Button 
              size="lg" 
              onClick={handleSearch}
              className="h-16 px-10 text-lg shadow-lg rounded-xl bg-blue-600 hover:bg-blue-500 text-white border-0 transition-all font-semibold"
            >
              Search
            </Button>
          </div>
        </div>
        
        {/* Quick Filters */}
        <div className="flex flex-wrap gap-3 mt-6 justify-center">
          {['hospital', 'shopping', 'transport', 'hotel'].map((cat) => (
            <Button
              key={cat}
              variant="outline"
              size="sm"
              className={`rounded-full border backdrop-blur-sm transition-all px-4 py-1 h-8 ${
                filters.category === cat 
                  ? "bg-blue-600 text-white border-blue-500 shadow-md" 
                  : "bg-card/70 border-border text-foreground hover:bg-card shadow-sm"
              }`}
              onClick={() => {
                updateFilter("category", filters.category === cat ? "" : cat);
                setTimeout(handleSearch, 0);
              }}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border border-white/10 bg-card/5 text-muted-foreground hover:bg-card/15 hover:text-foreground backdrop-blur-sm transition-all px-4 py-1 h-8"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Advanced Filters
          </Button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-6 p-5 bg-card  rounded-xl shadow-lg border border-border  animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Category</label>
                <Select 
                  value={filters.category} 
                  onValueChange={(value) => updateFilter("category", value === "all" ? "" : value)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">State</label>
                <Select 
                  value={filters.state} 
                  onValueChange={(value) => updateFilter("state", value === "all" ? "" : value)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {states.filter(s => s.value).map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">City</label>
                <Select 
                  value={filters.city} 
                  onValueChange={(value) => updateFilter("city", value === "all" ? "" : value)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Accessibility</label>
                <Select 
                  value={filters.wheelchairAccessible ? "wheelchair" : filters.minScore ? "high_score" : "all"} 
                  onValueChange={(value) => handleAccessibilityFilter(value)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Any Accessibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Accessibility</SelectItem>
                    {accessibilityFilters.filter(f => f.value).map((filter) => (
                      <SelectItem key={filter.value} value={filter.value}>
                        {filter.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {hasActiveFilters && (
              <div className="mt-5 pt-4 border-t border-border  flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Default variant (used in header or other pages)
  return (
    <div className="w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search venues..."
            value={filters.q}
            onChange={(e) => updateFilter("q", e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9 pr-10 bg-card"
            aria-label="Search venues"
          />
          {isListening ? (
            <button 
              onClick={stopListening}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center bg-red-500/10 text-red-500 rounded-full animate-pulse"
              aria-label="Stop listening"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            </button>
          ) : isSupported ? (
            <button
              onClick={startListening}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              aria-label="Voice search"
            >
              <Mic className="w-4 h-4" />
            </button>
          ) : null}
        </div>
        <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)} className="bg-card">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
        {showLocationButton && onLocationSearch && (
          <Button 
            variant="outline" 
            onClick={onLocationSearch}
            disabled={isLocating}
            className="bg-card"
          >
            <MapPin className="h-4 w-4 mr-2" />
            {isLocating ? "..." : "Nearby"}
          </Button>
        )}
        <Button onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      {/* Expanded Filters for Default Variant */}
      {showFilters && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-card  rounded-lg shadow-md border">
          <Select 
            value={filters.category} 
            onValueChange={(value) => updateFilter("category", value === "all" ? "" : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select 
            value={filters.state} 
            onValueChange={(value) => updateFilter("state", value === "all" ? "" : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {states.filter(s => s.value).map((state) => (
                <SelectItem key={state.value} value={state.value}>
                  {state.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select 
            value={filters.city} 
            onValueChange={(value) => updateFilter("city", value === "all" ? "" : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select 
            value={filters.wheelchairAccessible ? "wheelchair" : filters.minScore ? "high_score" : "all"} 
            onValueChange={(value) => handleAccessibilityFilter(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Any Accessibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Accessibility</SelectItem>
              {accessibilityFilters.filter(f => f.value).map((filter) => (
                <SelectItem key={filter.value} value={filter.value}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <div className="flex justify-end lg:col-span-4 pt-2">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Hook for debounced search
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
