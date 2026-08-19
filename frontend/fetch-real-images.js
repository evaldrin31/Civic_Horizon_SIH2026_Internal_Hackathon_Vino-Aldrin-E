const fs = require('fs');
const https = require('https');

const allVenues = JSON.parse(fs.readFileSync('src/lib/data/all-venues.json', 'utf8'));

async function fetchWikiImage(query) {
  return new Promise((resolve) => {
    // Search Wikipedia for the page
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&srlimit=1`;
    
    https.get(searchUrl, { headers: { 'User-Agent': 'CivicHorizon/1.0 (test@example.com)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.query && parsed.query.search && parsed.query.search.length > 0) {
            const title = parsed.query.search[0].title;
            // Now get the image for this page
            const imageUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=800`;
            
            https.get(imageUrl, { headers: { 'User-Agent': 'CivicHorizon/1.0 (test@example.com)' } }, (imgRes) => {
              let imgData = '';
              imgRes.on('data', chunk => imgData += chunk);
              imgRes.on('end', () => {
                try {
                  const imgParsed = JSON.parse(imgData);
                  const pages = imgParsed.query.pages;
                  const pageId = Object.keys(pages)[0];
                  if (pages[pageId].thumbnail && pages[pageId].thumbnail.source) {
                    resolve(pages[pageId].thumbnail.source);
                  } else {
                    resolve(null);
                  }
                } catch (e) { resolve(null); }
              });
            }).on('error', () => resolve(null));
            
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function processVenues() {
  console.log('Starting Wikipedia image fetching for', allVenues.venues.length, 'venues...');
  let successCount = 0;
  
  for (let i = 0; i < allVenues.venues.length; i++) {
    const venue = allVenues.venues[i];
    console.log(`[${i+1}/${allVenues.venues.length}] Fetching image for: ${venue.name}`);
    
    // Clean up query: remove generic words to improve search
    let query = venue.name;
    
    let imageUrl = await fetchWikiImage(query);
    
    // If exact name fails, try name + city
    if (!imageUrl) {
      imageUrl = await fetchWikiImage(venue.name + ' ' + venue.city);
    }
    
    // If that fails, try just the city to at least get a realistic local photo
    if (!imageUrl) {
      console.log(`  -> Exact match failed. Fetching city image for: ${venue.city}`);
      imageUrl = await fetchWikiImage(venue.city + ' Tamil Nadu');
    }
    
    if (imageUrl) {
      venue.imageUrl = imageUrl;
      successCount++;
      console.log(`  -> Found: ${imageUrl}`);
    } else {
      console.log(`  -> FAILED to find any image.`);
    }
    
    // small delay to not hammer Wikipedia API
    await new Promise(r => setTimeout(r, 200));
  }
  
  fs.writeFileSync('src/lib/data/all-venues.json', JSON.stringify(allVenues, null, 2));
  console.log(`\nFinished! Found real images for ${successCount} out of ${allVenues.venues.length} venues.`);
}

processVenues();
