const https = require('https');
https.get('https://mahurzari-village-water-portal.vercel.app/', (r) => {
  let body = '';
  r.on('data', c => body += c);
  r.on('end', () => {
    console.log('Status:', r.statusCode);
    console.log('Length:', body.length);
    console.log('Contains root:', body.includes('id="root"'));
    console.log('Contains view-home:', body.includes('id="view-home"'));
    console.log('Contains index-BhZxoemH:', body.includes('index-BhZxoemH'));
    console.log('Contains index-4dAo47fc:', body.includes('index-4dAo47fc'));
    console.log('Title:', body.match(/<title>(.*?)<\/title>/)?.[1]);
    console.log('Script tags:', body.match(/<script.*?src=".*?".*?>/g));
  });
});
