/**
 * API Client - Centralized API communication layer
 * 
 * Matches docs/API_CONTRACT.md
 * Base URL: http://localhost:8000/api/v1
 */

import {
  ApiError,
  PaginatedResponse,
  Venue,
  VenueSearchParams,
  NearbySearchParams,
  UnifiedSearchParams,
  AccessibilityAttribute,
  AccessibilitySummary,
  Evidence,
  VerificationHistory,
  EvidenceConflict,
  VenueDetailResponse,
} from './types';

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Custom error class for API errors
export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorCode: string
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

// Helper to build query string
function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

// Generic fetch wrapper
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      error: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
    }));
    
    throw new ApiClientError(
      errorData.message,
      response.status,
      errorData.error
    );
  }
  
  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }
  
  return response.json();
}

// ==================== Venues ====================

export const venuesApi = {
  /**
   * List all venues with optional filters
   * GET /api/v1/venues
   */
  list: async (params?: {
    page?: number;
    page_size?: number;
    category?: string;
    city?: string;
    state?: string;
  }): Promise<PaginatedResponse<Venue>> => {
    const query = buildQueryString(params || {});
    return fetchApi<PaginatedResponse<Venue>>(`/venues${query}`);
  },

  /**
   * Get a specific venue by ID
   * GET /api/v1/venues/{venue_id}
   */
  getById: async (venueId: string): Promise<Venue> => {
    return fetchApi<Venue>(`/venues/${venueId}`);
  },

  /**
   * Create a new venue
   * POST /api/v1/venues
   */
  create: async (venue: Omit<Venue, 'venue_id' | 'created_at' | 'updated_at'>): Promise<Venue> => {
    return fetchApi<Venue>('/venues', {
      method: 'POST',
      body: JSON.stringify(venue),
    });
  },

  /**
   * Update a venue (partial update)
   * PATCH /api/v1/venues/{venue_id}
   */
  update: async (venueId: string, updates: Partial<Venue>): Promise<Venue> => {
    return fetchApi<Venue>(`/venues/${venueId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Delete a venue
   * DELETE /api/v1/venues/{venue_id}
   */
  delete: async (venueId: string): Promise<void> => {
    return fetchApi<void>(`/venues/${venueId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get venue detail with all related data
   * GET /api/v1/venues/{venue_id}/detail
   */
  getDetail: async (venueId: string): Promise<VenueDetailResponse> => {
    return fetchApi<VenueDetailResponse>(`/venues/${venueId}/detail`);
  },
};

// ==================== Search ====================

export const searchApi = {
  /**
   * Search venues by name and filters
   * GET /api/v1/venues/search
   */
  search: async (params: VenueSearchParams): Promise<PaginatedResponse<Venue>> => {
    const query = buildQueryString(params);
    return fetchApi<PaginatedResponse<Venue>>(`/venues/search${query}`);
  },

  /**
   * Find venues near a location
   * GET /api/v1/venues/nearby
   */
  nearby: async (params: NearbySearchParams): Promise<PaginatedResponse<Venue>> => {
    const query = buildQueryString(params);
    return fetchApi<PaginatedResponse<Venue>>(`/venues/nearby${query}`);
  },

  /**
   * Unified search (combines text and location)
   * GET /api/v1/search
   */
  unified: async (params: UnifiedSearchParams): Promise<PaginatedResponse<Venue>> => {
    const query = buildQueryString(params);
    return fetchApi<PaginatedResponse<Venue>>(`/search${query}`);
  },
};

// ==================== Accessibility ====================

export const accessibilityApi = {
  /**
   * Get accessibility attributes for a venue
   * GET /api/v1/venues/{venue_id}/accessibility
   */
  getForVenue: async (
    venueId: string,
    params?: {
      category?: string;
      attribute_name?: string;
      page?: number;
      page_size?: number;
    }
  ): Promise<PaginatedResponse<AccessibilityAttribute>> => {
    const query = buildQueryString(params || {});
    return fetchApi<PaginatedResponse<AccessibilityAttribute>>(
      `/venues/${venueId}/accessibility${query}`
    );
  },

  /**
   * Get a specific accessibility attribute
   * GET /api/v1/venues/{venue_id}/accessibility/{attribute_id}
   */
  getById: async (venueId: string, attributeId: string): Promise<AccessibilityAttribute> => {
    return fetchApi<AccessibilityAttribute>(`/venues/${venueId}/accessibility/${attributeId}`);
  },

  /**
   * Create an accessibility attribute
   * POST /api/v1/venues/{venue_id}/accessibility
   */
  create: async (
    venueId: string,
    attribute: Omit<AccessibilityAttribute, 'attribute_id' | 'venue_id' | 'created_at' | 'updated_at'>
  ): Promise<AccessibilityAttribute> => {
    return fetchApi<AccessibilityAttribute>(`/venues/${venueId}/accessibility`, {
      method: 'POST',
      body: JSON.stringify(attribute),
    });
  },

  /**
   * Update an accessibility attribute
   * PATCH /api/v1/venues/{venue_id}/accessibility/{attribute_id}
   */
  update: async (
    venueId: string,
    attributeId: string,
    updates: Partial<AccessibilityAttribute>
  ): Promise<AccessibilityAttribute> => {
    return fetchApi<AccessibilityAttribute>(
      `/venues/${venueId}/accessibility/${attributeId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }
    );
  },

  /**
   * Delete an accessibility attribute
   * DELETE /api/v1/venues/{venue_id}/accessibility/{attribute_id}
   */
  delete: async (venueId: string, attributeId: string): Promise<void> => {
    return fetchApi<void>(`/venues/${venueId}/accessibility/${attributeId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get accessibility summary for a venue
   * GET /api/v1/venues/{venue_id}/accessibility/summary
   */
  getSummary: async (venueId: string): Promise<AccessibilitySummary> => {
    return fetchApi<AccessibilitySummary>(`/venues/${venueId}/accessibility/summary`);
  },
};

// ==================== Evidence ====================

export const evidenceApi = {
  /**
   * Get all evidence for a venue
   * GET /api/v1/venues/{venue_id}/evidence
   */
  getForVenue: async (
    venueId: string,
    params?: {
      verification_status?: string;
      page?: number;
      page_size?: number;
    }
  ): Promise<PaginatedResponse<Evidence>> => {
    const query = buildQueryString(params || {});
    return fetchApi<PaginatedResponse<Evidence>>(`/venues/${venueId}/evidence${query}`);
  },

  /**
   * Get specific evidence
   * GET /api/v1/evidence/{evidence_id}
   */
  getById: async (evidenceId: string): Promise<Evidence> => {
    return fetchApi<Evidence>(`/evidence/${evidenceId}`);
  },

  /**
   * Create evidence
   * POST /api/v1/evidence
   */
  create: async (
    evidence: Omit<Evidence, 'evidence_id' | 'created_at' | 'updated_at'>
  ): Promise<Evidence> => {
    return fetchApi<Evidence>('/evidence', {
      method: 'POST',
      body: JSON.stringify(evidence),
    });
  },

  /**
   * Update evidence
   * PATCH /api/v1/evidence/{evidence_id}
   */
  update: async (
    evidenceId: string,
    updates: Partial<Evidence>
  ): Promise<Evidence> => {
    return fetchApi<Evidence>(`/evidence/${evidenceId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Get verification history for evidence
   * GET /api/v1/evidence/{evidence_id}/history
   */
  getHistory: async (evidenceId: string): Promise<VerificationHistory[]> => {
    return fetchApi<VerificationHistory[]>(`/evidence/${evidenceId}/history`);
  },

  /**
   * Get conflicting evidence
   * GET /api/v1/evidence/{evidence_id}/conflicts
   */
  getConflicts: async (evidenceId: string): Promise<EvidenceConflict[]> => {
    return fetchApi<EvidenceConflict[]>(`/evidence/${evidenceId}/conflicts`);
  },
};

// ==================== Import (Admin) ====================

export const importApi = {
  /**
   * Import a single structured record
   * POST /api/v1/admin/import/record
   */
  importRecord: async (record: unknown): Promise<{
    success: boolean;
    venue_id: string;
    venue_created: boolean;
    errors: string[];
  }> => {
    return fetchApi('/admin/import/record', {
      method: 'POST',
      body: JSON.stringify(record),
    });
  },

  /**
   * Import multiple records (batch)
   * POST /api/v1/admin/import/records
   */
  importRecords: async (records: unknown[]): Promise<{
    total: number;
    successful: number;
    failed: number;
    stats: {
      venues_created: number;
      venues_matched: number;
      attributes_created: number;
      evidence_created: number;
      sources_created: number;
    };
    results: unknown[];
  }> => {
    return fetchApi('/admin/import/records', {
      method: 'POST',
      body: JSON.stringify(records),
    });
  },
};

// Export all APIs as a single object
export const api = {
  venues: venuesApi,
  search: searchApi,
  accessibility: accessibilityApi,
  evidence: evidenceApi,
  import: importApi,
};

export default api;
