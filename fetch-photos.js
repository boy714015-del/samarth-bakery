/* Downloads a free-licensed photo per product from Wikimedia Commons into images/.
   Run once (internet needed):  npm run photos
   Then restart the server. Photos that fail are skipped (the drawing stays).
   Review the photos; replace any wrong one from Admin > Products > Edit.
   Credits are saved in images/CREDITS.txt */
const fs = require('fs'), path = require('path');
const UA = { 'User-Agent': 'SamarthBakery/1.0 (local shop project)' };
const ITEMS = {
  'birthday-cake': 'birthday cake candles', 'chocolate-cake': 'chocolate cake slice',
  'pineapple-cake': 'pineapple cake', 'pastry': 'pastry cake slice', 'bread': 'loaf of bread',
  'bun': 'bread bun rolls', 'cream-roll': 'cream roll pastry', 'cookies': 'chocolate chip cookies',
  'khari': 'khari biscuit', 'toast': 'toast bread slices', 'puffs': 'puff pastry', 'donuts': 'doughnuts'
};
(async () => {
  const credits = [];
  for (const [slug, q] of Object.entries(ITEMS)) {
    try {
      const url = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url&iiurlwidth=640&gsrsearch=' + encodeURIComponent(q);
      const d = await (await fetch(url, { headers: UA })).json();
      const p = Object.values(d.query.pages).sort((a, b) => a.index - b.index).find(x => /\.jpe?g$/i.test(x.title) && x.imageinfo);
      const ii = p.imageinfo[0];
      const img = await fetch(ii.thumburl, { headers: UA });
      fs.writeFileSync(path.join(__dirname, 'images', slug + '.jpg'), Buffer.from(await img.arrayBuffer()));
      credits.push(slug + ': ' + p.title + ' - ' + ii.descriptionurl);
      console.log('OK  ', slug);
    } catch (e) { console.log('SKIP', slug, '-', e.message); }
  }
  fs.writeFileSync(path.join(__dirname, 'images', 'CREDITS.txt'), credits.join('\n'));
  console.log('\nDone. Restart the server (npm start).');
})();
