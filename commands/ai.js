const axios = require('axios');

module.exports = {
  name: 'ai',
  description: 'Handles AI responses for incoming messages, images, and documents',
  author: 'Biru',
  usage: 'ask any questions without the command name',

  async execute(senderId, args, pageAccessToken, sendMessage) {
    const userMessage = args ? (Array.isArray(args) ? args.join(' ') : args) : '';
    let apiUrl;

    try {
      // Detect and handle image or document recognition commands
      if (userMessage.startsWith('recognize_image:')) {
        const imageUrl = userMessage.replace('recognize_image:', '');
        apiUrl = `https://vneerapi.onrender.com/bot?prompt=recognize_image:${encodeURIComponent(imageUrl)}&uid=${senderId}`;
      } else if (userMessage.startsWith('process_file:')) {
        const fileUrl = userMessage.replace('process_file:', '');
        apiUrl = `https://vneerapi.onrender.com/bot?prompt=process_file:${encodeURIComponent(fileUrl)}&uid=${senderId}`;
      } else {
        apiUrl = `https://vneerapi.onrender.com/bot?prompt=${encodeURIComponent(userMessage)}&uid=${senderId}`;
      }

      const response = await axios.get(apiUrl);
      let message = response.data.message || 'No response from the API';
      const generatedImageUrl = response.data.img_urls?.[0];

      // Clean up response text
      message = message.replace(/generateImage\s*\n*/, '')
                       .replace(/browseWeb\s*\n*/, '')
                       .replace(/analyzeImage\s*\n*/, '')
                       .replace(/!\[.*?\]\(.*?\)/g, '')
                       .trim();

      const maxMessageLength = 2000;
      const messages = splitMessageIntoChunks(message, maxMessageLength);

      // Send response message in chunks
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
