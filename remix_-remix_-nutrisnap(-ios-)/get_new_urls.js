import axios from 'axios';
import fs from 'fs';

const badUrls = [
  'https://images.unsplash.com/photo-1590779033100-9f60705a2f3b?w=800&q=80', // Фаршированные перцы
  'https://images.unsplash.com/photo-1518013031637-61c453967b3f?w=800&q=80', // Картофель по-деревенски
  'https://images.unsplash.com/photo-1512058560366-cd242959b4fe?w=800&q=80', // Плов с курицей
  'https://images.unsplash.com/photo-1594973474191-3647f374783b?w=800&q=80', // Гречка с грибами
  'https://images.unsplash.com/photo-1594759071442-5fe5022603a5?w=800&q=80', // Борщ в мультиварке
  'https://images.unsplash.com/photo-1510629954389-c1e0da47d4ec?w=800&q=80', // Омлет со шпинатом
  'https://images.unsplash.com/photo-1594834002982-0400117556eb?w=800&q=80', // Овощная фриттата
  'https://images.unsplash.com/photo-1567620905732-2d1ec7bb7445?w=800&q=80', // Овсяноблин
  'https://images.unsplash.com/photo-1514516348920-f319999a5e5f?w=800&q=80'  // Оладьи из кабачков
];

const queries = [
  'stuffed peppers',
  'roasted potatoes',
  'chicken rice pilaf',
  'buckwheat mushrooms',
  'borscht soup',
  'spinach omelette',
  'vegetable frittata',
  'oatmeal pancake',
  'zucchini fritters'
];

async function getNewUrls() {
  for (let i = 0; i < queries.length; i++) {
    try {
      const response = await axios.get(`https://api.unsplash.com/search/photos`, {
        params: { query: queries[i], per_page: 1, orientation: 'landscape' },
        headers: {
          Authorization: `Client-ID 7v-1yS9-rFp4B-i_P2j3y_r8k-b_u7-y_m-s_u_y_k_o` // Random fake client ID? No, I need a real one or just use source.unsplash.com? source.unsplash.com is deprecated.
        }
      });
      console.log(`${queries[i]} -> ${response.data.results[0].urls.regular}`);
    } catch (e) {
      console.log(`Failed for ${queries[i]}`);
    }
  }
}

getNewUrls();
