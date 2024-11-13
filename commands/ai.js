const axios = require('axios');

const userState = {}; // Store user state for attachments and prompts

module.exports = {
  name: 'ai',
  description: 'Handles AI responses for incoming messages, images, and documents',
  author: 'Biru',
  usage: 'ask any questions without the command name',
  userState,

  async execute(senderId, args, pageAccessToken, sendMessage) {
    const userMessage = Array.isArray(args) ? args.join(' ') : args;

    // Check if a prompt is provided without any previous image or file awaiting processing
    if (!userMessage && !(userState[senderId]?.waitingForImagePrompt || userState[senderId]?.waitingForFilePrompt)) {
      await sendMessage(senderId, { text: 'How may I assist you today?' }, pageAccessToken);
      return;
    }

    let apiUrl;

    try {
      // If images are awaiting processing, use them with the follow-up prompt
      if (userState[senderId]?.waitingForImagePrompt && userMessage) {
        const imageUrls = userState[senderId].imageUrls;
        apiUrl = `https://vneerapi.onrender.com/bot?prompt=${encodeURIComponent(userMessage)}&imageUrls=${encodeURIComponent(JSON.stringify(imageUrls))}&uid=${senderId}`;
        
        // Clear the stored state after processing
        delete userState[senderId];
      }
      // If a file is awaiting processing, handle it
      else if (userState[senderId]?.waitingForFilePrompt && userMessage) {
        const fileUrl = userState[senderId].fileUrl;
        apiUrl = `https://vneerapi.onrender.com/bot?prompt=${encodeURIComponent(userMessage)}&fileUrl=${encodeURIComponent(fileUrl)}&uid=${senderId}`;
        
        // Clear the stored state after processing
        delete userState[senderId];
      }
      // Handle standard text messages if no image or file is awaiting processing
      else if (!apiUrl) {
        apiUrl = `https://vneerapi.onrender.com/bot?prompt=${encodeURIComponent(userMessage)}&uid=${senderId}`;
      }

      const response = await axios.get(apiUrl);
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
