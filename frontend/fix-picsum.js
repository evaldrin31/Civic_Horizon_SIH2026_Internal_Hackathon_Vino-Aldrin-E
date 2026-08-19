const fs = require('fs');
let code = fs.readFileSync('src/components/ui/venue-image.tsx', 'utf8');

const replacement = `const VENUE_IMAGES: Record<string, string> = {
  'apollo': 'https://picsum.photos/seed/hospital/800/400',
  'chennai-central': 'https://picsum.photos/seed/transport/800/400',
  'central': 'https://picsum.photos/seed/transport/800/400',
  'chennai-airport': 'https://picsum.photos/seed/transport2/800/400',
  'airport': 'https://picsum.photos/seed/transport2/800/400',
  'chennai-metro': 'https://picsum.photos/seed/transport3/800/400',
  'metro': 'https://picsum.photos/seed/transport3/800/400',
  'vr-chennai': 'https://picsum.photos/seed/shopping/800/400',
  'phoenix-marketcity': 'https://picsum.photos/seed/shopping2/800/400',
  'phoenix': 'https://picsum.photos/seed/shopping2/800/400',
  'express-avenue': 'https://picsum.photos/seed/shopping3/800/400',
  'iit-madras': 'https://picsum.photos/seed/education/800/400',
  'anna-university': 'https://picsum.photos/seed/education2/800/400',
  'marina-beach': 'https://picsum.photos/seed/tourism/800/400',
  'kapaleeshwarar-temple': 'https://picsum.photos/seed/tourism2/800/400',
  'fort-st-george': 'https://picsum.photos/seed/government/800/400'
};`;

code = code.replace(/const VENUE_IMAGES: Record<string, string> = \{[\s\S]*?\};\n/, replacement + '\n');
fs.writeFileSync('src/components/ui/venue-image.tsx', code);
console.log('Replaced local hardcoded images in VenueImage with Picsum');
