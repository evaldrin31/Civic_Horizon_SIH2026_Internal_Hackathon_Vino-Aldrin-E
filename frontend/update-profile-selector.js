const fs = require('fs');
let code = fs.readFileSync('src/components/profile-selector.tsx', 'utf8');

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
    /setProfile\(p\.id\);/g,
    `setProfile(p.id); speak(p.name + " profile selected");`
  );

  fs.writeFileSync('src/components/profile-selector.tsx', code);
  console.log('Updated profile-selector with TTS');
}
