const fs = require('fs');
let code = fs.readFileSync('src/lib/real-venues.ts', 'utf8');
code = code.replace(/\s*pincode:\s*"",/g, '');
fs.writeFileSync('src/lib/real-venues.ts', code);
console.log('Fixed pincode error');
