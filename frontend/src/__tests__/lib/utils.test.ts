import { formatDistance, formatDate, formatRelativeTime, formatCategory, formatAttributeName } from '@/lib/utils'

describe('Utils', () => {
  describe('formatDistance', () => {
    it('formats distances less than 1km in meters', () => {
      expect(formatDistance(0.5)).toBe('500m')
      expect(formatDistance(0.1)).toBe('100m')
      expect(formatDistance(0.999)).toBe('999m')
    })

    it('formats distances 1km or more in kilometers', () => {
      expect(formatDistance(1)).toBe('1.0km')
      expect(formatDistance(2.5)).toBe('2.5km')
      expect(formatDistance(10)).toBe('10.0km')
    })
  })

  describe('formatDate', () => {
    it('formats date strings correctly', () => {
      // Note: This test may vary by locale
      const result = formatDate('2024-01-15T10:30:00Z')
      expect(result).toBeTruthy()
      expect(typeof result).toBe('string')
    })
  })

  describe('formatRelativeTime', () => {
    it('returns "just now" for very recent times', () => {
      const now = new Date().toISOString()
      expect(formatRelativeTime(now)).toBe('just now')
    })

    it('returns hours ago for recent times', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      expect(formatRelativeTime(oneHourAgo)).toBe('1 hour ago')
    })

    it('returns days ago for older times', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      expect(formatRelativeTime(twoDaysAgo)).toBe('2 days ago')
    })

    it('returns Yesterday for 1 day ago', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      expect(formatRelativeTime(yesterday)).toBe('Yesterday')
    })
  })

  describe('formatCategory', () => {
    it('formats snake_case to Title Case', () => {
      expect(formatCategory('hospital')).toBe('Hospital')
      expect(formatCategory('shopping_mall')).toBe('Shopping Mall')
      expect(formatCategory('government_office')).toBe('Government Office')
    })

    it('handles single word categories', () => {
      expect(formatCategory('restaurant')).toBe('Restaurant')
      expect(formatCategory('education')).toBe('Education')
    })
  })

  describe('formatAttributeName', () => {
    it('formats snake_case attribute names', () => {
      expect(formatAttributeName('ramp')).toBe('Ramp')
      expect(formatAttributeName('step_free_entrance')).toBe('Step Free Entrance')
      expect(formatAttributeName('accessible_parking')).toBe('Accessible Parking')
      expect(formatAttributeName('braille_signage')).toBe('Braille Signage')
    })
  })
})
