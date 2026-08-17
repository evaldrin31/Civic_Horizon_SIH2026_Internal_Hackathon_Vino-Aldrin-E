import { render, screen } from '@testing-library/react'
import { AttributeValueBadge } from '@/components/accessibility-attributes'
import { AttributeValue } from '@/lib/api/types'

describe('AttributeValueBadge', () => {
  const values: { value: AttributeValue; expectedLabel: string }[] = [
    { value: 'yes', expectedLabel: 'Available' },
    { value: 'no', expectedLabel: 'Not Available' },
    { value: 'unknown', expectedLabel: 'Unknown' },
    { value: 'partial', expectedLabel: 'Partial' },
  ]

  values.forEach(({ value, expectedLabel }) => {
    it(`renders ${value} value with correct label`, () => {
      render(<AttributeValueBadge value={value} />)
      expect(screen.getByText(expectedLabel)).toBeInTheDocument()
    })
  })

  it('renders appropriate icons for each value', () => {
    const { rerender } = render(<AttributeValueBadge value="yes" />)
    expect(screen.getByText('Available')).toBeInTheDocument()
    
    rerender(<AttributeValueBadge value="no" />)
    expect(screen.getByText('Not Available')).toBeInTheDocument()
    
    rerender(<AttributeValueBadge value="unknown" />)
    expect(screen.getByText('Unknown')).toBeInTheDocument()
    
    rerender(<AttributeValueBadge value="partial" />)
    expect(screen.getByText('Partial')).toBeInTheDocument()
  })
})
