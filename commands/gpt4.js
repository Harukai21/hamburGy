const axios = require('axios');
module.exports = {
  name: 'gpt4',
  description: 'Ask a question to GPT-4',
  author: 'Biru',
  usage: '/gpt4 <question>',
  async execute(senderId, args, pageAccessToken, sendMessage) {
    // Join the arguments to form the prompt
    const prompt = args.join(' ');

    try {
      // API URL to send the request
      const apiUrl = `https://vneerapi.onrender.com/ai?prompt=${encodeURIComponent(prompt)}&uid=${senderId}`;
      const response = await axios.get(apiUrl);

      // Extract the message from the response
      const text = response.data.message || 'No response from GPT-4';

      // Limit of message per chunk is 2000 characters
      const maxMessageLength = 2000;

      // Split the response into chunks if it exceeds 2000 characters
      if (text.length > maxMessageLength) {
        const messages = splitMessageIntoChunks(text, maxMessageLength);

        // Send each chunk in sequence
        for (const message of messages) {
          await sendMessage(senderId, { text: message }, pageAccessToken);
        }
      } else {
        // Send the whole response if it's under the limit
        await sendMessage(senderId, { text }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error calling GPT-4 API:', error);
      await sendMessage(senderId, { text: 'Please enter a valid question.' }, pageAccessToken);
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
