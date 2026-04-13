const fs = require('fs');

const content = fs.readFileSync('src/constants.ts', 'utf-8');
const urls = content.match(/https:\/\/images\.unsplash\.com\/[^\s'"]+/g);

async function checkUrls() {
  for (const url of [...new Set(urls)]) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.status !== 200) {
        console.log(`Broken URL: ${url}`);
      }
    } catch (e) {
      console.log(`Error checking URL: ${url}`);
    }
  }
}

checkUrls();
