const fs = require('fs');
let content = fs.readFileSync('tailwind.config.ts', 'utf8');

// Remove hardcoded hexes
content = content.replace(/"background": "#f8f9ff",/g, '');
content = content.replace(/"primary": "#003594",/g, '');
content = content.replace(/"secondary": "#00687a",/g, '');

// Inject HSL definitions at the bottom block
const injection = `
        background: "hsl(var(--background))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
`;
content = content.replace(/border: "hsl\(var\(--border\)\)",/, injection + '        border: "hsl(var(--border))",');

fs.writeFileSync('tailwind.config.ts', content);
console.log('Fixed tailwind.config.ts');
