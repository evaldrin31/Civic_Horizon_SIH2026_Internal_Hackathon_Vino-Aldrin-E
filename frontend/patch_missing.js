const fs = require('fs');
const images = JSON.parse(fs.readFileSync('missing_images.json', 'utf8'));
let code = fs.readFileSync('src/lib/real-venues.ts', 'utf8');
for (const [id, url] of Object.entries(images)) {
  if (!url) continue;
  const regex = new RegExp('(venue_id:\\s*"' + id + '",[\\s\\S]*?accessibilityScore:\\s*\\d+,?)', 'g');
  code = code.replace(regex, '$1\n    imageUrl: "' + url + '",\n    imageSource: "Wikimedia Commons",');
}
fs.writeFileSync('src/lib/real-venues.ts', code);
console.log('Done');
