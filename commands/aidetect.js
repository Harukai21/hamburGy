const axios = require('axios');

module.exports = {
  name: 'aidetect',
  description: 'Detect if a given text is written by an AI or a human',
  author: 'Biru',
  usage: '/aidetect <text>',
  async execute(senderId, args, pageAccessToken, sendMessage) {
    // Check if the user provided text
    if (args.length === 0) {
      await sendMessage(senderId, { text: 'Please provide a text to analyze.\nUsage example: /aidetect This is a sample text for detection.' }, pageAccessToken);
      return;
    }

    // Join the arguments to form the input text
    const inputText = args.join(' ');

    try {
      // Send a processing message to indicate the request is being handled
      await sendMessage(senderId, { text: 'Analyzing your text for AI detection, please wait...' }, pageAccessToken);

      // API URL to send the request
      const apiUrl = `https://vneerapi.onrender.com/aidetect?text=${encodeURIComponent(inputText)}`;
      const response = await axios.get(apiUrl);

      // Extract the cleaned result from the response
      const cleanedResult = response.data.cleaned_result?.message || 'No response from AI Detector';

      // Limit of message per chunk is 2000 characters
      const maxMessageLength = 2000;

      // Split the response into chunks if it exceeds 2000 characters
      if (cleanedResult.length > maxMessageLength) {
        const messages = splitMessageIntoChunks(cleanedResult, maxMessageLength);

        // Send each chunk in sequence with a slight delay
        for (const message of messages) {
          await sendMessage(senderId, { text: message }, pageAccessToken);
          await new Promise(resolve => setTimeout(resolve, 500)); // delay between chunks for alignment
        }
      } else {
        // Send the whole response if it's under the limit
        await sendMessage(senderId, { text: cleanedResult }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error calling AI Detector API:', error);
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
