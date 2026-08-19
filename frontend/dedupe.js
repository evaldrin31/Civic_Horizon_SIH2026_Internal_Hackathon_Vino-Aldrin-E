const fs = require('fs');
let text = fs.readFileSync('src/lib/real-venues.ts', 'utf8');

// The regex will look for two adjacent imageUrl/imageSource blocks and replace with one
text = text.replace(/(imageUrl:\s*"[^"]*",\s*imageSource:\s*"[^"]*",\s*)imageUrl:\s*"[^"]*",\s*imageSource:\s*"[^"]*",/g, '$1');

fs.writeFileSync('src/lib/real-venues.ts', text);
console.log("Done");
