import type { DemoVenue } from './demo-data';

export type AccessibilityProfile = 'wheelchair' | 'blind' | 'deaf' | 'sensory' | 'elderly' | 'temporary';

export function calculateVenueScore(venue: DemoVenue): {
  total: number;
  mobility: number;
  vision: number;
  hearing: number;
  sensory: number;
  facilities: number;
  safety: number;
  confidence: number;
} {
  // Mobility (25)
  let mobilityScore = 0;
  if (venue.wheelchairAccessible) mobilityScore += 8;
  if (venue.stepFreeEntrance) mobilityScore += 7;
  if (venue.elevatorAvailable) mobilityScore += 5;
  if (venue.rampAvailable) mobilityScore += 5;

  // Vision (15)
  let visionScore = 0;
  if (venue.tactilePath) visionScore += 8;
  if (venue.brailleSignage) visionScore += 7;

  // Hearing (15)
  let hearingScore = 0;
  if (venue.signLanguageSupport) hearingScore += 8;
  if (venue.audioAssistance) hearingScore += 7;

  // Sensory (15)
  let sensoryScore = 0;
  if (venue.quietZone) sensoryScore += 8;
  if (venue.lowSensoryArea) sensoryScore += 7;

  // Facilities (15)
  let facilitiesScore = 0;
  if (venue.accessibleRestroom) facilitiesScore += 8;
  if (venue.accessibleParking) facilitiesScore += 7;

  // Safety/Navigation (10)
  let safetyScore = 0;
  if (venue.clearSignage) safetyScore += 5;
  if (venue.emergencyAssistance) safetyScore += 3;
  if (venue.staffAssistance) safetyScore += 2;

  // Confidence (5)
  const confidenceScore = ((venue.confidence || 0) / 100) * 5;

  const total = mobilityScore + visionScore + hearingScore + sensoryScore + facilitiesScore + safetyScore + confidenceScore;

  return {
    total: Math.round(total),
    mobility: mobilityScore,
    vision: visionScore,
    hearing: hearingScore,
    sensory: sensoryScore,
    facilities: facilitiesScore,
    safety: safetyScore,
    confidence: confidenceScore
  };
}

export function calculateProfileMatch(
  venue: DemoVenue,
  profile: AccessibilityProfile
): { matchPercentage: number; reasons: string[]; warnings: string[] } {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 0;
  let maxScore = 0;

  const addPoint = (hasIt: boolean, goodMsg: string, badMsg: string, weight = 1) => {
    maxScore += weight;
    if (hasIt) {
      score += weight;
      reasons.push(goodMsg);
    } else {
      warnings.push(badMsg);
    }
  };

  switch (profile) {
    case 'wheelchair':
      addPoint(venue.stepFreeEntrance, 'Step-free entrance available.', 'Lacks step-free entrance.', 3);
      addPoint(venue.elevatorAvailable || venue.rampAvailable, 'Has ramp or elevator.', 'No ramp or elevator available.', 2);
      addPoint(venue.accessibleParking, 'Accessible parking available.', 'No designated accessible parking.', 1);
      addPoint(venue.accessibleRestroom, 'Accessible restrooms available.', 'No accessible restrooms.', 2);
      addPoint(venue.wheelchairAccessible, 'Fully wheelchair accessible.', 'Not fully wheelchair accessible.', 2);
      break;
    case 'blind':
      addPoint(venue.tactilePath, 'Tactile path is present.', 'Missing tactile path.', 3);
      addPoint(venue.brailleSignage, 'Braille signage is available.', 'Lacks Braille signage.', 2);
      addPoint(venue.audioAssistance, 'Audio assistance provided.', 'No audio assistance.', 2);
      addPoint(venue.staffAssistance, 'Staff assistance available.', 'No staff assistance noted.', 1);
      break;
    case 'deaf':
      addPoint(venue.signLanguageSupport, 'Sign language support available.', 'No sign language support.', 3);
      addPoint(venue.clearSignage, 'Clear visual signage.', 'Signage may not be clear.', 2);
      break;
    case 'sensory':
      addPoint(venue.quietZone, 'Quiet zones are available.', 'No designated quiet zones.', 3);
      addPoint(venue.lowSensoryArea, 'Low sensory areas provided.', 'No low sensory areas.', 2);
      break;
    case 'elderly':
      addPoint(venue.stepFreeEntrance || venue.elevatorAvailable, 'Step-free or elevator access.', 'Stairs may be required.', 2);
      addPoint(venue.wheelchairSeating || venue.accessibleRestroom, 'Accessible facilities available.', 'Limited accessible facilities.', 2);
      addPoint(venue.staffAssistance, 'Staff assistance available.', 'No staff assistance noted.', 1);
      break;
    case 'temporary':
      addPoint(venue.stepFreeEntrance || venue.rampAvailable, 'Step-free or ramp access.', 'Stairs required.', 2);
      addPoint(venue.accessibleParking, 'Accessible parking.', 'No accessible parking.', 1);
      break;
  }

  const matchPercentage = maxScore === 0 ? 0 : Math.round((score / maxScore) * 100);

  return { matchPercentage, reasons, warnings };
}

export function rankVenuesForProfile(venues: DemoVenue[], profile: AccessibilityProfile | null): DemoVenue[] {
  if (!profile) return venues;
  
  return [...venues].sort((a, b) => {
    const scoreA = calculateProfileMatch(a, profile).matchPercentage;
    const scoreB = calculateProfileMatch(b, profile).matchPercentage;
    return scoreB - scoreA;
  });
}
