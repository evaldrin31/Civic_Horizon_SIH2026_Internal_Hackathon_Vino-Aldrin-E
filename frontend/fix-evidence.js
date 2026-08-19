const fs = require('fs');
let code = fs.readFileSync('src/lib/demo-data.ts', 'utf8');

const replacement = `export function getDemoEvidence(venueId: string): Evidence[] {
  const venue = DEMO_VENUES_DATA.find(v => v.venue_id === venueId);
  const evidence: Evidence[] = [];
  
  if (!venue) return evidence;
  
  const v = venue as any;
  const count = v.evidenceCount || 1;
  const realImage = v.imageUrl || 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Meenakshi_Amman_West_Tower.jpg/800px-Meenakshi_Amman_West_Tower.jpg';
  
  // 1. Primary Evidence: The actual location image
  evidence.push({
    id: "ev1",
    venue_id: venueId,
    url: realImage,
    type: "image",
    category: "mobility",
    description: "Location Overview & Approach",
    verified: true,
    timestamp: new Date().toISOString(),
    uploader_id: "u1"
  });

  if (count > 1 && v.stepFreeEntrance) {
    evidence.push({
      id: "ev2",
      venue_id: venueId,
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Wheelchair_ramp.jpg/800px-Wheelchair_ramp.jpg",
      type: "image",
      category: "mobility",
      description: "Step-free entrance / ramp access",
      verified: true,
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      uploader_id: "u2"
    });
  }

  if (count > 2 && v.tactilePath) {
    evidence.push({
      id: "ev3",
      venue_id: venueId,
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Tactile_paving.jpg/800px-Tactile_paving.jpg",
      type: "image",
      category: "vision",
      description: "Tactile paving for visually impaired",
      verified: true,
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      uploader_id: "u3"
    });
  }

  if (count > evidence.length && v.accessibleRestroom) {
    evidence.push({
      id: "ev4",
      venue_id: venueId,
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Braille_sign_on_door.jpg/800px-Braille_sign_on_door.jpg",
      type: "image",
      category: "mobility",
      description: "Accessible Facilities Signage",
      verified: true,
      timestamp: new Date(Date.now() - 259200000).toISOString(),
      uploader_id: "u4"
    });
  }

  // Fallback if we still need more evidence items to match count
  while(evidence.length < count) {
     evidence.push({
      id: "ev" + (evidence.length + 1),
      venue_id: venueId,
      url: realImage,
      type: "image",
      category: "general",
      description: "Supplementary view",
      verified: true,
      timestamp: new Date().toISOString(),
      uploader_id: "u1"
    });
  }
  
  // Return exact number of evidence requested
  return evidence.slice(0, count);
}`;

code = code.replace(/export function getDemoEvidence\(venueId: string\): Evidence\[\] \{[\s\S]*?\];\n  \}/, replacement);
fs.writeFileSync('src/lib/demo-data.ts', code);
console.log('Replaced getDemoEvidence in demo-data.ts');
