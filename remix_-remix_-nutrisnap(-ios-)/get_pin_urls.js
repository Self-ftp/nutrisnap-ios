import https from 'https';

function getRedirect(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(res.headers.location);
      } else {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }
    }).on('error', reject);
  });
}

async function run() {
  const url1 = await getRedirect('https://pin.it/2aj00xysk');
  const url2 = await getRedirect('https://pin.it/6DovDcBmO');
  console.log('Buckwheat:', url1);
  console.log('Oatmeal:', url2);
}

run();
