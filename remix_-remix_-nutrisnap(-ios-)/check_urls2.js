import https from 'https';

const urls = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80',
  'https://images.unsplash.com/photo-1484723091791-00d31210878e?w=800&q=80',
  'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=800&q=80',
  'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80',
  'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&q=80',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=800&q=80',
  'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=800&q=80',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=80'
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      resolve({ url, status: res.statusCode });
    }).on('error', (e) => {
      resolve({ url, status: e.message });
    });
    req.setTimeout(2000, () => {
      req.destroy();
      resolve({ url, status: 'timeout' });
    });
  });
}

async function run() {
  const promises = urls.map(url => checkUrl(url));
  const results = await Promise.all(promises);
  for (const result of results) {
    console.log(`${result.status} - ${result.url}`);
  }
}

run();
