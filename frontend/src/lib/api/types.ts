/**
 * API Types - Matching docs/API_CONTRACT.md
 * 
 * This file contains TypeScript types that mirror the backend API contract.
 * Keep in sync with API_CONTRACT.md
 */

// ==================== Common ====================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface ApiError {
  error: string;
  message: string;
}

// ==================== Venue ====================

export interface Venue {
  venue_id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code?: string;
  latitude: number;
  longitude: number;
  official_url?: string;
  contact_phone?: string;
  contact_email?: string;
  created_at: string;
  updated_at: string;
  // Optional accessibility summary from search results
  accessibility_summary?: {
    total_attributes: number;
    yes_count: number;
    no_count: number;
    unknown_count: number;
    partial_count: number;
    has_verified: boolean;
  };
}

export interface VenueLocation {
  location_id: string;
  venue_id: string;
  name: string;
  location_type: string;
  description?: string;
  latitude?: number;
  longitude?: number;
}

// ==================== Accessibility ====================

export type AttributeValue = 'yes' | 'no' | 'unknown' | 'partial';
export type AttributeCategory = 'mobility' | 'visual' | 'hearing' | 'general';

export interface AccessibilityAttribute {
  attribute_id: string;
  venue_id: string;
  location_id: string | null;
  category: AttributeCategory;
  attribute_name: string;
  value: AttributeValue;
  value_type: string;
  value_text?: string;
  notes?: string;
  last_observed_at?: string;
  location?: VenueLocation | null;
  created_at: string;
  updated_at: string;
}

export interface AccessibilitySummary {
  total_attributes: number;
  by_category: Record<string, {
    total: number;
    yes: number;
    no: number;
    unknown: number;
    partial: number;
  }>;
  by_value: {
    yes: number;
    no: number;
    unknown: number;
    partial: number;
  };
  with_evidence: number;
  without_evidence: number;
}

// ==================== Evidence ====================

export type VerificationStatus = 
  | 'unverified' 
  | 'reported' 
  | 'corroborated' 
  | 'verified' 
  | 'conflicting' 
  | 'outdated';

export type SourceType = 
  | 'government'
  | 'professional_audit'
  | 'official_venue'
  | 'direct_observation'
  | 'institutional_dataset'
  | 'community_observation'
  | 'public_review'
  | 'ai_inference';

export interface Source {
  source_id: string;
  source_type: SourceType;
  source_name?: string;
  source_url?: string;
  created_at: string;
}

export interface Evidence {
  evidence_id: string;
  attribute_id: string;
  source_id?: string;
  evidence_text?: string;
  evidence_media_url?: string;
  observed_at?: string;
  collected_at: string;
  collector?: string;
  verification_status: VerificationStatus;
  confidence: number;
  notes?: string;
  source?: Source | null;
  attribute?: AccessibilityAttribute;
  created_at: string;
  updated_at: string;
}

export interface VerificationHistory {
  history_id: string;
  evidence_id: string;
  previous_status: VerificationStatus;
  new_status: VerificationStatus;
  change_reason?: string;
  changed_by: string;
  changed_at: string;
}

export interface EvidenceConflict {
  evidence_id: string;
  reason: string;
  positive_evidence?: string;
  negative_evidence?: string;
}

// ==================== Search ====================

export interface VenueSearchParams {
  q?: string;
  category?: string;
  city?: string;
  state?: string;
  has_accessible_entrance?: boolean;
  page?: number;
  page_size?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface NearbySearchParams {
  lat: number;
  lon: number;
  radius?: number;
  category?: string;
  has_accessible_entrance?: boolean;
  page?: number;
  page_size?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface UnifiedSearchParams extends VenueSearchParams {
  lat?: number;
  lon?: number;
  radius?: number;
}

// ==================== Report ====================

export interface ReportFormData {
  venue_id: string;
  attribute_id?: string;
  report_type: 'incorrect' | 'outdated' | 'missing' | 'changed';
  description: string;
  contact_email?: string;
}

// ==================== UI Types ====================

export interface VenueWithDistance extends Venue {
  distance?: number;
}

export interface AccessibilityCategoryGroup {
  category: AttributeCategory;
  attributes: AccessibilityAttribute[];
}

export interface VenueAccessibilityDetail {
  venue: Venue;
  attributes: AccessibilityAttribute[];
  locations: VenueLocation[];
  evidence: Evidence[];
  summary: AccessibilitySummary;
}

export interface VenueDetailResponse {
  venue: Venue;
  locations: VenueLocation[];
  attributes: AccessibilityAttribute[];
  evidence: Evidence[];
}
