const fs = require('fs');

let loc = fs.readFileSync('src/components/current-location.tsx', 'utf8');
loc = loc.replace('let name = "Chennai, Tamil Nadu";', 'const name = "Chennai, Tamil Nadu";');
fs.writeFileSync('src/components/current-location.tsx', loc);

let speech = fs.readFileSync('src/lib/hooks/use-speech.ts', 'utf8');
speech = speech.replace(/any/g, 'unknown');
fs.writeFileSync('src/lib/hooks/use-speech.ts', speech);

let venue = fs.readFileSync('src/app/venues/[id]/page.tsx', 'utf8');
venue = venue.replace(/any/g, 'unknown');
fs.writeFileSync('src/app/venues/[id]/page.tsx', venue);
console.log('Fixed linting errors');
