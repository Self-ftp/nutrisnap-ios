import axios from 'axios';

const queries = [
  'Фаршированные перцы',
  'Картофель по-деревенски',
  'Плов с курицей',
  'Гречка с грибами',
  'Борщ в мультиварке',
  'Омлет со шпинатом',
  'Овощная фриттата',
  'Овсяноблин',
  'Оладьи из кабачков'
];

async function searchFoodImage(q) {
  try {
    const searchUrl = `https://yandex.ru/images/search?text=${encodeURIComponent(q + " еда готовое блюдо на тарелке фуд-фотография")}&type=photo`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 5000
    });

    const matches = response.data.match(/"img_url":"(https:\/\/[^"]+)"/g);
    if (matches && matches.length > 0) {
      let url = matches[0].match(/"img_url":"(https:\/\/[^"]+)"/)[1];
      url = url.replace(/\\u[\dA-F]{4}/gi, (m) => String.fromCharCode(parseInt(m.replace(/\\u/g, ''), 16)));
      return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=600&h=400&fit=cover&output=jpg&q=80`;
    }
  } catch (error) {
    console.error("Image search error:", error.message);
  }
  return `https://loremflickr.com/600/400/food,${encodeURIComponent(q.split(' ')[0])}`;
}

async function run() {
  for (const q of queries) {
    const url = await searchFoodImage(q);
    console.log(`${q} -> ${url}`);
  }
}

run();
