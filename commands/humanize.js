const axios = require('axios');
module.exports = {
  name: 'humanize',
  description: 'Humanize your given text',
  author: 'Biru',
  usage: '/humanize <text>',
  async execute(senderId, args, pageAccessToken, sendMessage) {
    // Check if the user provided text
    if (args.length === 0) {
      await sendMessage(senderId, { text: 'Please provide a text to humanize.\nUsage example: /humanize love is a complex feeling.' }, pageAccessToken);
      return;
    }

    // Check if the input has at least 30 words
    if (args.length < 30) {
      await sendMessage(senderId, { text: 'Your input must contain at least 30 words to be humanized.' }, pageAccessToken);
      return;
    }

    // Join the arguments to form the prompt
    const prompt = args.join(' ');

    try {
      // Send a processing message to indicate the request is being handled
      await sendMessage(senderId, { text: 'Humanizing your content, please wait...' }, pageAccessToken);

      // API URL to send the request
      const apiUrl = `https://vneerapi.onrender.com/humanizer?prompt=${encodeURIComponent(prompt)}&uid=${senderId}`;
      const response = await axios.get(apiUrl);

      // Extract the message from the response
      const text = response.data.message || 'No response from Humanizer Pro';

      // Limit of message per chunk is 2000 characters
      const maxMessageLength = 2000;

      // Split the response into chunks if it exceeds 2000 characters
      if (text.length > maxMessageLength) {
        const messages = splitMessageIntoChunks(text, maxMessageLength);

        // Send each chunk in sequence with a slight delay
        for (const message of messages) {
          await sendMessage(senderId, { text: message }, pageAccessToken);
          await new Promise(resolve => setTimeout(resolve, 500)); // delay between chunks for alignment
        }
      } else {
        // Send the whole response if it's under the limit
        await sendMessage(senderId, { text }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error calling Humanizer API:', error);
      await sendMessage(senderId, { text: 'An error occurred. Please try again later.' }, pageAccessToken);
    }
  }
};

// Helper function to split message into chunks
function splitMessageIntoChunks(message, chunkSize) {
  const chunks = [];
  for (let i = 0; i < message.length; i += chunkSize) {
    chunks.push(message.slice(i, i + chunkSize));
  }
  return chunks;
}
