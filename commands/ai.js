const axios = require('axios');

module.exports = {
  name: 'ai',
  description: 'Recognize images, generate images, or answer questions based on input',
  author: 'Biru',
  usage: 'just put any message',
  
  async execute(senderId, args, pageAccessToken, sendMessage) {
    // Combine arguments into a single message
    const userMessage = args.join(' ');

    try {
      // Determine if message contains a URL for recognition
      const urlPattern = /(https?:\/\/[^\s]+)/g;
      const foundUrls = userMessage.match(urlPattern);

      // Build API URL depending on input type
      let apiUrl;
      if (foundUrls) {
        // For image recognition, format the URL for recognition
        const imageUrl = foundUrls[0];
        apiUrl = `https://vneerapi.onrender.com/gpt4o?prompt=recognize_image:${encodeURIComponent(imageUrl)}&uid=${senderId}`;
      } else {
        // For text or questions, send the input as-is
        apiUrl = `https://vneerapi.onrender.com/gpt4o?prompt=${encodeURIComponent(userMessage)}&uid=${senderId}`;
      }

      // Fetch response from API
      const response = await axios.get(apiUrl);
      let message = response.data.message || 'No response from the API';
      const generatedImageUrl = response.data.img_urls?.[0];  // Use the first image URL if available

      // Remove any "generateImage" text and markdown-style image links if present
      message = message.replace(/generateImage\s*\n*/, '').replace(/!\[.*?\]\(.*?\)/g, '').trim();

      // Send text message if provided
      if (message) {
        await sendMessage(senderId, { text: message }, pageAccessToken);
      }

      // Send image if available
      if (generatedImageUrl) {
        await sendMessage(senderId, {
          attachment: {
            type: 'image',
            payload: { url: generatedImageUrl },
          },
        }, pageAccessToken);
      }

    } catch (error) {
      console.error('Error processing request:', error);
      await sendMessage(senderId, { text: 'There was an error processing your request. Please try again.' }, pageAccessToken);
    }
  }
};
