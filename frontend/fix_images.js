const fs = require('fs');
let code = fs.readFileSync('generate-data.js', 'utf8');

code = code.replace(
  'tourism: "https://upload.wikimedia.org/wikipedia/commons/4/47/Meenakshi_Amman_West_Tower.jpg"',
  'tourism: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Meenakshi_Amman_West_Tower.jpg/800px-Meenakshi_Amman_West_Tower.jpg"'
);
code = code.replace(
  'hospital: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Apollo_Hospitals_Greams_Road_Chennai.jpg"',
  'hospital: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Apollo_Hospitals_Greams_Road_Chennai.jpg/800px-Apollo_Hospitals_Greams_Road_Chennai.jpg"'
);
code = code.replace(
  'transport: "https://upload.wikimedia.org/wikipedia/commons/1/14/Chennai_Central_Railway_Station.jpg"',
  'transport: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Chennai_Central_Railway_Station.jpg/800px-Chennai_Central_Railway_Station.jpg"'
);
code = code.replace(
  'education: "https://upload.wikimedia.org/wikipedia/commons/2/25/NIT_Trichy_Clock_Tower.jpg"',
  'education: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/NIT_Trichy_Clock_Tower.jpg/800px-NIT_Trichy_Clock_Tower.jpg"'
);
code = code.replace(
  'shopping: "https://upload.wikimedia.org/wikipedia/commons/c/ce/Phoenix_Market_City_Chennai.jpg"',
  'shopping: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Phoenix_Market_City_Chennai.jpg/800px-Phoenix_Market_City_Chennai.jpg"'
);

fs.writeFileSync('generate-data.js', code);
console.log('Fixed image URLs');
