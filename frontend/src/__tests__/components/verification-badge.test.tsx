import { render, screen } from '@testing-library/react'
import { VerificationBadge } from '@/components/verification-badge'
import { VerificationStatus } from '@/lib/api/types'

describe('VerificationBadge', () => {
  const statuses: VerificationStatus[] = [
    'unverified',
    'reported',
    'corroborated',
    'verified',
    'conflicting',
    'outdated',
  ]

  statuses.forEach((status) => {
    it(`renders ${status} status correctly`, () => {
      render(<VerificationBadge status={status} />)
      
      // Should display the status label
      const label = status.charAt(0).toUpperCase() + status.slice(1)
      expect(screen.getByText(label)).toBeInTheDocument()
    })

    it(`${status} badge has proper accessibility attributes`, () => {
      render(<VerificationBadge status={status} />)
      
      const badge = screen.getByText(status.charAt(0).toUpperCase() + status.slice(1)).closest('div')
      expect(badge).toHaveAttribute('title')
    })
  })

  it('renders without label when showLabel is false', () => {
    const { container } = render(<VerificationBadge status="verified" showLabel={false} />)
    expect(container.textContent).toBe('')
  })

  it('renders different sizes correctly', () => {
    const { rerender } = render(<VerificationBadge status="verified" size="sm" />)
    expect(screen.getByText('Verified')).toBeInTheDocument()
    
    rerender(<VerificationBadge status="verified" size="md" />)
    expect(screen.getByText('Verified')).toBeInTheDocument()
    
    rerender(<VerificationBadge status="verified" size="lg" />)
    expect(screen.getByText('Verified')).toBeInTheDocument()
  })
})
