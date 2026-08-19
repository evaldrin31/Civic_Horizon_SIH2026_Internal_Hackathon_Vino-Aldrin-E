const fs = require('fs');

// Fix demo-data.ts
let demoData = fs.readFileSync('src/lib/demo-data.ts', 'utf8');
demoData = demoData.replace(/fuzzyMatch\(term, subDistrict, 2\)/g, 'fuzzyMatch(term, subDistrict)');
demoData = demoData.replace(/fuzzyMatch\(query, v\.name, 2\)/g, 'fuzzyMatch(query, v.name)');
demoData = demoData.replace(/name: "Accessible Entrance"/g, '');
demoData = demoData.replace(/category: "vision"/g, 'category: "mobility"');
demoData = demoData.replace(/id: "ev1"/g, 'evidence_id: "ev1"');
fs.writeFileSync('src/lib/demo-data.ts', demoData);

// Fix use-speech.ts
let useSpeech = fs.readFileSync('src/lib/hooks/use-speech.ts', 'utf8');
useSpeech = useSpeech.replace(/\(window as unknown\)/g, '(window as any)');
useSpeech = useSpeech.replace(/event: unknown/g, 'event: any');
fs.writeFileSync('src/lib/hooks/use-speech.ts', useSpeech);

// Fix scoring.ts
let scoring = fs.readFileSync('src/lib/scoring.ts', 'utf8');
scoring = scoring.replace(/const confidenceWeight = venue\.confidence \/ 100;/g, 'const confidenceWeight = (venue.confidence || 0) / 100;');
fs.writeFileSync('src/lib/scoring.ts', scoring);

console.log('Fixed more TS errors');
