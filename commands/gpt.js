const axios = require('axios');
const cron = require('node-cron');

const userGptModes = {};

module.exports = {
  name: 'gpt',
  description: 'Turn GPT mode on or off, and clear to reset history',
  author: 'Biru',
  usage: 'example: /gpt on/off/clear',

  async execute(senderId, args, pageAccessToken, sendMessage) {
    const userMessage = args.join(' ');

    if (userMessage.toLowerCase() === 'on') {
      userGptModes[senderId] = true;
      await sendMessage(senderId, { text: 'GPT mode activated.' }, pageAccessToken);
      return;
    } else if (userMessage.toLowerCase() === 'off') {
      userGptModes[senderId] = false;
      await sendMessage(senderId, { text: 'GPT mode deactivated. AI mode is now active.' }, pageAccessToken);
      return;
    }

    try {
      if (userGptModes[senderId]) {
        const urlPattern = /(https?:\/\/[^\s]+)/g;
        const foundUrls = userMessage.match(urlPattern);

        let apiUrl;
        if (foundUrls) {
          const imageUrl = foundUrls[0];
          apiUrl = `https://vneerapi.onrender.com/gpt4o?prompt=recognize_image:${encodeURIComponent(imageUrl)}&uid=${senderId}`;
        } else {
          apiUrl = `https://vneerapi.onrender.com/gpt4o?prompt=${encodeURIComponent(userMessage)}&uid=${senderId}`;
        }

        const response = await axios.get(apiUrl);
        let message = response.data.message || 'No response from the API';
        const generatedImageUrl = response.data.img_urls?.[0];

        // Remove unwanted text
        message = message.replace(/generateImage\s*\n*/, '').replace(/!\[.*?\]\(.*?\)/g, '').trim();

        // Split message into chunks and send each chunk in sequence
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
      } else {
        await sendMessage(senderId, { text: 'GPT mode is currently off. Use "/gpt on" to activate it.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error processing GPT request:', error);
      await sendMessage(senderId, { text: 'There was an error processing your request. Please try again.' }, pageAccessToken);
    }
  },

  isGptMode(senderId) {
    return userGptModes[senderId] || false; // Default to false if not set
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

// Schedule 5-hour interval for clearing history
cron.schedule('0 */5 * * *', async () => {
  try {
    await axios.get('https://vneerapi.onrender.com/gpt4o?prompt=clear');
    console.log('History cleared successfully');
  } catch (error) {
    console.error('Error clearing history:', error);
  }
});
