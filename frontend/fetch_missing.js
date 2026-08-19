const https = require('https');
const fs = require('fs');

const missing = {
  'real-metro-agdms': 'Chennai Metro',
  'real-cmbt': 'Chennai Mofussil Bus Terminus',
  'real-apollo-greams': 'Apollo Hospitals Chennai',
  'real-gh': 'Rajiv Gandhi Government General Hospital Chennai',
  'real-sankara': 'Sankara Nethralaya Chennai',
  'real-miot': 'MIOT Hospital Chennai',
  'real-phoenix': 'Phoenix Marketcity Chennai',
  'real-iit-madras': 'IIT Madras',
  'real-taj-connemara': 'Connemara Hotel',
  'real-secretariat': 'Fort St. George, India'
};

function fetchWikiImageBySearch(query) {
  return new Promise((resolve) => {
    const url = 'https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=' + encodeURIComponent(query) + '&gsrlimit=1&prop=pageimages&format=json&pithumbsize=800';
    https.get(url, { headers: { 'User-Agent': 'CivicHorizon/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const pages = json.query?.pages;
          if (pages) {
            const page = Object.values(pages)[0];
            if (page.thumbnail) return resolve(page.thumbnail.source);
          }
          resolve(null);
        } catch(e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

async function run() {
  const results = {};
  for (const [id, query] of Object.entries(missing)) {
    console.log('Searching', query);
    const img = await fetchWikiImageBySearch(query);
    if (img) {
      results[id] = img;
      console.log(' Found:', img);
    } else {
      console.log(' Not found');
    }
  }
  fs.writeFileSync('missing_images.json', JSON.stringify(results, null, 2));
}

run();
