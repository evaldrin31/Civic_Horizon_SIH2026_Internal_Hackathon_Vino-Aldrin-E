const fs = require('fs');
const content = fs.readFileSync('src/lib/real-venues.ts', 'utf-8');
const venues = content.split('venue_id:');
for (const v of venues) {
  if (v.includes('name:')) {
    const nameMatch = v.match(/name:\s*"(.*?)"/);
    const hasImage = v.includes('imageUrl:');
    if (nameMatch) {
      console.log(nameMatch[1].padEnd(45) + (hasImage ? '✅ HAS IMAGE' : '❌ NO IMAGE'));
    }
  }
}
