const https = require('https');

https.get('https://agentsentry-eta.vercel.app/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('HTML content loaded.');
    const match = data.match(/src="(\/assets\/index-[^"]+\.js)"/);
    if (match) {
      const jsUrl = 'https://agentsentry-eta.vercel.app' + match[1];
      console.log('Fetching JS from:', jsUrl);
      https.get(jsUrl, (res2) => {
        let jsData = '';
        res2.on('data', c => jsData += c);
        res2.on('end', () => {
          console.log('Searching addresses in bundle...');
          const found8C = jsData.includes('0x8C63E2ec5Df199024b82E4f289aEF645b93893Ee');
          const found90 = jsData.includes('0x90dbdC2caA70f014867C7a6C85A918fA6f74C810');
          const found2a = jsData.includes('0x2aEaFC5C6e2e9967B19b82707537b3798C2F4b7e');
          console.log('Contains 0x8C63E2 (latest):', found8C);
          console.log('Contains 0x90dbdC (first):', found90);
          console.log('Contains 0x2aEaFC (second):', found2a);
        });
      });
    }
  });
});
