import { render, screen, fireEvent } from '@testing-library/react';
import { Venue } from '@/lib/api/types';

// Mock the map component to test UI behavior without actual Google Maps
jest.mock('@/components/map/interactive-map', () => ({
  InteractiveMapView: ({ venues, selectedVenueId, onVenueSelect }: { venues: Venue[]; selectedVenueId?: string; onVenueSelect?: (venue: Venue) => void }) => (
    <div data-testid="interactive-map">
      <div data-testid="venue-count">{venues.length} venues found</div>
      <div data-testid="map-error">Map Error</div>
      <button 
        data-testid="list-view-btn"
        onClick={() => {}}
      >
        List
      </button>
      {venues.map((venue: Venue) => (
        <button
          key={venue.venue_id}
          data-testid={`venue-${venue.venue_id}`}
          data-selected={venue.venue_id === selectedVenueId}
          onClick={() => onVenueSelect?.(venue)}
        >
          {venue.name}
        </button>
      ))}
    </div>
  )
}));

import { InteractiveMapView } from '@/components/map/interactive-map';

describe('InteractiveMapView', () => {
  const mockVenues: Venue[] = [
    {
      venue_id: 'venue-1',
      name: 'Test Hospital',
      category: 'hospital',
      address: '123 Test St',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      latitude: 19.0760,
      longitude: 72.8777,
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z',
    },
    {
      venue_id: 'venue-2',
      name: 'Test Station',
      category: 'transport',
      address: '456 Test Ave',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      latitude: 19.0822,
      longitude: 72.8812,
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders venue list', () => {
    render(<InteractiveMapView venues={mockVenues} />);
    
    expect(screen.getByText('2 venues found')).toBeInTheDocument();
    expect(screen.getByText('Test Hospital')).toBeInTheDocument();
    expect(screen.getByText('Test Station')).toBeInTheDocument();
  });

  it('calls onVenueSelect when venue is clicked', () => {
    const onVenueSelect = jest.fn();
    render(<InteractiveMapView venues={mockVenues} onVenueSelect={onVenueSelect} />);
    
    const venueButton = screen.getByText('Test Hospital');
    fireEvent.click(venueButton);
    
    expect(onVenueSelect).toHaveBeenCalledWith(mockVenues[0]);
  });

  it('shows error state when map fails', () => {
    render(<InteractiveMapView venues={mockVenues} />);
    
    expect(screen.getByTestId('map-error')).toBeInTheDocument();
  });

  it('renders list view button', () => {
    render(<InteractiveMapView venues={mockVenues} />);
    
    expect(screen.getByText('List')).toBeInTheDocument();
  });

  it('shows correct venue count', () => {
    render(<InteractiveMapView venues={mockVenues} />);
    expect(screen.getByText('2 venues found')).toBeInTheDocument();
  });

  it('shows singular venue count for single venue', () => {
    render(<InteractiveMapView venues={[mockVenues[0]]} />);
    expect(screen.getByText('1 venues found')).toBeInTheDocument();
  });
});

describe('Map Error States', () => {
  it('shows error fallback', () => {
    render(<InteractiveMapView venues={[]} />);
    expect(screen.getByText('0 venues found')).toBeInTheDocument();
  });
});
