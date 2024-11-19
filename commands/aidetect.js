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

      // Extract the required part of the cleaned result
      const result = response.data.cleaned_result?.message || 'No response from AI Detector';
      const relevantPart = result.split('\n').filter(line => line.startsWith('Reading Ease:') || line.includes('likely to be written'))?.join('\n') || result;

      // Send the relevant part of the result
      await sendMessage(senderId, { text: relevantPart }, pageAccessToken);
    } catch (error) {
      console.error('Error calling AI Detector API:', error);
      await sendMessage(senderId, { text: 'An error occurred. Please try again later.' }, pageAccessToken);
    }
  }
};
