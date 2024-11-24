const axios = require('axios');
const fs = require('fs');
const { sendMessage } = require('../handles/sendMessage');

const tokenPath = './token.txt';
const pageAccessToken = fs.readFileSync(tokenPath, 'utf8').trim();

const API_KEY = 'AIzaSyC_gYM4M6Fp1AOYra_K_-USs0SgrFI08V0';
const SEARCH_ENGINE_ID = 'e01c6428089ea4702';
const MAX_IMAGES = 9;

const badWords = new Set(
[ "gay", "add more" ]
);

module.exports = {
  name: 'gmage',
  description: 'Search images in google.',
  usage: '-gmage <search_query>',
  author: 'coffee',

  async execute(senderId, args) {
    const searchQuery = args.join(' ').trim();
    if (!searchQuery) {
      return sendMessage(senderId, { text: '📷 | Format: -gmage <search_query>' }, pageAccessToken);
    }
    if (containsBadWords(searchQuery)) {
      return sendMessage(senderId, { text: '❎ | NSFW Prompt Detected' }, pageAccessToken);
    }

    try {
      const imageUrls = await fetchImageUrls(searchQuery);
      if (!imageUrls.length) {
        return sendMessage(senderId, { text: `📷 | No images found for "${searchQuery}".` }, pageAccessToken);
      }

      // Send each image as an attachment one at a time
      for (const url of imageUrls) {
        await sendImage(senderId, url, pageAccessToken);
      }

    } catch {
      sendMessage(senderId, { text: '📷 | Can\'t get your images atm, do try again later...' }, pageAccessToken);
    }
  }
};

// Fetch image URLs from Google Custom Search API
async function fetchImageUrls(query) {
  const { data } = await axios.get(`https://www.googleapis.com/customsearch/v1`, {
    params: {
      key: API_KEY,
      cx: SEARCH_ENGINE_ID,
      q: query,
      searchType: 'image',
      num: MAX_IMAGES
    }
  });
  return data.items ? data.items.map(item => item.link) : [];
}

// Send image as an attachment
async function sendImage(senderId, url, pageAccessToken) {
  return sendMessage(senderId, { attachment: { type: 'image', payload: { url } } }, pageAccessToken);
}

// Function to check if the query contains bad words
function containsBadWords(query) {
  return [...badWords].some(badWord => query.toLowerCase().includes(badWord));
}
