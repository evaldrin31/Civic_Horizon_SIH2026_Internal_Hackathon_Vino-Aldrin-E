const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Add imports
code = code.replace(
  /import { \n    Accessibility, MapPin, Eye, Ear, Brain, ArrowRight, \n    Building2, Shield, Star, Search, ShoppingBag, Bus, \n    Bed, GraduationCap, Activity\n  } from "lucide-react";/g,
  `import { 
    Accessibility, MapPin, Eye, Ear, Brain, ArrowRight, 
    Building2, Shield, Star, Search, ShoppingBag, Bus, 
    Bed, GraduationCap, Activity, Sparkles, TreePine, Landmark
  } from "lucide-react";`
);

// 2. Update CATEGORIES
const newCategories = `const CATEGORIES = [
  { id: "hospital", label: "Hospital", Icon: Activity, color: "text-rose-600", bg: "bg-rose-50", hoverBg: "hover:bg-rose-100", border: "border-rose-200", activeBg: "bg-rose-600", activeText: "text-white" },
  { id: "shopping", label: "Shopping", Icon: ShoppingBag, color: "text-fuchsia-600", bg: "bg-fuchsia-50", hoverBg: "hover:bg-fuchsia-100", border: "border-fuchsia-200", activeBg: "bg-fuchsia-600", activeText: "text-white" },
  { id: "transport", label: "Transport", Icon: Bus, color: "text-blue-600", bg: "bg-blue-50", hoverBg: "hover:bg-blue-100", border: "border-blue-200", activeBg: "bg-blue-600", activeText: "text-white" },
  { id: "education", label: "Education", Icon: GraduationCap, color: "text-amber-600", bg: "bg-amber-50", hoverBg: "hover:bg-amber-100", border: "border-amber-200", activeBg: "bg-amber-600", activeText: "text-white" },
  { id: "devotional", label: "Devotional", Icon: Sparkles, color: "text-orange-600", bg: "bg-orange-50", hoverBg: "hover:bg-orange-100", border: "border-orange-200", activeBg: "bg-orange-600", activeText: "text-white" },
  { id: "nature", label: "Nature", Icon: TreePine, color: "text-green-600", bg: "bg-green-50", hoverBg: "hover:bg-green-100", border: "border-green-200", activeBg: "bg-green-600", activeText: "text-white" },
  { id: "tourism", label: "Tourism", Icon: Landmark, color: "text-indigo-600", bg: "bg-indigo-50", hoverBg: "hover:bg-indigo-100", border: "border-indigo-200", activeBg: "bg-indigo-600", activeText: "text-white" }
];`;

code = code.replace(/const CATEGORIES = \[\s*\{ id: "hospital".*?\{ id: "education".*?\}\s*,\s*\];/s, newCategories);

// 3. Update useEffect logic
const oldEffect = `  useEffect(() => {
    setIsLoading(false);
    const ranked = rankVenuesForProfile(getDemoVenues(), profile);
    setDisplayVenues(ranked.slice(0, 6));

    // Enhanced GSAP Recommendation Card Entrance
    if (containerRef.current) {`;

const newEffect = `  useEffect(() => {
    setIsLoading(false);
    let venues = getDemoVenues();
    
    if (activeCategory) {
      venues = venues.filter(v => v.category.toLowerCase() === activeCategory);
    }
    
    const ranked = rankVenuesForProfile(venues, profile);
    setDisplayVenues(ranked.slice(0, 6));

    // Enhanced GSAP Recommendation Card Entrance
    if (containerRef.current) {`;

code = code.replace(oldEffect, newEffect);

// 4. Also update the dependency array of that useEffect
code = code.replace(/overwrite: "auto" }\n        \);\n      }\n    }, \[profile\]\);/g, 'overwrite: "auto" }\n        );\n      }\n    }, [profile, activeCategory]);');

fs.writeFileSync('src/app/page.tsx', code);
console.log('Updated page.tsx logic');
