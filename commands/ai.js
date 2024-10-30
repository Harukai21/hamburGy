const axios = require('axios');

module.exports = {
  name: 'ai',
  description: 'Handles AI responses for incoming messages and images',
  author: 'Biru',

  async execute(senderId, args, pageAccessToken, sendMessage) {
    const userMessage = args ? (Array.isArray(args) ? args.join(' ') : args) : '';

    try {
      let apiUrl;

      if (userMessage.startsWith('recognize_image:')) {
        const imageUrl = userMessage.replace('recognize_image:', '');
        apiUrl = `https://vneerapi.onrender.com/gpt4o?prompt=recognize_image:${encodeURIComponent(imageUrl)}&uid=${senderId}`;
      } else {
        apiUrl = `https://vneerapi.onrender.com/gpt4o?prompt=${encodeURIComponent(userMessage)}&uid=${senderId}`;
      }

      const response = await axios.get(apiUrl);
      let message = response.data.message || 'No response from the API';
      const generatedImageUrl = response.data.img_urls?.[0];

      message = message.replace(/generateImage\s*\n*/, '').replace(/!\[.*?\]\(.*?\)/g, '').trim();
      const maxMessageLength = 2000;
      const messages = splitMessageIntoChunks(message, maxMessageLength);

      for (const chunk of messages) {
        await sendMessage(senderId, { text: chunk }, pageAccessToken);
      }

      if (generatedImageUrl) {
        await sendMessage(senderId, {
          attachment: { type: 'image', payload: { url: generatedImageUrl } }
        }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error processing AI request:', error);
      await sendMessage(senderId, { text: 'There was an error processing your request. Please try again.' }, pageAccessToken);
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
