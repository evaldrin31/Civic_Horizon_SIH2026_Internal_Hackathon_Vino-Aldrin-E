const fs = require('fs');
let code = fs.readFileSync('src/components/layout.tsx', 'utf8');

// Remove the erroneous import at the very top
code = code.replace('import { useA11yTTS } from "@/lib/hooks/use-a11y-tts";\n', '');

// Place it right after 'use client';
code = code.replace('"use client";', '"use client";\nimport { useA11yTTS } from "@/lib/hooks/use-a11y-tts";');

fs.writeFileSync('src/components/layout.tsx', code);
console.log('Fixed use client directive');
