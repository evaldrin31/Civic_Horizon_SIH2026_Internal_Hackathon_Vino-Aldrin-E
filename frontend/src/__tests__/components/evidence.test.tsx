/**
 * Evidence Component Tests
 * 
 * Tests for evidence rendering, source rendering, verification status,
 * YES/NO/PARTIAL/UNKNOWN semantics, conflicting evidence, freshness,
 * and location handling.
 */

import { render, screen } from '@testing-library/react';
import { 
  EvidenceCard, 
  EvidenceList, 
  EvidenceSummary,
  ConflictWarning,
  FreshnessIndicator,
  ConfidenceIndicator,
  hasConflictingEvidence,
  getAttributeConflicts,
  SourceTypeBadge
} from '@/components/evidence';
import { Evidence, AttributeValue } from '@/lib/api/types';

// Mock data
const mockEvidence: Evidence = {
  evidence_id: 'ev-1',
  attribute_id: 'attr-1',
  evidence_text: 'Ramp present at main entrance',
  observed_at: '2024-01-15T00:00:00Z',
  collected_at: '2024-01-15T10:30:00Z',
  collector: 'test_collector',
  verification_status: 'verified',
  confidence: 0.9,
  notes: 'Verified by site visit',
  source: {
    source_id: 'src-1',
    source_type: 'direct_observation',
    source_name: 'Site Visit',
    trust_level: 5,
    created_at: '2024-01-15T10:30:00Z',
  },
  attribute: {
    attribute_id: 'attr-1',
    venue_id: 'venue-1',
    location_id: null,
    category: 'mobility',
    attribute_name: 'ramp',
    value: 'yes' as AttributeValue,
    value_type: 'boolean',
    last_observed_at: '2024-01-15T00:00:00Z',
    location: null,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
  },
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:30:00Z',
};

const mockConflictingEvidence: Evidence[] = [
  {
    ...mockEvidence,
    evidence_id: 'ev-1',
    verification_status: 'verified',
    attribute: {
      ...mockEvidence.attribute!,
      value: 'yes',
    },
  },
  {
    ...mockEvidence,
    evidence_id: 'ev-2',
    verification_status: 'reported',
    attribute: {
      ...mockEvidence.attribute!,
      value: 'no',
    },
    source: {
      ...mockEvidence.source!,
      source_type: 'public_review',
    },
  },
];

const mockUnverifiedEvidence: Evidence = {
  ...mockEvidence,
  evidence_id: 'ev-3',
  verification_status: 'unverified',
  confidence: 0.5,
  source: null,
};

const mockOutdatedEvidence: Evidence = {
  ...mockEvidence,
  evidence_id: 'ev-4',
  verification_status: 'outdated',
  observed_at: '2023-01-15T00:00:00Z',
  confidence: 0.8,
};

describe('EvidenceCard', () => {
  it('renders evidence with all available information', () => {
    render(<EvidenceCard evidence={mockEvidence} showAttribute={true} />);
    
    // Check evidence text
    expect(screen.getByText('Ramp present at main entrance')).toBeInTheDocument();
    
    // Check attribute info
    expect(screen.getByText('ramp')).toBeInTheDocument();
    expect(screen.getByText('yes')).toBeInTheDocument();
    
    // Check source
    expect(screen.getByText('Site Visit')).toBeInTheDocument();
    
    // Check verification status
    expect(screen.getByText('Verified')).toBeInTheDocument();
    
    // Check collector
    expect(screen.getByText(/By: test_collector/)).toBeInTheDocument();
    
    // Check notes
    expect(screen.getByText('Verified by site visit')).toBeInTheDocument();
  });

  it('handles missing evidence text gracefully', () => {
    const evidenceWithoutText = { ...mockEvidence, evidence_text: undefined };
    render(<EvidenceCard evidence={evidenceWithoutText} />);
    
    expect(screen.getByText(/No description available/i)).toBeInTheDocument();
  });

  it('handles missing source gracefully', () => {
    const evidenceWithoutSource = { ...mockEvidence, source: null };
    render(<EvidenceCard evidence={evidenceWithoutSource} />);
    
    expect(screen.getByText(/Source information not available/i)).toBeInTheDocument();
  });

  it('handles missing collector gracefully', () => {
    const evidenceWithoutCollector = { ...mockEvidence, collector: undefined };
    render(<EvidenceCard evidence={evidenceWithoutCollector} />);
    
    expect(screen.getByText(/Collector unknown/i)).toBeInTheDocument();
  });

  it('handles missing observation date gracefully', () => {
    const evidenceWithoutObserved = { ...mockEvidence, observed_at: undefined };
    render(<EvidenceCard evidence={evidenceWithoutObserved} />);
    
    expect(screen.getByText(/Observation date unknown/i)).toBeInTheDocument();
  });
});

