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
import { Search, MapPin, SlidersHorizontal, X } from "lucide-react";

interface SearchFilters {
  q: string;
  category: string;
  city: string;
  state: string;
}

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  initialFilters?: Partial<SearchFilters>;
  showLocationButton?: boolean;
  onLocationSearch?: () => void;
  isLocating?: boolean;
  variant?: "default" | "compact" | "hero";
}

const categories = [
  { value: "", label: "All Categories" },
  { value: "hospital", label: "Hospital" },
  { value: "restaurant", label: "Restaurant" },
  { value: "shopping", label: "Shopping" },
  { value: "education", label: "Education" },
  { value: "transport", label: "Transport" },
  { value: "government", label: "Government" },
  { value: "entertainment", label: "Entertainment" },
  { value: "other", label: "Other" },
];

const states = [
  { value: "", label: "All States" },
  { value: "Maharashtra", label: "Maharashtra" },
  { value: "Karnataka", label: "Karnataka" },
  { value: "Delhi", label: "Delhi" },
  { value: "Tamil Nadu", label: "Tamil Nadu" },
  { value: "Telangana", label: "Telangana" },
  { value: "Gujarat", label: "Gujarat" },
  { value: "West Bengal", label: "West Bengal" },
];

export function SearchBar({ 
  onSearch, 
  initialFilters = {},
  showLocationButton = true,
  onLocationSearch,
  isLocating = false,
  variant = "default"
}: SearchBarProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    q: initialFilters.q || "",
    category: initialFilters.category || "",
    city: initialFilters.city || "",
    state: initialFilters.state || "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = useCallback(() => {
    onSearch(filters);
  }, [filters, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ q: "", category: "", city: "", state: "" });
  };

  const hasActiveFilters = filters.category || filters.city || filters.state;

  if (variant === "hero") {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for venues by name..."
              value={filters.q}
              onChange={(e) => updateFilter("q", e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 h-12 text-lg"
              aria-label="Search venues"
            />
          </div>
          <div className="flex gap-2">
            {showLocationButton && onLocationSearch && (
              <Button 
                variant="outline" 
                size="lg"
                onClick={onLocationSearch}
                disabled={isLocating}
                className="h-12 px-4"
              >
                <MapPin className="h-5 w-5 mr-2" />
                {isLocating ? "Locating..." : "Near Me"}
              </Button>
            )}
            <Button 
              size="lg" 
              onClick={handleSearch}
              className="h-12 px-6"
            >
              <Search className="h-5 w-5 mr-2" />
              Search
            </Button>
          </div>
        </div>
        
        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {categories.slice(1, 5).map((cat) => (
            <Button
              key={cat.value}
              variant={filters.category === cat.value ? "default" : "outline"}
              size="sm"
              onClick={() => {
                updateFilter("category", filters.category === cat.value ? "" : cat.value);
                // Trigger search after a brief delay
                setTimeout(handleSearch, 0);
              }}
            >
              {cat.label}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-1" />
            More Filters
          </Button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <Select 
                  value={filters.category} 
                  onValueChange={(value) => updateFilter("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">State</label>
                <Select 
                  value={filters.state} 
                  onValueChange={(value) => updateFilter("state", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">City</label>
                <Input
                  type="text"
                  placeholder="Enter city name"
                  value={filters.city}
                  onChange={(e) => updateFilter("city", e.target.value)}
                />
              </div>
            </div>
            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
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

  // Default variant
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
            className="pl-9"
            aria-label="Search venues"
          />
        </div>
        <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
        {showLocationButton && onLocationSearch && (
          <Button 
            variant="outline" 
            onClick={onLocationSearch}
            disabled={isLocating}
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

      {/* Expanded Filters */}
      {showFilters && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select 
            value={filters.category} 
            onValueChange={(value) => updateFilter("category", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select 
            value={filters.state} 
            onValueChange={(value) => updateFilter("state", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent>
              {states.map((state) => (
                <SelectItem key={state.value} value={state.value}>
                  {state.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="City"
              value={filters.city}
              onChange={(e) => updateFilter("city", e.target.value)}
            />
            {hasActiveFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
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
