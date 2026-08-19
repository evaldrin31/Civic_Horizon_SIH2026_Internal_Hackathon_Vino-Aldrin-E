const fs = require('fs');

// Fix demo-data.ts type error
let demoData = fs.readFileSync('src/lib/demo-data.ts', 'utf8');
demoData = demoData.replace(
  /const DEMO_VENUES_DATA: DemoVenue\[\] = data\.venues as DemoVenue\[\];/,
  'const DEMO_VENUES_DATA: DemoVenue[] = data.venues as unknown as DemoVenue[];'
);
fs.writeFileSync('src/lib/demo-data.ts', demoData);

// Fix profile-selector.tsx speak
let profileSelector = fs.readFileSync('src/components/profile-selector.tsx', 'utf8');
profileSelector = profileSelector.replace(
  /setProfile\(val === "none" \? null : val\);/,
  'setProfile(val === "none" ? null : val);\n      speak(val === "none" ? "Profile cleared" : val + " profile selected");'
);
fs.writeFileSync('src/components/profile-selector.tsx', profileSelector);

console.log('Fixed TS issues');