describe('EvidenceList', () => {
  it('renders empty state when no evidence', () => {
    render(<EvidenceList evidence={[]} />);
    
    expect(screen.getByText('No evidence recorded')).toBeInTheDocument();
    expect(screen.getByText(/not been backed by evidence/i)).toBeInTheDocument();
  });

  it('renders list of evidence items', () => {
    render(<EvidenceList evidence={[mockEvidence, mockUnverifiedEvidence]} />);
    
    // Use getAllByText since there are multiple instances
    expect(screen.getAllByText('Ramp present at main entrance').length).toBeGreaterThanOrEqual(1);
  });

  it('groups evidence by verification status when enabled', () => {
    render(<EvidenceList evidence={[mockEvidence, mockUnverifiedEvidence]} groupByStatus={true} />);
    
    // Use getAllByText since there are multiple instances of status labels
    const verifiedElements = screen.getAllByText('Verified');
    expect(verifiedElements.length).toBeGreaterThanOrEqual(1);
    
    const unverifiedElements = screen.getAllByText('Unverified');
    expect(unverifiedElements.length).toBeGreaterThanOrEqual(1);
  });

  it('shows conflict warning when conflicts exist', () => {
    render(<EvidenceList evidence={mockConflictingEvidence} showConflicts={true} />);
    
    expect(screen.getByText(/Conflicting Reports/i)).toBeInTheDocument();
    expect(screen.getByText(/conflicting evidence/i)).toBeInTheDocument();
  });

  it('does not show conflict warning when no conflicts', () => {
    render(<EvidenceList evidence={[mockEvidence]} showConflicts={true} />);
    
    expect(screen.queryByText(/Conflicting Reports/i)).not.toBeInTheDocument();
  });
});

describe('EvidenceSummary', () => {
  it('shows no evidence state', () => {
    render(<EvidenceSummary evidence={[]} />);
    
    expect(screen.getByText('No evidence')).toBeInTheDocument();
  });

  it('shows evidence count', () => {
    render(<EvidenceSummary evidence={[mockEvidence, mockUnverifiedEvidence]} />);
    
    expect(screen.getByText('2 evidence')).toBeInTheDocument();
  });

  it('shows verified count', () => {
    render(<EvidenceSummary evidence={[mockEvidence, mockUnverifiedEvidence]} />);
    
    expect(screen.getByText('1 verified')).toBeInTheDocument();
  });

  it('shows conflicting count', () => {
    render(<EvidenceSummary evidence={mockConflictingEvidence} />);
    
    // The component filters by verification_status === 'conflicting', so update the mock
    const conflictingEvidence = mockConflictingEvidence.map(e => ({
      ...e,
      verification_status: 'conflicting' as const,
    }));
    
    render(<EvidenceSummary evidence={conflictingEvidence} />);
    
    // Check for conflicting badge - use a more flexible matcher
    expect(screen.getByText(/1/)).toBeInTheDocument();
    expect(screen.getByText(/conflicting/)).toBeInTheDocument();
  });
});

describe('ConflictWarning', () => {
  it('renders when conflicts exist', () => {
    render(<ConflictWarning evidence={mockConflictingEvidence} />);
    
    expect(screen.getByText('Conflicting Reports')).toBeInTheDocument();
    expect(screen.getByText(/1 attribute has conflicting evidence/i)).toBeInTheDocument();
  });

  it('does not render when no conflicts', () => {
    const { container } = render(<ConflictWarning evidence={[mockEvidence]} />);
    
    expect(container.firstChild).toBeNull();
  });
});

describe('FreshnessIndicator', () => {
  it('shows recent for dates less than 30 days', () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 5);
    
    render(<FreshnessIndicator observedAt={recentDate.toISOString()} collectedAt={recentDate.toISOString()} />);
    
    expect(screen.getByText('Recent')).toBeInTheDocument();
  });

  it('shows months ago for dates between 30-90 days', () => {
    const olderDate = new Date();
    olderDate.setDate(olderDate.getDate() - 60);
    
    render(<FreshnessIndicator observedAt={olderDate.toISOString()} collectedAt={olderDate.toISOString()} />);
    
    expect(screen.getByText(/months ago/i)).toBeInTheDocument();
  });

  it('shows unknown when no date available', () => {
    // Pass undefined for both observedAt and collectedAt to trigger the "Date unknown" case
    render(<FreshnessIndicator observedAt={undefined} collectedAt={undefined as unknown as string} />);
    
    expect(screen.getByText(/Date unknown/i)).toBeInTheDocument();
  });
});

