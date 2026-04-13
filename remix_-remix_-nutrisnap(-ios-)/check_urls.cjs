const https = require('https');

const urls = [
  'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=800&q=80',
  'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
  'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=800&q=80',
  'https://images.unsplash.com/photo-1590779033100-9f60705a2f3b?w=800&q=80',
  'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&q=80',
  'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80',
  'https://images.unsplash.com/photo-1518013031637-61c453967b3f?w=800&q=80',
  'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=800&q=80',
  'https://images.unsplash.com/photo-1512058560366-cd242959b4fe?w=800&q=80',
  'https://images.unsplash.com/photo-1594973474191-3647f374783b?w=800&q=80',
  'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=800&q=80',
  'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
  'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&q=80',
  'https://images.unsplash.com/photo-1594759071442-5fe5022603a5?w=800&q=80',
  'https://images.unsplash.com/photo-1510629954389-c1e0da47d4ec?w=800&q=80',
  'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&q=80',
  'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80',
  'https://images.unsplash.com/photo-1594834002982-0400117556eb?w=800&q=80',
  'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=800&q=80',
  'https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=800&q=80',
  'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=800&q=80',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7bb7445?w=800&q=80',
  'https://images.unsplash.com/photo-1514516348920-f319999a5e5f?w=800&q=80'
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ url, status: res.statusCode });
    }).on('error', (e) => {
      resolve({ url, status: e.message });
    });
  });
}

async function run() {
  for (const url of urls) {
    const result = await checkUrl(url);
    console.log(`${result.status} - ${result.url}`);
  }
}

run();
