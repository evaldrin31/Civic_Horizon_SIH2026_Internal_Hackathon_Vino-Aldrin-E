const fs = require('fs');
const path = require('path');

const tnDistricts = [
  { name: 'Ariyalur', lat: 11.1400, lng: 79.0786 },
  { name: 'Chengalpattu', lat: 12.6840, lng: 79.9833 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Coimbatore', lat: 11.0168, lng: 76.9558 },
  { name: 'Cuddalore', lat: 11.7480, lng: 79.7714 },
  { name: 'Dharmapuri', lat: 12.1211, lng: 78.1582 },
  { name: 'Dindigul', lat: 10.3673, lng: 77.9803 },
  { name: 'Erode', lat: 11.3410, lng: 77.7172 },
  { name: 'Kallakurichi', lat: 11.7383, lng: 78.9639 },
  { name: 'Kanchipuram', lat: 12.8342, lng: 79.7036 },
  { name: 'Kanyakumari', lat: 8.0883, lng: 77.5385 },
  { name: 'Karur', lat: 10.9504, lng: 78.0832 },
  { name: 'Krishnagiri', lat: 12.5186, lng: 78.2137 },
  { name: 'Madurai', lat: 9.9252, lng: 78.1198 },
  { name: 'Mayiladuthurai', lat: 11.1085, lng: 79.6534 },
  { name: 'Nagapattinam', lat: 10.7656, lng: 79.8424 },
  { name: 'Namakkal', lat: 11.2189, lng: 78.1673 },
  { name: 'Nilgiris', lat: 11.4916, lng: 76.7337 },
  { name: 'Perambalur', lat: 11.2342, lng: 78.8821 },
  { name: 'Pudukkottai', lat: 10.3797, lng: 78.8205 },
  { name: 'Ramanathapuram', lat: 9.3639, lng: 78.8320 },
  { name: 'Ranipet', lat: 12.9272, lng: 79.3331 },
  { name: 'Salem', lat: 11.6643, lng: 78.1460 },
  { name: 'Sivaganga', lat: 9.8433, lng: 78.4809 },
  { name: 'Tenkasi', lat: 8.9594, lng: 77.3161 },
  { name: 'Thanjavur', lat: 10.7870, lng: 79.1378 },
  { name: 'Theni', lat: 10.0104, lng: 77.4768 },
  { name: 'Thoothukudi', lat: 8.7642, lng: 78.1348 },
  { name: 'Tiruchirappalli', lat: 10.7905, lng: 78.7047 },
  { name: 'Tirunelveli', lat: 8.7139, lng: 77.7567 },
  { name: 'Tirupathur', lat: 12.4933, lng: 78.5677 },
  { name: 'Tiruppur', lat: 11.1085, lng: 77.3411 },
  { name: 'Tiruvallur', lat: 13.1430, lng: 79.9071 },
  { name: 'Tiruvannamalai', lat: 12.2253, lng: 79.0747 },
  { name: 'Tiruvarur', lat: 10.7715, lng: 79.6366 },
  { name: 'Vellore', lat: 12.9165, lng: 79.1325 },
  { name: 'Viluppuram', lat: 11.9401, lng: 79.4861 },
  { name: 'Virudhunagar', lat: 9.5872, lng: 77.9573 }
];

const klDistricts = [
  { name: 'Alappuzha', lat: 9.4981, lng: 76.3388 },
  { name: 'Ernakulam', lat: 9.9816, lng: 76.2999 },
  { name: 'Idukki', lat: 9.8500, lng: 76.9366 },
  { name: 'Kannur', lat: 11.8745, lng: 75.3704 },
  { name: 'Kasaragod', lat: 12.4996, lng: 74.9869 },
  { name: 'Kollam', lat: 8.8932, lng: 76.6141 },
  { name: 'Kottayam', lat: 9.5916, lng: 76.5222 },
  { name: 'Kozhikode', lat: 11.2588, lng: 75.7804 },
  { name: 'Malappuram', lat: 11.0714, lng: 76.0740 },
  { name: 'Palakkad', lat: 10.7867, lng: 76.6548 },
  { name: 'Pathanamthitta', lat: 9.2648, lng: 76.7870 },
  { name: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366 },
  { name: 'Thrissur', lat: 10.5276, lng: 76.2144 },
  { name: 'Wayanad', lat: 11.6854, lng: 76.1320 }
];

const categories = ['hospital', 'shopping', 'education', 'transport', 'tourism', 'government', 'hotel'];

function generateVenues() {
  const venues = [];
  let idCounter = 1;

  function genForDistrict(district, state) {
    const numVenues = 5 + Math.floor(Math.random() * 3); // 5 to 7
    for (let i = 0; i < numVenues; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const latOffset = (Math.random() - 0.5) * 0.1;
      const lngOffset = (Math.random() - 0.5) * 0.1;
      
      const v = {
        venue_id: `venue-${idCounter++}`,
        name: `Demo ${category.charAt(0).toUpperCase() + category.slice(1)} ${idCounter}`,
        description: `A sample ${category} in ${district.name}`,
        category,
        address: `Main Road, ${district.name}`,
        city: district.name,
        district: district.name,
        state,
        latitude: +(district.lat + latOffset).toFixed(4),
        longitude: +(district.lng + lngOffset).toFixed(4),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        
        wheelchairAccessible: Math.random() > 0.3,
        rampAvailable: Math.random() > 0.3,
        elevatorAvailable: Math.random() > 0.4,
        accessibleParking: Math.random() > 0.5,
        accessibleRestroom: Math.random() > 0.4,
        tactilePath: Math.random() > 0.7,
        brailleSignage: Math.random() > 0.7,
        audioAssistance: Math.random() > 0.8,
        signLanguageSupport: Math.random() > 0.9,
        accessibleReception: Math.random() > 0.4,
        lowSensoryArea: Math.random() > 0.8,
        quietZone: Math.random() > 0.8,
        clearSignage: Math.random() > 0.3,
        emergencyAssistance: Math.random() > 0.3,
        staffAssistance: Math.random() > 0.3,
        stepFreeEntrance: Math.random() > 0.3,
        wheelchairSeating: Math.random() > 0.6,
        
        verificationStatus: 'demo',
        lastVerified: new Date().toISOString(),
        evidenceCount: Math.floor(Math.random() * 5),
        confidence: 50 + Math.floor(Math.random() * 50),
        sourceType: 'demo'
      };

      let score = 0;
      if (v.wheelchairAccessible) score += 20;
      if (v.rampAvailable) score += 15;
      if (v.elevatorAvailable) score += 15;
      if (v.accessibleRestroom) score += 10;
      if (v.accessibleParking) score += 10;
      if (v.stepFreeEntrance) score += 10;
      if (v.staffAssistance) score += 5;
      if (v.tactilePath) score += 5;
      if (v.brailleSignage) score += 5;
      if (v.clearSignage) score += 5;
      
      v.accessibilityScore = Math.min(100, score);
      
      venues.push(v);
    }
  }

  tnDistricts.forEach(d => genForDistrict(d, 'Tamil Nadu'));
  klDistricts.forEach(d => genForDistrict(d, 'Kerala'));
  
  return venues;
}

const allVenues = generateVenues();

const tsCode = `import { Venue, AccessibilityAttribute, Evidence, AttributeCategory } from '@/lib/api/types';

export interface DemoVenue extends Venue {
  description: string;
  district: string;
  city: string;
  state: string;
  address: string;
  latitude: number;
  longitude: number;
  
  accessibilityScore: number;
  wheelchairAccessible: boolean;
  rampAvailable: boolean;
  elevatorAvailable: boolean;
  accessibleParking: boolean;
  accessibleRestroom: boolean;
  tactilePath: boolean;
  brailleSignage: boolean;
  audioAssistance: boolean;
  signLanguageSupport: boolean;
  accessibleReception: boolean;
  lowSensoryArea: boolean;
  quietZone: boolean;
  clearSignage: boolean;
  emergencyAssistance: boolean;
  staffAssistance: boolean;
  stepFreeEntrance: boolean;
  wheelchairSeating: boolean;

  verificationStatus: 'verified' | 'partially_verified' | 'unverified' | 'demo';
  lastVerified: string;
  evidenceCount: number;
  confidence: number;
  sourceType: string;
}

export const DEMO_VENUES_DATA: DemoVenue[] = ${JSON.stringify(allVenues, null, 2)};

export function getDemoVenues(): DemoVenue[] {
  return DEMO_VENUES_DATA;
}

export function getDemoAttributes(venueId: string): AccessibilityAttribute[] {
  const venue = DEMO_VENUES_DATA.find(v => v.venue_id === venueId);
  if (!venue) return [];
  
  const attrs: AccessibilityAttribute[] = [
    {
      attribute_id: \`attr-\${venueId}-wheelchair\`,
      category: 'Physical' as AttributeCategory,
      name: 'Wheelchair Accessible',
      value: venue.wheelchairAccessible ? 'yes' : 'no',
      verification_status: 'demo',
      confidence: 100,
      evidence_count: venue.evidenceCount,
      created_at: venue.created_at,
      updated_at: venue.updated_at
    },
    {
      attribute_id: \`attr-\${venueId}-ramp\`,
      category: 'Physical' as AttributeCategory,
      name: 'Ramp Available',
      value: venue.rampAvailable ? 'yes' : 'no',
      verification_status: 'demo',
      confidence: 100,
      evidence_count: venue.evidenceCount,
      created_at: venue.created_at,
      updated_at: venue.updated_at
    }
  ];
  return attrs.filter(a => a.value === 'yes');
}

export function getDemoEvidence(venueId: string): Evidence[] {
  const venue = DEMO_VENUES_DATA.find(v => v.venue_id === venueId);
  if (!venue) return [];
  
  const evidence: Evidence[] = [];
  for (let i = 0; i < venue.evidenceCount; i++) {
    evidence.push({
      evidence_id: \`ev-\${venueId}-\${i}\`,
      attribute_id: \`attr-\${venueId}-wheelchair\`,
      evidence_media_url: \`https://example.com/evidence-\${i}.jpg\`,
      collector: \`demo-user\`,
      collected_at: venue.lastVerified,
      verification_status: 'demo',
      confidence: 90,
      created_at: venue.created_at,
      updated_at: venue.updated_at
    });
  }
  return evidence;
}

export function searchDemoVenues(params: any): DemoVenue[] {
  return DEMO_VENUES_DATA.filter(v => {
    if (params.q) {
      const query = params.q.toLowerCase();
      if (!v.name.toLowerCase().includes(query) && 
          !v.city.toLowerCase().includes(query) && 
          !v.category.toLowerCase().includes(query)) {
        return false;
      }
    }
    if (params.category && v.category !== params.category) return false;
    if (params.city && v.city.toLowerCase() !== params.city.toLowerCase()) return false;
    if (params.state && v.state.toLowerCase() !== params.state.toLowerCase()) return false;
    if (params.minScore && v.accessibilityScore < params.minScore) return false;
    
    if (params.wheelchairAccessible && !v.wheelchairAccessible) return false;
    if (params.accessibleParking && !v.accessibleParking) return false;
    if (params.accessibleRestroom && !v.accessibleRestroom) return false;
    
    return true;
  });
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

export function getNearbyDemoVenues(lat: number, lng: number, radiusKm: number = 10): (DemoVenue & { distance: number })[] {
  const withDistance = DEMO_VENUES_DATA.map(v => ({
    ...v,
    distance: getDistance(lat, lng, v.latitude, v.longitude)
  }));
  
  return withDistance
    .filter(v => v.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
}

export function getDemoStats(): any {
  const cities = new Set(DEMO_VENUES_DATA.map(v => v.city));
  const categories = new Set(DEMO_VENUES_DATA.map(v => v.category));
  const states = new Set(DEMO_VENUES_DATA.map(v => v.state));
  const totalEvidence = DEMO_VENUES_DATA.reduce((sum, v) => sum + v.evidenceCount, 0);
  const totalScore = DEMO_VENUES_DATA.reduce((sum, v) => sum + v.accessibilityScore, 0);
  
  return {
    totalVenues: DEMO_VENUES_DATA.length,
    totalCities: cities.size,
    totalCategories: categories.size,
    totalEvidence,
    totalStates: states.size,
    averageScore: DEMO_VENUES_DATA.length > 0 ? Math.round(totalScore / DEMO_VENUES_DATA.length) : 0
  };
}

export function getDemoCities(): string[] {
  return Array.from(new Set(DEMO_VENUES_DATA.map(v => v.city))).sort();
}

export function getDemoCategories(): string[] {
  return Array.from(new Set(DEMO_VENUES_DATA.map(v => v.category))).sort();
}
`;

fs.writeFileSync(path.join(__dirname, 'src', 'lib', 'demo-data.ts'), tsCode);
console.log('Successfully generated src/lib/demo-data.ts');
