const axios = require('axios');

const userState = {}; // Track sender's state for images or files

module.exports = {
  name: 'ai',
  description: 'Handles AI responses for incoming messages, images, and documents',
  author: 'Biru',
  usage: 'ask any questions without the command name',

  async execute(senderId, args, pageAccessToken, sendMessage) {
    if (args.length === 0) {
      // Check if an image or file URL was received and is awaiting a prompt
      if (userState[senderId] && (userState[senderId].waitingForImagePrompt || userState[senderId].waitingForFilePrompt)) {
        await sendMessage(senderId, { text: 'Please provide a message to process the received file or image.' }, pageAccessToken);
      } else {
        await sendMessage(senderId, { text: 'How may I assist you today?' }, pageAccessToken);
      }
      return;
    }

    const userMessage = Array.isArray(args) ? args.join(' ') : args;
    let apiUrl;

    try {
      // Check if there's an image or file URL stored for processing after receiving a prompt
      if (userState[senderId]) {
        if (userState[senderId].waitingForImagePrompt && userMessage) {
          const imageUrl = userState[senderId].imageUrl;
          apiUrl = `https://vneerapi.onrender.com/bot?prompt=${encodeURIComponent(userMessage)}&imageUrl=${encodeURIComponent(imageUrl)}&uid=${senderId}`;
          delete userState[senderId]; // Clear state after processing
        } else if (userState[senderId].waitingForFilePrompt && userMessage) {
          const fileUrl = userState[senderId].fileUrl;
          apiUrl = `https://vneerapi.onrender.com/bot?prompt=${encodeURIComponent(userMessage)}&fileUrl=${encodeURIComponent(fileUrl)}&uid=${senderId}`;
          delete userState[senderId]; // Clear state after processing
        }
      }

      // If no image or file is waiting, handle normal commands
      if (!apiUrl) {
        if (userMessage.startsWith('explain_or_answer:')) {
          // Store the image URL and wait for a follow-up prompt
          const imageUrl = userMessage.replace('explain_or_answer:', '').trim();
          userState[senderId] = { waitingForImagePrompt: true, imageUrl };
          await sendMessage(senderId, { text: 'Please provide a message to explain or answer based on the image.' }, pageAccessToken);
          return;
        } else if (userMessage.startsWith('process_file:')) {
          // Store the file URL and wait for a follow-up prompt
          const fileUrl = userMessage.replace('process_file:', '').trim();
          userState[senderId] = { waitingForFilePrompt: true, fileUrl };
          await sendMessage(senderId, { text: 'Please provide a message to process the file.' }, pageAccessToken);
          return;
        } else {
          // Standard text processing when no image or file URL is involved
          apiUrl = `https://vneerapi.onrender.com/bot?prompt=${encodeURIComponent(userMessage)}&uid=${senderId}`;
        }
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
