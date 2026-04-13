import axios from 'axios';

async function findImage(query) {
  try {
    const response = await axios.get(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=YOUR_UNSPLASH_KEY`);
    // wait I don't have an unsplash key.
  } catch (e) {}
}
