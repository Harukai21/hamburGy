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
      // Handle long prompts by truncating them
      const maxPromptLength = 2000; // Set a limit for the prompt length
      const truncatedMessage = userMessage.length > maxPromptLength 
        ? userMessage.slice(0, maxPromptLength) 
        : userMessage;

      // Construct the API URL based on the command
      if (truncatedMessage.startsWith('explain_or_answer:')) {
        const imageUrl = truncatedMessage.replace('explain_or_answer:', '');
        apiUrl = `https://vneerapi.onrender.com/bot?prompt=${encodeURIComponent(imageUrl)}&uid=${senderId}`;
      } else if (truncatedMessage.startsWith('process_file:')) {
        const fileUrl = truncatedMessage.replace('process_file:', '');
        apiUrl = `https://vneerapi.onrender.com/bot?prompt=${encodeURIComponent(fileUrl)}&uid=${senderId}`;
      } else {
        apiUrl = `https://vneerapi.onrender.com/bot?prompt=${encodeURIComponent(truncatedMessage)}&uid=${senderId}`;
      }

      // Fetch the response from the API
      const response = await axios.get(apiUrl);
      let message = response.data.message || 'No response from the API';
      const generatedImageUrl = response.data.img_urls?.[0];

      // Clean up the response text
      message = message.replace(/generateImage\s*\n*/gi, '')
                       .replace(/browseWeb\s*\n*/gi, '')
                       .replace(/analyzeImage\s*\n*/gi, '')
                       .replace(/retrieveUrl\s*\n*/gi, '')
                       .replace(/withPixtral\s*\n*/gi, '')
                       .replace(/analyzeImageWithPixtral\s*\n*/gi, '')
                       .replace(/generateFile\s*\n*/gi, '')
                       .replace(/!\[.*?\]\(.*?\)/g, '')
                       .trim();

      // Send the response text in chunks
      await sendChunks(senderId, message, pageAccessToken, sendMessage);

      // Send generated image if available
      if (generatedImageUrl) {
        await sendMessage(senderId, {
          attachment: { type: 'image', payload: { url: generatedImageUrl } }
        }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error processing AI request:', error);

      // Send error message to the user
      const errorMessage = error.response?.status === 500
        ? 'The server encountered an error. Please try again later.'
        : 'Request timeout: please try again. If this persists, you can contact my admin: https://www.facebook.com/valneer.2024';

      await sendMessage(senderId, { text: errorMessage }, pageAccessToken);
    }
  },
};

// Function to send text in chunks
async function sendChunks(senderId, text, pageAccessToken, sendMessage) {
  const maxMessageLength = 2000; // Define the maximum message length
  const chunks = splitMessageIntoChunks(text, maxMessageLength);

  for (const chunk of chunks) {
    try {
      await sendMessage(senderId, { text: chunk }, pageAccessToken);
    } catch (error) {
      console.error('Error sending message chunk:', error);
      throw new Error('Failed to send message chunk');
    }
  }
}

// Function to split text into manageable chunks
function splitMessageIntoChunks(text, maxLength) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    chunks.push(text.slice(start, start + maxLength));
    start += maxLength;
  }

  return chunks;
}
