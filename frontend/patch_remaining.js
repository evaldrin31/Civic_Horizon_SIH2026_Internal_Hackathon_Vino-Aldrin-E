const fs = require('fs');

const missing = {
  "real-chennai-metro-ag-dms": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Alstom_Metropolis_train-set_at_Guindy_Metro_station_in_Chennai.jpg/960px-Alstom_Metropolis_train-set_at_Guindy_Metro_station_in_Chennai.jpg",
  "real-govt-general-hospital": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/GovernmentHospitalChennai.JPG/960px-GovernmentHospitalChennai.JPG",
  "real-sankara-nethralaya": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Shankara_Nethraalaya_Chennai.jpg/960px-Shankara_Nethraalaya_Chennai.jpg",
  "real-miot-hospital": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/MIOT.JPG/960px-MIOT.JPG",
  "real-phoenix-marketcity": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Phoenix_Market_City_%2821812542780%29.jpg/960px-Phoenix_Market_City_%2821812542780%29.jpg",
  "real-apollo-greams": "https://upload.wikimedia.org/wikipedia/commons/4/4b/Apollo_Hospitals_Chennai.jpg",
  "real-iit-madras": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/IIT_Madras_Admin_Block.jpg/1280px-IIT_Madras_Admin_Block.jpg",
  "real-taj-connemara": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Hotel_Taj_Connemara%2C_Chennai%2C_India.jpg/960px-Hotel_Taj_Connemara%2C_Chennai%2C_India.jpg"
};

let code = fs.readFileSync('src/lib/real-venues.ts', 'utf8');

for (const [id, url] of Object.entries(missing)) {
  const regex = new RegExp('(venue_id:\\s*"' + id + '",[\\s\\S]*?accessibilityScore:\\s*\\d+,?)', 'g');
  code = code.replace(regex, '$1\n    imageUrl: "' + url + '",\n    imageSource: "Wikimedia Commons",');
}

fs.writeFileSync('src/lib/real-venues.ts', code);
console.log('Patched the rest!');
