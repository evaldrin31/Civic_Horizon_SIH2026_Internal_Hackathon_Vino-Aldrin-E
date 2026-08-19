const fs = require('fs');
const https = require('https');

const titles = {
  'real-chennai-central': 'Chennai_Central_railway_station',
  'real-chennai-airport': 'Chennai_International_Airport',
  'real-metro-agdms': 'Chennai_Metro',
  'real-cmbt': 'CMBT',
  'real-apollo-greams': 'Apollo_Hospitals',
  'real-gh': 'Rajiv_Gandhi_Government_General_Hospital',
  'real-sankara': 'Sankara_Nethralaya',
  'real-miot': 'MIOT_Hospital',
  'real-vr-chennai': 'VR_Chennai',
  'real-phoenix': 'Phoenix_Marketcity_(Chennai)',
  'real-express-avenue': 'Express_Avenue',
  'real-iit-madras': 'IIT_Madras',
  'real-anna-university': 'Anna_University',
  'real-itc-grand-chola': 'ITC_Grand_Chola_Hotel',
  'real-taj-connemara': 'Connemara_Hotel',
  'real-secretariat': 'Fort_St._George,_India',
  'real-high-court': 'Madras_High_Court',
  'real-marina-beach': 'Marina_Beach',
  'real-kapaleeshwarar-temple': 'Kapaleeshwarar_Temple',
  'real-government-museum': 'Government_Museum,_Chennai',
  'real-chennai-metro-alandur': 'Chennai_Metro',
  'real-spencer-plaza': 'Spencer_Plaza'
};

async function fetchWikiImage(title) {
  return new Promise((resolve) => {
    const url = 'https://en.wikipedia.org/w/api.php?action=query&titles=' + encodeURIComponent(title) + '&prop=pageimages&format=json&pithumbsize=800';
    https.get(url, { headers: { 'User-Agent': 'CivicHorizon/1.0 (sih@example.com)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const pages = json.query?.pages;
          if (pages) {
            const page = pages[Object.keys(pages)[0]];
            if (page.thumbnail) return resolve(page.thumbnail.source);
          }
          resolve(null);
        } catch(e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

async function run() {
  const mapping = {};
  for (const [id, title] of Object.entries(titles)) {
    console.log('Fetching', title);
    const img = await fetchWikiImage(title);
    mapping[id] = img;
    await new Promise(r => setTimeout(r, 500)); // Delay to avoid rate limits
  }
  fs.writeFileSync('wiki_images.json', JSON.stringify(mapping, null, 2));
  console.log('Done');
}

run();
