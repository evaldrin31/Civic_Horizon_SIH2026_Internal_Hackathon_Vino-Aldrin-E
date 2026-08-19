const https = require('https');
const topics = ['Wheelchair ramp', 'Tactile paving', 'Accessible toilet', 'Braille', 'Elevator', 'Disabled parking permit', 'Handrail', 'Curb cut'];
topics.forEach(t => {
  https.get('https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&pithumbsize=640&format=json&titles=' + encodeURIComponent(t), { headers: { 'User-Agent': 'CivicHorizon/1.0' } }, res => {
    let d=''; res.on('data', c=>d+=c);
    res.on('end', () => {
      try {
        const page = Object.values(JSON.parse(d).query.pages)[0];
        if (page && page.thumbnail) {
          console.log(`"${page.thumbnail.source}", // ${t}`);
        }
      } catch (e) {}
    });
  });
});
