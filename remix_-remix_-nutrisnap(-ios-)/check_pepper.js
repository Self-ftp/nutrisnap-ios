import https from 'https';

const urls = [
  'https://images.unsplash.com/photo-1582515073490-39981397c445?w=800&q=80',
  'https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?w=800&q=80',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80'
];

urls.forEach(url => {
  https.get(url, (res) => {
    console.log(url, res.statusCode);
  });
});
