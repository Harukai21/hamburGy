const axios = require('axios');

module.exports = {
  name: 'ai',
  description: 'Handles AI responses for incoming messages, images, and documents',
  author: 'Biru',
  usage: 'ask any questions without the command name',

  async execute(senderId, args, pageAccessToken, sendMessage) {
    if (args.length === 0) {
      await sendMessage(senderId, { text: 'How may I assist you today?' }, pageAccessToken);
      return;
    }
    
    const userMessage = args ? (Array.isArray(args) ? args.join(' ') : args) : '';
    let apiUrl;

    try {
      // Detect and handle image or document recognition commands
      if (userMessage.startsWith('explain_or_answer:')) {
        const imageUrl = userMessage.replace('explain_or_answer:', '');
        apiUrl = `https://vneerapi.onrender.com/bot?prompt=${encodeURIComponent(imageUrl)}&uid=${senderId}`;
      } else if (userMessage.startsWith('process_file:')) {
        const fileUrl = userMessage.replace('process_file:', '');
        apiUrl = `https://vneerapi.onrender.com/bot?prompt=${encodeURIComponent(fileUrl)}&uid=${senderId}`;
      } else {
        apiUrl = `https://vneerapi.onrender.com/bot?prompt=${encodeURIComponent(userMessage)}&uid=${senderId}`;
      }

      // Retry logic for the API call
      const response = await retryRequest(() => axios.get(apiUrl), 3, 2000);
      let message = response.data.message || 'No response from the API';
      const generatedImageUrl = response.data.img_urls?.[0];

      // Clean up response text
      message = message.replace(/generateImage\s*\n*/gi, '')
                       .replace(/browseWeb\s*\n*/gi, '')
                       .replace(/analyzeImage\s*\n*/gi, '')
                       .replace(/retrieveUrl\s*\n*/gi, '')
                       .replace(/withPixtral\s*\n*/gi, '')
                       .replace(/analyzeImageWithPixtral\s*\n*/gi, '')
                       .replace(/generateFile\s*\n*/gi, '')
                       .replace(/!\[.*?\]\(.*?\)/g, '')
                       .trim();

      const maxMessageLength = 2000;
      const messages = splitMessageIntoChunks(message, maxMessageLength);

      // Send response message in chunks sequentially
      for (const chunk of messages) {
        await sendMessage(senderId, { text: chunk }, pageAccessToken);
      }

      // Send generated image if available
      if (generatedImageUrl) {
        await sendMessage(senderId, {
          attachment: { type: 'image', payload: { url: generatedImageUrl } }
        }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error processing AI request:', error);
      await sendMessage(senderId, { text: 'Request timeout: please try again. If this persists, you can contact my admin: https://www.facebook.com/valneer.2024' }, pageAccessToken);
    }
  },
};

// Function to split text into chunks
function splitMessageIntoChunks(text, maxLength) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    chunks.push(text.slice(start, start + maxLength));
    start += maxLength;
  }

  return chunks;
}

// Retry function with customizable attempts and delay
async function retryRequest(requestFn, retries, delay) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt === retries) {
        throw error; // Throw error if max retries reached
      }
      console.warn(`Retry ${attempt} failed. Retrying in ${delay}ms...`);
      await sleep(delay); // Wait before retrying
    }
  }
}

// Sleep function for delay between retries
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