describe('ConfidenceIndicator', () => {
  it('shows high confidence for >= 0.9', () => {
    render(<ConfidenceIndicator confidence={0.95} />);
    
    expect(screen.getByText('95%')).toBeInTheDocument();
  });

  it('shows good confidence for >= 0.7', () => {
    render(<ConfidenceIndicator confidence={0.75} />);
    
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('shows moderate confidence for >= 0.5', () => {
    render(<ConfidenceIndicator confidence={0.6} />);
    
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('shows low confidence for < 0.5', () => {
    render(<ConfidenceIndicator confidence={0.3} />);
    
    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('handles undefined confidence', () => {
    render(<ConfidenceIndicator confidence={undefined} />);
    
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('handles null confidence', () => {
    render(<ConfidenceIndicator confidence={null} />);
    
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });
});

describe('SourceTypeBadge', () => {
  it('renders government source', () => {
    render(<SourceTypeBadge sourceType="government" />);
    
    expect(screen.getByText('Government/Regulatory')).toBeInTheDocument();
  });

  it('renders community observation source', () => {
    render(<SourceTypeBadge sourceType="community_observation" />);
    
    expect(screen.getByText('Community Observation')).toBeInTheDocument();
  });

  it('renders ai inference source', () => {
    render(<SourceTypeBadge sourceType="ai_inference" />);
    
    expect(screen.getByText('AI Inference')).toBeInTheDocument();
  });
});

describe('hasConflictingEvidence', () => {
  it('returns true when evidence conflicts', () => {
    expect(hasConflictingEvidence(mockConflictingEvidence)).toBe(true);
  });

  it('returns false when evidence agrees', () => {
    const agreeingEvidence = [
      { ...mockEvidence, evidence_id: 'ev-1' },
      { ...mockEvidence, evidence_id: 'ev-2' },
    ];
    expect(hasConflictingEvidence(agreeingEvidence)).toBe(false);
  });

  it('returns false with single evidence', () => {
    expect(hasConflictingEvidence([mockEvidence])).toBe(false);
  });

  it('returns false with empty array', () => {
    expect(hasConflictingEvidence([])).toBe(false);
  });

  it('ignores unknown values when checking conflicts', () => {
    const evidenceWithUnknown = [
      { ...mockEvidence, evidence_id: 'ev-1', attribute: { ...mockEvidence.attribute!, value: 'yes' } },
      { ...mockEvidence, evidence_id: 'ev-2', attribute: { ...mockEvidence.attribute!, value: 'unknown' } },
    ];
    expect(hasConflictingEvidence(evidenceWithUnknown)).toBe(false);
  });
});

describe('getAttributeConflicts', () => {
  it('returns conflicts grouped by attribute', () => {
    const conflicts = getAttributeConflicts(mockConflictingEvidence);
    
    expect(conflicts.size).toBe(1);
    expect(conflicts.has('attr-1')).toBe(true);
  });

  it('returns empty map when no conflicts', () => {
    const conflicts = getAttributeConflicts([mockEvidence]);
    
    expect(conflicts.size).toBe(0);
  });

  it('handles null attribute gracefully', () => {
    const evidenceWithNullAttr = [
      { ...mockEvidence, evidence_id: 'ev-1', attribute: null },
      { ...mockEvidence, evidence_id: 'ev-2', attribute: null },
    ];
    
    // Should not throw and should return empty map
    const conflicts = getAttributeConflicts(evidenceWithNullAttr);
    expect(conflicts.size).toBe(0);
  });

  it('handles undefined attribute gracefully', () => {
    const evidenceWithUndefinedAttr = [
      { ...mockEvidence, evidence_id: 'ev-1', attribute: undefined },
      { ...mockEvidence, evidence_id: 'ev-2', attribute: undefined },
    ];
    
    // Should not throw and should return empty map
    const conflicts = getAttributeConflicts(evidenceWithUndefinedAttr);
    expect(conflicts.size).toBe(0);
  });

  it('ignores evidence without usable attribute values', () => {
    const mixedEvidence = [
      { ...mockEvidence, evidence_id: 'ev-1', attribute: { ...mockEvidence.attribute!, value: 'yes' } },
      { ...mockEvidence, evidence_id: 'ev-2', attribute: null },
      { ...mockEvidence, evidence_id: 'ev-3', attribute: undefined },
    ];
    
    // Only one evidence with a value, so no conflicts possible
    expect(hasConflictingEvidence(mixedEvidence)).toBe(false);
    const conflicts = getAttributeConflicts(mixedEvidence);
    expect(conflicts.size).toBe(0);
  });

  it('handles undefined attribute value gracefully', () => {
    const evidenceWithUndefinedValue = [
      { ...mockEvidence, evidence_id: 'ev-1', attribute: { ...mockEvidence.attribute!, value: 'yes' } },
      { ...mockEvidence, evidence_id: 'ev-2', attribute: { ...mockEvidence.attribute!, value: undefined as unknown as AttributeValue } },
    ];
    
    // Should not throw and should filter out undefined values
    expect(hasConflictingEvidence(evidenceWithUndefinedValue)).toBe(false);
  });
});

describe('Verification Status Values', () => {
  it('preserves YES semantics correctly', () => {
    const yesEvidence = { 
      ...mockEvidence, 
      attribute: { ...mockEvidence.attribute!, value: 'yes' }
    };
    
    render(<EvidenceCard evidence={yesEvidence} showAttribute={true} />);
    const yesBadge = screen.getByText('yes');
    expect(yesBadge).toBeInTheDocument();
  });

  it('preserves NO semantics correctly', () => {
    const noEvidence = { 
      ...mockEvidence, 
      attribute: { ...mockEvidence.attribute!, value: 'no' }
    };
    
    render(<EvidenceCard evidence={noEvidence} showAttribute={true} />);
    const noBadge = screen.getByText('no');
    expect(noBadge).toBeInTheDocument();
  });

  it('preserves PARTIAL semantics correctly', () => {
    const partialEvidence = { 
      ...mockEvidence, 
      attribute: { ...mockEvidence.attribute!, value: 'partial' }
    };
    
    render(<EvidenceCard evidence={partialEvidence} showAttribute={true} />);
    const partialBadge = screen.getByText('partial');
    expect(partialBadge).toBeInTheDocument();
  });

  it('preserves UNKNOWN semantics correctly', () => {
    const unknownEvidence = { 
      ...mockEvidence, 
      attribute: { ...mockEvidence.attribute!, value: 'unknown' }
    };
    
    render(<EvidenceCard evidence={unknownEvidence} showAttribute={true} />);
    const unknownBadge = screen.getByText('unknown');
    expect(unknownBadge).toBeInTheDocument();
  });

  it('does not treat UNKNOWN as NO', () => {
    const unknownEvidence = { 
      ...mockEvidence, 
      attribute: { ...mockEvidence.attribute!, value: 'unknown' }
    };
    
    render(<EvidenceCard evidence={unknownEvidence} showAttribute={true} />);
    
    // Should show as "unknown" not "no"
    expect(screen.getByText('unknown')).toBeInTheDocument();
    expect(screen.queryByText('no')).not.toBeInTheDocument();
  });

  // NULL SAFETY TESTS
  it('handles null attribute object gracefully', () => {
    const evidenceWithNullAttr = { ...mockEvidence, attribute: null };
    
    // Should render without crashing
    render(<EvidenceCard evidence={evidenceWithNullAttr} showAttribute={true} />);
    
    // Evidence text should still be visible
    expect(screen.getByText('Ramp present at main entrance')).toBeInTheDocument();
  });

  it('handles undefined attribute object gracefully', () => {
    const evidenceWithUndefinedAttr = { ...mockEvidence, attribute: undefined };
    
    // Should render without crashing
    render(<EvidenceCard evidence={evidenceWithUndefinedAttr} showAttribute={true} />);
    
    // Evidence text should still be visible
    expect(screen.getByText('Ramp present at main entrance')).toBeInTheDocument();
  });

  it('renders evidence without attribute using available info', () => {
    const evidenceWithoutAttribute = { 
      ...mockEvidence, 
      attribute: null,
      evidence_text: 'Evidence without attribute reference'
    };
    
    render(<EvidenceCard evidence={evidenceWithoutAttribute} />);
    
    // Should show evidence text
    expect(screen.getByText('Evidence without attribute reference')).toBeInTheDocument();
    
    // Should show source info
    expect(screen.getByText('Site Visit')).toBeInTheDocument();
    
    // Should show verification status
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('handles evidence with only attribute_id and no attribute object', () => {
    const evidenceWithOnlyId = { 
      ...mockEvidence, 
      attribute: null,
      attribute_id: 'orphan-attr-1'
    };
    
    // Should render without crashing in list
    render(<EvidenceList evidence={[evidenceWithOnlyId]} />);
    
    // Should show evidence
    expect(screen.getByText('Ramp present at main entrance')).toBeInTheDocument();
  });

  it('handles list with mixed null and valid attributes', () => {
    const mixedEvidence = [
      mockEvidence, // has valid attribute
      { ...mockEvidence, evidence_id: 'ev-null', attribute: null },
      { ...mockEvidence, evidence_id: 'ev-undefined', attribute: undefined },
    ];
    
    // Should render all without crashing
    render(<EvidenceList evidence={mixedEvidence} />);
    
    // All three should be visible
    const evidenceTexts = screen.getAllByText('Ramp present at main entrance');
    expect(evidenceTexts.length).toBe(3);
  });
});
