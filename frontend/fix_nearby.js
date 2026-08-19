const fs = require('fs');
let code = fs.readFileSync('src/app/nearby/page.tsx', 'utf8');

code = code.replace(
  'getNearbyDemoVenues,',
  'getNearbyDemoVenues,\n  getDemoVenues,'
);

const oldFiltered = `  const filteredVenues = useMemo(() => {
    let result = allVenues;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.city?.toLowerCase().includes(q) ||
        v.category?.toLowerCase().includes(q)
      );
    }`;

const newFiltered = `  const filteredVenues = useMemo(() => {
    // If there's a search query, search across ALL cities in the dataset
    // Otherwise, just show the nearby venues (allVenues)
    let result = searchQuery.trim() ? getDemoVenues() as DemoVenue[] : allVenues;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(v =>
        fuzzyMatch(v.name, q) ||
        fuzzyMatch(v.city || '', q) ||
        fuzzyMatch(v.category || '', q)
      );
    }`;

code = code.replace(oldFiltered, newFiltered);
fs.writeFileSync('src/app/nearby/page.tsx', code);
console.log('Fixed filteredVenues');
