// gpt.js

const axios = require('axios');

// Object to track GPT mode for each user
const userGptModes = {};

module.exports = {
  name: 'gpt',
  description: 'Toggle GPT mode on or off, recognize images, or answer questions',
  author: 'Biru',
  usage: '/gpt on/off/clear',
  
  async execute(senderId, args, pageAccessToken, sendMessage) {
    const userMessage = args.join(' ');

    // Check for on/off commands to toggle GPT mode
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
      // Proceed with GPT processing if GPT mode is on for this user
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

        message = message.replace(/generateImage\s*\n*/, '').replace(/!\[.*?\]\(.*?\)/g, '').trim();
        if (message) await sendMessage(senderId, { text: message }, pageAccessToken);
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
