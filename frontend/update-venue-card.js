const fs = require('fs');
let code = fs.readFileSync('src/components/venue-card.tsx', 'utf8');

if (!code.includes('useTTS')) {
  code = code.replace(
    /import Link from "next\/link";/,
    `import Link from "next/link";\nimport { useTTS } from "@/lib/hooks/use-tts";`
  );

  code = code.replace(
    /export function VenueCard\(\{ venue, match \}: VenueCardProps\) \{/,
    `export function VenueCard({ venue, match }: VenueCardProps) {\n  const { speak } = useTTS();`
  );

  code = code.replace(
    /export function CompactVenueCard\(\{ venue, match, onHover \}: VenueCardProps\) \{/,
    `export function CompactVenueCard({ venue, match, onHover }: VenueCardProps) {\n  const { speak } = useTTS();`
  );

  // Add onClick to outer div of VenueCard
  code = code.replace(
    /<div className="group relative bg-card rounded-2xl border border-border overflow-hidden/,
    `<div onClick={() => speak(venue.name)} className="group relative bg-card rounded-2xl border border-border overflow-hidden`
  );

  // Add onClick to outer div of CompactVenueCard
  code = code.replace(
    /<div \n      className=\{cn\(\n        "group relative flex gap-4 bg-card rounded-2xl p-3 border border-border overflow-hidden/,
    `<div \n      onClick={() => speak(venue.name)}\n      className={cn(\n        "group relative flex gap-4 bg-card rounded-2xl p-3 border border-border overflow-hidden`
  );

  fs.writeFileSync('src/components/venue-card.tsx', code);
  console.log('Added TTS to VenueCard');
}
