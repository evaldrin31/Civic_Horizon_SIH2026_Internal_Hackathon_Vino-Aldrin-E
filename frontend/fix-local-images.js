const fs = require('fs');
let code = fs.readFileSync('src/components/ui/venue-image.tsx', 'utf8');

const replacement = `const VENUE_IMAGES: Record<string, string> = {
  'apollo': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
  'chennai-central': 'https://images.unsplash.com/photo-1541427468627-a89a96e5ca1d?w=800&q=80',
  'central': 'https://images.unsplash.com/photo-1541427468627-a89a96e5ca1d?w=800&q=80',
  'chennai-airport': 'https://images.unsplash.com/photo-1541427468627-a89a96e5ca1d?w=800&q=80',
  'airport': 'https://images.unsplash.com/photo-1541427468627-a89a96e5ca1d?w=800&q=80',
  'chennai-metro': 'https://images.unsplash.com/photo-1541427468627-a89a96e5ca1d?w=800&q=80',
  'metro': 'https://images.unsplash.com/photo-1541427468627-a89a96e5ca1d?w=800&q=80',
  'vr-chennai': 'https://images.unsplash.com/photo-1519567281799-9712075fc935?w=800&q=80',
  'phoenix-marketcity': 'https://images.unsplash.com/photo-1519567281799-9712075fc935?w=800&q=80',
  'phoenix': 'https://images.unsplash.com/photo-1519567281799-9712075fc935?w=800&q=80',
  'express-avenue': 'https://images.unsplash.com/photo-1519567281799-9712075fc935?w=800&q=80',
  'iit-madras': 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80',
  'anna-university': 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80',
  'marina-beach': 'https://images.unsplash.com/photo-1582510003544-4d00b7f7415e?w=800&q=80',
  'kapaleeshwarar-temple': 'https://images.unsplash.com/photo-1582510003544-4d00b7f7415e?w=800&q=80',
  'fort-st-george': 'https://images.unsplash.com/photo-1523293836414-f04746be8d02?w=800&q=80'
};`;

code = code.replace(/const VENUE_IMAGES: Record<string, string> = \{[\s\S]*?\};\n/, replacement + '\n');
fs.writeFileSync('src/components/ui/venue-image.tsx', code);
console.log('Replaced local hardcoded images in VenueImage');
