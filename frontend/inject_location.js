const fs = require('fs');
let code = fs.readFileSync('src/components/layout.tsx', 'utf8');

const importStatement = 'import { CurrentLocationIndicator } from "@/components/current-location";\n';
if (!code.includes('CurrentLocationIndicator')) {
  // Put it right after use client
  code = code.replace('"use client";\n', '"use client";\n' + importStatement);
}

code = code.replace(
  '        </div>\n\n        <div className="flex flex-1 flex-col overflow-y-auto py-5 px-3">',
  '        </div>\n        <CurrentLocationIndicator />\n\n        <div className="flex flex-1 flex-col overflow-y-auto py-5 px-3">'
);

code = code.replace(
  '      </header>\n    );\n  }\n\nimport { useA11yTTS } from "@/lib/hooks/use-a11y-tts";\n\nexport function AppLayout',
  '        <CurrentLocationIndicator isMobile={true} />\n      </header>\n    );\n  }\n\nimport { useA11yTTS } from "@/lib/hooks/use-a11y-tts";\n\nexport function AppLayout'
);

fs.writeFileSync('src/components/layout.tsx', code);
console.log('Injected location indicator');
