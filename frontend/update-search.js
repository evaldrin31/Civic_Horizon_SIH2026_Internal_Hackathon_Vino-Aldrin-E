const fs = require('fs');
let code = fs.readFileSync('src/components/search-bar.tsx', 'utf8');

// Import useTTS
if (!code.includes('useTTS')) {
  code = code.replace(
    /import \{ useState, useEffect, useRef, KeyboardEvent \} from "react";/,
    `import { useState, useEffect, useRef, KeyboardEvent } from "react";\nimport { useTTS } from "@/lib/hooks/use-tts";`
  );
  
  // Inside SearchBar component
  code = code.replace(
    /const searchContainerRef = useRef<HTMLDivElement>\(null\);/,
    `const searchContainerRef = useRef<HTMLDivElement>(null);\n  const { speak } = useTTS();`
  );

  // Search button
  code = code.replace(
    /<Button \n            type="submit"/,
    `<Button \n            type="submit"\n            onClick={() => speak("Searching for venues")}`
  );

  // Near Me button
  code = code.replace(
    /onClick=\{\(\) => \{[\s\S]*?onLocationSearch\(\);[\s\S]*?\}\}/,
    `onClick={(e) => {\n              speak("Locating near me");\n              e.preventDefault();\n              onLocationSearch();\n            }}`
  );

  // Mic button
  code = code.replace(
    /<button\n              type="button"\n              onClick=\{startListening\}/,
    `<button\n              type="button"\n              onClick={() => {\n                speak("Listening for voice search");\n                startListening();\n              }}`
  );

  fs.writeFileSync('src/components/search-bar.tsx', code);
  console.log('Updated SearchBar with TTS');
}
