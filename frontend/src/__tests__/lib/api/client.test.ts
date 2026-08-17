import { api, ApiClientError } from '@/lib/api/client'

describe('API Client', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  describe('venuesApi', () => {
    it('list calls the correct endpoint', async () => {
      const mockResponse = {
        items: [],
        total: 0,
        page: 1,
        page_size: 20,
        pages: 0,
      }
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await api.venues.list()
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/venues'),
        expect.any(Object)
      )
      expect(result).toEqual(mockResponse)
    })

    it('getById calls the correct endpoint', async () => {
      const mockVenue = {
        venue_id: 'test-id',
        name: 'Test Venue',
        category: 'hospital',
        address: '123 Test St',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        latitude: 19.0760,
        longitude: 72.8777,
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z',
      }
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVenue,
      })

      const result = await api.venues.getById('test-id')
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/venues/test-id'),
        expect.any(Object)
      )
      expect(result).toEqual(mockVenue)
    })

    it('throws ApiClientError on failed request', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'NOT_FOUND', message: 'Venue not found' }),
      })

      await expect(api.venues.getById('invalid-id')).rejects.toThrow(ApiClientError)
    })
  })

  describe('searchApi', () => {
    it('search calls the correct endpoint with query params', async () => {
      const mockResponse = { items: [], total: 0, page: 1, page_size: 20, pages: 0 }
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      await api.search.search({ q: 'hospital', category: 'healthcare' })
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/venues/search'),
        expect.any(Object)
      )
      
      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0]
      expect(callUrl).toContain('q=hospital')
      expect(callUrl).toContain('category=healthcare')
    })

    it('nearby calls the correct endpoint with lat/lon', async () => {
      const mockResponse = { items: [], total: 0, page: 1, page_size: 20, pages: 0 }
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      await api.search.nearby({ lat: 19.0760, lon: 72.8777, radius: 5 })
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/venues/nearby'),
        expect.any(Object)
      )
      
      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0]
      expect(callUrl).toContain('lat=19.076')
      expect(callUrl).toContain('lon=72.8777')
    })
  })

  describe('accessibilityApi', () => {
    it('getForVenue calls the correct endpoint', async () => {
      const mockResponse = { items: [], total: 0, page: 1, page_size: 20, pages: 0 }
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      await api.accessibility.getForVenue('venue-id')
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/venues/venue-id/accessibility'),
        expect.any(Object)
      )
    })

    it('getSummary calls the correct endpoint', async () => {
      const mockSummary = {
        total_attributes: 5,
        by_category: {},
        by_value: { yes: 2, no: 0, unknown: 3, partial: 0 },
        with_evidence: 2,
        without_evidence: 3,
      }
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSummary,
      })

      const result = await api.accessibility.getSummary('venue-id')
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/venues/venue-id/accessibility/summary'),
        expect.any(Object)
      )
      expect(result).toEqual(mockSummary)
    })
  })
})
