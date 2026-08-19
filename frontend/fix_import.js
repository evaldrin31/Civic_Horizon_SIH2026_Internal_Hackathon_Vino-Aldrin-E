const fs = require('fs');
let code = fs.readFileSync('src/components/layout.tsx', 'utf8');
code = code.replace('\nimport { useA11yTTS } from "@/lib/hooks/use-a11y-tts";\n', '');
code = 'import { useA11yTTS } from "@/lib/hooks/use-a11y-tts";\n' + code;
fs.writeFileSync('src/components/layout.tsx', code);
console.log('Moved import');
