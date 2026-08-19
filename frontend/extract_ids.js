const fs = require('fs');
const content = fs.readFileSync('src/lib/real-venues.ts', 'utf-8');
const venues = content.split('venue_id:');
for (const v of venues) {
  if (v.includes('name:')) {
    const nameMatch = v.match(/name:\s*"(.*?)"/);
    const idMatch = v.match(/^\s*"(.*?)"/);
    console.log((idMatch ? idMatch[1] : 'unknown').padEnd(30), '->', nameMatch[1]);
  }
}
