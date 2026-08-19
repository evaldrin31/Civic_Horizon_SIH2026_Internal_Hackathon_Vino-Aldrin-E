/* eslint-disable @typescript-eslint/no-explicit-any */
import { Venue, AccessibilityAttribute, Evidence } from './api/types';
import data from './data/all-venues.json';
import { fuzzyMatch } from './utils';

export interface DemoVenue extends Venue {
  accessibilityScore: number;
  verificationStatus: "verified" | "unverified" | "pending" | "demo";
  evidenceCount: number;
  wheelchairAccessible: boolean;
  stepFreeEntrance: boolean;
  elevatorAvailable: boolean;
  rampAvailable: boolean;
  accessibleParking: boolean;
  accessibleRestroom: boolean;
  tactilePath: boolean;
  brailleSignage: boolean;
  audioAssistance: boolean;
  signLanguageSupport: boolean;
  clearSignage: boolean;
  quietZone: boolean;
  lowSensoryArea: boolean;
  emergencyAssistance: boolean;
  staffAssistance: boolean;
  wheelchairSeating: boolean;
  confidence?: number;
  description?: string;
}

const DEMO_VENUES_DATA: DemoVenue[] = data.venues as unknown as DemoVenue[];
const SUB_DISTRICT_MAP: Record<string, string> = data.subDistrictMap;

export function getDemoVenues(): DemoVenue[] {
  return DEMO_VENUES_DATA;
}

export function searchDemoVenues(
  queryOrFilters: string | { q?: string; category?: string; city?: string; state?: string; status?: string },
  options: { category?: string; status?: string } = {}
): DemoVenue[] {
  let query = "";
  if (typeof queryOrFilters === "string") {
    query = queryOrFilters;
  } else {
    query = queryOrFilters.q || "";
    if (queryOrFilters.category && queryOrFilters.category.toLowerCase() !== "all") {
      options.category = queryOrFilters.category;
    }
    if (queryOrFilters.status) {
      options.status = queryOrFilters.status;
    }
  }

  const searchTerms = query.toLowerCase().split(' ').filter(t => t.length > 0);
  
  // Intercept sub-districts and map to parent district
  let mappedQuery = query.toLowerCase();
  for (const term of searchTerms) {
    // Fuzzy match against sub-district keys
    for (const [subDistrict, parentDistrict] of Object.entries(SUB_DISTRICT_MAP)) {
      if (fuzzyMatch(term, subDistrict)) {
        mappedQuery += ` ${parentDistrict.toLowerCase()}`;
      }
    }
  }

  let results = DEMO_VENUES_DATA;

  if (mappedQuery.trim().length > 0) {
    const queryTokens = mappedQuery.toLowerCase().split(' ').filter(t => t.length > 2);
    results = results.filter(v => {
      const searchTarget = (v.name + ' ' + v.city + ' ' + v.category + ' ' + (v.address || '')).toLowerCase();
      
      // Simple includes for full query
      if (searchTarget.includes(query.toLowerCase().trim())) return true;
      
      // Token based fuzzy matching
      for (const token of queryTokens) {
        if (searchTarget.includes(token)) return true;
        
        // Also split search target into words and fuzzy match tokens
        const targetWords = searchTarget.split(' ');
        for (const word of targetWords) {
          if (word.length > 3 && fuzzyMatch(token, word)) return true;
        }
      }
      return false;
    });
  }

  if (options.category && options.category !== 'all') {
    results = results.filter(v => v.category.toLowerCase() === options.category!.toLowerCase());
  }

  if (options.status) {
    if (options.status === 'verified') {
      results = results.filter(v => v.verificationStatus === 'verified');
    } else if (options.status === 'high') {
      results = results.filter(v => v.accessibilityScore >= 80);
    } else if (options.status === 'moderate') {
      results = results.filter(v => v.accessibilityScore >= 50 && v.accessibilityScore < 80);
    }
  }

  return results;
}

export function getNearbyDemoVenues(lat: number, lng: number, radiusKm: number = 5): DemoVenue[] {
  return DEMO_VENUES_DATA;
}

export function getDemoAttributes(venueId: string): AccessibilityAttribute[] {
  return [
    { 
      attribute_id: "attr1",
      venue_id: venueId,
      location_id: null,
      category: "mobility", 
      attribute_name: "wheelchair_ramp", 
      value: "yes",
      value_type: "boolean",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      attribute_id: "attr2",
      venue_id: venueId,
      location_id: null,
      category: "mobility", 
      attribute_name: "tactile_paths", 
      value: "yes",
      value_type: "boolean",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
}

export function getDemoEvidence(venueId: string): Evidence[] {
  const venue = DEMO_VENUES_DATA.find(v => v.venue_id === venueId);
  return [
    {
      evidence_id: "ev1",
      venue_id: venueId,
      url: (venue as any)?.imageUrl || "https://upload.wikimedia.org/wikipedia/commons/4/47/Meenakshi_Amman_West_Tower.jpg",
      type: "image",
      category: "mobility",
      description: "Front entrance",
      verified: true,
      timestamp: new Date().toISOString(),
      uploader_id: "u1"
    }
  ];
}


export function getDemoCities(): string[] {
  return Array.from(new Set(DEMO_VENUES_DATA.map(v => v.city))).sort();
}

export function getDemoCategories(): string[] {
  return Array.from(new Set(DEMO_VENUES_DATA.map(v => v.category))).sort();
}

export function getDemoStats() {
  const totalVenues = DEMO_VENUES_DATA.length;
  const verifiedVenues = DEMO_VENUES_DATA.filter(v => v.verificationStatus === 'verified').length;
  const avgScore = Math.round(DEMO_VENUES_DATA.reduce((sum, v) => sum + v.accessibilityScore, 0) / totalVenues);
  const totalEvidence = DEMO_VENUES_DATA.reduce((sum, v) => sum + v.evidenceCount, 0);
  
  return {
    totalVenues,
    verifiedVenues,
    avgScore,
    totalEvidence
  };
}

// Force hot reload for real images

// Force hot reload for SRM Kattankulathur fix