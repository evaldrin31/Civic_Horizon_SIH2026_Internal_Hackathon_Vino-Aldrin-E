const fs = require('fs');
let code = fs.readFileSync('src/lib/demo-data.ts', 'utf8');

code += `

export function getDemoCities(): string[] {
  return Array.from(new Set(DEMO_VENUES_DATA.map(v => v.city))).sort();
}

export function getDemoCategories(): string[] {
  return Array.from(new Set(DEMO_VENUES_DATA.map(v => v.category))).sort();
}

export function getDemoStats() {
  const totalVenues = DEMO_VENUES_DATA.length;
  const verifiedVenues = DEMO_VENUES_DATA.filter(v => v.verificationStatus === 'verified').length;
  const avgScore = Math.round(DEMO_VENUES_DATA.reduce((sum, v) => sum + v.accessibilityScore, 0) / totalVenues);
  const totalEvidence = DEMO_VENUES_DATA.reduce((sum, v) => sum + v.evidenceCount, 0);
  
  return {
    totalVenues,
    verifiedVenues,
    avgScore,
    totalEvidence
  };
}
`;

fs.writeFileSync('src/lib/demo-data.ts', code);
console.log('Added missing exports');
