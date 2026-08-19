const fs = require('fs');
let code = fs.readFileSync('src/components/profile-dropdown.tsx', 'utf8');

if (!code.includes('useTTS')) {
  code = code.replace(
    /import \{ Accessibility, Eye, Ear, Brain, Heart, Check, ChevronDown \} from "lucide-react";/,
    `import { Accessibility, Eye, Ear, Brain, Heart, Check, ChevronDown } from "lucide-react";\nimport { useTTS } from "@/lib/hooks/use-tts";`
  );

  code = code.replace(
    /const \{ profile, setProfile \} = useProfile\(\);/,
    `const { profile, setProfile } = useProfile();\n  const { speak } = useTTS();`
  );

  // When setting profile
  code = code.replace(
    /setProfile\(p\.id\);/,
    `setProfile(p.id);\n                      speak(p.name + " profile selected");`
  );
  
  // When pressing enter on profile
  code = code.replace(
    /if \(e\.key === 'Enter'\) \{[\s\S]*?setProfile\(p\.id\);/,
    `if (e.key === 'Enter') {\n                        e.preventDefault();\n                        setProfile(p.id);\n                        speak(p.name + " profile selected");`
  );

  fs.writeFileSync('src/components/profile-dropdown.tsx', code);
  console.log('Updated profile-dropdown with TTS');
}
