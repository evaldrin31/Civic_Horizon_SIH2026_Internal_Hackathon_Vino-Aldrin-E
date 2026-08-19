const fs = require('fs');
const files = [
  'src/app/page.tsx',
  'src/components/venue-card.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/nearby/page.tsx',
  'src/app/venues/[id]/page.tsx'
];

const replacements = {
  'bg-white/80': 'bg-background/80 dark:bg-black/80',
  'bg-white/70': 'bg-background/70 dark:bg-black/70',
  'bg-white/40': 'bg-background/40 dark:bg-black/40',
  'bg-white': 'bg-card',
  'bg-slate-50': 'bg-muted',
  'bg-slate-100': 'bg-muted',
  'text-slate-900': 'text-foreground',
  'text-slate-800': 'text-foreground',
  'text-slate-700': 'text-foreground',
  'text-slate-600': 'text-muted-foreground',
  'text-slate-500': 'text-muted-foreground',
  'text-slate-400': 'text-muted-foreground',
  'text-slate-300': 'text-muted-foreground',
  'border-slate-200': 'border-border',
  'border-slate-100': 'border-border',
  'border-white/50': 'border-border/50',
  'from-blue-50/80': 'from-primary/5',
  'via-white': 'via-background',
  'to-white': 'to-background'
};

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  for (const [key, value] of Object.entries(replacements)) {
    // We use a regex with word boundaries for most things except slashes which are trickier
    const regex = new RegExp(key.replace(/\//g, '\\\\/'), 'g');
    content = content.replace(regex, value);
  }
  fs.writeFileSync(file, content);
});
console.log('Fixed themes');
